import asyncio
from crawl4ai import AsyncWebCrawler


async def main():
    # Create an instance of AsyncWebCrawler
    async with AsyncWebCrawler() as crawler:
        # Run the crawler on a URL
        result = await crawler.arun(url="https://dichvucong.bocongan.gov.vn/?home=1")

        # Print the extracted content
        print(result.markdown)

        with open("resutl.md", "w") as file:
            file.write(result.markdown)


# Run the async main function
asyncio.run(main())
