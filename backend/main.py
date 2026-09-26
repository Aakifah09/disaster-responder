from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
import json
import random
import time
from typing import List, Optional
import httpx

import models
from database import engine, SessionLocal
from pipeline import run_pipeline

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Seed Data if empty
def seed_data():
    db = SessionLocal()
    if db.query(models.Incident).count() == 0:
        cases = [
            {"report": "Small trash fire in the alleyway behind 5th Ave. No immediate danger to buildings.", "loc": "5th Ave Alley", "severity": "low", "type": "Fire"},
            {"report": "Minor water leak reported in the basement of Sector 3. Maintenance on site.", "loc": "Sector 3 Basement", "severity": "low", "type": "Utility"},
            {"report": "Multiple car pileup on Highway 10. Some minor injuries, traffic is blocked.", "loc": "Highway 10", "severity": "medium", "type": "Traffic"},
            {"report": "Localized power outage in the residential area. Utility teams investigating.", "loc": "Residential Sector B", "severity": "medium", "type": "Utility"},
        ]
        coords = [
            (25.2048, 55.2708),  # Dubai
            (40.7128, -74.0060), # New York
            (51.5074, -0.1278),  # London
            (35.6762, 139.6503), # Tokyo
        ]
        for i, case in enumerate(cases):
            lat, lng = coords[i % len(coords)]
            inc = models.Incident(
                raw_report=case["report"],
                location=case["loc"],
                severity=case["severity"],
                disaster_type=case["type"],
                casualties_estimate=0,
                resources_needed='["Standard Units"]',
                dispatch_instruction="Standard protocol initiated.",
                status="pending",
                deployment_time=random.randint(2400, 3000), # ~40-50 mins
                lat=lat,
                lng=lng
            )
            db.add(inc)
        db.commit()

        # Seed some logs
        first_inc = db.query(models.Incident).first()
        if first_inc:
            logs = [
                "Incident Command established.",
                "Primary search initiated.",
                "First responders on scene.",
                "Medical triage center setup complete."
            ]
            for msg in logs:
                db_log = models.DispatchLog(incident_id=first_inc.id, message=msg)
                db.add(db_log)
            db.commit()
    db.close()

seed_data()

class IncidentCreate(BaseModel):
    raw_report: str
    manual_location: Optional[str] = None
    casualties_estimate: Optional[int] = None
    lat: Optional[float] = None
    lng: Optional[float] = None

class StatusUpdate(BaseModel):
    status: str

class LogCreate(BaseModel):
    message: str


def normalize_location_name(location_name: str):
    if not location_name:
        return None
    if isinstance(location_name, str):
        try:
            parsed = json.loads(location_name)
            if isinstance(parsed, str):
                return parsed.strip()
            if isinstance(parsed, list):
                return ", ".join(str(item).strip() for item in parsed)
            if isinstance(parsed, dict):
                return ", ".join(str(v).strip() for v in parsed.values())
        except Exception:
            pass
        return location_name.strip()
    return str(location_name).strip()

async def get_coordinates(location_name: str):
    """Attempt to geocode a location name using Nominatim."""
    location_name = normalize_location_name(location_name)
    if not location_name or "Unknown" in location_name:
        return None, None
    try:
        async with httpx.AsyncClient() as client:
            # Add a user-agent as required by Nominatim policy
            headers = {"User-Agent": "DisasterResponder-App/1.0"}
            response = await client.get(
                "https://nominatim.openstreetmap.org/search",
                params={"format": "json", "q": location_name, "limit": 1},
                headers=headers,
                timeout=5.0
            )
            data = response.json()
            if data:
                return float(data[0]["lat"]), float(data[0]["lon"])
    except Exception as e:
        print(f"Geocoding error for {location_name}: {e}")
    return None, None

