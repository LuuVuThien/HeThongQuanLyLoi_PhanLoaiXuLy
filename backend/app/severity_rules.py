# -*- coding: utf-8 -*-
"""
severity_rules.py
------------------
Thực hiện: Hoàng Tiến Dũng
Mô tả (mục 3.1.4 báo cáo - Kịch bản 4): Thuật toán dựa trên luật (rule-based)
để tự động gán mức độ nghiêm trọng (Severity) và độ ưu tiên (Priority) cho
một báo cáo sự cố, dựa trên tiêu đề + mô tả đã được TextProcessor làm sạch.

Vị trí trong hệ thống:
    Tester -> ReactJS -> Backend API (POST /incidents)
    -> TextProcessor -> RuleBasedClassifier -> lưu Severity, Priority,
       needs_review vào cơ sở dữ liệu.

Cách gọi từ tầng API (ví dụ):

    from severity_rules import RuleBasedClassifier

    clf = RuleBasedClassifier("v2")

    def auto_assign(title, description):
        r = clf.classify(title, description)
        return {"severity": r.severity,
                "priority": r.priority,
                "needs_review": r.needs_review}

Nhóm chọn thuật toán luật thay vì huấn luyện mô hình học máy vì:
(1) chưa có bộ dữ liệu sự cố thật đủ lớn để huấn luyện;
(2) PM cần thấy được lý do hệ thống gán mức đó;
(3) xử lý mất cỡ mili-giây, phù hợp yêu cầu phân loại nhanh trong Agile;
(4) dễ chỉnh sửa khi nhóm phát hiện luật sai.
"""

import re
from dataclasses import dataclass, field
from typing import List

try:
    # Khi được import như một phần của package "app" (vd: app.severity_rules)
    from app.text_processor import (
        TextProcessor, ProcessedText, is_negated,
        URGENT_RE, LOW_URGENCY_RE, SCALE_RE, WORKAROUND_RE,
    )
except ImportError:
    # Khi chạy độc lập / import trực tiếp (vd: python severity_rules.py,
    # hoặc evaluate.py thêm thư mục app/ vào sys.path)
    from text_processor import (
        TextProcessor, ProcessedText, is_negated,
        URGENT_RE, LOW_URGENCY_RE, SCALE_RE, WORKAROUND_RE,
    )


# ---------------------------------------------------------------------------
# 1. Thang mức độ (Bảng 3.4.1)
# ---------------------------------------------------------------------------

# Mức độ được biểu diễn bằng số nguyên để dễ so sánh / cộng trừ bậc:
# 1 = Low, 2 = Medium, 3 = High, 4 = Critical
LEVEL_NAME = {1: "Low", 2: "Medium", 3: "High", 4: "Critical"}
NAME_LEVEL = {v: k for k, v in LEVEL_NAME.items()}

# Priority mặc định tương ứng với từng Severity: Critical->P1, High->P2,
# Medium->P3, Low->P4
PRIORITY_OF = {4: 1, 3: 2, 2: 3, 1: 4}


# ---------------------------------------------------------------------------
# 2. Từ điển từ khóa theo 4 tầng (đã ở dạng KHÔNG DẤU, vì sẽ so khớp trên
#    văn bản đã qua TextProcessor.normalize())
#    -> mỗi phần tử: (từ_khóa, mức_độ, nhãn_hiển_thị)
# ---------------------------------------------------------------------------

LOW_KEYWORDS = [
    "chinh ta", "lech 2px", "lech px", "mau sac", "tooltip", "giao dien",
    "placeholder", "font chu", "can le", "spacing", "thiet ke", "icon",
    "xuong dong som", "chua dep", "chua hay",
]

MEDIUM_KEYWORDS = [
    "hien thi sai", "load cham", "validation", "404", "chua chuan",
    "khong dong bo", "sai dinh dang", "loi", "sai", "bug",
]

HIGH_KEYWORDS = [
    "crash", "loi 500", "loi 502", "loi 503", "timeout", "memory leak",
    "deadlock", "login loop", "loop", "khong phan hoi", "not responding",
    "hangs", "hanging", "treo may", "race condition",
]

