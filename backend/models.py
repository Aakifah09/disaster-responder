from sqlalchemy import Column, Integer, String, Text, DateTime, Float
from database import Base
import datetime

class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    raw_report = Column(Text, nullable=False)
    location = Column(String, nullable=True)
    severity = Column(String, nullable=True) # low/medium/high/critical
    disaster_type = Column(String, nullable=True)
    casualties_estimate = Column(Integer, nullable=True)
    resources_needed = Column(Text, nullable=True) # JSON string array
    dispatch_instruction = Column(Text, nullable=True)
    status = Column(String, default="pending") # pending/active/resolved
    deployment_time = Column(Integer, nullable=True) # in seconds
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class DispatchLog(Base):
    __tablename__ = "dispatch_logs"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, nullable=False)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

