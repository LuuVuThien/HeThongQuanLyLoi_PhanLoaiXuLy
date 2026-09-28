import requests
import time
from sqlalchemy.orm import Session
from app.database import engine, SessionLocal
from app.models import User, RoleEnum
import uuid

BASE_URL = "http://localhost:8000"

def get_or_create_user(db: Session):
    user = db.query(User).first()
    if not user:
        user = User(
            username=f"testuser_{uuid.uuid4().hex[:8]}",
            email=f"test_{uuid.uuid4().hex[:8]}@example.com",
            hashed_password="hashed_password",
            role=RoleEnum.DEVELOPER
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user

def run_tests():
    print("="*50)
    print(" BẮT ĐẦU TEST TỰ ĐỘNG CRUD VÀ HIỆU NĂNG API")
    print("="*50)
    
    db = SessionLocal()
    user = get_or_create_user(db)
    reporter_id = user.id
    db.close()
    
    print(f"[SETUP] Sử dụng User ID = {reporter_id} để báo lỗi.\n")

    print("--- 1. TEST CREATE (Hiệu năng) ---")
    num_requests = 100
    success_count = 0
    first_incident_id = None
    
    start_time = time.time()
    for i in range(num_requests):
        payload = {
            "title": f"Lỗi test tự động số {i}",
            "description": "Nút đăng nhập không hoạt động.",
            "status": "NEW",
            "priority": "HIGH",
            "severity": "MAJOR",
            "reporter_id": reporter_id
        }
        try:
            res = requests.post(f"{BASE_URL}/incidents/", json=payload)
            if res.status_code == 200:
                success_count += 1
                if first_incident_id is None:
                    first_incident_id = res.json()["id"]
        except Exception as e:
            print(f"Lỗi ở request {i}: {e}")

    end_time = time.time()
    total_time = end_time - start_time
    
    print(f"✅ Đã gửi {num_requests} request tạo lỗi.")
    print(f"✅ Thành công: {success_count}/{num_requests}")
    print(f"⏱️ Tổng thời gian: {total_time:.2f} giây")
    print(f"⏱️ Tốc độ trung bình (Throughput): {num_requests/total_time:.2f} requests/giây")
    print(f"⏱️ Độ trễ trung bình (Latency): {(total_time/num_requests)*1000:.2f} ms/request\n")

    print("--- 2. TEST READ (Lấy danh sách lỗi) ---")
    start_time = time.time()
    res = requests.get(f"{BASE_URL}/incidents/?limit={num_requests}")
    end_time = time.time()
    if res.status_code == 200:
        data = res.json()
        print(f"✅ Đã tải về {len(data)} lỗi.")
        print(f"⏱️ Thời gian phản hồi: {(end_time - start_time)*1000:.2f} ms\n")

    print("--- 3. TEST UPDATE (Sửa trạng thái lỗi) ---")
    if first_incident_id:
        update_payload = {
            "status": "IN_PROGRESS",
            "priority": "CRITICAL"
        }
        res = requests.patch(f"{BASE_URL}/incidents/{first_incident_id}", json=update_payload)
        if res.status_code == 200:
            updated_data = res.json()
            print(f"✅ Đã cập nhật thành công lỗi ID={first_incident_id}.")
            print(f"👉 Trạng thái mới: {updated_data['status']} | Priority mới: {updated_data['priority']}\n")
    else:
        print("❌ Bỏ qua Update vì không tạo được lỗi mẫu.")
        
    print("--- 4. TEST DELETE (Xóa lỗi vừa tạo) ---")
    if first_incident_id:
        res = requests.delete(f"{BASE_URL}/incidents/{first_incident_id}")
        if res.status_code == 200:
            print(f"✅ Đã xóa thành công lỗi ID={first_incident_id}.\n")
    else:
         print("❌ Bỏ qua Delete vì không có ID lỗi.")
         
    print("🎉 HOÀN THÀNH TOÀN BỘ KỊCH BẢN TEST!")

if __name__ == "__main__":
    run_tests()