# Mẫu tổng quát cho các cách diễn đạt "không làm được việc gì đó" mà không
# liệt kê hết mọi hành động cụ thể (cải tiến v2, xem Bảng 3.4.4):
# "không ... được", "không thể", "không phản hồi"...
HIGH_PATTERNS = [
    (r"khong (?:\w+\s+){1,3}duoc\b", "khong ... duoc"),
    (r"\bkhong the\b", "khong the"),
]

CRITICAL_KEYWORDS = [
    "mat du lieu", "sql injection", "server down", "tru tien 2 lan",
    "lo du lieu", "ro ri du lieu", "bao mat", "lo hong bao mat",
    "khong khoi phuc duoc", "xoa nham", "ghi de du lieu", "plain text",
    "bi tru tien", "sai so du", "deface", "ro ri khoa api",
]

# Các từ khóa "Medium" chỉ mang tính chung chung (không đặc trưng), dùng cho
# luật cosmetic (B3): nếu báo cáo chỉ khớp các từ này + có từ khóa giao diện
# thì hạ xuống Low thay vì giữ ở Medium.
GENERIC_MEDIUM = {"loi", "sai", "bug"}

_KEYWORD_TABLE = (
    [(kw, 1, kw) for kw in LOW_KEYWORDS]
    + [(kw, 2, kw) for kw in MEDIUM_KEYWORDS]
    + [(kw, 3, kw) for kw in HIGH_KEYWORDS]
    + [(kw, 4, kw) for kw in CRITICAL_KEYWORDS]
)

# Các mẫu tổng quát (regex), chỉ áp dụng cho luật v2. Mỗi phần tử:
# (compiled_pattern, mức_độ, nhãn_hiển_thị)
_REGEX_TABLE = [(re.compile(pattern), 3, label) for pattern, label in HIGH_PATTERNS]


@dataclass
class ClassificationResult:
    severity: str
    priority: str
    level: int                      # 1..4, tương ứng severity
    priority_level: int             # 1..4 (P1..P4)
    confidence: float
    matched_keywords: List[str] = field(default_factory=list)
    reason: str = ""
    needs_review: bool = False