@app.post("/incidents")
async def create_incident(incident: IncidentCreate, db: Session = Depends(get_db)):
    start_time = time.time()
    try:
        pipeline_result = run_pipeline(incident.raw_report, incident.manual_location, incident.casualties_estimate)
    except Exception as e:
        print(f"[FATAL PIPELINE ERROR] {e}")
        pipeline_result = {
            "location": incident.manual_location or "Unknown (Analysis Failed)",
            "severity": "high",
            "disaster_type": "Unverified Emergency",
            "casualties_estimate": 0,
            "resources_needed": '["General Duty Units"]',
            "dispatch_instruction": f"SYSTEM FAILURE: AI pipeline crashed. \nError: {str(e)}"
        }

    # Determine coordinates
    lat, lng = incident.lat, incident.lng
    
    # If no coordinates provided, try to geocode the location found by AI or the manually supplied location
    if lat is None or lng is None:
        geo_lat, geo_lng = await get_coordinates(pipeline_result["location"])
        if geo_lat is None and incident.manual_location:
            geo_lat, geo_lng = await get_coordinates(incident.manual_location)
        if geo_lat is not None:
            lat, lng = geo_lat, geo_lng
        else:
            # Global fallback (Center of map) if geocoding fails completely
            lat = 0.0
            lng = 0.0

    # Realistic Deployment Logic
    base_deployment = 50 * 60  # 50 minutes in seconds
    
    # Calculate "Resource Load" penalty
    # For every active incident already in the system, add 10-15 minutes of delay
    active_count = db.query(models.Incident).filter(models.Incident.status == "active").count()
    load_penalty = active_count * random.randint(600, 900) # 10-15 mins per active case
    
    # Random jitter (+/- 5 mins)
    jitter = random.randint(-300, 300)
    
    actual_deployment = base_deployment + load_penalty + jitter
    if actual_deployment < 2400: actual_deployment = 2400 # Minimum 40 mins

    db_incident = models.Incident(
        raw_report=incident.raw_report,
        location=pipeline_result["location"],
        severity=pipeline_result["severity"],
        disaster_type=pipeline_result["disaster_type"],
        casualties_estimate=pipeline_result["casualties_estimate"],
        resources_needed=pipeline_result["resources_needed"],
        dispatch_instruction=pipeline_result["dispatch_instruction"],
        status="pending",
        deployment_time=actual_deployment,
        lat=lat,
        lng=lng
    )
    db.add(db_incident)
    db.commit()
    db.refresh(db_incident)
    return db_incident

@app.get("/incidents")
def get_incidents(db: Session = Depends(get_db)):
    incidents = db.query(models.Incident).all()
    severity_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    incidents_sorted = sorted(incidents, key=lambda x: (severity_order.get(x.severity, 4), -x.created_at.timestamp()))
    return incidents_sorted

@app.get("/incidents/{id}")
def get_incident(id: int, db: Session = Depends(get_db)):
    incident = db.query(models.Incident).filter(models.Incident.id == id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return incident

@app.patch("/incidents/{id}/status")
def update_status(id: int, status_update: StatusUpdate, db: Session = Depends(get_db)):
    incident = db.query(models.Incident).filter(models.Incident.id == id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    incident.status = status_update.status
    db.commit()
    db.refresh(incident)
    return incident

@app.delete("/incidents/{id}")
def delete_incident(id: int, db: Session = Depends(get_db)):
    incident = db.query(models.Incident).filter(models.Incident.id == id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    db.query(models.DispatchLog).filter(models.DispatchLog.incident_id == id).delete()
    db.delete(incident)
    db.commit()
    return {"message": "Deleted"}

@app.post("/incidents/{id}/logs")
def add_log(id: int, log: LogCreate, db: Session = Depends(get_db)):
    incident = db.query(models.Incident).filter(models.Incident.id == id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    db_log = models.DispatchLog(incident_id=id, message=log.message)
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log

@app.get("/incidents/{id}/logs")
def get_logs(id: int, db: Session = Depends(get_db)):
    return db.query(models.DispatchLog).filter(models.DispatchLog.incident_id == id).order_by(models.DispatchLog.created_at.desc()).all()


@app.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    incidents = db.query(models.Incident).all()
    stats = {
        "total": len(incidents),
        "critical": sum(1 for i in incidents if i.severity == "critical"),
        "active": sum(1 for i in incidents if i.status == "active"),
        "resolved": sum(1 for i in incidents if i.status == "resolved")
    }
    return stats
