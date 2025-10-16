from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import uuid

from . import crud, models, schemas
from .database import SessionLocal, engine, get_db

# Initialisation de l'application FastAPI
app = FastAPI(
    title="Predictive Maintenance API",
    description="API for real-time industrial machine monitoring, anomaly detection, and predictive maintenance.",
    version="1.0.0",
)

# Endpoint racine (pour vérifier que l'API fonctionne)
@app.get("/", tags=["Root"])
def read_root():
    return {"message": "Welcome to the Predictive Maintenance API"}

# --- Endpoints pour les Machines ---
@app.post("/machines/", response_model=schemas.Machine, status_code=status.HTTP_201_CREATED, tags=["Machines"])
def create_machine(machine: schemas.MachineCreate, db: Session = Depends(get_db)):
    db_machine = crud.get_machine_by_serial(db, serial_number=machine.serial_number)
    if db_machine:
        raise HTTPException(status_code=400, detail="Machine with this serial number already registered")
    return crud.create_machine(db=db, machine=machine)

@app.get("/machines/", response_model=List[schemas.Machine], tags=["Machines"])
def read_machines(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    machines = crud.get_machines(db, skip=skip, limit=limit)
    return machines

@app.get("/machines/{machine_id}", response_model=schemas.Machine, tags=["Machines"])
def read_machine(machine_id: uuid.UUID, db: Session = Depends(get_db)):
    db_machine = crud.get_machine(db, machine_id=machine_id)
    if db_machine is None:
        raise HTTPException(status_code=404, detail="Machine not found")
    return db_machine

# --- Endpoints pour les Données de Capteurs (Sensor Data) ---
@app.post("/sensor-data/", response_model=schemas.SensorData, status_code=status.HTTP_201_CREATED, tags=["Sensor Data"])
def create_sensor_data(sensor_data: schemas.SensorDataCreate, db: Session = Depends(get_db)):
    return crud.create_sensor_data(db=db, sensor_data_item=sensor_data)

@app.post("/sensor-data/batch/", response_model=List[schemas.SensorData], status_code=status.HTTP_201_CREATED, tags=["Sensor Data"])
def create_multiple_sensor_data(sensor_data_items: List[schemas.SensorDataCreate], db: Session = Depends(get_db)):
    return crud.create_multiple_sensor_data(db=db, sensor_data_items=sensor_data_items)

@app.get("/machines/{machine_id}/sensor-data/", response_model=List[schemas.SensorData], tags=["Sensor Data"])
def read_sensor_data_for_machine(
    machine_id: uuid.UUID,
    start_time: Optional[datetime] = None,
    end_time: Optional[datetime] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    sensor_data = crud.get_sensor_data_for_machine(
        db, machine_id=machine_id, start_time=start_time, end_time=end_time, skip=skip, limit=limit
    )
    if not sensor_data:
        # Ne renvoie pas 404 si aucune donnée, juste une liste vide est acceptable
        return []
    return sensor_data

# --- Endpoints pour les Alertes ---
@app.post("/alerts/", response_model=schemas.Alert, status_code=status.HTTP_201_CREATED, tags=["Alerts"])
def create_alert(alert: schemas.AlertCreate, db: Session = Depends(get_db)):
    # Ici, on pourrait ajouter une logique pour vérifier l'existence de la machine_id
    db_machine = crud.get_machine(db, machine_id=alert.machine_id)
    if not db_machine:
        raise HTTPException(status_code=404, detail="Machine not found for this alert")
    return crud.create_alert(db=db, alert_item=alert)

@app.get("/machines/{machine_id}/alerts/", response_model=List[schemas.Alert], tags=["Alerts"])
def read_alerts_for_machine(
    machine_id: uuid.UUID,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    alerts = crud.get_alerts_for_machine(db, machine_id=machine_id, skip=skip, limit=limit)
    return alerts

@app.get("/alerts/unresolved/", response_model=List[schemas.Alert], tags=["Alerts"])
def read_unresolved_alerts(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    alerts = crud.get_unresolved_alerts(db, skip=skip, limit=limit)
    return alerts

# --- Endpoints pour les Utilisateurs (sera étendu avec authentification) ---
@app.post("/users/", response_model=schemas.User, status_code=status.HTTP_201_CREATED, tags=["Users"])
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_user(db=db, user=user)

@app.get("/users/", response_model=List[schemas.User], tags=["Users"])
def read_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    users = crud.get_users(db, skip=skip, limit=limit) # Il manque get_users dans crud.py, ajoutons-le
    return users

@app.get("/users/{user_id}", response_model=schemas.User, tags=["Users"])
def read_user(user_id: uuid.UUID, db: Session = Depends(get_db)):
    db_user = crud.get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user