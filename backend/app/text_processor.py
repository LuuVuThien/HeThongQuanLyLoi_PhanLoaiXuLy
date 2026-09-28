
import re
import unicodedata
from dataclasses import dataclass, field
from typing import List, Optional


# ---------------------------------------------------------------------------
# 1. Các biểu thức chính quy dùng để trích xuất đặc trưng (mục 2.1.4.d.3)
# ---------------------------------------------------------------------------

HTML_TAG_RE = re.compile(r"<[^>]+>")
URL_RE = re.compile(r"https?://\S+|www\.\S+")
EMAIL_RE = re.compile(r"[\w.+-]+@[\w-]+\.[\w.-]+")
WHITESPACE_RE = re.compile(r"\s+")
PUNCT_RE = re.compile(r"[^\w\s<>\x01\x02]", re.UNICODE)
# Giữ lại dấu '.'/',' khi nó là dấu phân cách nhóm nghìn giữa hai chữ số
# (vd: "1.200", "3,000"), để USERS_RE ở bước process() còn nhận ra số lượng.
NUMBER_DOT_RE = re.compile(r"(?<=\d)\.(?=\d)")
NUMBER_COMMA_RE = re.compile(r"(?<=\d),(?=\d)")

# Mã lỗi HTTP 3xx - 5xx (áp dụng trên văn bản đã chuẩn hóa)
HTTP_CODE_RE = re.compile(r"\b([3-5]\d{2})\b")

# Tên Exception/Error (áp dụng trên văn bản đã clean, còn giữ hoa/thường)
EXCEPTION_RE = re.compile(r"\b([A-Za-z][A-Za-z0-9_]*(?:Exception|Error))\b")

# Dấu hiệu stack trace: Traceback kiểu Python hoặc "at ...(File.ext:line)" kiểu Java
STACKTRACE_RE = re.compile(
    r"Traceback \(most recent call last\)"
    r"|at\s+[\w.$]+\([\w.]+:\d+\)"
    r"|[\w.$]+\([\w.]+\.java:\d+\)",
    re.IGNORECASE,
)

# Số người dùng/khách hàng bị ảnh hưởng, chấp nhận định dạng "1.200" hoặc "3000"
USERS_RE = re.compile(
    r"([\d]{1,3}(?:[.,]\d{3})*|\d+)\s*"
    r"(?:nguoi dung|khach hang|nhan vien|users?|customers?)",
    re.IGNORECASE,
)

# Môi trường production
PROD_RE = re.compile(r"\b(production|prod|live)\b", re.IGNORECASE)

# Phạm vi ảnh hưởng diện rộng (không đi kèm con số cụ thể)
SCALE_RE = re.compile(
    r"toan bo (?:nguoi dung|khach hang|nhan vien)"
    r"|tat ca (?:nguoi dung|khach hang|nhan vien)"
    r"|nobody",
    re.IGNORECASE,
)

# Có cách khắc phục tạm / phạm vi hẹp -> hạ bớt mức độ so với mức cơ sở "High"
WORKAROUND_RE = re.compile(
    r"mo lai app la dung duoc"
    r"|co the xoa tu menu khac"
    r"|chi xay ra tren mot may"
    r"|dung tam duoc"
    r"|workaround",
    re.IGNORECASE,
)

# Ghi chú mức độ khẩn cấp trong văn bản (mục 3.1.4, luật B6)
URGENT_RE = re.compile(
    r"\bgap\b|khan cap|chan release|\bblocker\b|deadline",
    re.IGNORECASE,
)
LOW_URGENCY_RE = re.compile(
    r"khong gap|khi co thoi gian|sprint sau",
    re.IGNORECASE,
)

# Các từ phủ định đứng trước từ khóa sẽ vô hiệu hóa từ khóa đó
NEGATION_WORDS = {"khong", "chua", "not", "no", "never", "chang"}
# Ngoại lệ: "khong the" (= không thể / cannot) là một phần mô tả lỗi,
# không phải phủ định của từ khóa phía sau nó.
CANNOT_PHRASES = ["khong the"]

_NEGATION_WINDOW_CHARS = 22  # ~3 từ tiếng Việt/Anh phía trước từ khóa


# ---------------------------------------------------------------------------
# 2. Cấu trúc dữ liệu trả về
# ---------------------------------------------------------------------------

@dataclass
class ProcessedText:
    raw: str
    clean: str
    normalized: str
    tokens: List[str] = field(default_factory=list)
    http_codes: List[int] = field(default_factory=list)
    exceptions: List[str] = field(default_factory=list)
    has_stacktrace: bool = False
    affected_users: Optional[int] = None
    is_production: bool = False


# ---------------------------------------------------------------------------
# 3. Các hàm xử lý theo từng bước của pipeline (Hình 2.4.1 / Bảng 2.4.1)
# ---------------------------------------------------------------------------

