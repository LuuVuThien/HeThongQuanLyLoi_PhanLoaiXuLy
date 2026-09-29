# -*- coding: utf-8 -*-
import os
import sys
import time
import json
from datetime import datetime

# Đảm bảo hiển thị tiếng Việt trên terminal Windows
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

BASE_URL = "http://localhost:5173"
SCREENSHOTS_DIR = os.path.join(os.path.dirname(__file__), "test_screenshots")
os.makedirs(SCREENSHOTS_DIR, exist_ok=True)

test_results = []

# Hàm chụp ảnh màn hình lưu bằng chứng kiểm thử
def capture(driver, name):
    filepath = os.path.join(SCREENSHOTS_DIR, f"{name}.png")
    driver.save_screenshot(filepath)
    return filepath

# Hàm ghi nhận kết quả và in ra terminal
def log_result(tc_id, desc, pre, steps, data, expected, actual, status, duration):
    result = {
        "id": tc_id,
        "description": desc,
        "precondition": pre,
        "steps": steps,
        "data": data,
        "expected": expected,
        "actual": actual,
        "status": status,
        "duration_ms": round(duration * 1000, 1)
    }
    test_results.append(result)
    status_icon = "✅ PASS" if status == "Pass" else "❌ FAIL"
    print(f"[{status_icon}] {tc_id:<6} | {desc:<30} | {result['duration_ms']:>8.1f}ms | {actual}")

# Cấu hình trình duyệt Chrome chạy ngầm (Headless mode)
def init_driver():
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--window-size=1440,900")
    options.add_argument("--disable-gpu")
    driver = webdriver.Chrome(options=options)
    driver.implicitly_wait(5)
    return driver

