from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List, Dict, Any
import uuid

# Schémas pour SensorData
class SensorDataCreate(BaseModel):
    machine_id: uuid.UUID
    timestamp: Optional[datetime] = Field(default_factory=datetime.utcnow) 
    temperature: float = Field(..., ge=-273.15, description="Température en Celsius")
    vibration: float
    pressure: float
    current: float
    operating_hours: Optional[float] = None
    labels: List[str] = Field(default_factory=list)

class SensorData(SensorDataCreate):
   
    class Config:
        orm_mode = True 

# Schémas pour Machine
class MachineBase(BaseModel):
    name: str = Field(..., max_length=100)
    location: Optional[str] = Field(None, max_length=100)
    type: Optional[str] = Field(None, max_length=100)
    model_number: Optional[str] = Field(None, max_length=100)
    serial_number: Optional[str] = Field(None, unique=True, max_length=100)
    installation_date: Optional[datetime] = None
    last_maintenance_date: Optional[datetime] = None
    thresholds_config: Dict[str, Any] = Field(default_factory=dict)

class MachineCreate(MachineBase):
    pass 

class Machine(MachineBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class AlertBase(BaseModel):
    machine_id: uuid.UUID
    timestamp: Optional[datetime] = Field(default_factory=datetime.utcnow)
    type: str = Field(..., max_length=100)
    severity: str = Field(..., pattern="^(Avertissement|Critique|Urgence)$") # Validation des niveaux d'alerte
    message: str
    is_resolved: bool = False
    resolved_by_user_id: Optional[uuid.UUID] = None
    resolved_at: Optional[datetime] = None

class AlertCreate(AlertBase):
    pass

class Alert(AlertBase):
    id: uuid.UUID
    created_at: datetime

    class Config:
        orm_mode = True

class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: str = Field(..., example="user@example.com")
    role: str = Field("technician", pattern="^(admin|engineer|technician)$")

class UserCreate(UserBase):
    password: str = Field(..., min_length=6) 

class User(UserBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

        