import asyncio
import re
from crawl4ai import AsyncWebCrawler, CrawlerRunConfig, CacheMode, BrowserConfig
from crawl4ai.markdown_generation_strategy import DefaultMarkdownGenerator


async def main():
    browser_config = BrowserConfig(headless=True)
    config = CrawlerRunConfig(
        cache_mode=CacheMode.BYPASS,
        markdown_generator=DefaultMarkdownGenerator(),
        verbose=True,
    )

    base_url = "https://dichvucong.bocongan.gov.vn/bocongan/bothutuc/listThuTuc?per_page=50&page="
    all_links = set()

    async with AsyncWebCrawler(config=browser_config) as crawler:
        # Giả sử có khoảng 200 thủ tục => với per_page=50 => ~4 trang
        for page in range(1, 10):  # tăng lên nếu cần, hoặc dừng khi không thấy link mới
            url = base_url + str(page)
            result = await crawler.arun(url=url, config=config)

            if not result.success:
                print(f"❌ Fail page {page}")
                break

            # Regex lấy các link matt
            link_pattern = r"https://dichvucong\.bocongan\.gov\.vn/bocongan/bothutuc/tthc\?matt=\d+"
            matches = re.findall(link_pattern, result.markdown)
            if not matches:
                print(f"⛔ Page {page} không có thêm link, dừng lại")
                break

            all_links.update(matches)
            print(f"✅ Page {page}: tìm thấy {len(matches)} link")

    print(f"\n🔗 Tổng số link tìm thấy: {len(all_links)}")
    with open("all_filtered_links.csv", "w", encoding="utf-8") as f:
        f.write("link\n")
        for url in all_links:
            f.write(url + "\n")


if __name__ == "__main__":
    asyncio.run(main())
