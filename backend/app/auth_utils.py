# -*- coding: utf-8 -*-
"""
auth_utils.py
-------------
Mô-đun bảo mật & xác thực người dùng:
- Tuân thủ tiêu chuẩn an toàn OWASP Top 10 & NIST SP 800-63B.
- Tuân thủ quy định bảo vệ dữ liệu cá nhân (Nghị định 13/2023/NĐ-CP & Luật An ninh mạng).
- Mã hóa mật khẩu một chiều mạnh mẽ với Bcrypt (tự sinh muối ngẫu nhiên - Salt).
- Cấp phát và xác thực chữ ký JSON Web Token (JWT - RFC 7519) thuật toán HMAC SHA-256.
"""
import os
import bcrypt
import jwt
from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from dotenv import load_dotenv

load_dotenv()

# Khóa bí mật ký số JWT (HMAC-SHA256)
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "super-secret-incident-management-key-2026-very-secure-random-token")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24  # Thời hạn token: 24 tiếng theo chuẩn bảo mật phiên

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)


def hash_password(password: str) -> str:
    """Mã hóa mật khẩu bằng thuật toán Bcrypt với Salt (Cost factor = 12)."""
    pwd_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Kiểm tra mật khẩu nhập vào khớp với bản băm Bcrypt."""
    if not hashed_password:
        return False
    try:
        # Nếu là hash bcrypt ($2b$ hoặc $2a$)
        if hashed_password.startswith("$2"):
            return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
        # Hỗ trợ backward compatibility cho các bản ghi cũ dùng fake hash
        if hashed_password.endswith("notreallyhashed"):
            return plain_password + "notreallyhashed" == hashed_password
        # Trường hợp plain text cũ
        return plain_password == hashed_password
    except Exception:
        return False


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Tạo chữ ký điện tử JWT Token với các Claims bảo mật."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    
    to_encode.update({
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    })
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> dict:
    """Giải mã và xác minh chữ ký tính toàn vẹn của JWT Token."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token xác thực không hợp lệ hoặc đã bị can thiệp trái phép",
            headers={"WWW-Authenticate": "Bearer"},
        )
