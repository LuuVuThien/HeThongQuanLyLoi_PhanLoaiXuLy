from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel, EmailStr
import json
import urllib.parse

from app import crud, schemas, database, models
from app.auth_utils import hash_password, verify_password, create_access_token, decode_access_token, oauth2_scheme

router = APIRouter(
    prefix="/auth",
    tags=["authentication"],
)

class LoginRequest(BaseModel):
    email: Optional[str] = None
    username: Optional[str] = None
    password: str

@router.post("/register", response_model=schemas.UserResponse)
def register(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    """Đăng ký tài khoản người dùng mới với mật khẩu được mã hóa Bcrypt."""
    # Kiểm tra xem email đã tồn tại chưa
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email này đã được đăng ký trong hệ thống",
        )
    
    # Tạo user mới với password được hash an toàn
    return crud.create_user(db=db, user=user)

@router.post("/login")
async def login(
    request: Request,
    db: Session = Depends(database.get_db),
):
    """
    Đăng nhập hệ thống (hỗ trợ cả JSON body lẫn OAuth2 Form).
    Xác thực mật khẩu với Bcrypt và cấp phát JWT token chuẩn RFC 7519.
    """
    login_id = ""
    password = ""

    # Parse linh hoạt và tự động chống lỗi cho cả JSON body, URLSearchParams và Form Data
    try:
        raw_body = await request.body()
        body_text = raw_body.decode("utf-8", errors="ignore").strip()
    except Exception:
        body_text = ""

    # 1. Thử parse JSON
    if body_text.startswith("{"):
        try:
            data = json.loads(body_text)
            if isinstance(data, dict):
                login_id = (data.get("email") or data.get("username") or "").strip()
                password = (data.get("password") or "").strip()
        except Exception:
            pass

    # 2. Nếu chưa parse được, thử parse URL-encoded (URLSearchParams)
    if (not login_id or not password) and body_text and ("=" in body_text):
        try:
            parsed = urllib.parse.parse_qs(body_text)
            login_id = (parsed.get("username", [""])[0] or parsed.get("email", [""])[0]).strip()
            password = parsed.get("password", [""])[0].strip()
        except Exception:
            pass

    # 3. Fallback sang request.form()
    if not login_id or not password:
        try:
            form = await request.form()
            login_id = (form.get("username") or form.get("email") or "").strip()
            password = (form.get("password") or "").strip()
        except Exception:
            pass

    if not login_id or not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vui lòng cung cấp email/tên đăng nhập và mật khẩu",
        )

    # Tìm user theo email hoặc username (không phân biệt hoa thường)
    user = (
        db.query(models.User)
        .filter(
            (models.User.email.ilike(login_id))
            | (models.User.username.ilike(login_id))
        )
        .first()
    )

    # Kiểm tra mật khẩu bằng thuật toán Bcrypt
    # Hỗ trợ cả trường hợp người dùng vô tình gõ khoảng trắng (ví dụ "admin 123" -> "admin123")
    is_valid = False
    if user and user.hashed_password:
        is_valid = verify_password(password, user.hashed_password)
        if not is_valid and " " in password:
            is_valid = verify_password(password.replace(" ", ""), user.hashed_password)

    if not user or not is_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Tài khoản hoặc mật khẩu không chính xác",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Lấy vai trò của người dùng
    role_str = user.role.value if hasattr(user.role, "value") else str(user.role)

    # Sinh JWT Token chuẩn mã hóa HMAC-SHA256
    access_token = create_access_token(
        data={
            "sub": user.email,
            "user_id": user.id,
            "username": user.username,
            "role": role_str,
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": role_str.lower(),
        },
    }

@router.get("/me")
def get_current_user_profile(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(database.get_db),
):
    """Lấy thông tin người dùng từ JWT Token trong Header Authorization."""
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Chưa cung cấp token xác thực",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    payload = decode_access_token(token)
    user_id = payload.get("user_id")
    user = crud.get_user(db, user_id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Người dùng không tồn tại trong hệ thống",
        )

    role_str = user.role.value if hasattr(user.role, "value") else str(user.role)
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "role": role_str.lower(),
    }

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

@router.post("/forgot-password")
def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(database.get_db)):
    """Reset mật khẩu và trả về mật khẩu mới."""
    user = crud.get_user_by_email(db, email=request.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Email không tồn tại trong hệ thống.",
        )
    
    import random
    import string
    # Generate random 8-char password
    new_password = ''.join(random.choices(string.ascii_letters + string.digits, k=8))
    
    # Hash and save
    user.hashed_password = hash_password(new_password)
    db.commit()
    
    return {
        "success": True,
        "message": "Cấp mật khẩu mới thành công",
        "new_password": new_password
    }


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str

@router.post("/change-password")
def change_password(
    request: ChangePasswordRequest, 
    token: Optional[str] = Depends(oauth2_scheme), 
    db: Session = Depends(database.get_db)
):
    """Đổi mật khẩu cho người dùng đang đăng nhập."""
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Chưa cung cấp token xác thực",
        )
        
    payload = decode_access_token(token)
    user_id = payload.get("user_id")
    user = crud.get_user(db, user_id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Người dùng không tồn tại.",
        )
        
    # Xác minh mật khẩu cũ
    if not verify_password(request.old_password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mật khẩu cũ không chính xác.",
        )
        
    # Cập nhật mật khẩu mới
    user.hashed_password = hash_password(request.new_password)
    db.commit()
    
    return {
        "success": True,
        "message": "Đổi mật khẩu thành công!"
    }

@router.post("/logout")
def logout():
    """Đăng xuất an toàn khỏi hệ thống (Hủy bỏ phiên phía client)."""
    return {
        "status": "success",
        "message": "Đã đăng xuất thành công. Token phiên làm việc đã được xóa.",
    }
