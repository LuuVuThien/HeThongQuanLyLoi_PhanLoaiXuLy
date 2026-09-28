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
    # Trong FastAPI OAuth2, 'username' của form_data được dùng làm trường đăng nhập chung (ở đây mình giả định nhập email vào ô username)
    user = crud.get_user_by_email(db, email=form_data.username)
    
    # Ở crud.py mình đang giả lập hash password bằng cách thêm chữ "notreallyhashed"
    fake_hashed_password = form_data.password + "notreallyhashed"
    
    if not user or user.hashed_password != fake_hashed_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Tài khoản hoặc mật khẩu không chính xác",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Trả về một token giả định (nếu làm dự án thực tế sẽ dùng JWT)
    return {"access_token": user.email, "token_type": "bearer", "user_id": user.id, "role": user.role}
