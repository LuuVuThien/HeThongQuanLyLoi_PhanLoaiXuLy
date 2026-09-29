from app.database import SessionLocal
from app.models import User
from app.auth_utils import verify_password, hash_password

db = SessionLocal()
try:
    user = db.query(User).filter(User.email == 'admin@company.com').first()
    if user:
        print(f"User found: {user.email}, role={user.role}")
        print(f"Password hash: {user.hashed_password}")
        print(f"Check 'admin123': {verify_password('admin123', user.hashed_password)}")
        print(f"Check 'admin 123': {verify_password('admin 123', user.hashed_password)}")
        
        # Nếu chưa hỗ trợ hoặc mật khẩu chưa chuẩn, cập nhật lại cho chắc chắn
        if not verify_password('admin123', user.hashed_password):
            user.hashed_password = hash_password('admin123')
            db.commit()
            print("Đã cập nhật lại mật khẩu admin123 thành công!")
    else:
        print("Tạo mới tài khoản admin@company.com...")
        new_admin = User(
            email='admin@company.com',
            username='admin',
            hashed_password=hash_password('admin123'),
            role='ADMIN'
        )
        db.add(new_admin)
        db.commit()
        print("Đã tạo mới admin@company.com!")
finally:
    db.close()