class RuleBasedClassifier:
    """Thuật toán 6 bước gán Severity/Priority (Hình 3.4.1).

    B1. Khớp từ khóa theo 4 tầng (Low/Medium/High/Critical), bỏ qua từ khóa
        bị phủ định (vd: "khong bi crash").
    B2. Mức cơ sở = tầng CAO NHẤT khớp được (không khớp gì -> Medium +
        cờ needs_review).
    B3. Luật cosmetic: chỉ có từ khóa giao diện + lỗi chung chung -> Low.
    B4. Luật phạm vi: sự cố High trở lên, ảnh hưởng >=100 người dùng hoặc
        toàn bộ người dùng -> +1 bậc.
    B5. Luật workaround: sự cố High có cách khắc phục tạm/phạm vi hẹp
        -> -1 bậc.
    B6. Priority: ánh xạ từ Severity, rồi +-1 bậc theo "khẩn cấp/không gấp".
    """

    def __init__(self, version: str = "v2"):
        if version not in ("v1", "v2"):
            raise ValueError("version phải là 'v1' hoặc 'v2'")
        self.version = version
        self.processor = TextProcessor()

    # ------------------------------------------------------------------
    def _match_keywords(self, pt: ProcessedText):
        """B1: tìm tất cả từ khóa khớp trong pt.normalized, bỏ qua từ khóa
        bị phủ định. Trả về danh sách (từ_khóa, mức, nhãn)."""
        text = pt.normalized
        hits = []
        for keyword, level, label in _KEYWORD_TABLE:
            start = text.find(keyword)
            while start != -1:
                if self.version == "v1" or not is_negated(text, start):
                    hits.append((keyword, level, label))
                    break  # 1 lần khớp là đủ cho từ khóa này
                start = text.find(keyword, start + 1)

        if self.version == "v2":
            for pattern, level, label in _REGEX_TABLE:
                match = pattern.search(text)
                if match and not is_negated(text, match.start()):
                    hits.append((match.group(0), level, label))

        return hits

    def classify(self, title: str, description: str) -> ClassificationResult:
        pt = self.processor.process(title, description)
        hits = self._match_keywords(pt)
        needs_review = False

        # B2: mức cơ sở = tầng cao nhất khớp được
        if hits:
            base = max(level for _, level, _ in hits)
        else:
            base = 2  # Medium mặc định
            needs_review = True
        level = base

        if self.version == "v2":
            # B3: luật cosmetic
            if base <= 2 and any(level_ == 1 for _, level_, _ in hits):
                specific = [
                    kw for kw, level_, label in hits
                    if level_ == 2 and label not in GENERIC_MEDIUM
                ]
                if not specific:
                    level = 1

            # B4: luật phạm vi ảnh hưởng
            if base >= 3 and level < 4:
                if (pt.affected_users and pt.affected_users >= 100) or SCALE_RE.search(pt.normalized):
                    level += 1

            # B5: luật workaround
            if 3 <= base < 4 and level == base and WORKAROUND_RE.search(pt.normalized):
                level -= 1

        level = min(4, max(1, level))

        # B6: Priority = ánh xạ từ Severity, điều chỉnh theo khẩn cấp
        p = PRIORITY_OF[level]
        if LOW_URGENCY_RE.search(pt.clean) or LOW_URGENCY_RE.search(pt.normalized):
            p += 1   # "không gấp" -> hạ 1 bậc ưu tiên
        elif URGENT_RE.search(pt.clean) or URGENT_RE.search(pt.normalized):
            p -= 1   # "gấp/khẩn cấp" -> tăng 1 bậc ưu tiên
        p = min(4, max(1, p))

        matched = [kw for kw, _, _ in hits]
        confidence = 1.0 if hits and not needs_review else (0.5 if hits else 0.3)

        reason_parts = []
        if not hits:
            reason_parts.append("Không khớp từ khóa nào -> mặc định Medium/P3, cần review")
        else:
            reason_parts.append(f"Mức cơ sở {LEVEL_NAME[base]} từ từ khóa: {', '.join(matched)}")
            if level != base:
                reason_parts.append(f"Điều chỉnh thành {LEVEL_NAME[level]} theo luật ngữ cảnh")
        reason = "; ".join(reason_parts)

        return ClassificationResult(
            severity=LEVEL_NAME[level],
            priority=f"P{p}",
            level=level,
            priority_level=p,
            confidence=confidence,
            matched_keywords=matched,
            reason=reason,
            needs_review=needs_review,
        )


def auto_assign(title: str, description: str, version: str = "v2") -> dict:
    """Hàm tiện ích để gọi từ tầng API: trả về dict sẵn sàng lưu vào DB."""
    clf = RuleBasedClassifier(version)
    r = clf.classify(title, description)
    return {
        "severity": r.severity,
        "priority": r.priority,
        "needs_review": r.needs_review,
        "reason": r.reason,
    }


if __name__ == "__main__":
    # Ví dụ chạy thử (mục c.6, Bảng 3.4.8)
    examples = [
        (
            "Không bị crash nhưng nút hiển thị lệch",
            "Ứng dụng chạy ổn định, chỉ có nút Lưu bị lệch 2px so với nút Hủy.",
        ),
        (
            "Toàn bộ nhân viên không đăng nhập được vào hệ thống lương",
            "Sáng nay 500 nhân viên không đăng nhập được, sát ngày chốt lương.",
        ),
        (
            "Không thể đặt hàng trên điện thoại",
            "Bấm nút Đặt hàng trên iPhone không có phản hồi. Đang chạy quảng cáo nên cần sửa gấp.",
        ),
    ]
    clf = RuleBasedClassifier("v2")
    for title, desc in examples:
        r = clf.classify(title, desc)
        print(f"[{r.severity} / {r.priority}] {title}")
        print("   Lý do:", r.reason)
