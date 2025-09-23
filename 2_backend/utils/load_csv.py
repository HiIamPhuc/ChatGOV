import csv
from supabase import create_client, Client
from ..config import SUPABASE_URL, SUPABASE_KEY
# app/utils/url_parser.py
from urllib.parse import urlparse, parse_qs

# Run this script once to load CSV into Supabase
# Usage: python -m app.utils.load_csv path_to_csv.csv

import sys

aliases = {
    'ma_thu_tuc': 'Mã thủ tục',
    'links': 'Links',
    'ten_thu_tuc': 'Tên thủ tục',
    'linh_vuc': 'Lĩnh vực',
    'co_quan_thuc_hien': 'Cơ quan thực hiện',
    'muc_do_cung_cap_dich_vu_cong_truc_tuyen': 'Mức độ cung cấp dịch vụ công trực tuyến',
    'cach_thuc_thuc_hien': 'Cách thức thực hiện',
    'trinh_tu_thuc_hien': 'Trình tự thực hiện',
    'thoi_han_giai_quyet': 'Thời hạn giải quyết',
    'phi': 'Phí',
    'le_phi': 'Lệ Phí',
    'thanh_phan_ho_so': 'Thành phần hồ sơ',
    'yeu_cau_dieu_kien': 'Yêu cầu - điều kiện',
    'can_cu_phap_ly': 'Căn cứ pháp lý',
    'bieu_mau': 'Biểu mẫu',
    'ket_qua_thuc_hien': 'Kết quả thực hiện',
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
            'ma_thu_tuc': row[aliases['ma_thu_tuc']],
            'ten_thu_tuc': row[aliases['ten_thu_tuc']],
            'links': row[aliases['links']],
            'linh_vuc': row.get(aliases['linh_vuc'], ''),
            'co_quan_thuc_hien': row.get(aliases['co_quan_thuc_hien'], ''), 
            'muc_do_cung_cap_dich_vu_cong_truc_tuyen': row.get(aliases['muc_do_cung_cap_dich_vu_cong_truc_tuyen'], ''),
            'cach_thuc_thuc_hien': row.get(aliases['cach_thuc_thuc_hien'], ''),
            'trinh_tu_thuc_hien': row.get(aliases['trinh_tu_thuc_hien'], ''),
            'thoi_han_giai_quyet': row.get(aliases['thoi_han_giai_quyet'], ''),
            'phi': row.get(aliases['phi'], ''),
            'le_phi': row.get(aliases['le_phi'], ''),
            'thanh_phan_ho_so': row.get(aliases['thanh_phan_ho_so'], ''),
            'yeu_cau_dieu_kien': row.get(aliases['yeu_cau_dieu_kien'], ''),
            'can_cu_phap_ly': row.get(aliases['can_cu_phap_ly'], ''),
            'bieu_mau': row.get(aliases['bieu_mau'], ''),
            'ket_qua_thuc_hien': row.get(aliases['ket_qua_thuc_hien'], ''),
            
            # 'content': {key : row.get(key, '') for key in row if key in aliases['content']}
        }
        # for key in service_data:
        #     print(f"{key}: {service_data[key]}")
        print(f'Fetching service {service_data["service_id"]}')
        
        client.table('services').insert(service_data).execute()
    
    print(f"Loaded {len(data)} services into Supabase.")