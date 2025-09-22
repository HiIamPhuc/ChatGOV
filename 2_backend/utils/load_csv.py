import csv
from supabase import create_client, Client
from ..config import SUPABASE_URL, SUPABASE_KEY
# app/utils/url_parser.py
from urllib.parse import urlparse, parse_qs

# Run this script once to load CSV into Supabase
# Usage: python -m app.utils.load_csv path_to_csv.csv

import sys

aliases = {
    'id': 'Mã thủ tục',
    'url': 'Links',
    'title': 'Tên thủ tục',
    'content': [
        'Lĩnh vực', 'Cơ quan thực hiện', 'Mức độ cung cấp dịch vụ công trực tuyến',
        'Cách thức thực hiện', 'Trình tự thực hiện', 'Thời hạn giải quyết',
        'Phí', 'Lệ Phí', 'Thành phần hồ sơ', 'Yêu cầu - điều kiện',
        'Căn cứ pháp lý', 'Biểu mẫu', 'Kết quả thực hiện', ''
    ]
}

def extract_matt_param(url: str) -> str:
    """
    Extract the 'matt' parameter value from a URL.
    
    Args:
        url (str): The URL containing the 'matt' query parameter.
        
    Returns:
        str: The value of the 'matt' parameter, or an empty string if not found.
    """
    parsed_url = urlparse(url)
    query_params = parse_qs(parsed_url.query)
    matt_value = query_params.get('matt', [''])[0]  # Get first value if multiple
    return matt_value

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python -m load_csv <csv_path>")
        sys.exit(1)
    
    csv_path = sys.argv[1]
    client: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        data = [row for row in reader]
    
    # Assuming columns: index (id), title, url, content (combine other contents)
    for row in data:
        service_data = {
            'id': extract_matt_param(row[aliases['url']]),
            'service_id': row[aliases['id']],
            'title': row[aliases['title']],
            'url': row[aliases['url']],
            'content': {key : row.get(key, '') for key in row if key in aliases['content']}
        }
        # for key in service_data:
        #     print(f"{key}: {service_data[key]}")
        print(f'Fetching service {service_data["service_id"]}')
        
        client.table('services').insert(service_data).execute()
    
    print(f"Loaded {len(data)} services into Supabase.")