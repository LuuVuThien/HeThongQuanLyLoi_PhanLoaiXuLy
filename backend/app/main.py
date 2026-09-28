from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app import models
from app.database import engine
from app.routers import incidents

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Bug Tracking & Incident Classification API",
    description="API for managing bugs and classifying incidents.",
    version="1.0.0"
)

# CORS middleware for frontend connection (ReactJS later)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(incidents.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to Bug Tracking API"}
