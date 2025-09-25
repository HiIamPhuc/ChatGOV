import os, json, base64
from datetime import timedelta
from fastapi import APIRouter, HTTPException, Response, Request, Header
from pydantic import BaseModel, EmailStr, Field
from supabase import create_client
from ..database import client  # public (anon)
from ..config import SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

router = APIRouter()

# ===== Service Role client để thao tác đặc quyền (bỏ qua RLS) =====
admin_client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# ===== Cookie config =====
COOKIE_DOMAIN = (os.getenv("BACKEND_COOKIE_DOMAIN") or "").strip() or None
COOKIE_SECURE = (os.getenv("BACKEND_COOKIE_SECURE") or "false").lower() == "true"
ACCESS_COOKIE = "sb-access-token"
REFRESH_COOKIE = "sb-refresh-token"

def set_session_cookies(resp: Response, access_token: str, refresh_token: str | None):
    resp.set_cookie(
        key=ACCESS_COOKIE, value=access_token, httponly=True, secure=COOKIE_SECURE,
        samesite="lax", domain=COOKIE_DOMAIN, max_age=int(timedelta(hours=1).total_seconds()), path="/",
    )
    resp.set_cookie(
        key=REFRESH_COOKIE, value=refresh_token or "", httponly=True, secure=COOKIE_SECURE,
        samesite="lax", domain=COOKIE_DOMAIN, max_age=int(timedelta(days=30).total_seconds()), path="/",
    )

def clear_session_cookies(resp: Response):
    resp.delete_cookie(ACCESS_COOKIE, domain=COOKIE_DOMAIN, path="/")
    resp.delete_cookie(REFRESH_COOKIE, domain=COOKIE_DOMAIN, path="/")

# ===== Schemas =====
class RegisterBody(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    fullName: str | None = None
    metadata: dict | None = None

class LoginBody(BaseModel):
    email: EmailStr
    password: str

class ForgotBody(BaseModel):
    email: EmailStr

class ResetBody(BaseModel):
    new_password: str = Field(min_length=6)

class MeResponse(BaseModel):
    id: str
    email: EmailStr
    user_metadata: dict = {}

class ExchangeBody(BaseModel):
    access_token: str
    refresh_token: str | None = None

# ===== Helpers =====
def _decode_jwt_payload(token: str) -> dict:
    try:
        parts = token.split(".")
        if len(parts) < 2:
            return {}
        payload_b64 = parts[1]
        padding = '=' * (-len(payload_b64) % 4)
        import base64 as _b64, json as _json
        data = _b64.urlsafe_b64decode(payload_b64 + padding)
        return _json.loads(data.decode("utf-8"))
    except Exception:
        return {}

def _get_user_by_jwt_using_sdk(jwt: str):
    client.auth._set_auth(jwt)
    return client.auth.get_user()

# ===== Routes =====
@router.post("/api/auth/register")
def register(body: RegisterBody):
    try:
        confirm_redirect = "http://localhost:5173/signin"
        res = client.auth.sign_up({
            "email": body.email,
            "password": body.password,
            "options": {
                "data": ({"fullName": body.fullName, **(body.metadata or {})}
                         if body.fullName else (body.metadata or {})) or {},
                "email_redirect_to": confirm_redirect,
            }
        })
        if not res or not res.user:
            raise HTTPException(status_code=400, detail="Cannot create user")

        # Tài khoản đã tồn tại (Supabase trả identities = [])
        if hasattr(res.user, "identities") and res.user.identities == []:
            raise HTTPException(status_code=400, detail="Tài khoản đã tồn tại, email đã được đăng ký")

        # >>> TẠO HÀNG TRONG profiles bằng SERVICE ROLE (bỏ qua RLS)
        try:
            admin_client.table("profiles").insert({
                "id": res.user.id,
                "name": body.fullName or None,
            }).execute()
        except Exception:
            # nếu đã có (do chạy lại) thì bỏ qua
            pass

        return {"ok": True, "user": {"id": res.user.id, "email": res.user.email}}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/api/auth/login", response_model=MeResponse)
def login(body: LoginBody, response: Response):
    try:
        res = client.auth.sign_in_with_password({"email": body.email, "password": body.password})
        if not res or not getattr(res, "session", None) or not getattr(res.session, "access_token", None):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        set_session_cookies(response, res.session.access_token, getattr(res.session, "refresh_token", ""))
        u = res.user
        return MeResponse(id=u.id, email=u.email, user_metadata=u.user_metadata or {})
    except HTTPException:
        raise
    except Exception as e:
        msg = str(e) or "Login failed"
        if any(x in msg.lower() for x in (
            "invalid login credentials", "email not confirmed",
            "only sign in with an email address that has been confirmed",
            "invalid email or password"
        )):
            raise HTTPException(status_code=401, detail=msg)
        print("[LOGIN ERROR]", repr(e))
        raise HTTPException(status_code=500, detail=msg)

@router.post("/api/auth/logout")
def logout(response: Response, request: Request):
    try:
        access = request.cookies.get(ACCESS_COOKIE)
        if access:
            client.auth._set_auth(access)
            client.auth.sign_out()
    except Exception:
        pass
    finally:
        clear_session_cookies(response)
    return {"ok": True}

@router.post("/api/auth/forgot-password")
def forgot_password(body: ForgotBody):
    try:
        redirect_to = "http://localhost:5173/reset"
        client.auth.reset_password_email(body.email, options={"redirect_to": redirect_to})
        return {"ok": True}
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to send reset email")

@router.post("/api/auth/reset-password")
def reset_password(body: ResetBody, request: Request):
    authz = request.headers.get("Authorization", "")
    if not authz.lower().startswith("bearer "):
        raise HTTPException(status_code=400, detail="Missing recovery access token")
    recovery_token = authz.split(" ", 1)[1].strip()
    if not recovery_token:
        raise HTTPException(status_code=400, detail="Missing recovery access token")

    try:
        payload = _decode_jwt_payload(recovery_token)
        user_id = payload.get("sub") or payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=400, detail="Invalid recovery token")

        updated = client.auth.admin.update_user_by_id(user_id, {"password": body.new_password})
        if not updated or not getattr(updated, "user", None):
            raise HTTPException(status_code=400, detail="Failed to reset password")
        return {"ok": True}
    except HTTPException:
        raise
    except Exception as e:
        print("[RESET ERROR]", repr(e))
        raise HTTPException(status_code=500, detail=str(e) or "Reset password failed")

