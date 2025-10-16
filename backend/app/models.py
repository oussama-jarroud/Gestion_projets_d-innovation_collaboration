from sqlalchemy import Column, DateTime, Integer, String, Numeric, Boolean, ForeignKey, func, ARRAY, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from .database import Base
import uuid

class TimestampMixin:
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

class UUIDMixin:
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

class Machine(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "machines"

    name = Column(String, nullable=False)
    location = Column(String)
    type = Column(String)
    model_number = Column(String)
    serial_number = Column(String, unique=True)
    installation_date = Column(DateTime(timezone=True))
    last_maintenance_date = Column(DateTime(timezone=True))
    thresholds_config = Column(JSON, default={})

    sensor_data = relationship("SensorData", back_populates="machine")
    alerts = relationship("Alert", back_populates="machine")

class SensorData(Base):
    __tablename__ = "sensor_data"

    timestamp = Column(DateTime(timezone=True), primary_key=True, server_default=func.now())
    machine_id = Column(UUID(as_uuid=True), ForeignKey("machines.id"), nullable=False, primary_key=True)
    temperature = Column(Numeric, nullable=False)
    vibration = Column(Numeric, nullable=False)
    pressure = Column(Numeric, nullable=False)
    current = Column(Numeric, nullable=False)
    operating_hours = Column(Numeric)
    labels = Column(ARRAY(String), default=[])

    machine = relationship("Machine", back_populates="sensor_data")

    __table_args__ = ({},)

class Alert(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "alerts"

    machine_id = Column(UUID(as_uuid=True), ForeignKey("machines.id"), nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    type = Column(String, nullable=False)
    severity = Column(String, nullable=False)
    message = Column(String, nullable=False)
    is_resolved = Column(Boolean, default=False)
    resolved_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    resolved_at = Column(DateTime(timezone=True))

    machine = relationship("Machine", back_populates="alerts")
    resolved_by_user = relationship("User")

class User(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "users"

    username = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False, default="technician")

    alerts_resolved = relationship("Alert", foreign_keys=[Alert.resolved_by_user_id], back_populates="resolved_by_user")
