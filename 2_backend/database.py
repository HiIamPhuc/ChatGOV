from typing import List, Optional, Dict
from supabase import create_client, Client
from .config import SUPABASE_URL, SUPABASE_KEY, SUPABASE_SERVICE_ROLE_KEY, MODE
from .models import User, Session, Service
from langchain_core.messages import message_to_dict, messages_from_dict, BaseMessage

if SUPABASE_URL is None:
    raise TypeError("SUPABASE_URL is invalid")

if MODE == "dev":
    client: Client = create_client(
        SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)  # type: ignore
elif MODE == "prod":
    client: Client = create_client(SUPABASE_URL, SUPABASE_KEY)  # type: ignore
else:
    raise ValueError("Invalid MODE. Choose 'dev' or 'prod'.")


def get_user(user_id: str) -> Optional[User]:
    # Ưu tiên dùng SRK nếu có
    if SUPABASE_SERVICE_ROLE_KEY:
        admin_client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
        try:
            resp = admin_client.auth.admin.get_user_by_id(user_id)
            if resp.user:
                return User(id=resp.user.id, email=resp.user.email, phone=resp.user.phone)
        except Exception:
            pass
    # Fallback dùng client thường
    return User(id=user_id, email=None, phone=None)


def save_user(user: User):
    # No need to save to custom table; auth.users is managed by Supabase Auth
    pass


def get_session(session_id: str) -> Optional[Session]:
    response = (
        client.table("sessions").select(
            "*").eq("session_id", session_id).execute()
    )
    if response.data:
        return Session(**response.data[0])
    return None


def save_session(session: Session):
    data = session.dict()
    client.table("sessions").upsert(data, on_conflict="session_id").execute()


# Helpers for chat history serialization
def serialize_chat_history(history: List[BaseMessage]) -> List[dict]:
    return [message_to_dict(msg) for msg in history]


def deserialize_chat_history(serialized: List[dict]) -> List[BaseMessage]:
    return messages_from_dict(serialized)


def get_all_service_titles() -> List[str]:
    response = (
        client.table("services").select(
            "ten_thu_tuc").execute()
    )

    titles = [service['ten_thu_tuc'] for service in response.data]

    return titles


def search_services_by_name(
    query: str, threshold: float = 0.3, limit: int = 5
) -> List[Dict]:
    """
    Tìm kiếm dịch vụ theo tên sử dụng RPC function

    Args:
        query: Từ khóa tìm kiếm
        threshold: Ngưỡng similarity (0-1)
        limit: Số lượng kết quả tối đa

    Returns:
        List[Dict]: Danh sách dịch vụ tìm thấy với service_id, ma_thu_tuc, ten_thu_tuc, similarity_score
    """
    try:
        result = client.rpc(
            "search_services_by_name",
            {
                "search_query": query,
                "similarity_threshold": threshold,
                "result_limit": limit,
            },
        ).execute()

        if result.data:
            print(f"RPC search found {len(result.data)} results")
            return result.data
        else:
            print("RPC search returned no results")
            return []

    except Exception as e:
        print(f"Error searching services by name (RPC): {str(e)}")
        return []


def get_procedure_details_by_id(service_id: str, column_name: str) -> Optional[str]:
    """
    Lấy thông tin cụ thể của một cột từ thủ tục theo ID

    Args:
        service_id: ID của service trong database
        column_name: Tên cột cần lấy thông tin

    Returns:
        Optional[str]: Nội dung của cột đó hoặc None nếu không tìm thấy
    """
    try:
        result = client.rpc(
            "get_procedure_column_by_id",
            {"service_id": service_id, "column_name": column_name},
        ).execute()

        if result.data and len(result.data) > 0:
            value = result.data[0].get("column_value")
            print(
                f"RPC column search found: {column_name} = {value[:50] if value else 'None'}..."
            )
            return value
        else:
            print(f"RPC column search returned no results for {column_name}")
            return None

    except Exception as e:
        print(f"Error getting procedure column by ID (RPC): {str(e)}")
        return None


