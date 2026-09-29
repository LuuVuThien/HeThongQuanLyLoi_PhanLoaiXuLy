import os
import sys
import random

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

from app.database import SessionLocal
from app.models import User, Project, Incident, StatusEnum, PriorityEnum, SeverityEnum

def seed_more_incidents():
    db = SessionLocal()
    try:
        # Lấy danh sách users và projects
        users = db.query(User).all()
        projects = db.query(Project).all()
        
        if not users or not projects:
            print("Chưa có User hoặc Project nào trong DB. Vui lòng chạy seed_db.py trước.")
            return

        print("Đang tạo thêm 15 lỗi/sự cố ngẫu nhiên...")

        # Dữ liệu mẫu (title, description)
        bug_samples = [
            ("Lỗi không gửi được OTP qua SMS", "Người dùng không nhận được tin nhắn mã OTP khi đăng ký.", SeverityEnum.CRITICAL, PriorityEnum.HIGH),
            ("Nút Submit bị vô hiệu hóa", "Trên Safari, nút submit form liên hệ không click được.", SeverityEnum.MAJOR, PriorityEnum.MEDIUM),
            ("Mất session khi refresh trang", "Người dùng bị văng ra trang login khi F5.", SeverityEnum.BLOCKER, PriorityEnum.CRITICAL),
            ("Giao diện vỡ trên màn hình iPhone SE", "CSS flexbox không responsive đúng cách trên màn hình siêu nhỏ.", SeverityEnum.MINOR, PriorityEnum.LOW),
            ("API thống kê trả về lỗi 502", "Khi truy cập Dashboard, thỉnh thoảng Gateway timeout.", SeverityEnum.MAJOR, PriorityEnum.HIGH),
            ("Màu sắc nút bấm không đúng chuẩn", "Nút Cancel đang là màu đỏ thay vì xám.", SeverityEnum.MINOR, PriorityEnum.LOW),
            ("Email xác nhận gửi vào Spam", "Toàn bộ email từ hệ thống bị Gmail đánh dấu là Spam.", SeverityEnum.CRITICAL, PriorityEnum.HIGH),
            ("Đăng tải ảnh báo lỗi kích thước", "Up ảnh dưới 2MB vẫn báo vượt quá dung lượng.", SeverityEnum.MAJOR, PriorityEnum.MEDIUM),
            ("Tính sai tổng tiền giỏ hàng", "Khuyến mãi 10% nhưng chỉ giảm có 5%.", SeverityEnum.BLOCKER, PriorityEnum.CRITICAL),
            ("Tốc độ load trang danh sách quá chậm", "Phải mất 10s mới hiện xong danh sách sản phẩm.", SeverityEnum.MAJOR, PriorityEnum.MEDIUM),
            ("Không đổi được mật khẩu", "Nhập đúng mật khẩu cũ nhưng hệ thống báo sai.", SeverityEnum.CRITICAL, PriorityEnum.HIGH),
            ("Sai chính tả trang Giới thiệu", "Chữ 'Công ty' bị viết sai chính tả.", SeverityEnum.MINOR, PriorityEnum.LOW),
            ("Lỗi scroll trang trên Android", "Trang web bị dính cứng không vuốt xuống được trên Chrome Android.", SeverityEnum.MAJOR, PriorityEnum.MEDIUM),
            ("Không lọc được ngày tháng", "Filter theo khoảng thời gian không có tác dụng.", SeverityEnum.MAJOR, PriorityEnum.MEDIUM),
            ("Export Excel ra file rỗng", "Nhấn xuất báo cáo Excel thì tải về file 0 byte.", SeverityEnum.CRITICAL, PriorityEnum.HIGH)
        ]

        incidents_to_add = []
        for i, (title, desc, sev, prio) in enumerate(bug_samples):
            # Chọn random status
            status = random.choice(list(StatusEnum))
            
            # Chọn random reporter, assignee, project
            reporter = random.choice(users)
            assignee = random.choice(users)
            project = random.choice(projects)
            
            new_incident = Incident(
                title=title,
                description=desc,
                status=status,
                priority=prio,
                severity=sev,
                reporter_id=reporter.id,
                assignee_id=assignee.id,
                project_id=project.id
            )
            incidents_to_add.append(new_incident)

        db.add_all(incidents_to_add)
        db.commit()

        print(f"Đã thêm thành công {len(incidents_to_add)} lỗi mới vào hệ thống!")

    except Exception as e:
        db.rollback()
        print(f"Lỗi khi thêm incident: {e}")
    finally:
        db.close()

if __name__ == '__main__':
    seed_more_incidents()
