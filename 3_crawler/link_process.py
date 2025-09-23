import asyncio
import csv
import re
import unicodedata
from bs4 import BeautifulSoup
from crawl4ai import AsyncWebCrawler, CrawlerRunConfig, CacheMode, BrowserConfig
from crawl4ai.markdown_generation_strategy import DefaultMarkdownGenerator

# --- Cấu hình header (theo yêu cầu của bạn) ---
HEADERS = [
    "Links",
    "Tên thủ tục",  # Thêm cột Tên thủ tục
    "Mã thủ tục",
    "Lĩnh vực",
    "Cơ quan thực hiện",
    "Mức độ cung cấp dịch vụ công trực tuyến",
    "Cách thức thực hiện",
    "Trình tự thực hiện",
    "Thời hạn giải quyết",
    "Phí",
    "Lệ Phí",
    "Thành phần hồ sơ",
    "Yêu cầu - điều kiện",
    "Căn cứ pháp lý",
    "Biểu mẫu",
    "Kết quả thực hiện",
    "Link tải tài liệu (nếu có)",  # Thêm cột mới
]

# --- Mapping tiêu đề trên trang -> trường CSV (dạng keyword để so khớp) ---
TITLE_KEYWORDS = {
    "Mã thủ tục": ["mã thủ tục", "mã tthc", "mã thủ"],
    "Lĩnh vực": ["lĩnh vực", "linh vuc"],
    "Cơ quan thực hiện": [
        "cơ quan thực hiện",
        "cơ quan",
        "đơn vị thực hiện",
        "cơ quan chủ trì",
    ],
    "Mức độ cung cấp dịch vụ công trực tuyến": [
        "mức độ cung cấp dịch vụ công trực tuyến",
        "mức độ cung cấp",
        "mức độ dịch vụ trực tuyến",
    ],
    "Cách thức thực hiện": ["cách thức thực hiện", "cách thức", "hình thức thực hiện"],
    "Trình tự thực hiện": ["trình tự thực hiện", "trình tự", "thứ tự thực hiện"],
    "Thời hạn giải quyết": ["thời hạn giải quyết", "thời hạn"],
    "Phí": ["phí", "chi phí (phí)"],
    "Lệ Phí": ["lệ phí"],
    "Thành phần hồ sơ": ["thành phần hồ sơ", "thành phần"],
    "Yêu cầu - điều kiện": [
        "yêu cầu",
        "điều kiện",
        "yêu cầu - điều kiện",
        "yêu cầu/điều kiện",
    ],
    "Căn cứ pháp lý": ["căn cứ pháp lý", "căn cứ pháp", "pháp lý"],
    "Biểu mẫu": ["biểu mẫu", "mẫu đơn", "mẫu"],
    "Kết quả thực hiện": ["kết quả thực hiện", "kết quả"],
}


