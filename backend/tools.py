from langchain_core.tools import tool
from database import (
    search_services_by_name,
    get_procedure_details,
    get_procedure_details_by_id,
    search_services_direct,
    get_procedure_info_direct,
    get_procedure_column_direct,
)
from typing import List, Optional


@tool
def find_available_services(
    user_request: str, threshold: float = 0.1, limit: int = 5
) -> str:
    """
    Tìm kiếm các dịch vụ công có sẵn dựa trên yêu cầu của người dùng.

    Args:
        user_request: Mô tả dịch vụ mà người dùng muốn đăng ký/sử dụng (ví dụ: 'cấp hộ chiếu', 'đăng ký xe máy')
        threshold: Ngưỡng tương đồng (0.1-1.0, mặc định 0.3)
        limit: Số lượng kết quả tối đa (mặc định 5)

    Returns:
        Danh sách các dịch vụ phù hợp với ID và tên thủ tục
    """
    try:
        # Try using RPC function first
        services = search_services_by_name(user_request, threshold, limit)

        # Fallback to direct search if RPC fails
        if not services:
            services = search_services_direct(user_request, threshold, limit)

        if not services:
            return f"Không tìm thấy dịch vụ nào phù hợp với yêu cầu: '{user_request}'\n\nBạn có thể thử tìm kiếm với từ khóa khác hoặc mô tả cụ thể hơn."

        # Format kết quả
        results = ["**CÁC DỊCH VỤ CÔNG CÓ SẴN:**\n"]

        for i, service in enumerate(services, 1):
            # similarity_percent = round(service.get("similarity_score", 0) * 100, 1)
            results.append(
                f"{i}. **{service['ten_thu_tuc']}**\n"
                f"   • ID: `{service['id']}`\n"
                f"   • Mã thủ tục: `{service['ma_thu_tuc']}`\n"
                f"   • URL: `{service['links']}`\n"
                # f"   • Độ phù hợp: {similarity_percent}%\n"
            )

        results.append(
            f"\n*Tìm thấy {len(services)} dịch vụ phù hợp. "
            f"Để biết chi tiết về bất kỳ thủ tục nào, bạn hãy nói: "
            f"'Cho tôi biết về thủ tục [ID]' hoặc 'Thông tin [loại thông tin] của thủ tục [ID]'*"
        )

        return "\n".join(results)

    except Exception as e:
        return f"Lỗi khi tìm kiếm dịch vụ: {str(e)}"


@tool
def get_procedure_information(service_id: str, column_name: str = "all") -> str:
    """
    Lấy thông tin chi tiết về một thủ tục cụ thể theo ID và cột thông tin.

    Args:
        service_id: ID của thủ tục trong database (ví dụ: 'abc123xyz')
        column_name: Tên cột thông tin cần lấy. Có thể là:
            - "all": Tất cả thông tin (mặc định)
            - "thanh_phan_ho_so": Thành phần hồ sơ
            - "phi": Phí
            - "le_phi": Lệ phí
            - "trinh_tu_thuc_hien": Trình tự thực hiện
            - "thoi_han_giai_quyet": Thời hạn giải quyết
            - "co_quan_thuc_hien": Cơ quan thực hiện
            - "yeu_cau_dieu_kien": Yêu cầu điều kiện
            - "bieu_mau": Biểu mẫu
            - "link_tai_tai_lieu": Tài liệu tải xuống
            - "cach_thuc_thuc_hien": Cách thức thực hiện
            - "can_cu_phap_ly": Căn cứ pháp lý
            - "ket_qua_thuc_hien": Kết quả thực hiện
            - "linh_vuc": Lĩnh vực
            - "muc_do_cung_cap_dich_vu_cong_truc_tuyen": Mức độ dịch vụ trực tuyến

    Returns:
        Thông tin chi tiết về thủ tục được format rõ ràng
    """
    try:
        # If requesting all information
        if column_name.lower() == "all":
            # Get all information
            procedure_info = get_procedure_details(service_id)

            # Fallback to direct query if RPC fails
            if not procedure_info:
                procedure_info = get_procedure_info_direct(service_id)

            if not procedure_info:
                return f"Không tìm thấy thông tin cho thủ tục có ID: `{service_id}`\n\nHãy kiểm tra lại ID thủ tục."

            return format_all_procedure_info(procedure_info)

        else:
            # Get specific column information
            column_value = get_procedure_details_by_id(service_id, column_name)

            # Fallback to direct query if RPC fails
            if not column_value:
                column_value = get_procedure_column_direct(service_id, column_name)

            if not column_value:
                return f"Không tìm thấy thông tin `{column_name}` cho thủ tục có ID: `{service_id}`"

            return format_specific_column_info(service_id, column_name, column_value)

    except Exception as e:
        return f"Lỗi khi lấy thông tin thủ tục: {str(e)}"


