import json, base64, re
from typing import Optional
from datetime import date, datetime
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field
from supabase import create_client

from ..database import client                         # public client (anon hoặc SRK tuỳ MODE)
from ..config import SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

router = APIRouter()

# Admin client dùng SERVICE_ROLE để thao tác đặc quyền (đổi mật khẩu, xóa user...)
admin_client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

ACCESS_COOKIE = "sb-access-token"
MIN_AGE = 14
MAX_AGE = 100

# ===================== Helpers =====================
def _decode_jwt_payload(token: str) -> dict:
    """Decode payload JWT (không verify chữ ký) – đủ dùng DEV."""
    try:
        parts = token.split(".")
        if len(parts) < 2:
            return {}
        payload_b64 = parts[1]
        padding = "=" * (-len(payload_b64) % 4)
        data = base64.urlsafe_b64decode(payload_b64 + padding)
        return json.loads(data.decode("utf-8"))
    except Exception:
        return {}

def _get_current_user(request: Request):
    token = request.cookies.get(ACCESS_COOKIE)
    if not token:
        raise HTTPException(status_code=401, detail="Chưa xác thực")
    payload = _decode_jwt_payload(token)
    uid = payload.get("sub") or payload.get("user_id")
    email = payload.get("email") or ""
    if not uid:
        raise HTTPException(status_code=401, detail="Token không hợp lệ")
    return uid, email

def _skeleton(uid: str):
    return {"id": uid, "name": None, "age": None, "city": None, "phone": None, "dob": None}

def _select_profile(uid: str):
    row = (
        client.table("profiles")
        .select("*")
        .eq("id", uid)
        .maybe_single()
        .execute()
    )
    return getattr(row, "data", None)

# ---- phone helpers ----
VN_MOBILE_RE = re.compile(r"^(0(3|5|7|8|9)\d{8}|(\+?84)(3|5|7|8|9)\d{8})$")
def _normalize_vn_phone(phone: str) -> str:
    phone = phone.replace(" ", "")
    if phone.startswith("+84") or phone.startswith("84"):
        return "0" + re.sub(r"^\+?84", "", phone)
    return phone

def _calc_age_from_dob(d: date) -> int:
    today = date.today()
    years = today.year - d.year - ((today.month, today.day) < (d.month, d.day))
    return years

def _validate_profile_patch(patch: dict):
    # phone
    phone = patch.get("phone")
    if phone is not None:
        if phone == "":
            patch["phone"] = None
        else:
            norm = _normalize_vn_phone(str(phone))
            if not VN_MOBILE_RE.fullmatch(norm):
                raise HTTPException(
                    status_code=400,
                    detail="Số điện thoại di động VN không hợp lệ (03/05/07/08/09, 10 số)",
                )
            patch["phone"] = norm

    # dob string -> date
    if "dob" in patch and isinstance(patch["dob"], str) and patch["dob"]:
        try:
            patch["dob"] = date.fromisoformat(patch["dob"])
        except Exception:
            raise HTTPException(status_code=400, detail="Ngày sinh không hợp lệ (YYYY-MM-DD)")
    if "dob" in patch and patch["dob"] is None:
        pass

    # age: bounds + đồng bộ với dob
    if "age" in patch and patch["age"] is not None:
        try:
            age_int = int(patch["age"])
        except Exception:
            raise HTTPException(status_code=400, detail="Tuổi phải là số nguyên")
        if age_int < MIN_AGE or age_int > MAX_AGE:
            raise HTTPException(status_code=400, detail=f"Độ tuổi phải từ {MIN_AGE}–{MAX_AGE}")
        patch["age"] = age_int

        if isinstance(patch.get("dob"), date):
            calc = _calc_age_from_dob(patch["dob"])
            if calc != age_int:
                raise HTTPException(status_code=400, detail="Tuổi không khớp với ngày sinh")

    if isinstance(patch.get("dob"), date):
        if patch["dob"] > date.today():
            raise HTTPException(status_code=400, detail="Ngày sinh không được lớn hơn hiện tại")
        calc = _calc_age_from_dob(patch["dob"])
        if calc < MIN_AGE or calc > MAX_AGE:
            raise HTTPException(status_code=400, detail=f"Độ tuổi không hợp lệ ({MIN_AGE}–{MAX_AGE})")

# ===================== Schemas =====================
class ProfileOut(BaseModel):
    id: str
    email: str = ""  # dùng str để chấp nhận rỗng khi JWT không có email
    name: Optional[str] = None
    age: Optional[int] = None
    city: Optional[str] = None
    phone: Optional[str] = None
    dob: Optional[date] = None

class ProfileUpdate(BaseModel):
    name: Optional[str] = Field(default=None, max_length=200)
    age: Optional[int] = Field(default=None, ge=0, le=150)
    city: Optional[str] = Field(default=None, max_length=200)
    phone: Optional[str] = Field(default=None, max_length=50)
    dob: Optional[date] = None  # cho phép string ISO, sẽ chuyển ở validator

class ChangePasswordBody(BaseModel):
    current_password: str = Field(min_length=6)
    next_password: str = Field(min_length=8)

# ===================== Routes =====================
@router.get("/api/profile", response_model=ProfileOut)
def get_profile(request: Request):
    uid, email = _get_current_user(request)

    data = _select_profile(uid)
    if not data:
        try:
            client.table("profiles").insert({"id": uid}).execute()
        except Exception:
            pass
        data = _select_profile(uid) or _skeleton(uid)

    return ProfileOut(
        id=uid,
        email=email,
        name=data.get("name"),
        age=data.get("age"),
        city=data.get("city"),
        phone=data.get("phone"),
        dob=data.get("dob"),
    )

@router.put("/api/profile", response_model=ProfileOut)
def update_profile(body: ProfileUpdate, request: Request):
    uid, email = _get_current_user(request)

    patch = {k: v for k, v in body.dict().items() if v is not None}

    # Nếu client gửi dob dạng string ISO, convert về date
    if "dob" in patch and isinstance(patch["dob"], str):
        try:
            patch["dob"] = date.fromisoformat(patch["dob"])
        except Exception:
            raise HTTPException(status_code=400, detail="Ngày sinh không hợp lệ (YYYY-MM-DD)")

    _validate_profile_patch(patch)

    # upsert để tự tạo nếu chưa có
    if isinstance(patch.get("dob"), date):
        patch["dob"] = patch["dob"].isoformat()
    patch["id"] = uid

    client.table("profiles").upsert(patch, on_conflict="id").execute()

    data = _select_profile(uid) or _skeleton(uid)
    return ProfileOut(
        id=uid,
        email=email,
        name=data.get("name"),
        age=data.get("age"),
        city=data.get("city"),
        phone=data.get("phone"),
        dob=data.get("dob"),
    )

@router.put("/api/profile/password")
def change_password(body: ChangePasswordBody, request: Request):
    uid, email = _get_current_user(request)

    if not email:
        raise HTTPException(status_code=400, detail="Không thể đổi mật khẩu (không có email)")

    if body.current_password == body.next_password:
        raise HTTPException(status_code=400, detail="Mật khẩu mới không được trùng mật khẩu hiện tại")

    # 1) Verify current password bằng public client
    try:
        client.auth.sign_in_with_password({"email": email, "password": body.current_password})
    except Exception:
        raise HTTPException(status_code=401, detail="Mật khẩu hiện tại không hợp lệ")

    # 2) Đổi mật khẩu bằng Admin API (SERVICE_ROLE)
    try:
        admin_client.auth.admin.update_user_by_id(uid, {"password": body.next_password})
        return {"ok": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e) or "Đổi mật khẩu thất bại")