def strip_accents(text: str) -> str:
    """Bỏ dấu tiếng Việt. Chữ 'đ' không phân rã được bằng NFD nên phải thay
    thủ công trước, sau đó phân rã (NFD) và loại các ký tự dấu (nhóm Mn)."""
    text = text.replace("đ", "d").replace("Đ", "D")
    nfd = unicodedata.normalize("NFD", text)
    return "".join(ch for ch in nfd if unicodedata.category(ch) != "Mn")


class TextProcessor:
    """Pipeline 4 bước: clean() -> normalize() -> tokenize() -> process()."""

    def clean(self, text: str) -> str:
        """Bước 1: bỏ thẻ HTML; thay URL/email bằng <URL>/<EMAIL>;
        gộp khoảng trắng; chuẩn hóa Unicode NFC."""
        text = unicodedata.normalize("NFC", text or "")
        text = HTML_TAG_RE.sub(" ", text)
        text = URL_RE.sub(" <URL> ", text)
        text = EMAIL_RE.sub(" <EMAIL> ", text)
        text = WHITESPACE_RE.sub(" ", text).strip()
        return text

    def normalize(self, text: str) -> str:
        """Bước 2: chữ thường, bỏ dấu tiếng Việt (kể cả đ -> d), bỏ dấu câu,
        đổi "n't" thành " not"."""
        text = text.replace("n't", " not")
        text = text.lower()
        text = strip_accents(text)
        # Bảo vệ dấu . / , nằm giữa hai chữ số (số có nhóm nghìn) trước khi
        # bỏ dấu câu, để không tách rời "1.200" thành "1" và "200".
        text = NUMBER_DOT_RE.sub("\x01", text)
        text = NUMBER_COMMA_RE.sub("\x02", text)
        text = PUNCT_RE.sub(" ", text)
        text = text.replace("\x01", ".").replace("\x02", ",")
        text = WHITESPACE_RE.sub(" ", text).strip()
        return text

    def tokenize(self, normalized_text: str) -> List[str]:
        """Bước 3: tách chuỗi đã chuẩn hóa thành token theo khoảng trắng."""
        if not normalized_text:
            return []
        return normalized_text.split(" ")

    def _extract_users(self, normalized_text: str) -> Optional[int]:
        match = USERS_RE.search(normalized_text)
        if not match:
            return None
        number = match.group(1).replace(".", "").replace(",", "")
        try:
            return int(number)
        except ValueError:
            return None

    def process(self, title: Optional[str], description: Optional[str]) -> ProcessedText:
        """Bước 4: trích xuất đặc trưng và trả về ProcessedText hoàn chỉnh.
        Đầu vào rỗng/None không phát sinh lỗi (Bảng 2.4.3)."""
        title = title or ""
        description = description or ""
        raw = f"{title}. {description}".strip(". ").strip()

        clean = self.clean(raw)
        norm = self.normalize(clean)

        return ProcessedText(
            raw=raw,
            clean=clean,
            normalized=norm,
            tokens=self.tokenize(norm),
            http_codes=[int(c) for c in HTTP_CODE_RE.findall(norm)],
            exceptions=EXCEPTION_RE.findall(clean),
            has_stacktrace=bool(STACKTRACE_RE.search(clean)),
            affected_users=self._extract_users(norm),
            is_production=bool(PROD_RE.search(norm)),
        )


# ---------------------------------------------------------------------------
# 4. Phát hiện phủ định (mục 2.1.4.d.2)
# ---------------------------------------------------------------------------

def is_negated(normalized: str, start: int) -> bool:
    """Nhìn lại tối đa 3 từ đứng ngay trước vị trí `start` trong chuỗi đã
    chuẩn hóa `normalized`. Nếu có "khong", "chua", "not", "no", "never"...
    thì từ khóa tại `start` bị coi là phủ định. Ngoại lệ: cụm "khong the"
    (= cannot) không được tính là phủ định vì nó là một phần mô tả lỗi."""
    prefix = normalized[max(0, start - _NEGATION_WINDOW_CHARS):start].strip()
    if any(prefix.endswith(p) for p in CANNOT_PHRASES):
        return False  # "khong the" = cannot, không phải phủ định
    words = prefix.split()[-3:]
    return any(w in NEGATION_WORDS for w in words)


if __name__ == "__main__":
    # Chạy thử nhanh module (mục 2.1.4.e, Bảng 2.4.2)
    tp = TextProcessor()
    sample_title = "Không thể đăng nhập"
    sample_desc = (
        "<b>Lỗi 500</b> trên production, khoảng 1.200 người dùng bị ảnh hưởng. "
        "NullPointerException tại https://app.example.com/login"
    )
    result = tp.process(sample_title, sample_desc)
    print("clean       :", result.clean)
    print("normalized  :", result.normalized)
    print("tokens      :", len(result.tokens), "token")
    print("http_codes  :", result.http_codes)
    print("exceptions  :", result.exceptions)
    print("has_stacktrace:", result.has_stacktrace)
    print("affected_users:", result.affected_users)
    print("is_production :", result.is_production)
