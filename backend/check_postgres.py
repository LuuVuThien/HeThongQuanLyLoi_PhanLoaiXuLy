import sys
import os

# Đảm bảo UTF-8 trên Windows console
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

from sqlalchemy import text
from app.database import engine

def check_postgres_info():
    with engine.connect() as conn:
        version = conn.execute(text("SELECT version();")).scalar()
        current_db = conn.execute(text("SELECT current_database();")).scalar()
        current_user = conn.execute(text("SELECT current_user;")).scalar()
        
        # Đếm số dòng từng bảng
        incidents_cnt = conn.execute(text("SELECT count(*) FROM incidents;")).scalar()
        users_cnt = conn.execute(text("SELECT count(*) FROM users;")).scalar()
        projects_cnt = conn.execute(text("SELECT count(*) FROM projects;")).scalar()
        
    print("=== XÁC NHẬN KẾT NỐI POSTGRESQL THÀNH CÔNG 100% ===")
    print(f"1. Hệ quản trị CSDL : {version}")
    print(f"2. Database name    : {current_db}")
    print(f"3. DB User          : {current_user}")
    print(f"4. Host server      : {engine.url.host}")
    print(f"5. Driver kết nối   : {engine.url.drivername}")
    print("\n=== DỮ LIỆU ĐANG LƯU TRỮ THỰC TẾ TRÊN POSTGRESQL ===")
    print(f" - Bảng 'incidents' : {incidents_cnt} sự cố")
    print(f" - Bảng 'users'     : {users_cnt} người dùng")
    print(f" - Bảng 'projects'  : {projects_cnt} dự án")

if __name__ == "__main__":
    check_postgres_info()
