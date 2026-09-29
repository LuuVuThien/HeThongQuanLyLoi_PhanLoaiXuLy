import os
import sys

# Ensure script runs with correct encoding
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

from app.database import SessionLocal
from app.models import User, Project, Incident, Comment, RoleEnum, StatusEnum, PriorityEnum, SeverityEnum
from app.auth_utils import hash_password

def seed_data():
    db = SessionLocal()
    try:
        print("Đang tạo thêm dữ liệu mẫu...")

        # 1. Create Users
        dev1 = User(username='dev11', email='dev11@company.com', hashed_password=hash_password('password'), role=RoleEnum.DEVELOPER)
        dev2 = User(username='dev12', email='dev12@company.com', hashed_password=hash_password('password'), role=RoleEnum.DEVELOPER)
        tester = User(username='tester11', email='tester11@company.com', hashed_password=hash_password('password'), role=RoleEnum.TESTER)
        manager = User(username='manager11', email='manager11@company.com', hashed_password=hash_password('password'), role=RoleEnum.MANAGER)

        
        # We assume admin is already created, but we can query it
        admin = db.query(User).filter(User.email == 'admin@company.com').first()
        if not admin:
            admin = User(username='admin', email='admin@company.com', hashed_password=hash_password('admin123'), role=RoleEnum.ADMIN)
            db.add(admin)

        db.add_all([dev1, dev2, tester, manager])
        db.commit()
        db.refresh(dev1)
        db.refresh(dev2)
        db.refresh(tester)
        db.refresh(manager)
        db.refresh(admin)

        # 2. Create Projects
        p1 = Project(name="E-Commerce Website", description="Hệ thống bán hàng trực tuyến")
        p2 = Project(name="Mobile App", description="Ứng dụng di động iOS/Android")
        p3 = Project(name="Internal CRM", description="Hệ thống quản lý khách hàng nội bộ")
        
        db.add_all([p1, p2, p3])
        db.commit()
        db.refresh(p1)
        db.refresh(p2)

        # 3. Create Incidents
        i1 = Incident(
            title="Lỗi giỏ hàng không thanh toán được",
            description="Khi khách hàng chọn thanh toán VNPay thì trang bị lỗi 500.",
            status=StatusEnum.NEW,
            priority=PriorityEnum.HIGH,
            severity=SeverityEnum.MAJOR,
            reporter_id=tester.id,
            assignee_id=dev1.id,
            project_id=p1.id
        )
        i2 = Incident(
            title="Sai font chữ ở trang chủ",
            description="Font chữ header bị sai so với thiết kế.",
            status=StatusEnum.IN_PROGRESS,
            priority=PriorityEnum.LOW,
            severity=SeverityEnum.MINOR,
            reporter_id=tester.id,
            assignee_id=dev2.id,
            project_id=p1.id
        )
        i3 = Incident(
            title="Crash app trên iOS 16",
            description="Ứng dụng văng ngay khi mở lên trên iOS 16.",
            status=StatusEnum.OPEN,
            priority=PriorityEnum.CRITICAL,
            severity=SeverityEnum.BLOCKER,
            reporter_id=manager.id,
            assignee_id=dev1.id,
            project_id=p2.id
        )
        i4 = Incident(
            title="Data export bị lỗi font",
            description="Xuất file CSV bị lỗi font tiếng Việt.",
            status=StatusEnum.RESOLVED,
            priority=PriorityEnum.MEDIUM,
            severity=SeverityEnum.MINOR,
            reporter_id=tester.id,
            assignee_id=dev2.id,
            project_id=p3.id
        )
        db.add_all([i1, i2, i3, i4])
        db.commit()
        db.refresh(i1)
        db.refresh(i3)

        # 4. Create Comments
        c1 = Comment(incident_id=i1.id, user_id=dev1.id, content="Đang check lại log VNPay.")
        c2 = Comment(incident_id=i1.id, user_id=tester.id, content="Nhờ bạn check sớm giúp mình.")
        c3 = Comment(incident_id=i3.id, user_id=dev1.id, content="Đã fix xong, chờ build bản mới.")
        db.add_all([c1, c2, c3])
        db.commit()

        print("Đã tạo xong dữ liệu mẫu trên Neon Database!")

    except Exception as e:
        db.rollback()
        print(f"Lỗi khi tạo dữ liệu: {e}")
    finally:
        db.close()

if __name__ == '__main__':
    seed_data()