@router.get("/api/auth/me", response_model=MeResponse)
def me(request: Request, authorization: str | None = Header(None)):
    token = request.cookies.get(ACCESS_COOKIE)
    if not token and authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1]
    if not token:
        raise HTTPException(status_code=401, detail="Unauthenticated")
    try:
        res = _get_user_by_jwt_using_sdk(token)
        if res and getattr(res, "user", None):
            u = res.user
            return MeResponse(id=u.id, email=u.email, user_metadata=u.user_metadata or {})
        payload = _decode_jwt_payload(token)
        uid = payload.get("sub") or payload.get("user_id") or "unknown"
        email = payload.get("email") or "unknown@example.com"
        return MeResponse(id=uid, email=email, user_metadata=payload.get("user_metadata") or {})
    except Exception:
        payload = _decode_jwt_payload(token)
        if not payload:
            raise HTTPException(status_code=401, detail="Invalid token")
        uid = payload.get("sub") or payload.get("user_id") or "unknown"
        email = payload.get("email") or "unknown@example.com"
        return MeResponse(id=uid, email=email, user_metadata=payload.get("user_metadata") or {})

@router.post("/api/auth/session/exchange", response_model=MeResponse)
def exchange_session(body: ExchangeBody, response: Response):
    if not body.access_token:
        raise HTTPException(status_code=400, detail="Missing access token")
    try:
        set_session_cookies(response, body.access_token, body.refresh_token)
        payload = _decode_jwt_payload(body.access_token)
        if not payload:
            raise HTTPException(status_code=401, detail="Invalid access token")
        uid = payload.get("sub") or payload.get("user_id") or "unknown"
        email = payload.get("email") or "unknown@example.com"
        meta = payload.get("user_metadata") or payload.get("app_metadata") or {}
        return MeResponse(id=uid, email=email, user_metadata=meta)
    except HTTPException:
        raise
    except Exception as e:
        print("[EXCHANGE ERROR]", repr(e))
        raise HTTPException(status_code=500, detail=str(e) or "Exchange session failed")