# --- Helpers ---
def normalize_text(s: str) -> str:
    """Lowercase, remove diacritics, remove punctuation (keeps letters/numbers/space)."""
    if not s:
        return ""
    s = s.strip().lower()
    # remove leading numbering like "1. " or "1) "
    s = re.sub(r"^\d+\s*[\.\)]\s*", "", s)
    # normalize unicode and remove combining marks (diacritics)
    s = unicodedata.normalize("NFD", s)
    s = "".join(ch for ch in s if not unicodedata.combining(ch))
    # keep letters and numbers and spaces
    s = re.sub(r"[^a-z0-9\s]", " ", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s


def extract_download_links(detail_elem, base_url="https://dichvucong.bocongan.gov.vn"):
    """Extract download links from the detail element"""
    download_links = []

    if detail_elem:
        # Tìm tất cả các link tải xuống
        download_anchors = detail_elem.find_all("a", href=True)

        for anchor in download_anchors:
            href = anchor.get("href", "")
            link_text = anchor.get_text(strip=True)

            # Kiểm tra xem có phải là link tải xuống không
            if (
                "tải về" in link_text.lower()
                or "download" in link_text.lower()
                or anchor.find("i", class_="fa-download")
                or href.endswith((".doc", ".docx", ".pdf", ".xls", ".xlsx"))
            ):

                # Tạo full URL nếu href là relative path
                if href.startswith("/"):
                    full_url = base_url + href
                elif href.startswith("http"):
                    full_url = href
                else:
                    full_url = base_url + "/" + href

                download_links.append(full_url)

    return download_links


# Pre-normalize keyword lists
NORMALIZED_KEYWORDS = {
    header: [normalize_text(k) for k in keywords]
    for header, keywords in TITLE_KEYWORDS.items()
}


async def fetch_and_extract(
    url: str, ten_thu_tuc: str, crawler, run_config, sem: asyncio.Semaphore
):
    async with sem:
        try:
            result = await crawler.arun(url=url, config=run_config)
        except Exception as e:
            return {
                "link": url,
                "ten_thu_tuc": ten_thu_tuc,
                "error": str(e),
                "data": {},
                "unmatched": [],
                "download_links": [],
            }

        if not result.success:
            return {
                "link": url,
                "ten_thu_tuc": ten_thu_tuc,
                "error": "crawl_failed",
                "data": {},
                "unmatched": [],
                "download_links": [],
            }

        # prefer HTML (vì cấu trúc class cần giữ), nếu không có fallback markdown (cảnh báo)
        html = (
            getattr(result, "html", None)
            or getattr(result, "page_html", None)
            or getattr(result, "markdown", None)
        )
        if not html:
            return {
                "link": url,
                "ten_thu_tuc": ten_thu_tuc,
                "error": "no_html",
                "data": {},
                "unmatched": [],
                "download_links": [],
            }

        soup = BeautifulSoup(html, "lxml")
        items = soup.select("div.tthc-list-item")
        # prepare empty mapping for this page (exclude Links, Tên thủ tục, và Link tải tài liệu columns)
        data = {h: "" for h in HEADERS[2:-1]}  # Exclude first 2 and last 1 columns
        unmatched = []
        all_download_links = []

        for item in items:
            title_elem = item.select_one(".item-title")
            detail_elem = item.select_one(".tthc-list-item-detail")

            title_text = title_elem.get_text(" ", strip=True) if title_elem else ""
            detail_text = detail_elem.get_text(" ", strip=True) if detail_elem else ""

            norm_title = normalize_text(title_text)

            # Extract download links from detail element
            download_links = extract_download_links(detail_elem)

            matched = False
            for header, keywords in NORMALIZED_KEYWORDS.items():
                for kw in keywords:
                    if kw and kw in norm_title:
                        # nếu đã tồn tại giá trị, nối thêm (ngăn cách bằng " || ")
                        if data.get(header):
                            data[header] = data[header] + " || " + detail_text
                        else:
                            data[header] = detail_text

                        # Nếu là phần Biểu mẫu và có download links, lưu lại
                        if header == "Biểu mẫu" and download_links:
                            all_download_links.extend(download_links)

                        matched = True
                        break
                if matched:
                    break

            if not matched:
                # lưu để kiểm tra sau (tiêu đề trang không giống bất kỳ keyword nào)
                unmatched.append({"title": title_text, "detail": detail_text})

        return {
            "link": url,
            "ten_thu_tuc": ten_thu_tuc,
            "error": None,
            "data": data,
            "unmatched": unmatched,
            "download_links": all_download_links,
        }


async def main(concurrency: int = 5):
    # Đọc links và tên thủ tục from CSV
    procedures = []

    with open(
        "/home/aaronpham/Coding/AI_thuc_chien/AI_Wrapper-WebPage/3_crawler/data/all_procedures_with_names.csv",
        "r",
        encoding="utf-8",
        newline="",
    ) as f:
        reader = csv.reader(f)
        next(reader, None)  # Skip header

        for row in reader:
            if len(row) >= 2:  # Đảm bảo có ít nhất 2 cột
                ten_thu_tuc = row[0].strip()  # Cột "Tên thủ tục"
                link = row[1].strip()  # Cột "Link"
                procedures.append({"ten_thu_tuc": ten_thu_tuc, "link": link})

                # Debug: In ra 3 dòng đầu để kiểm tra
                if len(procedures) <= 3:
                    print(f"Procedure {len(procedures)}: '{ten_thu_tuc}' -> {link}")

    if not procedures:
        print("No procedures found in all_procedures_with_names.csv")
        return

    print(f"Loaded {len(procedures)} procedures from CSV")

    browser_config = BrowserConfig(headless=True)
    md_generator = DefaultMarkdownGenerator()
    run_config = CrawlerRunConfig(
        cache_mode=CacheMode.BYPASS,
        markdown_generator=md_generator,
        only_text=False,
        verbose=False,
    )

    sem = asyncio.Semaphore(concurrency)
    results = []

    async with AsyncWebCrawler(config=browser_config) as crawler:
        tasks = [
            fetch_and_extract(
                proc["link"], proc["ten_thu_tuc"], crawler, run_config, sem
            )
            for proc in procedures
        ]

        # Process in chunks to avoid overwhelming the server
        for chunk in [
            tasks[i : i + concurrency * 2]
            for i in range(0, len(tasks), concurrency * 2)
        ]:
            print(f"Processing chunk of {len(chunk)} URLs...")
            chunk_res = await asyncio.gather(*chunk, return_exceptions=True)

            # Handle exceptions
            for i, res in enumerate(chunk_res):
                if isinstance(res, Exception):
                    print(f"Exception in chunk: {res}")
                    # Create error result
                    proc_index = len(results) + i
                    if proc_index < len(procedures):
                        proc = procedures[proc_index]
                        results.append(
                            {
                                "link": proc["link"],
                                "ten_thu_tuc": proc["ten_thu_tuc"],
                                "error": str(res),
                                "data": {},
                                "unmatched": [],
                                "download_links": [],
                            }
                        )
                else:
                    results.append(res)

    # Ghi file CSV kết quả chính
    with open("extracted_structured.csv", "w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(HEADERS)

        for r in results:
            if r.get("error"):
                # nếu crawl lỗi, ghi link + tên thủ tục + empty columns
                row = [r["link"], r["ten_thu_tuc"]] + [""] * (len(HEADERS) - 2)
            else:
                # Tạo string cho download links - chỉ lưu link, ngăn cách bằng " || "
                download_links_str = "None"
                if r.get("download_links"):
                    download_links_str = " || ".join(r["download_links"])

                # lấy các cột theo HEADERS (order cố định)
                row_vals = [
                    r["data"].get(h, "")
                    for h in HEADERS[
                        2:-1
                    ]  # Skip Links, Tên thủ tục, và Link tải tài liệu
                ]
                row = [r["link"], r["ten_thu_tuc"]] + row_vals + [download_links_str]
            writer.writerow(row)

    # Ghi unmatched để bạn review (nếu có)
    with open("unmatched_items.csv", "w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["link", "ten_thu_tuc", "title", "detail"])
        for r in results:
            for u in r.get("unmatched", []):
                writer.writerow([r["link"], r["ten_thu_tuc"], u["title"], u["detail"]])

    # Ghi file download links riêng để dễ theo dõi - chỉ lưu link
    with open("download_links.csv", "w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["link", "ten_thu_tuc", "download_url"])
        for r in results:
            for dl in r.get("download_links", []):
                writer.writerow([r["link"], r["ten_thu_tuc"], dl])

    print("Done. Outputs:")
    print(" - extracted_structured.csv")
    print(" - unmatched_items.csv (check for titles that need mapping)")
    print(" - download_links.csv (all download links found)")
    print(f"Processed {len(results)} procedures (concurrency={concurrency})")

    # Show some stats
    success_count = len([r for r in results if not r.get("error")])
    error_count = len([r for r in results if r.get("error")])
    download_links_count = sum(len(r.get("download_links", [])) for r in results)
    print(f"Success: {success_count}, Errors: {error_count}")
    print(f"Total download links found: {download_links_count}")


if __name__ == "__main__":
    # chỉnh concurrency nếu bạn muốn (vd: 5, 10, ...)
    asyncio.run(main(concurrency=3))  # Giảm concurrency để tránh overload server