def get_procedure_details(
    service_id: str, columns: Optional[List[str]] = None
) -> Dict[str, str]:
    """
    Lấy thông tin chi tiết của thủ tục theo ID

    Args:
        service_id: ID của service trong database
        columns: Danh sách cột cần lấy (None = lấy tất cả)

    Returns:
        Dict[str, str]: Thông tin thủ tục
    """
    try:
        params = {"service_id": service_id}
        if columns:
            params["info_columns"] = columns

        result = client.rpc("get_procedure_info_by_id", params).execute()

        # Convert list of dicts to single dict
        procedure_info = {}
        if result.data:
            for item in result.data:
                procedure_info[item["column_name"]] = item["column_value"]
            print(f"RPC procedure details found {len(procedure_info)} fields")
        else:
            print("RPC procedure details returned no results")

        return procedure_info

    except Exception as e:
        print(f"Error getting procedure details by ID (RPC): {str(e)}")
        return {}


def search_services_direct(
    query: str, threshold: float = 0.3, limit: int = 5
) -> List[Dict]:
    """
    Fallback function nếu RPC không có sẵn - tìm kiếm trực tiếp
    """
    try:
        print("Using direct search fallback...")

        # Search by service name
        response = (
            client.table("services")
            .select("id, ma_thu_tuc, ten_thu_tuc")
            .ilike("ten_thu_tuc", f"%{query}%")
            .limit(limit)
            .execute()
        )

        results = []
        if response.data:
            for item in response.data:
                results.append(
                    {
                        "service_id": item["id"],
                        "ma_thu_tuc": item["ma_thu_tuc"],
                        "ten_thu_tuc": item["ten_thu_tuc"],
                        "similarity_score": 0.8,  # Mock similarity score
                    }
                )

        # If no results, try search by field
        if not results:
            response = (
                client.table("services")
                .select("id, ma_thu_tuc, ten_thu_tuc, linh_vuc")
                .ilike("linh_vuc", f"%{query}%")
                .limit(limit)
                .execute()
            )

            if response.data:
                for item in response.data:
                    results.append(
                        {
                            "service_id": item["id"],
                            "ma_thu_tuc": item["ma_thu_tuc"],
                            "ten_thu_tuc": item["ten_thu_tuc"],
                            "similarity_score": 0.6,
                        }
                    )

        print(f"Direct search found {len(results)} results")
        return results

    except Exception as e:
        print(f"Error in direct search: {str(e)}")
        return []


def get_procedure_info_direct(
    service_id: str, columns: Optional[List[str]] = None
) -> Dict[str, str]:
    """
    Fallback function nếu RPC không có sẵn - query trực tiếp theo ID
    """
    try:
        print("🔄 Using direct procedure info fallback...")

        # Build select query
        if columns:
            select_columns = ", ".join(columns + ["id", "ten_thu_tuc"])
        else:
            select_columns = "*"

        # Find by ID
        response = (
            client.table("services")
            .select(select_columns)
            .eq("id", service_id)
            .limit(1)
            .execute()
        )

        if response.data and len(response.data) > 0:
            # Convert to the expected format
            data = response.data[0]
            result = {}
            for key, value in data.items():
                if value is not None and str(value).strip() and str(value) != "None":
                    result[key] = str(value)

            print(f"Direct procedure info found {len(result)} fields")
            return result

        print("Direct procedure info returned no results")
        return {}

    except Exception as e:
        print(f"Error in get_procedure_info_direct: {str(e)}")
        return {}


def get_procedure_column_direct(service_id: str, column_name: str) -> Optional[str]:
    """
    Fallback function để lấy một cột cụ thể theo ID
    """
    try:
        print(f"🔄 Using direct column fallback for {column_name}...")

        response = (
            client.table("services")
            .select(f"{column_name}, ten_thu_tuc")
            .eq("id", service_id)
            .limit(1)
            .execute()
        )

        if response.data and len(response.data) > 0:
            value = response.data[0].get(column_name)
            if value and str(value).strip() and str(value) != "None":
                print(f"Direct column found: {value[:50]}...")
                return str(value)

        print(f"Direct column search returned no results for {column_name}")
        return None

    except Exception as e:
        print(f"Error in get_procedure_column_direct: {str(e)}")
        return None