"""Configuration constants for the crawler"""

# --- Cấu hình header CSV ---
HEADERS = [
    "Links",
    "Tên thủ tục",
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
    "Link tải tài liệu (nếu có)",
]

# --- Mapping tiêu đề trên trang -> trường CSV ---
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

# Crawler settings
BASE_URL = "https://dichvucong.bocongan.gov.vn"
DEFAULT_CONCURRENCY = 3
INPUT_CSV_PATH = "/home/aaronpham/Coding/AI_thuc_chien/AI_Wrapper-WebPage/3_crawler/data/all_procedures_with_names.csv"

# Output file names
OUTPUT_MAIN_CSV = "extracted_structured.csv"
OUTPUT_UNMATCHED_CSV = "unmatched_items.csv"
OUTPUT_DOWNLOADS_CSV = "download_links.csv"
