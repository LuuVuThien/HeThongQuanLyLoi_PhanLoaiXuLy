# -*- coding: utf-8 -*-
"""
evaluate.py
-----------
Thực hiện: Hoàng Tiến Dũng
Mô tả (mục 3.1.4.c báo cáo): Đo độ chính xác của RuleBasedClassifier (v1/v2)
trên các bộ dữ liệu mô phỏng, so với mốc "chưa triển khai" (gán cố định
Medium/P3). In ra: accuracy Severity/Priority, macro-F1, tỷ lệ sai lệch
không quá 1 bậc, ma trận nhầm lẫn và tỷ lệ needs_review.

Cách chạy:
    cd backend
    python evaluate.py dataset_A.txt dataset_B.txt

Định dạng file dữ liệu (mỗi dòng 1 báo cáo, phân tách bằng ký tự '|'):
    tieu_de | mo_ta | severity_chuan | priority_chuan

    Ví dụ:
    Không thể đăng nhập|Lỗi 500 trên production, 1.200 người dùng bị ảnh hưởng|Critical|P1

Dòng trống hoặc bắt đầu bằng '#' được bỏ qua (dùng để chú thích).
"""

import sys
import time
from collections import defaultdict

sys.path.insert(0, "app")

from severity_rules import RuleBasedClassifier, NAME_LEVEL, LEVEL_NAME  # noqa: E402

LEVELS = ["Low", "Medium", "High", "Critical"]
PRIORITIES = ["P1", "P2", "P3", "P4"]


def load_dataset(path):
    """Đọc file dataset, trả về danh sách dict:
    {title, description, severity, priority}."""
    reports = []
    with open(path, "r", encoding="utf-8") as f:
        for line_no, raw_line in enumerate(f, start=1):
            line = raw_line.strip("\n")
            if not line.strip() or line.strip().startswith("#"):
                continue
            parts = line.split("|")
            if len(parts) != 4:
                print(f"[CẢNH BÁO] Bỏ qua dòng {line_no} trong {path}: sai định dạng")
                continue
            title, description, severity, priority = (p.strip() for p in parts)
            reports.append({
                "title": title,
                "description": description,
                "severity": severity,
                "priority": priority,
            })
    return reports


def fixed_default_predict():
    """Mô phỏng tình trạng 'chưa triển khai': gán cố định Medium/P3."""
    return "Medium", "P3"


def _level_of_priority(p):
    return int(p[1]) if p and p[0] == "P" and p[1:].isdigit() else None


def _off_by_at_most_one(true_level, pred_level):
    return abs(true_level - pred_level) <= 1


def _precision_recall_f1(confusion, label):
    tp = confusion[label][label]
    fp = sum(confusion[other][label] for other in LEVELS if other != label)
    fn = sum(confusion[label][other] for other in LEVELS if other != label)
    precision = tp / (tp + fp) if (tp + fp) else 0.0
    recall = tp / (tp + fn) if (tp + fn) else 0.0
    f1 = (2 * precision * recall / (precision + recall)) if (precision + recall) else 0.0
    return precision, recall, f1


