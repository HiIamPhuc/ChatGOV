"""Data processing and matching logic"""

from bs4 import BeautifulSoup
from config import HEADERS
from text_utils import normalize_text, NORMALIZED_KEYWORDS
from content_extractor import extract_structured_content, extract_download_links


async def fetch_and_extract(url: str, ten_thu_tuc: str, crawler, run_config, sem):
    """Extract data from a single URL"""
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

        # prefer HTML (vì cấu trúc class cần giữ), nếu không có fallback markdown
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

            # Use structured content extraction instead of plain text
            detail_text = extract_structured_content(detail_elem)

            norm_title = normalize_text(title_text)

            # Extract download links from detail element
            download_links = extract_download_links(detail_elem)

            # Find best matching header (longest keyword match first)
            matched = False
            best_match = None
            best_keyword_length = 0

            for header, keywords in NORMALIZED_KEYWORDS.items():
                for kw in keywords:
                    if kw and kw in norm_title:
                        # Ưu tiên keyword dài hơn (cụ thể hơn)
                        if len(kw) > best_keyword_length:
                            best_match = header
                            best_keyword_length = len(kw)
                            matched = True

            if matched and best_match:
                # nếu đã tồn tại giá trị, nối thêm (ngăn cách bằng " || ")
                if data.get(best_match):
                    data[best_match] = data[best_match] + " || " + detail_text
                else:
                    data[best_match] = detail_text

                # Nếu là phần Biểu mẫu và có download links, lưu lại
                if best_match == "Biểu mẫu" and download_links:
                    all_download_links.extend(download_links)

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
