import asyncio
import csv
import re
from crawl4ai import AsyncWebCrawler, CrawlerRunConfig, CacheMode, BrowserConfig


async def main():
    browser_config = BrowserConfig(headless=True)
    config = CrawlerRunConfig(cache_mode=CacheMode.BYPASS, verbose=True)

    base_url = "https://dichvucong.bocongan.gov.vn/bocongan/bothutuc/listThuTuc?per_page=50&page="
    all_procedures = []

    async with AsyncWebCrawler(config=browser_config) as crawler:
        # Crawl nhiều trang
        for page in range(1, 10):  # Thử crawl 10 trang đầu
            url = base_url + str(page)
            print(f"Crawling page {page}...")

            try:
                result = await crawler.arun(url=url, config=config)

                if not result.success:
                    print(f"❌ Failed to crawl page {page}")
                    break

                # Pattern để extract tên và link với matt
                link_pattern = r"\[([^\]]+)\]\((https://dichvucong\.bocongan\.gov\.vn/bocongan/bothutuc/tthc\?matt=\d+)\)"
                matches = re.findall(link_pattern, result.markdown)

                if not matches:
                    print(f"⛔ Page {page} không có thủ tục nào, dừng crawl")
                    break

                # Thêm vào danh sách tổng
                for name, url in matches:
                    procedure_info = {
                        "ten_thu_tuc": name.strip(),
                        "link": url,
                        "page": page,
                    }
                    all_procedures.append(procedure_info)

                print(f"✅ Page {page}: tìm thấy {len(matches)} thủ tục")

            except Exception as e:
                print(f"❌ Error crawling page {page}: {e}")
                break

    # Loại bỏ duplicate dựa trên link
    unique_procedures = []
    seen_links = set()

    for proc in all_procedures:
        if proc["link"] not in seen_links:
            unique_procedures.append(proc)
            seen_links.add(proc["link"])

    print(f"\n🔗 Tổng số thủ tục unique: {len(unique_procedures)}")

    # Lưu vào CSV
    with open(
        "all_procedures_with_names.csv", "w", encoding="utf-8", newline=""
    ) as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow(["Tên thủ tục", "Link", "Page tìm thấy"])

        for proc in unique_procedures:
            writer.writerow([proc["ten_thu_tuc"], proc["link"], proc["page"]])

    # Lưu vào markdown
    with open("all_procedures.md", "w", encoding="utf-8") as file:
        file.write("# Tất cả thủ tục hành chính\n\n")
        file.write(f"Tổng cộng: {len(unique_procedures)} thủ tục\n\n")

        for i, proc in enumerate(unique_procedures, 1):
            file.write(f"{i}. [{proc['ten_thu_tuc']}]({proc['link']})\n")

    print(f"\n📁 Đã lưu vào:")
    print("- all_procedures_with_names.csv")
    print("- all_procedures.md")

    # In preview
    print(f"\n📋 Preview 5 thủ tục đầu tiên:")
    for i, proc in enumerate(unique_procedures[:5]):
        print(f"{i+1}. {proc['ten_thu_tuc']}")


if __name__ == "__main__":
    asyncio.run(main())
