"""Content extraction utilities for different HTML structures"""

from bs4 import BeautifulSoup
from config import BASE_URL


def extract_structured_content(detail_elem):
    """Extract clean content optimized for QA chatbot - remove unnecessary tags but keep table structure"""
    if not detail_elem:
        return ""

    content_parts = []
    processed_texts = set()  # Để theo dõi nội dung đã extract

    def is_duplicate_content(text, threshold=0.8):
        """Check if content is similar to already processed content"""
        if not text or len(text) < 20:  # Skip very short text
            return False

        text_words = set(text.lower().split())
        for processed in processed_texts:
            processed_words = set(processed.lower().split())

            # Calculate similarity (Jaccard similarity)
            if len(processed_words) > 0:
                intersection = len(text_words.intersection(processed_words))
                union = len(text_words.union(processed_words))
                similarity = intersection / union if union > 0 else 0

                if similarity > threshold:  # If more than 80% similar
                    return True
        return False

    # Extract content theo thứ tự xuất hiện trong DOM
    for element in detail_elem.find_all(recursive=False):  # Only direct children
        if element.name in ["h1", "h2", "h3", "h4", "h5", "h6"]:
            heading_text = element.get_text(strip=True)
            if heading_text and not is_duplicate_content(heading_text):
                # Remove tag prefix, just add colon for structure
                content_parts.append(f"{heading_text}:")
                processed_texts.add(heading_text)

        elif element.name == "p":
            p_text = element.get_text(strip=True)
            if p_text and not is_duplicate_content(p_text):
                # Remove "P:" prefix, just add the text
                content_parts.append(p_text)
                processed_texts.add(p_text)

        elif element.name == "ul":
            ul_items = []
            ul_content = ""
            for li in element.find_all("li"):
                li_text = li.get_text(strip=True)
                if li_text:
                    ul_items.append(f"• {li_text}")  # Use bullet point instead of "- "
                    ul_content += li_text + " "

            if ul_items and not is_duplicate_content(ul_content):
                # Remove "UL:" prefix, just add items
                content_parts.extend(ul_items)
                processed_texts.add(ul_content)

        elif element.name == "ol":
            ol_items = []
            ol_content = ""
            for j, li in enumerate(element.find_all("li")):
                li_text = li.get_text(strip=True)
                if li_text:
                    ol_items.append(f"{j+1}. {li_text}")
                    ol_content += li_text + " "

            if ol_items and not is_duplicate_content(ol_content):
                # Remove "OL:" prefix, just add numbered items
                content_parts.extend(ol_items)
                processed_texts.add(ol_content)

        elif element.name == "table":
            # Tìm heading gần nhất trước table này
            table_context = ""
            prev_sibling = element.find_previous_sibling()

            while prev_sibling:
                if prev_sibling.name in ["h1", "h2", "h3", "h4", "h5", "h6"]:
                    table_context = prev_sibling.get_text(strip=True)
                    break
                elif prev_sibling.name == "p" and prev_sibling.get_text(strip=True):
                    table_context = prev_sibling.get_text(strip=True)
                    break
                prev_sibling = prev_sibling.find_previous_sibling()

            # Extract table content - KEEP STRUCTURE but make it more natural
            table_content = extract_table_content_natural(element, table_context)
            if table_content and not is_duplicate_content(" ".join(table_content)):
                content_parts.extend(table_content)
                processed_texts.add(" ".join(table_content))

    # If no structured content found, fallback to plain text
    if not content_parts:
        plain_text = detail_elem.get_text(strip=True)
        if plain_text:
            content_parts.append(plain_text)

    return "\n\n".join(content_parts)  # Use double newlines for better readability


def extract_table_content_natural(table, context=""):
    """Extract table content in natural, readable format while preserving structure"""
    table_parts = []

    # Add context as natural heading if available
    if context:
        table_parts.append(f"{context}:")

    # Extract table headers
    thead = table.find("thead")
    headers = []
    if thead:
        header_row = thead.find("tr")
        if header_row:
            headers = [
                th.get_text(strip=True) for th in header_row.find_all(["th", "td"])
            ]

    # Extract table body
    tbody = table.find("tbody") or table
    rows = tbody.find_all("tr")

    for j, row in enumerate(rows):
        # Skip header row if no thead
        if not thead and j == 0:
            headers = [th.get_text(strip=True) for th in row.find_all(["th", "td"])]
            continue

        cells = []
        for cell in row.find_all(["td", "th"]):
            # Handle nested content in cells
            cell_text = ""

            # Check for spans with file names
            spans = cell.find_all("span")
            if spans:
                span_texts = [
                    span.get_text(strip=True)
                    for span in spans
                    if span.get_text(strip=True)
                ]
                if span_texts:
                    cell_text = ", ".join(span_texts)  # Use comma instead of pipe

            # If no spans, get regular text but handle <br> tags
            if not cell_text:
                # Replace <br> with comma for better readability
                for br in cell.find_all("br"):
                    br.replace_with(", ")
                cell_text = cell.get_text(" ", strip=True)

            cells.append(cell_text)

        # Format row in natural language
        if any(cell for cell in cells) and headers and len(headers) == len(cells):
            # Create natural description of the row
            row_descriptions = []
            for header, cell in zip(headers, cells):
                if cell and cell.strip():
                    row_descriptions.append(f"{header}: {cell}")

            if row_descriptions:
                table_parts.append(" | ".join(row_descriptions))
        elif any(cell for cell in cells):
            # Fallback to simple cell joining if no proper headers
            table_parts.append(" | ".join([cell for cell in cells if cell.strip()]))

    return table_parts


def extract_download_links(detail_elem, base_url=BASE_URL):
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
