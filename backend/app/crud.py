from sqlalchemy.orm import Session
from app import models, schemas

def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.User).offset(skip).limit(limit).all()

def create_user(db: Session, user: schemas.UserCreate):
    fake_hashed_password = user.password + "notreallyhashed"
    db_user = models.User(
        username=user.username,
        email=user.email,
        hashed_password=fake_hashed_password,
        role=user.role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_incidents(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Incident).offset(skip).limit(limit).all()

def get_incident(db: Session, incident_id: int):
    return db.query(models.Incident).filter(models.Incident.id == incident_id).first()

def create_incident(db: Session, incident: schemas.IncidentCreate):
    db_incident = models.Incident(
        title=incident.title,
        description=incident.description,
        status=incident.status,
        priority=incident.priority,
        severity=incident.severity,
        project_id=incident.project_id,
        reporter_id=incident.reporter_id,
        assignee_id=incident.assignee_id
    )
    db.add(db_incident)
    db.commit()
    db.refresh(db_incident)
    return db_incident

def update_incident(db: Session, incident_id: int, incident_update: schemas.IncidentUpdate):
    db_incident = get_incident(db, incident_id)
    if not db_incident:
        return None
    update_data = incident_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_incident, key, value)
    db.add(db_incident)
    db.commit()
    db.refresh(db_incident)
    return db_incident

def delete_incident(db: Session, incident_id: int):
    db_incident = get_incident(db, incident_id)
    if db_incident:
        db.delete(db_incident)
        db.commit()
        return True
    return False