def format_all_procedure_info(procedure_info: dict) -> str:
    """Format all procedure information"""
    formatted_info = []

    # Always show basic info first
    if "ten_thu_tuc" in procedure_info:
        formatted_info.append(f"# {procedure_info['ten_thu_tuc']}\n")

    if "ma_thu_tuc" in procedure_info:
        formatted_info.append(f"**Mã thủ tục:** {procedure_info['ma_thu_tuc']}")

    # Column display mapping with Vietnamese labels and emojis
    display_mapping = {
        "linh_vuc": "**Lĩnh vực**",
        "co_quan_thuc_hien": "**Cơ quan thực hiện**",
        "muc_do_cung_cap_dich_vu_cong_truc_tuyen": "**Mức độ dịch vụ trực tuyến**",
        "cach_thuc_thuc_hien": "**Cách thức thực hiện**",
        "trinh_tu_thuc_hien": "**Trình tự thực hiện**",
        "thoi_han_giai_quyet": "⏱**Thời hạn giải quyết**",
        "phi": "**Phí**",
        "le_phi": "**Lệ phí**",
        "thanh_phan_ho_so": "**Thành phần hồ sơ**",
        "yeu_cau_dieu_kien": "**Yêu cầu - điều kiện**",
        "can_cu_phap_ly": "**Căn cứ pháp lý**",
        "bieu_mau": "**Biểu mẫu**",
        "ket_qua_thuc_hien": "**Kết quả thực hiện**",
        "link_tai_tai_lieu": "**Tài liệu tải xuống**",
        "links": "**Link chi tiết**",
    }

    # Add requested information
    for col_name, value in procedure_info.items():
        if (
            col_name not in ["ten_thu_tuc", "ma_thu_tuc", "id"]
            and value
            and str(value).strip()
        ):
            label = display_mapping.get(
                col_name, f"**{col_name.replace('_', ' ').title()}**"
            )

            # Special formatting for certain fields
            if col_name in ["thanh_phan_ho_so", "trinh_tu_thuc_hien"]:
                formatted_info.append(f"\n{label}:\n\n{value}")
            elif col_name == "link_tai_tai_lieu" and value != "None":
                if "||" in value:
                    links = [link.strip() for link in value.split("||")]
                    link_list = "\n".join(
                        [f"• {link}" for link in links if link.strip()]
                    )
                    formatted_info.append(f"\n{label}:\n{link_list}")
                else:
                    formatted_info.append(f"\n{label}:\n• {value}")
            else:
                formatted_info.append(f"\n{label}:\n{value}")

    # Add helpful footer
    formatted_info.append(
        f"\n---\n**Gợi ý:** Bạn có thể hỏi về từng phần cụ thể bằng cách nói: "
        f"'Thành phần hồ sơ của thủ tục này' hoặc 'Phí của thủ tục này'"
    )

    return "\n".join(formatted_info)


def format_specific_column_info(
    service_id: str, column_name: str, column_value: str
) -> str:
    """Format specific column information"""
    # Column display mapping with Vietnamese labels and emojis
    display_mapping = {
        "linh_vuc": "**Lĩnh vực**",
        "co_quan_thuc_hien": "**Cơ quan thực hiện**",
        "muc_do_cung_cap_dich_vu_cong_truc_tuyen": "**Mức độ dịch vụ trực tuyến**",
        "cach_thuc_thuc_hien": "**Cách thức thực hiện**",
        "trinh_tu_thuc_hien": "**Trình tự thực hiện**",
        "thoi_han_giai_quyet": "⏱**Thời hạn giải quyết**",
        "phi": "**Phí**",
        "le_phi": "**Lệ phí**",
        "thanh_phan_ho_so": "**Thành phần hồ sơ**",
        "yeu_cau_dieu_kien": "**Yêu cầu - điều kiện**",
        "can_cu_phap_ly": "**Căn cứ pháp lý**",
        "bieu_mau": "**Biểu mẫu**",
        "ket_qua_thuc_hien": "**Kết quả thực hiện**",
        "link_tai_tai_lieu": "**Tài liệu tải xuống**",
        "links": "**Link chi tiết**",
        "ten_thu_tuc": "**Tên thủ tục**",
        "ma_thu_tuc": "**Mã thủ tục**",
    }

    label = display_mapping.get(
        column_name, f"**{column_name.replace('_', ' ').title()}**"
    )

    # Special formatting for download links
    if column_name == "link_tai_tai_lieu" and column_value != "None":
        if "||" in column_value:
            links = [link.strip() for link in column_value.split("||")]
            link_list = "\n".join([f"• {link}" for link in links if link.strip()])
            return f"{label}:\n{link_list}"
        else:
            return f"{label}:\n• {column_value}"

    return f"{label}:\n{column_value}"


"""TESTING TOOL SECTIONS """
# print(find_available_services("Cấp hộ chiếu"))
# print(
#     get_procedure_information(
#         "29497",
#         "co_quan_thuc_hien",
#     )
# )
# print(
#     get_procedure_information(
#         "29497",
#         "all",
#     )
# )