def evaluate_method(reports, predict_fn, method_name):
    """predict_fn(title, description) -> (severity_pred, priority_pred, needs_review)"""
    n = len(reports)
    correct_severity = 0
    correct_priority = 0
    off_by_1_count = 0
    needs_review_count = 0

    confusion = {t: {p: 0 for p in LEVELS} for t in LEVELS}

    start = time.time()
    for r in reports:
        severity_pred, priority_pred, needs_review = predict_fn(r["title"], r["description"])

        if severity_pred == r["severity"]:
            correct_severity += 1
        if priority_pred == r["priority"]:
            correct_priority += 1
        if needs_review:
            needs_review_count += 1

        true_level = NAME_LEVEL.get(r["severity"])
        pred_level = NAME_LEVEL.get(severity_pred)
        if true_level is not None and pred_level is not None:
            if _off_by_at_most_one(true_level, pred_level):
                off_by_1_count += 1
            confusion[r["severity"]][severity_pred] += 1
    elapsed = time.time() - start

    severity_acc = correct_severity / n if n else 0.0
    priority_acc = correct_priority / n if n else 0.0
    off_by_1_rate = off_by_1_count / n if n else 0.0
    needs_review_rate = needs_review_count / n if n else 0.0

    f1_scores = []
    print(f"\n  Precision / Recall / F1 theo từng mức ({method_name}):")
    print(f"  {'Mức':<10}{'Precision':>10}{'Recall':>10}{'F1':>8}{'Số mẫu':>8}")
    for label in LEVELS:
        support = sum(confusion[label].values())
        if support == 0:
            continue
        p, r_, f1 = _precision_recall_f1(confusion, label)
        f1_scores.append(f1)
        print(f"  {label:<10}{p:>10.2f}{r_:>10.2f}{f1:>8.2f}{support:>8}")
    macro_f1 = sum(f1_scores) / len(f1_scores) if f1_scores else 0.0

    return {
        "method": method_name,
        "n": n,
        "severity_acc": severity_acc,
        "priority_acc": priority_acc,
        "macro_f1": macro_f1,
        "off_by_1_rate": off_by_1_rate,
        "needs_review_rate": needs_review_rate,
        "confusion": confusion,
        "avg_time_ms": (elapsed / n * 1000) if n else 0.0,
    }


def print_confusion_matrix(confusion, title):
    print(f"\n  Ma trận nhầm lẫn ({title}) - hàng = nhãn chuẩn, cột = dự đoán:")
    header = "  " + " " * 10 + "".join(f"{p:>10}" for p in LEVELS)
    print(header)
    for true_label in LEVELS:
        row = "".join(f"{confusion[true_label][pred]:>10}" for pred in LEVELS)
        print(f"  {true_label:<10}{row}")


def run_on_file(path):
    print("=" * 70)
    print(f" BỘ DỮ LIỆU: {path}")
    print("=" * 70)

    reports = load_dataset(path)
    if not reports:
        print("  (Không có báo cáo hợp lệ nào trong file này)")
        return

    print(f"  Số báo cáo: {len(reports)}")

    clf_v1 = RuleBasedClassifier("v1")
    clf_v2 = RuleBasedClassifier("v2")

    def predict_fixed(title, description):
        s, p = fixed_default_predict()
        return s, p, False

    def predict_v1(title, description):
        r = clf_v1.classify(title, description)
        return r.severity, r.priority, r.needs_review

    def predict_v2(title, description):
        r = clf_v2.classify(title, description)
        return r.severity, r.priority, r.needs_review

    results = []
    results.append(evaluate_method(reports, predict_fixed, "Gán cố định Medium/P3"))
    results.append(evaluate_method(reports, predict_v1, "Luật v1"))
    result_v2 = evaluate_method(reports, predict_v2, "Luật v2")
    results.append(result_v2)

    print("\n  Bảng so sánh tổng hợp:")
    print(f"  {'Phương pháp':<24}{'Sev.Acc':>9}{'Pri.Acc':>9}{'Macro-F1':>10}{'Sai lệch<=1':>13}{'Cần review':>12}")
    for res in results:
        print(
            f"  {res['method']:<24}"
            f"{res['severity_acc']*100:>8.1f}%"
            f"{res['priority_acc']*100:>8.1f}%"
            f"{res['macro_f1']:>10.3f}"
            f"{res['off_by_1_rate']*100:>12.1f}%"
            f"{res['needs_review_rate']*100:>11.1f}%"
        )

    print_confusion_matrix(result_v2["confusion"], "Luật v2")
    print(f"\n  Thời gian xử lý trung bình (luật v2): {result_v2['avg_time_ms']:.3f} ms/báo cáo")


def main():
    files = sys.argv[1:]
    if not files:
        print("Cách dùng: python evaluate.py dataset_A.txt [dataset_B.txt ...]")
        sys.exit(1)
    for path in files:
        run_on_file(path)


if __name__ == "__main__":
    main()
