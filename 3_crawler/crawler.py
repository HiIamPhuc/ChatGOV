"""Main crawler script"""

import asyncio
from crawl4ai import AsyncWebCrawler, CrawlerRunConfig, CacheMode, BrowserConfig
from crawl4ai.markdown_generation_strategy import DefaultMarkdownGenerator

from config import (
    DEFAULT_CONCURRENCY,
    OUTPUT_MAIN_CSV,
    OUTPUT_UNMATCHED_CSV,
    OUTPUT_DOWNLOADS_CSV,
)
from file_utils import load_procedures, save_results
from data_processor import fetch_and_extract


async def main(concurrency: int = DEFAULT_CONCURRENCY):
    """Main crawler function"""
    # Load procedures from CSV
    procedures = load_procedures()

    if not procedures:
        print("No procedures found in CSV file")
        return

    print(f"Loaded {len(procedures)} procedures from CSV")

    # Setup crawler configuration
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

    # Save results to CSV files
    save_results(results)

    print("Done. Outputs:")
    print(f" - {OUTPUT_MAIN_CSV}")
    print(f" - {OUTPUT_UNMATCHED_CSV} (check for titles that need mapping)")
    print(f" - {OUTPUT_DOWNLOADS_CSV} (all download links found)")
    print(f"Processed {len(results)} procedures (concurrency={concurrency})")

    # Show some stats
    success_count = len([r for r in results if not r.get("error")])
    error_count = len([r for r in results if r.get("error")])
    download_links_count = sum(len(r.get("download_links", [])) for r in results)
    print(f"Success: {success_count}, Errors: {error_count}")
    print(f"Total download links found: {download_links_count}")


if __name__ == "__main__":
    asyncio.run(main(concurrency=3))
