from sqlalchemy.orm import Session
from sqlalchemy import func
from . import models, schemas
from typing import List, Optional
import uuid
from datetime import datetime



def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.User).offset(skip).limit(limit).all()

# Fonctions CRUD pour Machine
def get_machine(db: Session, machine_id: uuid.UUID):
    return db.query(models.Machine).filter(models.Machine.id == machine_id).first()

def get_machine_by_serial(db: Session, serial_number: str):
    return db.query(models.Machine).filter(models.Machine.serial_number == serial_number).first()

def get_machines(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Machine).offset(skip).limit(limit).all()

def create_machine(db: Session, machine: schemas.MachineCreate):
    db_machine = models.Machine(**machine.dict())
    db.add(db_machine)
    db.commit()
    db.refresh(db_machine)
    return db_machine

# Fonctions CRUD pour SensorData
# Note : Pour les données de capteurs, nous nous concentrons sur l'ingestion et la lecture par machine/période
def create_sensor_data(db: Session, sensor_data_item: schemas.SensorDataCreate):
    # La clé primaire composite (timestamp, machine_id) est gérée par SQLAlchemy
    # Si timestamp n'est pas fourni, le DEFAULT NOW() de la DB sera utilisé
    db_sensor_data = models.SensorData(**sensor_data_item.dict())
    db.add(db_sensor_data)
    db.commit()
    db.refresh(db_sensor_data)
    return db_sensor_data

def create_multiple_sensor_data(db: Session, sensor_data_items: List[schemas.SensorDataCreate]):
    db_items = [models.SensorData(**item.dict()) for item in sensor_data_items]
    db.add_all(db_items)
    db.commit()
    for item in db_items:
        db.refresh(item)
    return db_items


def get_sensor_data_for_machine(
    db: Session,
    machine_id: uuid.UUID,
    start_time: Optional[datetime] = None,
    end_time: Optional[datetime] = None,
    skip: int = 0,
    limit: int = 100
):
    query = db.query(models.SensorData).filter(models.SensorData.machine_id == machine_id)
    if start_time:
        query = query.filter(models.SensorData.timestamp >= start_time)
    if end_time:
        query = query.filter(models.SensorData.timestamp <= end_time)
    # Ordonner par timestamp pour les séries temporelles
    return query.order_by(models.SensorData.timestamp.asc()).offset(skip).limit(limit).all()

# Fonction CRUD pour les alertes (simple pour l'instant)
def create_alert(db: Session, alert_item: schemas.AlertCreate):
    db_alert = models.Alert(**alert_item.dict())
    db.add(db_alert)
    db.commit()
    db.refresh(db_alert)
    return db_alert

def get_alerts_for_machine(db: Session, machine_id: uuid.UUID, skip: int = 0, limit: int = 100):
    return db.query(models.Alert).filter(models.Alert.machine_id == machine_id).offset(skip).limit(limit).all()

def get_unresolved_alerts(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Alert).filter(models.Alert.is_resolved == False).offset(skip).limit(limit).all()

# Fonctions CRUD pour User (sera étendu avec l'authentification)
def get_user(db: Session, user_id: uuid.UUID):
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate):
    # Le hachage du mot de passe sera ajouté ici plus tard
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