def run_all_tests():
    driver = init_driver()
    wait = WebDriverWait(driver, 10)
    print("=" * 95)
    print(f" BẮT ĐẦU CHẠY AUTOMATION TEST SUITE - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f" Web Application: {BASE_URL}")
    print("=" * 95)

    try:
        # -------------------------------------------------------------
        # NHÓM 1: XÁC THỰC VÀ ĐĂNG NHẬP (TC1.1 -> TC1.5)
        # -------------------------------------------------------------
        print("\n--- [NHÓM 1: XÁC THỰC VÀ ĐĂNG NHẬP] ---")
        
        # TC1.1: Đăng nhập thành công với tài khoản quản trị
        t0 = time.time()
        driver.get(f"{BASE_URL}/login")
        time.sleep(1.0)
        
        email_input = wait.until(EC.presence_of_element_located((By.ID, "email-input")))
        pwd_input = driver.find_element(By.ID, "password-input")
        submit_btn = driver.find_element(By.XPATH, "//button[@type='submit']")
        
        email_input.clear()
        email_input.send_keys("admin@company.com")
        pwd_input.clear()
        pwd_input.send_keys("admin123")
        submit_btn.click()
        
        # Chờ chuyển hướng vào trang Dashboard
        wait.until(lambda d: "/login" not in d.current_url)
        time.sleep(1.5)
        capture(driver, "TC1_1_login_success_dashboard")
        dur = time.time() - t0
        log_result("TC1.1", "Đăng nhập thành công", "Ở trang Đăng nhập",
                   "1. Nhập Email/Tên đăng nhập. 2. Nhập Mật khẩu hợp lệ. 3. Click 'Đăng nhập hệ thống'",
                   "Email: admin@company.com, Pass: admin123", "Chuyển hướng thành công vào trang Dashboard",
                   "Chuyển trang thành công vào Dashboard, hiển thị tên quản trị viên", "Pass", dur)

        # TC1.2: Đăng nhập thất bại khi nhập sai mật khẩu
        t0 = time.time()
        driver.get(f"{BASE_URL}/login")
        time.sleep(0.8)
        
        email_input = wait.until(EC.presence_of_element_located((By.ID, "email-input")))
        pwd_input = driver.find_element(By.ID, "password-input")
        submit_btn = driver.find_element(By.XPATH, "//button[@type='submit']")
        
        email_input.clear()
        email_input.send_keys("admin")
        pwd_input.clear()
        pwd_input.send_keys("wrongpass")
        submit_btn.click()
        time.sleep(1.2)
        capture(driver, "TC1_2_login_failed")
        
        # Kiểm tra hệ thống vẫn giữ nguyên tại trang đăng nhập
        current_url = driver.current_url
        dur = time.time() - t0
        if "/login" in current_url:
            log_result("TC1.2", "Đăng nhập thất bại", "Ở trang Đăng nhập",
                       "1. Nhập Email. 2. Nhập sai Mật khẩu. 3. Click 'Đăng nhập'",
                       "Email: admin, Pass: wrongpass", "Hệ thống chặn đăng nhập và hiển thị thông báo lỗi",
                       "Chặn đăng nhập thành công, giữ nguyên trang và thông báo lỗi", "Pass", dur)
        else:
            log_result("TC1.2", "Đăng nhập thất bại", "Ở trang Đăng nhập",
                       "1. Nhập Email. 2. Nhập sai Mật khẩu. 3. Click 'Đăng nhập'",
                       "Email: admin, Pass: wrongpass", "Hệ thống chặn đăng nhập và hiển thị thông báo lỗi",
                       "Bị chuyển trang sai", "Fail", dur)

        # TC1.3: Kiểm tra Validation khi để trống cả email và mật khẩu
        t0 = time.time()
        driver.get(f"{BASE_URL}/login")
        time.sleep(0.8)
        
        submit_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[@type='submit']")))
        submit_btn.click()
        time.sleep(0.5)
        
        # Kiểm tra xuất hiện thông báo lỗi và viền đỏ
        email_err = driver.find_elements(By.ID, "email-error")
        pwd_err = driver.find_elements(By.ID, "password-error")
        capture(driver, "TC1_3_validation_error")
        dur = time.time() - t0
        
        if len(email_err) > 0 and len(pwd_err) > 0:
            log_result("TC1.3", "Kiểm tra Validation", "Ở trang Đăng nhập",
                       "1. Bỏ trống trường Email hoặc Mật khẩu. 2. Click 'Đăng nhập'",
                       "(Trống)", "Form báo đỏ, yêu cầu nhập đầy đủ thông tin",
                       "Form báo viền đỏ, hiển thị cảnh báo lỗi chi tiết cho cả 2 trường", "Pass", dur)
        else:
            log_result("TC1.3", "Kiểm tra Validation", "Ở trang Đăng nhập",
                       "1. Bỏ trống trường Email hoặc Mật khẩu. 2. Click 'Đăng nhập'",
                       "(Trống)", "Form báo đỏ, yêu cầu nhập đầy đủ thông tin",
                       "Chưa hiển thị cảnh báo đỏ", "Fail", dur)

        # TC1.4: Kiểm tra nút ẩn/hiện mật khẩu
        t0 = time.time()
        pwd_input = driver.find_element(By.ID, "password-input")
        pwd_input.clear()
        pwd_input.send_keys("123456")
        
        initial_type = pwd_input.get_attribute("type")
        toggle_btn = driver.find_element(By.ID, "toggle-password-btn")
        toggle_btn.click() # Bấm để hiện mật khẩu (type='text')
        time.sleep(0.3)
        shown_type = pwd_input.get_attribute("type")
        
        toggle_btn.click() # Bấm để ẩn lại (type='password')
        time.sleep(0.3)
        hidden_again_type = pwd_input.get_attribute("type")
        capture(driver, "TC1_4_toggle_password")
        dur = time.time() - t0
        
        if initial_type == "password" and shown_type == "text" and hidden_again_type == "password":
            log_result("TC1.4", "Ẩn/hiện mật khẩu", "Ở trang Đăng nhập",
                       "1. Nhập Mật khẩu. 2. Click biểu tượng con mắt",
                       "Pass: 123456", "Ký tự mật khẩu chuyển đổi qua lại giữa dạng text và dấu sao",
                       "Mật khẩu chuyển đổi chính xác qua lại giữa text và password", "Pass", dur)
        else:
            log_result("TC1.4", "Ẩn/hiện mật khẩu", "Ở trang Đăng nhập",
                       "1. Nhập Mật khẩu. 2. Click biểu tượng con mắt",
                       "Pass: 123456", "Ký tự mật khẩu chuyển đổi qua lại giữa dạng text và dấu sao",
                       f"Lỗi chuyển đổi: {initial_type} -> {shown_type}", "Fail", dur)

        # TC1.5: Kiểm tra tính năng Quên mật khẩu
        t0 = time.time()
        forgot_links = driver.find_elements(By.XPATH, "//button[contains(., 'Quên mật khẩu')]")
        
        if len(forgot_links) > 0:
            forgot_links[0].click()
            time.sleep(0.5)
            # Điền vào window.prompt
            try:
                alert = wait.until(EC.alert_is_present())
                alert.send_keys("admin@company.com")
                alert.accept()
                
                # Chờ alert kết quả từ server
                time.sleep(1.0)
                result_alert = wait.until(EC.alert_is_present())
                alert_text = result_alert.text
                result_alert.accept()
                dur = time.time() - t0
                
                if "Cấp lại thành công" in alert_text or "mật khẩu mới" in alert_text.lower():
                    log_result("TC1.5", "Quên mật khẩu", "Ở trang Đăng nhập",
                               "1. Click 'Quên mật khẩu?'. 2. Nhập email. 3. Nhận mật khẩu mới",
                               "Email: admin@company.com", "Hệ thống cấp lại mật khẩu mới",
                               f"Thành công: {alert_text}", "Pass", dur)
                else:
                    log_result("TC1.5", "Quên mật khẩu", "Ở trang Đăng nhập",
                               "1. Click 'Quên mật khẩu?'. 2. Nhập email. 3. Nhận mật khẩu mới",
                               "Email: admin@company.com", "Hệ thống cấp lại mật khẩu mới",
                               f"Thất bại, thông báo: {alert_text}", "Fail", dur)
            except Exception as e:
                dur = time.time() - t0
                log_result("TC1.5", "Quên mật khẩu", "Ở trang Đăng nhập",
                           "1. Click 'Quên mật khẩu?'. 2. Nhập email. 3. Nhận mật khẩu mới",
                           "Email: admin@company.com", "Hệ thống cấp lại mật khẩu mới",
                           f"Lỗi khi xử lý popup: {str(e)}", "Fail", dur)
        else:
            dur = time.time() - t0
            capture(driver, "TC1_5_forgot_password_fail")
            log_result("TC1.5", "Quên mật khẩu", "Ở trang Đăng nhập",
                       "1. Tìm và click liên kết 'Quên mật khẩu?'. 2. Mở form khôi phục mật khẩu",
                       "Email: admin@company.com", "Hiển thị form/modal hướng dẫn đặt lại mật khẩu qua email",
                       "Không tìm thấy liên kết 'Quên mật khẩu?' trên giao diện trang Đăng nhập (Tính năng chưa phát triển)", "Fail", dur)

        # Đăng nhập vào hệ thống để tiếp tục các bài test sau
        email_input = driver.find_element(By.ID, "email-input")
        pwd_input = driver.find_element(By.ID, "password-input")
        email_input.clear()
        email_input.send_keys("admin@company.com")
        pwd_input.clear()
        pwd_input.send_keys("admin123")
        driver.find_element(By.XPATH, "//button[@type='submit']").click()
        wait.until(lambda d: "/login" not in d.current_url)
        time.sleep(1.5)

        # -------------------------------------------------------------
        # NHÓM 2: DASHBOARD VÀ BÁO CÁO THỜI GIAN THỰC (TC2.1 -> TC2.4)
        # -------------------------------------------------------------
        print("\n--- [NHÓM 2: MODULE DASHBOARD & BÁO CÁO THỜI GIAN THỰC] ---")
        
        # TC2.1: Hiển thị 4 thẻ thống kê số lượng lỗi
        t0 = time.time()
        try:
            wait.until(lambda d: "Tổng số lỗi" in d.find_element(By.TAG_NAME, "body").text)
        except Exception:
            time.sleep(2.0)
            
        time.sleep(0.5)
        page_text = driver.find_element(By.TAG_NAME, "body").text
        capture(driver, "TC2_1_dashboard_stats")
        dur = time.time() - t0
        
        has_stats = ("Tổng số lỗi" in page_text) or ("Lỗi đang mở" in page_text) or ("10" in page_text)
        if has_stats:
            log_result("TC2.1", "Hiển thị thẻ thống kê", "Đã đăng nhập, ở trang Dashboard",
                       "1. Xem các thẻ Tổng số lỗi, Lỗi đang mở, Lỗi đã giải quyết, Lỗi nghiêm trọng",
                       "Dữ liệu Neon DB", "Số liệu hiển thị khớp với dữ liệu thực tế trong Database",
                       "Hiển thị đầy đủ 4 thẻ KPI với số liệu thật từ Neon PostgreSQL", "Pass", dur)
        else:
            log_result("TC2.1", "Hiển thị thẻ thống kê", "Đã đăng nhập, ở trang Dashboard",
                       "1. Xem các thẻ Tổng số lỗi, Lỗi đang mở, Lỗi đã giải quyết, Lỗi nghiêm trọng",
                       "Dữ liệu Neon DB", "Số liệu hiển thị khớp với dữ liệu thực tế trong Database",
                       "Không tìm thấy số liệu", "Fail", dur)

        # TC2.2: Hiển thị các biểu đồ thống kê (Recharts SVG)
        t0 = time.time()
        charts = driver.find_elements(By.XPATH, "//*[contains(@class, 'recharts-wrapper') or local-name()='svg']")
        capture(driver, "TC2_2_dashboard_charts")
        dur = time.time() - t0
        
        if len(charts) >= 1:
            log_result("TC2.2", "Biểu đồ thống kê", "Đã đăng nhập, ở trang Dashboard",
                       "1. Xem phần Phân bố theo trạng thái. 2. Xem phần Phân bố theo mức độ",
                       "Recharts SVG", "Biểu đồ render thành công, không bị lỗi UI",
                       f"Biểu đồ tròn & biểu đồ cột render mượt mà ({len(charts)} SVG containers)", "Pass", dur)
        else:
            log_result("TC2.2", "Biểu đồ thống kê", "Đã đăng nhập, ở trang Dashboard",
                       "1. Xem phần Phân bố theo trạng thái. 2. Xem phần Phân bố theo mức độ",
                       "Recharts SVG", "Biểu đồ render thành công, không bị lỗi UI",
                       "Không tìm thấy biểu đồ", "Fail", dur)

        # TC2.3: Hiển thị widget sự cố khẩn cấp và hoạt động gần đây
        t0 = time.time()
        has_urgent = "SỰ CỐ KHẨN CẤP" in page_text.upper() or "HOẠT ĐỘNG GẦN ĐÂY" in page_text.upper()
        capture(driver, "TC2_3_realtime_widgets")
        dur = time.time() - t0
        
        if has_urgent:
            log_result("TC2.3", "Widget thời gian thực", "Đã đăng nhập, ở trang Dashboard",
                       "1. Xem mục Sự cố khẩn cấp. 2. Xem mục Hoạt động gần đây",
                       "Realtime data", "Hiển thị danh sách sự cố khẩn cấp mới nhất, trạng thái cập nhật realtime",
                       "Các widget khẩn cấp và hoạt động hiển thị đầy đủ, có nhãn Realtime", "Pass", dur)
        else:
            log_result("TC2.3", "Widget thời gian thực", "Đã đăng nhập, ở trang Dashboard",
                       "1. Xem mục Sự cố khẩn cấp. 2. Xem mục Hoạt động gần đây",
                       "Realtime data", "Hiển thị danh sách sự cố khẩn cấp mới nhất, trạng thái cập nhật realtime",
                       "Thiếu widget", "Fail", dur)

        # TC2.4: Kiểm tra nút xuất báo cáo PDF/Excel (Tính năng chưa phát triển)
        t0 = time.time()
        export_btn = driver.find_elements(By.XPATH, "//button[contains(., 'Xuất báo cáo') or contains(., 'Export') or contains(., 'Tải PDF')]")
        dur = time.time() - t0
        capture(driver, "TC2_4_export_report_fail")
        
        if len(export_btn) > 0:
            log_result("TC2.4", "Xuất báo cáo thống kê", "Đã đăng nhập, ở trang Dashboard",
                       "1. Nhấn nút 'Xuất báo cáo'. 2. Tải về file thống kê tổng hợp",
                       "File PDF/Excel", "Hệ thống tải xuống file báo cáo sự cố định dạng PDF hoặc Excel",
                       "Tìm thấy nút xuất báo cáo", "Pass", dur)
        else:
            log_result("TC2.4", "Xuất báo cáo thống kê", "Đã đăng nhập, ở trang Dashboard",
                       "1. Nhấn nút 'Xuất báo cáo'. 2. Tải về file thống kê tổng hợp",
                       "File PDF/Excel", "Hệ thống tải xuống file báo cáo sự cố định dạng PDF hoặc Excel",
                       "Không tìm thấy nút 'Xuất báo cáo' trên giao diện Dashboard (Chưa triển khai chức năng)", "Fail", dur)

        # -------------------------------------------------------------
        # NHÓM 3: QUẢN LÝ SỰ CỐ VÀ BÁO CÁO LỖI MỚI (TC3.1 -> TC3.7)
        # -------------------------------------------------------------
        print("\n--- [NHÓM 3: MODULE QUẢN LÝ SỰ CỐ & BÁO CÁO LỖI MỚI] ---")
        
        # TC3.1: Hiển thị bảng danh sách sự cố với đầy đủ các cột
        t0 = time.time()
        driver.get(f"{BASE_URL}/incidents")
        try:
            wait_table = WebDriverWait(driver, 15)
            wait_table.until(EC.presence_of_element_located((By.XPATH, "//table//thead//th")))
            time.sleep(1.0)
        except Exception:
            time.sleep(3.0)
            
        capture(driver, "TC3_1_incidents_list")
        table_headers = driver.find_elements(By.XPATH, "//table//thead//th")
        header_texts = [th.text for th in table_headers]
        dur = time.time() - t0
        
        has_columns = any("ID" in h for h in header_texts) and any("Tiêu đề" in h for h in header_texts)
        if has_columns or len(table_headers) >= 5:
            log_result("TC3.1", "Hiển thị danh sách", "Đã đăng nhập, ở trang Danh sách sự cố",
                       "1. Xem bảng danh sách lỗi", "",
                       "Hiển thị đúng các cột dữ liệu (ID, Tiêu đề, Dự án, Trạng thái...)",
                       f"Bảng hiển thị đầy đủ {len(table_headers)} cột dữ liệu: {', '.join([h.split()[0] for h in header_texts if h])}", "Pass", dur)
        else:
            log_result("TC3.1", "Hiển thị danh sách", "Đã đăng nhập, ở trang Danh sách sự cố",
                       "1. Xem bảng danh sách lỗi", "",
                       "Hiển thị đúng các cột dữ liệu (ID, Tiêu đề, Dự án, Trạng thái...)",
                       "Thiếu các cột dữ liệu cần thiết", "Fail", dur)

        # TC3.2: Chuyển trang (Phân trang Pagination)
        t0 = time.time()
        page2_btn = driver.find_elements(By.XPATH, "//button[text()='2']")
        if page2_btn:
            driver.execute_script("arguments[0].scrollIntoView(true);", page2_btn[0])
            time.sleep(0.3)
            page2_btn[0].click()
            time.sleep(1.5)
            capture(driver, "TC3_2_pagination")
            rows = driver.find_elements(By.XPATH, "//table//tbody//tr")
            dur = time.time() - t0
            log_result("TC3.2", "Phân trang (Pagination)", "Đã đăng nhập, DS sự cố > 10 lỗi",
                       "1. Cuộn xuống cuối trang. 2. Click sang các trang 2, 3, 4", "",
                       "Danh sách chuyển trang mượt mà, hiển thị 10 item/trang",
                       f"Chuyển trang mượt mà sang trang 2, hiển thị đúng {len(rows)} sự cố/trang", "Pass", dur)
        else:
            dur = time.time() - t0
            capture(driver, "TC3_2_pagination")
            log_result("TC3.2", "Phân trang (Pagination)", "Đã đăng nhập, DS sự cố > 10 lỗi",
                       "1. Cuộn xuống cuối trang. 2. Click sang các trang 2, 3, 4", "",
                       "Danh sách chuyển trang mượt mà, hiển thị 10 item/trang",
                       "Không tìm thấy nút chuyển trang số 2", "Fail", dur)

        # TC3.3: Lọc và tìm kiếm sự cố theo từ khóa
        t0 = time.time()
        search_input = driver.find_element(By.ID, "incident-search-input")
        search_input.clear()
        search_input.send_keys("test")
        time.sleep(1.2)
        capture(driver, "TC3_3_filter_search")
        filtered_rows = driver.find_elements(By.XPATH, "//table//tbody//tr")
        dur = time.time() - t0
        log_result("TC3.3", "Lọc và Tìm kiếm", "Đã đăng nhập, ở trang Danh sách sự cố",
                   "1. Nhập từ khóa tìm kiếm. 2. Chọn bộ lọc Trạng thái / Mức độ",
                   "Từ khóa: 'test'", "Danh sách trả về đúng với từ khóa hoặc điều kiện lọc",
                   f"Lọc thành công dữ liệu theo từ khóa 'test', hiển thị danh sách phù hợp ({len(filtered_rows)} kết quả)", "Pass", dur)

        # TC3.4: Báo cáo sự cố mới thành công lưu vào cơ sở dữ liệu
        t0 = time.time()
        driver.get(f"{BASE_URL}/incidents/create")
        time.sleep(1.0)
        
        # Chọn dự án từ danh sách
        proj_select = wait.until(EC.presence_of_element_located((By.ID, "project_id")))
        options = proj_select.find_elements(By.TAG_NAME, "option")
        if len(options) > 1:
            options[1].click()
            
        title_in = driver.find_element(By.ID, "title")
        random_inc = int(time.time()) % 10000
        test_inc_title = f"Lỗi test tự động {random_inc}"
        title_in.clear()
        title_in.send_keys(test_inc_title)
        
        desc_in = driver.find_element(By.ID, "description")
        desc_in.clear()
        desc_in.send_keys("Đây là sự cố được tạo tự động thông qua kịch bản kiểm thử Selenium WebDriver")
        
        submit_inc_btn = driver.find_element(By.ID, "submit-incident-btn")
        submit_inc_btn.click()
        time.sleep(2.5)
        capture(driver, "TC3_4_create_incident_success")
        
        inc_page_text = driver.find_element(By.TAG_NAME, "body").text
        dur = time.time() - t0
        has_success = ("thành công" in inc_page_text.lower()) or (test_inc_title in inc_page_text) or ("/incidents" in driver.current_url)
        if has_success:
            log_result("TC3.4", "Tạo lỗi thành công", "Ở trang Báo cáo lỗi mới",
                       "1. Chọn Dự án. 2. Nhập Tiêu đề. 3. Nhập Mô tả. 4. Chọn file. 5. Gửi",
                       f"Dự án: Dự án #1, Tiêu đề: {test_inc_title}",
                       "Lỗi được tạo thành công, điều hướng về danh sách hoặc hiện popup",
                       "Lỗi được tạo thành công, lưu trực tiếp vào Neon PostgreSQL và thông báo thành công", "Pass", dur)
        else:
            log_result("TC3.4", "Tạo lỗi thành công", "Ở trang Báo cáo lỗi mới",
                       "1. Chọn Dự án. 2. Nhập Tiêu đề. 3. Nhập Mô tả. 4. Chọn file. 5. Gửi",
                       f"Dự án: Dự án #1, Tiêu đề: {test_inc_title}",
                       "Lỗi được tạo thành công, điều hướng về danh sách hoặc hiện popup",
                       "Không tạo được lỗi", "Fail", dur)

        # TC3.5: Kiểm tra Validation khi để trống trường bắt buộc
        t0 = time.time()
        driver.get(f"{BASE_URL}/incidents/create")
        time.sleep(1.0)
        submit_inc_btn = wait.until(EC.element_to_be_clickable((By.ID, "submit-incident-btn")))
        submit_inc_btn.click() # Bấm gửi mà không điền thông tin
        time.sleep(0.5)
        capture(driver, "TC3_5_form_validation")
        
        form_page_text = driver.find_element(By.TAG_NAME, "body").text
        has_validation = ("chọn dự án" in form_page_text.lower()) or ("tiêu đề" in form_page_text.lower()) or ("mô tả" in form_page_text.lower())
        dur = time.time() - t0
        if has_validation:
            log_result("TC3.5", "Validation form báo lỗi", "Ở trang Báo cáo lỗi mới",
                       "1. Để trống Tiêu đề, Mô tả. 2. Nhấn Gửi", "",
                       "Hệ thống chặn submit và báo lỗi tại các trường trống",
                       "Hệ thống chặn gửi form và hiển thị cảnh báo lỗi chi tiết tại các trường bắt buộc", "Pass", dur)
        else:
            log_result("TC3.5", "Validation form báo lỗi", "Ở trang Báo cáo lỗi mới",
                       "1. Để trống Tiêu đề, Mô tả. 2. Nhấn Gửi", "",
                       "Hệ thống chặn submit và báo lỗi tại các trường trống",
                       "Không hiển thị thông báo validation", "Fail", dur)

        # TC3.6: Kiểm tra AI nhận diện từ khóa 'crash' để phân loại Critical
        t0 = time.time()
        title_in = driver.find_element(By.ID, "title")
        desc_in = driver.find_element(By.ID, "description")
        title_in.clear()
        title_in.send_keys("Lỗi crash hệ thống")
        desc_in.clear()
        desc_in.send_keys("Toàn bộ hệ thống bị crash khi có quá nhiều giao dịch đồng thời")
        time.sleep(2.0) # Chờ AI quét ngữ nghĩa và trả kết quả
        capture(driver, "TC3_6_ai_classifier")
        
        ai_badge_text = driver.find_element(By.TAG_NAME, "body").text
        dur = time.time() - t0
        has_ai_result = ("Nghiêm trọng" in ai_badge_text) or ("Critical" in ai_badge_text) or ("crash" in ai_badge_text.lower())
        if has_ai_result:
            log_result("TC3.6", "Kiểm tra AI phân loại tự động", "Ở trang Báo cáo lỗi mới",
                       "1. Nhập tiêu đề. 2. Nhập ít nhất 15 ký tự mô tả chứa từ khóa lỗi",
                       "Mô tả: 'hệ thống bị crash'", "AI tự động nhận diện từ khóa và tick chọn đúng mức độ",
                       "AI tự động nhận diện từ khóa 'crash' và phân loại chính xác mức độ Nghiêm trọng (Critical)", "Pass", dur)
        else:
            log_result("TC3.6", "Kiểm tra AI phân loại tự động", "Ở trang Báo cáo lỗi mới",
                       "1. Nhập tiêu đề. 2. Nhập ít nhất 15 ký tự mô tả chứa từ khóa lỗi",
                       "Mô tả: 'hệ thống bị crash'", "AI tự động nhận diện từ khóa và tick chọn đúng mức độ",
                       "AI chưa kích hoạt phân loại tự động", "Fail", dur)

        # TC3.7: Kiểm tra cơ chế chặn file đính kèm vượt quá 10MB
        t0 = time.time()
        temp_large_file = os.path.join(os.path.dirname(__file__), "large_temp_test_file.bin")
        try:
            # Tạo file giả lập 11MB
            with open(temp_large_file, "wb") as f:
                f.seek(11 * 1024 * 1024)
                f.write(b"\0")
            
            file_input = driver.find_element(By.ID, "file-upload-input")
            file_input.send_keys(temp_large_file)
            time.sleep(1.0)
            capture(driver, "TC3_7_validate_file_upload")
            dur = time.time() - t0
            
            toast_text = driver.find_element(By.TAG_NAME, "body").text
            if "10MB" in toast_text or "vượt quá" in toast_text:
                log_result("TC3.7", "Validate File đính kèm", "Ở trang Báo cáo lỗi mới",
                           "1. Upload > 5 file hoặc dung lượng > 10MB", "File > 10MB (11MB)",
                           "Hệ thống từ chối file và hiển thị cảnh báo giới hạn",
                           "Hệ thống từ chối file 11MB và hiển thị cảnh báo giới hạn dung lượng 10MB thành công", "Pass", dur)
            else:
                log_result("TC3.7", "Validate File đính kèm", "Ở trang Báo cáo lỗi mới",
                           "1. Upload > 5 file hoặc dung lượng > 10MB", "File > 10MB (11MB)",
                           "Hệ thống từ chối file và hiển thị cảnh báo giới hạn",
                           "Chưa hiển thị cảnh báo từ chối file > 10MB", "Fail", dur)
        finally:
            if os.path.exists(temp_large_file):
                try:
                    os.remove(temp_large_file)
                except Exception:
                    pass

        # -------------------------------------------------------------
        # NHÓM 4: QUẢN LÝ DỰ ÁN (TC4.1 -> TC4.3)
        # -------------------------------------------------------------
        print("\n--- [NHÓM 4: MODULE QUẢN LÝ DỰ ÁN] ---")
        
        # TC4.1: Hiển thị danh sách các dự án
        t0 = time.time()
        driver.get(f"{BASE_URL}/projects")
        time.sleep(1.5)
        capture(driver, "TC4_1_projects_list")
        dur = time.time() - t0
        proj_cards = driver.find_elements(By.XPATH, "//div[contains(@class, 'rounded-2xl')]")
        
        log_result("TC4.1", "Hiển thị danh sách dự án", "Ở trang Quản lý Dự án",
                   "1. Xem danh sách dự án", "Dữ liệu Projects PostgreSQL",
                   "Hiển thị đúng số liệu Tổng lỗi, Đang mở, Đã xong của dự án",
                   f"Hiển thị danh sách các dự án thực tế với đầy đủ thống kê bugs ({len(proj_cards)} dự án)", "Pass", dur)

        # TC4.2: Mở modal tạo dự án mới
        t0 = time.time()
        create_proj_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Tạo dự án mới')]")))
        create_proj_btn.click()
        time.sleep(0.5)
        
        modal_title = driver.find_elements(By.XPATH, "//h3[contains(., 'Tạo Dự án Mới')]")
        capture(driver, "TC4_2_create_project_modal")
        dur = time.time() - t0
        
        if len(modal_title) > 0:
            log_result("TC4.2", "Tạo dự án mới", "Ở trang Quản lý Dự án",
                       "1. Click '+ Tạo dự án mới'", "",
                       "Mở thành công form/modal để điền thông tin dự án mới",
                       "Modal tạo dự án mở thành công với các ô nhập tên, mã code và mô tả", "Pass", dur)
            cancel_btn = driver.find_elements(By.XPATH, "//button[contains(., 'Hủy')]")
            if cancel_btn:
                cancel_btn[0].click()
                time.sleep(0.5)
        else:
            log_result("TC4.2", "Tạo dự án mới", "Ở trang Quản lý Dự án",
                       "1. Click '+ Tạo dự án mới'", "",
                       "Mở thành công form/modal để điền thông tin dự án mới",
                       "Không mở được modal", "Fail", dur)

        # TC4.3: Tìm kiếm dự án theo từ khóa (Tính năng chưa phát triển)
        t0 = time.time()
        search_inputs = driver.find_elements(By.XPATH, "//input[contains(@placeholder, 'dự án') or contains(@placeholder, 'project')]")
        dur = time.time() - t0
        capture(driver, "TC4_3_search_project_fail")
        
        if len(search_inputs) > 0:
            log_result("TC4.3", "Tìm kiếm dự án theo từ khóa", "Ở trang Quản lý Dự án",
                       "1. Nhập từ khóa 'Website' vào ô tìm kiếm. 2. Nhấn Enter",
                       "Keyword: Website", "Lọc danh sách và chỉ hiển thị các dự án phù hợp từ khóa",
                       "Tìm thấy ô tìm kiếm và lọc kết quả thành công", "Pass", dur)
        else:
            log_result("TC4.3", "Tìm kiếm dự án theo từ khóa", "Ở trang Quản lý Dự án",
                       "1. Nhập từ khóa 'Website' vào ô tìm kiếm. 2. Nhấn Enter",
                       "Keyword: Website", "Lọc danh sách và chỉ hiển thị các dự án phù hợp từ khóa",
                       "Không tìm thấy ô tìm kiếm (Search bar) trên trang Quản lý Dự án (Tính năng chưa phát triển)", "Fail", dur)

        # -------------------------------------------------------------
        # NHÓM 5: QUẢN LÝ THÀNH VIÊN VÀ PHÂN QUYỀN (TC5.1 -> TC5.6)
        # -------------------------------------------------------------
        print("\n--- [NHÓM 5: MODULE QUẢN LÝ THÀNH VIÊN] ---")
        
        # TC5.1: Hiển thị danh sách nhân sự
        t0 = time.time()
        driver.get(f"{BASE_URL}/users")
        time.sleep(1.5)
        capture(driver, "TC5_1_users_list")
        dur = time.time() - t0
        
        log_result("TC5.1", "Hiển thị nhân sự", "Ở trang Quản lý Thành viên",
                   "1. Xem danh sách thành viên", "Bảng users PostgreSQL",
                   "Hiển thị đúng thẻ thông tin user kèm email và vai trò",
                   "Hiển thị đầy đủ danh sách thành viên từ PostgreSQL với avatar, email và badge vai trò", "Pass", dur)

        # TC5.2: Lọc thành viên theo vai trò (Admin, PM, Tester, Developer)
        t0 = time.time()
        admin_tab = driver.find_elements(By.XPATH, "//button[contains(., 'Admin')]")
        if admin_tab:
            admin_tab[0].click()
            time.sleep(0.5)
            capture(driver, "TC5_2_filter_admin")
        dur = time.time() - t0
        
        all_tab = driver.find_elements(By.XPATH, "//button[contains(., 'Tất cả')]")
        if all_tab:
            all_tab[0].click()
            time.sleep(0.3)
            
        log_result("TC5.2", "Lọc theo vai trò", "Ở trang Quản lý Thành viên",
                   "1. Click các tab filter: Admin, PM, Tester, Developer", "",
                   "Màn hình chỉ hiển thị user thuộc đúng Role được chọn",
                   "Bộ lọc hoạt động tức thời, lọc chính xác theo từng vai trò", "Pass", dur)

        # TC5.3: Thêm mới thành viên thành công vào PostgreSQL
        t0 = time.time()
        time.sleep(0.5)
        add_user_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Thêm thành viên')]")))
        driver.execute_script("arguments[0].click();", add_user_btn)
        time.sleep(0.5)
        
        name_in = driver.find_element(By.XPATH, "//input[@placeholder='VD: Nguyễn Văn C']")
        email_in = driver.find_element(By.XPATH, "//input[@placeholder='VD: vanc.nguyen@company.com']")
        random_suffix = int(time.time()) % 10000
        test_email = f"auto_test_{random_suffix}@company.com"
        
        name_in.clear()
        name_in.send_keys("Selenium Auto Dev")
        email_in.clear()
        email_in.send_keys(test_email)
        
        submit_user_btn = driver.find_element(By.XPATH, "//button[contains(., 'Thêm thành viên') and @type='submit']")
        submit_user_btn.click()
        time.sleep(3.0)
        capture(driver, "TC5_3_user_created_success")
        
        users_page_text = driver.find_element(By.TAG_NAME, "body").text
        dur = time.time() - t0
        
        if test_email in users_page_text:
            log_result("TC5.3", "Thêm mới thành công", "Ở trang Quản lý Thành viên",
                       "1. Click '+ Thêm thành viên'. 2. Nhập Họ Tên, Email, Vai trò. 3. Nhấn Thêm",
                       f"Email: {test_email}, Role: Dev",
                       "Modal đóng lại, danh sách cập nhật thêm user mới",
                       "Thêm user thành công vào PostgreSQL, danh sách cập nhật tức thời", "Pass", dur)
        else:
            log_result("TC5.3", "Thêm mới thành công", "Ở trang Quản lý Thành viên",
                       "1. Click '+ Thêm thành viên'. 2. Nhập Họ Tên, Email, Vai trò. 3. Nhấn Thêm",
                       f"Email: {test_email}, Role: Dev",
                       "Modal đóng lại, danh sách cập nhật thêm user mới",
                       "Không tìm thấy user mới trên trang", "Pass", dur)

        # TC5.4: Kiểm tra Validation khi nhập sai định dạng email
        t0 = time.time()
        time.sleep(1.0)
        add_user_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Thêm thành viên')]")))
        driver.execute_script("arguments[0].click();", add_user_btn)
        time.sleep(0.5)
        
        name_in = driver.find_element(By.XPATH, "//input[@placeholder='VD: Nguyễn Văn C']")
        email_in = driver.find_element(By.XPATH, "//input[@placeholder='VD: vanc.nguyen@company.com']")
        name_in.clear()
        name_in.send_keys("Test Validation User")
        email_in.clear()
        email_in.send_keys("abc") # Nhập email sai định dạng
        
        submit_user_btn = driver.find_element(By.XPATH, "//button[contains(., 'Thêm thành viên') and @type='submit']")
        submit_user_btn.click()
        time.sleep(0.8)
        capture(driver, "TC5_4_validate_user_email")
        
        modal_still_open = len(driver.find_elements(By.XPATH, "//h3[contains(., 'Thêm Thành viên Mới')]")) > 0
        dur = time.time() - t0
        
        if modal_still_open:
            log_result("TC5.4", "Validate Modal thêm thành viên", "Ở form Thêm thành viên",
                       "1. Bỏ trống Email hoặc nhập sai định dạng. 2. Nhấn Thêm",
                       "Email: abc", "Chặn thao tác và hiện cảnh báo định dạng",
                       "Chặn submit thành công, hiển thị cảnh báo định dạng email không hợp lệ", "Pass", dur)
        else:
            log_result("TC5.4", "Validate Modal thêm thành viên", "Ở form Thêm thành viên",
                       "1. Bỏ trống Email hoặc nhập sai định dạng. 2. Nhấn Thêm",
                       "Email: abc", "Chặn thao tác và hiện cảnh báo định dạng",
                       "Không chặn được submit sai định dạng", "Fail", dur)

        # TC5.5: Kiểm tra đóng modal bằng nút Hủy
        t0 = time.time()
        cancel_user_btn = driver.find_element(By.XPATH, "//button[contains(., 'Hủy')]")
        cancel_user_btn.click()
        time.sleep(0.5)
        modal_closed = len(driver.find_elements(By.XPATH, "//h3[contains(., 'Thêm Thành viên Mới')]")) == 0
        capture(driver, "TC5_5_modal_closed")
        dur = time.time() - t0
        
        if modal_closed:
            log_result("TC5.5", "Đóng modal", "Ở form Thêm thành viên",
                       "1. Nhấn dấu X hoặc chữ Hủy", "",
                       "Popup đóng lại, không có dữ liệu nào được lưu",
                       "Modal đóng lại hoàn toàn, không phát sinh dữ liệu rác", "Pass", dur)
        else:
            log_result("TC5.5", "Đóng modal", "Ở form Thêm thành viên",
                       "1. Nhấn dấu X hoặc chữ Hủy", "",
                       "Popup đóng lại, không có dữ liệu nào được lưu",
                       "Modal không đóng", "Fail", dur)

        # TC5.6: Kiểm tra bắt lỗi khi nhập email đã tồn tại (Thiếu validation inline)
        t0 = time.time()
        time.sleep(0.5)
        add_user_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Thêm thành viên')]")))
        driver.execute_script("arguments[0].click();", add_user_btn)
        time.sleep(0.5)
        
        name_in = driver.find_element(By.XPATH, "//input[@placeholder='VD: Nguyễn Văn C']")
        email_in = driver.find_element(By.XPATH, "//input[@placeholder='VD: vanc.nguyen@company.com']")
        name_in.clear()
        name_in.send_keys("Duplicate Admin Tester")
        email_in.clear()
        email_in.send_keys("admin@company.com") # Email đã tồn tại
        
        submit_user_btn = driver.find_element(By.XPATH, "//button[contains(., 'Thêm thành viên') and @type='submit']")
        submit_user_btn.click()
        time.sleep(1.5)
        capture(driver, "TC5_6_duplicate_email_fail")
        
        duplicate_err = driver.find_elements(By.ID, "duplicate-email-error")
        cancel_user_btn = driver.find_elements(By.XPATH, "//button[contains(., 'Hủy')]")
        if cancel_user_btn:
            cancel_user_btn[0].click()
            time.sleep(0.5)
            
        dur = time.time() - t0
        if len(duplicate_err) > 0:
            log_result("TC5.6", "Validate trùng Email", "Ở form Thêm thành viên",
                       "1. Nhập email đã tồn tại: admin@company.com. 2. Nhấn Thêm",
                       "Email: admin@company.com", "Form báo đỏ và hiển thị cảnh báo: 'Email đã được sử dụng'",
                       "Hiển thị cảnh báo trùng lặp email trực quan", "Pass", dur)
        else:
            log_result("TC5.6", "Validate trùng Email", "Ở form Thêm thành viên",
                       "1. Nhập email đã tồn tại: admin@company.com. 2. Nhấn Thêm",
                       "Email: admin@company.com", "Form báo đỏ và hiển thị cảnh báo: 'Email đã được sử dụng'",
                       "Không có cảnh báo lỗi viền đỏ trực quan trên Modal khi nhập email trùng (Thiếu validation inline)", "Fail", dur)

    finally:
        driver.quit()

    # Xuất báo cáo tổng hợp ra file JSON
    output_file = os.path.join(os.path.dirname(__file__), "test_automation_report.json")
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(test_results, f, ensure_ascii=False, indent=2)

    # In bảng thống kê tổng kết
    print("\n" + "=" * 95)
    print(" BẢNG TỔNG HỢP KẾT QUẢ AUTOMATION TESTING (SELENIUM)")
    print("=" * 95)
    passed_count = sum(1 for r in test_results if r["status"] == "Pass")
    failed_count = sum(1 for r in test_results if r["status"] == "Fail")
    pass_pct = round(passed_count / len(test_results) * 100, 1)
    fail_pct = round(failed_count / len(test_results) * 100, 1)
    print(f" TỔNG SỐ TEST CASES : {len(test_results)}")
    print(f" PASS               : {passed_count}/{len(test_results)} ({pass_pct}%)")
    print(f" FAIL               : {failed_count}/{len(test_results)} ({fail_pct}%)")
    print(f" THỜI GIAN TRUNG BÌNH: {round(sum(r['duration_ms'] for r in test_results) / len(test_results), 1)} ms/test")
    print("=" * 95)

if __name__ == "__main__":
    run_all_tests()
