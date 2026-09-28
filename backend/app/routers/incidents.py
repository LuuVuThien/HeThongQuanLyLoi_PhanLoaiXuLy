from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app import crud, schemas, database

router = APIRouter(
    prefix="/incidents",
    tags=["incidents"],
    responses={404: {"description": "Not found"}},
)

@router.post("/", response_model=schemas.IncidentResponse)
def create_incident(incident: schemas.IncidentCreate, db: Session = Depends(database.get_db)):
    return crud.create_incident(db=db, incident=incident)

@router.get("/", response_model=List[schemas.IncidentResponse])
def read_incidents(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    incidents = crud.get_incidents(db, skip=skip, limit=limit)
    return incidents

@router.get("/{incident_id}", response_model=schemas.IncidentResponse)
def read_incident(incident_id: int, db: Session = Depends(database.get_db)):
    db_incident = crud.get_incident(db, incident_id=incident_id)
    if db_incident is None:
        raise HTTPException(status_code=404, detail="Incident not found")
    return db_incident

@router.patch("/{incident_id}", response_model=schemas.IncidentResponse)
def update_incident(incident_id: int, incident: schemas.IncidentUpdate, db: Session = Depends(database.get_db)):
    db_incident = crud.update_incident(db, incident_id=incident_id, incident_update=incident)
    if db_incident is None:
        raise HTTPException(status_code=404, detail="Incident not found")
    return db_incident

@router.delete("/{incident_id}")
def delete_incident(incident_id: int, db: Session = Depends(database.get_db)):
    success = crud.delete_incident(db, incident_id=incident_id)
    if not success:
        raise HTTPException(status_code=404, detail="Incident not found")
    return {"message": "Incident deleted successfully"}
