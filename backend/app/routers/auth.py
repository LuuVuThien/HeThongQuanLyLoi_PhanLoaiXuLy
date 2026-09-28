from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app import crud, schemas, database

router = APIRouter(
    prefix="/auth",
    tags=["authentication"],
)

@router.post("/register", response_model=schemas.UserResponse)
def register(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    # Kiểm tra xem email đã tồn tại chưa
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email này đã được đăng ký")
    
    # Tạo user mới
    return crud.create_user(db=db, user=user)

@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = crud.get_user_by_email(db, email=form_data.username)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Tài khoản hoặc mật khẩu không chính xác",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    is_password_correct = False
    
    # Hỗ trợ cả 2 chuẩn mật khẩu đang có trong DB của nhóm bạn
    if user.hashed_password.endswith("notreallyhashed"):
        fake_hashed_password = form_data.password + "notreallyhashed"
        is_password_correct = (user.hashed_password == fake_hashed_password)
    else:
        # Chuẩn xịn bcrypt mà Dũng (hoặc thành viên khác) vừa thêm vào
        try:
            from passlib.context import CryptContext
            pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
            is_password_correct = pwd_context.verify(form_data.password, user.hashed_password)
        except Exception:
            is_password_correct = False

    if not is_password_correct:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Tài khoản hoặc mật khẩu không chính xác",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return {"access_token": user.email, "token_type": "bearer", "user_id": user.id, "role": user.role}
