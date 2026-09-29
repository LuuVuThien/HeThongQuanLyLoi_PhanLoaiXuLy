from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List
from datetime import datetime
from app.models import RoleEnum, StatusEnum, PriorityEnum, SeverityEnum

# --- User Schemas ---
class UserBase(BaseModel):
    username: str
    email: EmailStr
    role: RoleEnum = RoleEnum.DEVELOPER

    @field_validator('role', mode='before')
    @classmethod
    def normalize_role(cls, v):
        if isinstance(v, str):
            v_upper = v.strip().upper()
            if v_upper in ('PM', 'MANAGER'):
                return RoleEnum.MANAGER
            if v_upper in RoleEnum.__members__:
                return RoleEnum[v_upper]
        return v

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# --- Project Schemas ---
class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None

class ProjectCreate(ProjectBase):
    pass

class ProjectResponse(ProjectBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# --- Comment Schemas ---
class CommentBase(BaseModel):
    content: str

class CommentCreate(CommentBase):
    incident_id: int
    user_id: int

class CommentResponse(CommentBase):
    id: int
    incident_id: int
    user_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# --- Incident Schemas ---
class IncidentBase(BaseModel):
    title: str
    description: str
    status: StatusEnum = StatusEnum.NEW
    priority: PriorityEnum = PriorityEnum.LOW
    severity: SeverityEnum = SeverityEnum.MINOR
    project_id: Optional[int] = None
    assignee_id: Optional[int] = None

class IncidentCreate(IncidentBase):
    reporter_id: int

class IncidentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[StatusEnum] = None
    priority: Optional[PriorityEnum] = None
    severity: Optional[SeverityEnum] = None
    assignee_id: Optional[int] = None

class IncidentResponse(IncidentBase):
    id: int
    reporter_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    comments: List[CommentResponse] = []
    
    class Config:
        from_attributes = True
