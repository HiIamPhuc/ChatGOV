"""File I/O utilities"""

import csv
from config import (
    HEADERS,
    INPUT_CSV_PATH,
    OUTPUT_MAIN_CSV,
    OUTPUT_UNMATCHED_CSV,
    OUTPUT_DOWNLOADS_CSV,
)


def load_procedures():
    """Load procedures from CSV file"""
    procedures = []

    with open(INPUT_CSV_PATH, "r", encoding="utf-8", newline="") as f:
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

    return procedures


def save_results(results):
    """Save results to CSV files"""
    # Ghi file CSV kết quả chính
    with open(OUTPUT_MAIN_CSV, "w", encoding="utf-8", newline="") as f:
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

    # Ghi unmatched để review
    with open(OUTPUT_UNMATCHED_CSV, "w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["link", "ten_thu_tuc", "title", "detail"])
        for r in results:
            for u in r.get("unmatched", []):
                writer.writerow([r["link"], r["ten_thu_tuc"], u["title"], u["detail"]])

    # Ghi file download links riêng
    with open(OUTPUT_DOWNLOADS_CSV, "w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["link", "ten_thu_tuc", "download_url"])
        for r in results:
            for dl in r.get("download_links", []):
                writer.writerow([r["link"], r["ten_thu_tuc"], dl])
