import json
import urllib.request
import urllib.error

base = 'http://127.0.0.1:8000'

def make_req(path, method='GET', data=None, headers=None):
    if headers is None:
        headers = {}
    url = f"{base}{path}"
    req_data = None
    if data is not None:
        req_data = json.dumps(data).encode('utf-8')
        headers['Content-Type'] = 'application/json'
    
    req = urllib.request.Request(url, data=req_data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            body = resp.read().decode('utf-8')
            return resp.status, json.loads(body)
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8')
        return e.code, json.loads(body) if body.startswith('{') else body

def run_tests():
    print("--- KIỂM TRA TOÀN BỘ HỆ THỐNG INCIDENT MANAGEMENT SYSTEM ---")
    
    # 1A. Test login chuẩn "admin123"
    status_code, data = make_req('/auth/login', method='POST', data={'email': 'admin@company.com', 'password': 'admin123'})
    assert status_code == 200, f"Login admin123 failed: {data}"
    token = data['access_token']
    auth_headers = {'Authorization': f'Bearer {token}'}
    print(f"1A. Đăng nhập chuẩn ('admin123'): THÀNH CÔNG -> User: {data['user']['email']}, Role: {data['user']['role']}")
    
    # 1B. Test login có dấu cách "admin 123" (người dùng vừa nhập)
    status_code2, data2 = make_req('/auth/login', method='POST', data={'email': 'admin@company.com', 'password': 'admin 123'})
    assert status_code2 == 200, f"Login 'admin 123' failed: {data2}"
    print(f"1B. Đăng nhập linh hoạt có dấu cách ('admin 123'): THÀNH CÔNG -> User: {data2['user']['email']}")

    # 1C. Test login có email hoa/thường hoặc khoảng trắng (" admin@company.com ")
    status_code3, data3 = make_req('/auth/login', method='POST', data={'email': ' Admin@company.com ', 'password': 'admin123'})
    assert status_code3 == 200, f"Login email trim failed: {data3}"
    print(f"1C. Đăng nhập email có dấu cách / chữ hoa (' Admin@company.com '): THÀNH CÔNG")

    # 2. Phiên làm việc /auth/me
    status_code, me_data = make_req('/auth/me', headers=auth_headers)
    assert status_code == 200, f"Get me failed: {me_data}"
    print(f"2. Phiên làm việc /auth/me: THÀNH CÔNG (ID: {me_data['id']}, Email: {me_data['email']})")

    # 3. Thống kê Dashboard
    status_code, stats = make_req('/incidents/stats', headers=auth_headers)
    assert status_code == 200, f"Stats failed: {stats}"
    print(f"3. Thống kê Dashboard từ Neon DB: THÀNH CÔNG (Tổng: {stats['total']} lỗi, Nghiêm trọng: {stats['by_severity']['critical']})")

    # 4. Danh sách sự cố
    status_code, incidents = make_req('/incidents/?limit=5', headers=auth_headers)
    assert status_code == 200, f"List failed: {incidents}"
    print(f"4. Danh sách sự cố từ Neon DB: THÀNH CÔNG (Lấy được {len(incidents)} sự cố thật)")

    # 5. Chi tiết sự cố
    sample_id = incidents[0]['id']
    status_code, detail = make_req(f'/incidents/{sample_id}', headers=auth_headers)
    assert status_code == 200, f"Detail failed: {detail}"
    print(f"5. Chi tiết sự cố #{sample_id}: THÀNH CÔNG (Tiêu đề: '{detail['title'][:35]}...')")

    # 6. AI Phân loại sự cố
    status_code, cls = make_req('/incidents/classify', method='POST', headers=auth_headers, data={
        'title': 'Lỗi rò rỉ bộ nhớ sập kết nối database postgresql',
        'description': 'Out of memory khi query dữ liệu lớn làm server ngắt kết nối đột ngột'
    })
    assert status_code == 200, f"Classify failed: {cls}"
    print(f"6. AI Phân loại sự cố: THÀNH CÔNG (Category: {cls['category']}, Severity: {cls['severity']}, Priority: {cls['priority']})")

    # 7. Danh sách Dự án
    status_code, projects = make_req('/projects/', headers=auth_headers)
    assert status_code == 200, f"Projects failed: {projects}"
    print(f"7. Danh sách Dự án: THÀNH CÔNG ({len(projects)} dự án)")

    # 8. Quản trị Người dùng
    status_code, users = make_req('/users/', headers=auth_headers)
    assert status_code == 200, f"Users failed: {users}"
    print(f"8. Quản trị Người dùng: THÀNH CÔNG ({len(users)} tài khoản)")

    print("\n=======================================================")
    print(" KẾT QUẢ: 100% CÁC CHỨC NĂNG HỆ THỐNG ĐANG CHẠY ỔN ĐỊNH!")
    print("=======================================================")

if __name__ == '__main__':
    run_tests()
