# -*- coding: utf-8 -*-
from app.database import SessionLocal
from app.models import User
from app.auth_utils import verify_password

db = SessionLocal()
try:
    users = db.query(User).order_by(User.id).all()
    print(f"TOTAL_USERS: {len(users)}")
    print("=" * 70)
    for u in users:
        role_val = u.role.value if hasattr(u.role, 'value') else str(u.role)
        is_bcrypt = u.hashed_password.startswith("$2") if u.hashed_password else False
        
        # Test xem mật khẩu khớp với mật khẩu phổ biến nào
        known_pwd = None
        for test_p in ["admin123", "admin 123", "pm123456", "tester123", "dev123456", "123123123", "secret", "password"]:
            if verify_password(test_p, u.hashed_password):
                known_pwd = test_p
                break
        
        print(f"ID: {u.id:2d} | Username: {u.username:<15} | Email: {u.email:<25} | Role: {role_val:<10} | Bcrypt: {is_bcrypt} | KnownPwd: {known_pwd}")
    print("=" * 70)
finally:
    db.close()
