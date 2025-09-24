"""Content extraction utilities for different HTML structures"""

from bs4 import BeautifulSoup
from config import BASE_URL


def extract_structured_content(detail_elem):
    """Extract structured content from tthc-list-item-detail"""
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
                tag_name = element.name.upper()
                content_parts.append(f"{tag_name}: {heading_text}")
                processed_texts.add(heading_text)

        elif element.name == "p":
            p_text = element.get_text(strip=True)
            if p_text and not is_duplicate_content(p_text):
                content_parts.append(f"P: {p_text}")
                processed_texts.add(p_text)

        elif element.name == "ul":
            ul_items = []
            ul_content = ""
            for li in element.find_all("li"):
                li_text = li.get_text(strip=True)
                if li_text:
                    ul_items.append(f"  - {li_text}")
                    ul_content += li_text + " "

            if ul_items and not is_duplicate_content(ul_content):
                content_parts.append("UL:")
                content_parts.extend(ul_items)
                processed_texts.add(ul_content)

        elif element.name == "ol":
            ol_items = []
            ol_content = ""
            for j, li in enumerate(element.find_all("li")):
                li_text = li.get_text(strip=True)
                if li_text:
                    ol_items.append(f"  {j+1}. {li_text}")
                    ol_content += li_text + " "

            if ol_items and not is_duplicate_content(ol_content):
                content_parts.append("OL:")
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

            # Extract table content
            table_content = extract_table_content(element, table_context)
            if table_content and not is_duplicate_content(table_content):
                content_parts.extend(table_content)
                processed_texts.add(" ".join(table_content))

    # If no structured content found, fallback to plain text
    if not content_parts:
        plain_text = detail_elem.get_text(strip=True)
        if plain_text:
            content_parts.append(f"TEXT: {plain_text}")

    return "\n".join(content_parts)


def extract_table_content(table, context=""):
    """Extract content from a table element"""
    table_parts = []

    # Table header with context
    table_header = "TABLE:"
    if context:
        table_header += f" ({context})"
    table_parts.append(table_header)

    # Extract table headers
    thead = table.find("thead")
    if thead:
        header_row = thead.find("tr")
        if header_row:
            headers = [
                th.get_text(strip=True) for th in header_row.find_all(["th", "td"])
            ]
            if headers:
                table_parts.append(f"  Headers: {' | '.join(headers)}")

    # Extract table body
    tbody = table.find("tbody") or table
    rows = tbody.find_all("tr")

    for j, row in enumerate(rows):
        # Skip header row if no thead
        if not thead and j == 0:
            headers = [th.get_text(strip=True) for th in row.find_all(["th", "td"])]
            if any(header for header in headers):
                table_parts.append(f"  Headers: {' | '.join(headers)}")
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
                    cell_text = " | ".join(span_texts)

            # If no spans, get regular text but handle <br> tags
            if not cell_text:
                # Replace <br> with " | " for better readability
                for br in cell.find_all("br"):
                    br.replace_with(" | ")
                cell_text = cell.get_text(" ", strip=True)

            cells.append(cell_text)

        if any(cell for cell in cells):
            table_parts.append(f"  Row{j}: {' | '.join(cells)}")

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
