from fastapi import FastAPI
from .database import engine, Base

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="TikTok Urgency Engine")

@app.get("/")
def read_root():
    return {"status": "online", "service": "TikTok Urgency Engine"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}
