import logging
import asyncio
from uuid import UUID, uuid4
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Optional, Deque, Any
from collections import deque
import random

from fastapi import FastAPI, HTTPException, Body, Response, status, Request, BackgroundTasks
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, ValidationError
from fastapi.middleware.cors import CORSMiddleware

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

app = FastAPI(
    title="API de Maintenance Prédictive Industrielle",
    description="API pour la gestion des machines, des données de capteurs, des prédictions ML et de l'assistant IA.",
    version="1.0.0",
)

origins = [
    "http://localhost",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class UserBase(BaseModel):
    name: str
    email: str
    role: str = Field(..., pattern="^(Administrateur|Ingénieur|Technicien)$")
    status: str = Field(..., pattern="^(Actif|Inactif)$")

class UserCreate(UserBase):
    pass

class UserUpdate(UserBase):
    pass

class UserInDB(UserBase):
    id: UUID = Field(default_factory=uuid4)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Config:
        from_attributes = True
        json_encoders = {
            UUID: str
        }

db_users: List[UserInDB] = []

db_users.append(UserInDB(
    id=uuid4(),
    name="Alice Smith",
    email="alice@example.com",
    role="Administrateur",
    status="Actif",
    created_at=datetime.now(timezone.utc),
    updated_at=datetime.now(timezone.utc)
))
db_users.append(UserInDB(
    id=uuid4(),
    name="Bob Johnson",
    email="bob@example.com",
    role="Ingénieur",
    status="Actif",
    created_at=datetime.now(timezone.utc),
    updated_at=datetime.now(timezone.utc)
))
db_users.append(UserInDB(
    id=uuid4(),
    name="Charlie Brown",
    email="charlie@example.com",
    role="Technicien",
    status="Actif",
    created_at=datetime.now(timezone.utc),
    updated_at=datetime.now(timezone.utc)
))

# --- Routes pour les utilisateurs ---
@app.get("/users/", response_model=List[UserInDB], tags=["Users"])
async def read_users():
    return db_users

@app.post("/users/", response_model=UserInDB, status_code=201, tags=["Users"])
async def create_user(user: UserCreate):
    new_user = UserInDB(
        id=uuid4(),
        name=user.name,
        email=user.email,
        role=user.role,
        status=user.status,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )
    db_users.append(new_user)
    return new_user

@app.put("/users/{user_id}", response_model=UserInDB, tags=["Users"])
async def update_user(user_id: UUID, user_update: UserUpdate):
    for idx, existing_user in enumerate(db_users):
        if existing_user.id == user_id:
            updated_user_data = user_update.model_dump(exclude_unset=True)
            for key, value in updated_user_data.items():
                setattr(existing_user, key, value)
            existing_user.updated_at = datetime.now(timezone.utc)
            return existing_user
    raise HTTPException(status_code=404, detail="User not found")

@app.delete("/users/{user_id}", status_code=204, tags=["Users"])
async def delete_user(user_id: UUID):
    global db_users
    initial_len = len(db_users)
    db_users = [user for user in db_users if user.id != user_id]
    if len(db_users) == initial_len:
        raise HTTPException(status_code=404, detail="User not found")
    return Response(status_code=204)

# --- Modèles de données Pydantic (machines, capteurs, alertes) ---
class Machine(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    name: str
    location: str
    type: str
    serial_number: str
    installation_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    status: str = "Active"
    last_maintenance: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    thresholds_config: Dict[str, float] = Field(default_factory=dict)

class SensorDataPoint(BaseModel):
    machine_id: UUID 
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    temperature: float
    vibration: float
    pressure: float
    current: float
    operating_hours: Optional[float] = None
    labels: Optional[List[str]] = None 


# UNIFICATION des variables de stockage pour les données de capteurs
sensor_data_db: Dict[UUID, Deque[SensorDataPoint]] = {} 


class AnomalyPrediction(BaseModel):
    machine_id: UUID
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    anomaly_score: float
    is_anomaly: bool
    predicted_label: Optional[str] = None
    sensor_readings: Optional[dict] = None

class Alert(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    machine_id: UUID
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    type: str
    severity: str
    message: str
    is_resolved: bool = False
    details: Optional[Dict] = None

class AIQuestion(BaseModel):
    question: str
    machine_id: Optional[UUID] = None

# --- NOUVEAU: Modèle de données Pydantic pour les Modèles ML ---
class MLModel(BaseModel):
    id: str
    name: str
    algorithm: str
    version: str
    status: str
    last_trained: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    performance_score: Optional[float] = None
    deployed_machines_count: Optional[int] = None
    training_logs: List[str] = Field(default_factory=list)
    evaluation_metrics: Dict[str, float] = Field(default_factory=dict)
    hyperparameters: Dict[str, Any] = Field(default_factory=dict)
    feature_importance: Dict[str, float] = Field(default_factory=dict)

# --- Stockage en mémoire (pour la démonstration) ---
machines_db: Dict[UUID, Machine] = {}
alerts_db: Dict[UUID, List[Alert]] = {}
predictions_db: Dict[UUID, List[AnomalyPrediction]] = {}
db_ml_models: Dict[str, MLModel] = {}

# --- Données initiales (pour le test) ---
def create_initial_data():
    logging.info("Creating initial machine data...")
    
    # Machine 1
    machine1_id = uuid4()
    machine1 = Machine(
        id=machine1_id,
        name="Broyeur Alpha",
        location="Ligne 1",
        type="Broyeur",
        serial_number="BRYR-A-001",
        installation_date=datetime.now(timezone.utc) - timedelta(days=365),
        thresholds_config={"temperature_critique": 85.0, "vibration_max": 18.5, "pressure_max": 5.0, "current_max": 25.0}
    )
    machines_db[machine1_id] = machine1
    sensor_data_db[machine1_id] = deque(maxlen=1000)
    alerts_db[machine1_id] = []
    predictions_db[machine1_id] = []

    # Machine 2
    machine2_id = uuid4()
    machine2 = Machine(
        id=machine2_id,
        name="Presse Hydraulique Beta",
        location="Ligne 2",
        type="Presse Hydraulique",
        serial_number="PRES-B-002",
        installation_date=datetime.now(timezone.utc) - timedelta(days=180),
        thresholds_config={"temperature_critique": 80.0, "vibration_max": 15.0, "pressure_max": 6.5, "current_max": 30.0}
    )
    machines_db[machine2_id] = machine2
    sensor_data_db[machine2_id] = deque(maxlen=1000)
    alerts_db[machine2_id] = []
    predictions_db[machine2_id] = []

    # Machine 3
    machine3_id = uuid4()
    machine3 = Machine(
        id=machine3_id,
        name="Convoyeur Gamma",
        location="Ligne 3",
        type="Convoyeur",
        serial_number="CNVY-G-003",
        installation_date=datetime.now(timezone.utc) - timedelta(days=90),
        thresholds_config={"temperature_critique": 70.0, "vibration_max": 10.0, "pressure_max": 3.0, "current_max": 18.0}
    )
    machines_db[machine3_id] = machine3
    sensor_data_db[machine3_id] = deque(maxlen=1000)
    alerts_db[machine3_id] = []
    predictions_db[machine3_id] = []

    logging.info(f"Initialised with {len(machines_db)} machines.")

    logging.info("Creating initial ML models data...")
    db_ml_models["model_1"] = MLModel(
        id="model_1",
        name="Détection d'Anomalies de Température",
        algorithm="Random Forest",
        version="1.2.0",
        status="Actif",
        last_trained=datetime(2023, 10, 26, 10, 0, 0, tzinfo=timezone.utc),
        performance_score=0.92,
        deployed_machines_count=5,
        evaluation_metrics={"accuracy": 0.92, "precision": 0.88, "recall": 0.95},
        hyperparameters={"n_estimators": 100, "max_depth": 10},
        training_logs=["2023-10-26 10:00:00 - Début de l'entraînement...", "2023-10-26 10:45:00 - Entraînement terminé avec succès."],
        feature_importance={"temp_avg": 0.3, "vib_max": 0.25, "press_std": 0.15}
    )
    db_ml_models["model_2"] = MLModel(
        id="model_2",
        name="Prédiction de Défaillance Vibratoire",
        algorithm="XGBoost",
        version="2.1.0",
        status="Actif",
        last_trained=datetime(2023, 10, 25, 14, 30, 0, tzinfo=timezone.utc),
        performance_score=0.88,
        deployed_machines_count=3,
        evaluation_metrics={"roc_auc": 0.91, "f1_score": 0.89},
        hyperparameters={"learning_rate": 0.1, "n_estimators": 200},
        training_logs=["2023-10-25 14:30:00 - Démarrage de l'entraînement XGBoost...", "2023-10-25 15:10:00 - Validation du modèle réussie."],
        feature_importance={"vib_freq_bands": 0.4, "temp_trend": 0.2}
    )
    db_ml_models["model_3"] = MLModel(
        id="model_3",
        name="Prédiction de Durée de Vie Restante (RUL)",
        algorithm="LSTM Network",
        version="1.0.0",
        status="Entraînement",
        last_trained=datetime(2023, 10, 27, 8, 15, 0, tzinfo=timezone.utc),
        performance_score=None,
        deployed_machines_count=0,
        training_logs=["2023-10-27 08:15:00 - Initialisation de l'entraînement LSTM...", "2023-10-27 08:30:00 - Epoch 5/50 completed."],
        hyperparameters={"hidden_units": 64, "epochs": 50, "batch_size": 32}
    )
    db_ml_models["model_4"] = MLModel(
        id="model_4",
        name="Détection de Surchauffe Moteur",
        algorithm="Isolation Forest",
        version="1.1.0",
        status="Erreur",
        last_trained=datetime(2023, 10, 24, 11, 0, 0, tzinfo=timezone.utc),
        performance_score=0.75,
        deployed_machines_count=2,
        training_logs=["2023-10-24 11:00:00 - Tentative d'entraînement Isolation Forest.", "2023-10-24 11:05:00 - Erreur: Données d'entraînement manquantes."],
        hyperparameters={"contamination": 0.1}
    )
    logging.info(f"Initialised with {len(db_ml_models)} ML models.")

@app.on_event("startup")
async def startup_event():
    create_initial_data()
    logging.info("Starting sensor data simulator...")
    asyncio.create_task(simulate_sensor_data())
# --- Endpoints de l'API ---

@app.get("/")
async def read_root():
    return {"message": "Bienvenue sur l'API de Maintenance Prédictive Industrielle"}

@app.get("/machines/", response_model=List[Machine], tags=["Machines"])
async def get_machines():
    """
    Récupère la liste de toutes les machines enregistrées.
    """
    return list(machines_db.values())

@app.get("/machines/{machine_id}", response_model=Machine, tags=["Machines"])
async def get_machine(machine_id: UUID):
    """
    Récupère les détails d'une machine spécifique par son ID.
    """
    if machine_id not in machines_db:
        raise HTTPException(status_code=404, detail="Machine non trouvée")
    return machines_db[machine_id]

# Correction de la route pour créer des données de capteurs
@app.post("/sensor-data/", response_model=SensorDataPoint, status_code=status.HTTP_201_CREATED, tags=["Sensor Data"])
async def create_sensor_data(sensor_data_point: SensorDataPoint): # Renommé l'argument
    """
    Enregistre de nouvelles données de capteurs pour une machine.
    """
    if sensor_data_point.machine_id not in machines_db:
        raise HTTPException(status_code=404, detail="Machine non trouvée")

    if sensor_data_point.machine_id not in sensor_data_db:
        sensor_data_db[sensor_data_point.machine_id] = deque(maxlen=1000)
    sensor_data_db[sensor_data_point.machine_id].append(sensor_data_point)
    logging.info(f"Sensor data received for machine {sensor_data_point.machine_id}: T={sensor_data_point.temperature}°C, V={sensor_data_point.vibration} vib")
    
    asyncio.create_task(predict_anomaly_internal(sensor_data_point))
    
    return sensor_data_point

@app.get("/machines/{machine_id}/sensor-data/", response_model=List[SensorDataPoint])
async def get_machine_sensor_data(
    machine_id: UUID, 
    start_time: Optional[datetime] = None,
    end_time: Optional[datetime] = None,
    limit: int = 500
):
    logging.info(f"Fetching sensor data for machine_id: {machine_id}")
    """
    Récupère les données de capteurs pour une machine spécifique, avec options de filtrage temporel et de limitation.
    """
    if machine_id not in machines_db:
        raise HTTPException(status_code=404, detail="Machine non trouvée")

    all_data = list(sensor_data_db.get(machine_id, []))

    if not all_data: 
        return []

    if start_time:
        all_data = [d for d in all_data if d.timestamp >= start_time]
    if end_time:
        all_data = [d for d in all_data if d.timestamp <= end_time]

    sorted_data = sorted(all_data, key=lambda x: x.timestamp) 
    return sorted_data[-limit:] 


async def predict_anomaly_internal(data: SensorDataPoint):
    """
    Fonction interne pour simuler la prédiction d'anomalie et générer des alertes.
    """
    logging.debug(f"Initiating anomaly prediction for machine {data.machine_id}")

    if data.machine_id not in machines_db:
        logging.error(f"Machine {data.machine_id} not found for internal prediction.")
        return

    machine = machines_db[data.machine_id]
    is_anomaly = False
    anomaly_score = 0.0
    message_parts = []
    severity = "Avertissement" 

    if data.temperature > machine.thresholds_config.get("temperature_critique", 90.0):
        is_anomaly = True
        anomaly_score += 0.4
        message_parts.append(f"Température ({data.temperature:.1f}°C) dépasse le seuil critique ({machine.thresholds_config.get('temperature_critique', 'N/A')}°C).")
        severity = "Critique"

    if data.vibration > machine.thresholds_config.get("vibration_max", 20.0):
        is_anomaly = True
        anomaly_score += 0.3
        message_parts.append(f"Vibration ({data.vibration:.1f}) dépasse le seuil maximal ({machine.thresholds_config.get('vibration_max', 'N/A')}).")
        if severity == "Avertissement": severity = "Critique" 

    if data.pressure > machine.thresholds_config.get("pressure_max", 7.0):
        is_anomaly = True
        anomaly_score += 0.15
        message_parts.append(f"Pression ({data.pressure:.1f}) dépasse le seuil maximal ({machine.thresholds_config.get('pressure_max', 'N/A')}).")

    if data.current > machine.thresholds_config.get("current_max", 35.0):
        is_anomaly = True
        anomaly_score += 0.15
        message_parts.append(f"Courant ({data.current:.1f}) dépasse le seuil maximal ({machine.thresholds_config.get('current_max', 'N/A')}).")
        if severity == "Avertissement": severity = "Critique"

    if anomaly_score > 0.7:
        severity = "Urgence"
    elif anomaly_score > 0.4 and severity != "Urgence":
        severity = "Critique"

    if is_anomaly:
        anomaly_score = min(anomaly_score, 1.0)
        final_message = " et ".join(message_parts) if message_parts else f"Anomalie de type '{severity}' détectée."

        new_alert = Alert(
            machine_id=data.machine_id,
            type="anomaly_detection",
            severity=severity,
            message=final_message,
            details=data.model_dump() 
        )
        if data.machine_id not in alerts_db:
            alerts_db[data.machine_id] = []
        alerts_db[data.machine_id].append(new_alert)
        logging.warning(f"Alerte générée pour {machine.name} ({data.machine_id}): {final_message} (Sévérité: {severity})")
    else:
        final_message = "Données normales, pas d'anomalie détectée."

    prediction = AnomalyPrediction(
        machine_id=data.machine_id,
        anomaly_score=anomaly_score,
        is_anomaly=is_anomaly,
        predicted_label="Anomaly" if is_anomaly else "Normal",
        sensor_readings=data.model_dump()
    )
    if data.machine_id not in predictions_db:
        predictions_db[data.machine_id] = []
    predictions_db[data.machine_id].append(prediction)
    logging.debug(f"Anomaly prediction recorded for {machine.name}: is_anomaly={is_anomaly}, score={anomaly_score:.2f}")

@app.get("/machines/{machine_id}/predictions/", response_model=List[AnomalyPrediction], tags=["Machine Learning"])
async def get_machine_predictions(
    machine_id: UUID,
    limit: int = 100,
    is_anomaly: Optional[bool] = None
):
    """
    Récupère les prédictions d'anomalies pour une machine spécifique.
    """
    if machine_id not in predictions_db:
        return []
    
    predictions = list(predictions_db[machine_id])
    if is_anomaly is not None:
        predictions = [p for p in predictions if p.is_anomaly == is_anomaly]
        
    sorted_predictions = sorted(predictions, key=lambda x: x.timestamp, reverse=True)
    return sorted_predictions[:limit]

@app.get("/alerts/", response_model=List[Alert], tags=["Alerts"])
async def get_all_alerts(resolved: Optional[bool] = False, limit: int = 100):
    """
    Récupère toutes les alertes du système, avec option de filtrage par résolution.
    """
    all_filtered_alerts: List[Alert] = []
    for machine_id in alerts_db:
        for alert in alerts_db[machine_id]:
            if alert.is_resolved == resolved:
                all_filtered_alerts.append(alert)

    sorted_alerts = sorted(all_filtered_alerts, key=lambda x: x.timestamp, reverse=True)
    return sorted_alerts[:limit]

@app.get("/machines/{machine_id}/alerts/", response_model=List[Alert], tags=["Alerts"])
async def get_machine_alerts(
    machine_id: UUID,
    resolved: Optional[bool] = False,
    limit: int = 50
):
    """
    Récupère les alertes pour une machine spécifique, avec option de filtrage par résolution.
    """
    if machine_id not in alerts_db or not alerts_db[machine_id]:
        return []

    all_machine_alerts = list(alerts_db[machine_id])

    all_machine_alerts = [alert for alert in all_machine_alerts if alert.is_resolved == resolved]

    sorted_alerts = sorted(all_machine_alerts, key=lambda x: x.timestamp, reverse=True)
    return sorted_alerts[:limit]

@app.put("/alerts/{alert_id}/resolve/", response_model=Alert, tags=["Alerts"])
async def resolve_alert(alert_id: UUID):
    """
    Marque une alerte spécifique comme résolue.
    """
    for machine_id in alerts_db:
        for alert in alerts_db[machine_id]:
            if alert.id == alert_id:
                alert.is_resolved = True
                logging.info(f"Alert {alert_id} for machine {machine_id} resolved.")
                return alert
    raise HTTPException(status_code=404, detail="Alerte non trouvée")

@app.get("/ml-models/", response_model=List[MLModel], tags=["Machine Learning"])
async def get_ml_models():
    """
    Récupère la liste de tous les modèles de Machine Learning enregistrés.
    """
    return list(db_ml_models.values())

async def simulate_training(model_id: str):
    logging.info(f"Début de la simulation d'entraînement pour le modèle {model_id}...")
    await asyncio.sleep(10) 
    if model_id in db_ml_models:
        model = db_ml_models[model_id]
        model.status = "Actif"
        model.last_trained = datetime.now(timezone.utc)
        model.performance_score = round(0.85 + (0.1 * (len(model_id) % 2)), 2)
        model.training_logs.append(f"{model.last_trained.isoformat()} - Entraînement terminé avec succès!")
        logging.info(f"Modèle {model_id} ré-entraîné et actif. Nouveau score: {model.performance_score}")
    else:
        logging.warning(f"Modèle {model_id} non trouvé après entraînement simulé.")


@app.post("/ml-models/{model_id}/retrain", response_model=Dict[str, str], tags=["Machine Learning"])
async def retrain_ml_model(model_id: str, background_tasks: BackgroundTasks):
    """
    Déclenche le ré-entraînement d'un modèle de Machine Learning spécifique.
    Le processus d'entraînement est exécuté en tâche de fond.
    """
    if model_id not in db_ml_models:
        raise HTTPException(status_code=404, detail="Modèle non trouvé")

    model = db_ml_models[model_id]
    if model.status == "Entraînement":
        raise HTTPException(status_code=400, detail="Le modèle est déjà en cours d'entraînement")

    model.status = "Entraînement"
    model.training_logs.append(f"{datetime.now(timezone.utc).isoformat()} - Déclenchement du ré-entraînement...")
    logging.info(f"Déclenchement du ré-entraînement pour le modèle {model_id}. Statut mis à jour en 'Entraînement'.")

    background_tasks.add_task(simulate_training, model_id)

    return {"message": f"Ré-entraînement du modèle {model_id} déclenché."}

# --- Endpoint de l'Assistant IA ---
@app.post("/ai-assistant/", response_model=dict, tags=["AI Assistant"])
async def ask_ai(question_data: AIQuestion):
    """
    Interagit avec l'assistant IA pour poser des questions sur les machines ou la maintenance.
    """
    logging.info(f"Received AI question: '{question_data.question}' for machine {question_data.machine_id}")

    question_lower = question_data.question.lower()
    answer = ""

    machine_name = "une machine non spécifiée"
    machine_status_info = ""

    if question_data.machine_id and question_data.machine_id in machines_db:
        machine = machines_db[question_data.machine_id]
        machine_name = machine.name
        machine_status_info = f"La machine **{machine_name}** ({machine.type}, à {machine.location}) est actuellement {machine.status}."

        if "risque" in question_lower or "probabilité de panne" in question_lower:
            machine_alerts = [a for a in alerts_db.get(question_data.machine_id, []) if not a.is_resolved]
            
            risk_level = "faible"
            probability = "5%"
            if any(a.severity == "Urgence" for a in machine_alerts):
                risk_level = "extrêmement élevé"
                probability = "60-80%"
            elif any(a.severity == "Critique" for a in machine_alerts):
                risk_level = "élevé"
                probability = "25-50%"
            elif any(a.severity == "Avertissement" for a in machine_alerts):
                risk_level = "modéré"
                probability = "10-20%"
            else:
                 if random.random() < 0.1:
                     risk_level = "modéré"
                     probability = "8-12%"
            
            answer = f"**{machine_name}**: Le risque de panne est actuellement **{risk_level}**. La probabilité de défaillance cette semaine est estimée à **{probability}**."
            if machine_alerts:
                answer += f" Il y a actuellement {len(machine_alerts)} alerte(s) active(s) qui contribuent à ce risque."
                
        elif "alertes" in question_lower:
            machine_alerts = [a for a in alerts_db.get(question_data.machine_id, []) if not a.is_resolved]
            
            if len(machine_alerts) > 0:
                alert_types = {a.type for a in machine_alerts}
                answer = f"La machine **{machine_name}** a actuellement **{len(machine_alerts)}** alerte(s) active(s) de type(s) : {', '.join(alert_types)}. La plus critique est : '{machine_alerts[0].message}' ({machine_alerts[0].severity})."
            else:
                answer = f"La machine **{machine_name}** n'a pas d'alertes actives. Tout semble fonctionner correctement."
                
        elif "dernières données" in question_lower or "capteurs" in question_lower:
            if question_data.machine_id in sensor_data_db and sensor_data_db[question_data.machine_id]:
                last_data = sensor_data_db[question_data.machine_id][-1]
                answer = f"Les dernières lectures pour **{machine_name}** ({last_data.timestamp.strftime('%H:%M:%S')}): Température **{last_data.temperature:.1f}°C**, Vibration **{last_data.vibration:.1f}**, Pression **{last_data.pressure:.1f}**, Courant **{last_data.current:.1f}**."
            else:
                answer = f"Aucune donnée de capteur récente disponible pour **{machine_name}**."
                
        elif "qu'est-ce que tu fais" in question_lower or "ton rôle" in question_lower:
            answer = f"Pour **{machine_name}**, mon rôle est de vous fournir des informations en temps réel sur son état, de vous alerter en cas d'anomalie et de vous aider à comprendre les risques de panne potentiels."
        
        elif "informations" in question_lower or "détails" in question_lower:
             answer = machine_status_info + f" Elle a été installée le {machine.installation_date.strftime('%d/%m/%Y')}."

    if not answer: 
        if "bonjour" in question_lower or "salut" in question_lower:
            answer = "Bonjour ! Je suis votre assistant IA pour la maintenance prédictive. Comment puis-je vous aider ?"
        elif "aide" in question_lower:
            answer = "Je peux répondre à des questions sur le statut des machines, les risques de panne, les alertes, ou vous fournir des informations générales sur la maintenance prédictive. Essayez 'Quelle est la machine la plus à risque ?' ou 'Quelles sont les dernières alertes ?' Vous pouvez aussi me poser des questions spécifiques si une machine est sélectionnée."
        elif "machine la plus à risque" in question_lower:
            machine_risk_scores: Dict[UUID, float] = {}
            for mid, alerts in alerts_db.items():
                active_alerts = [a for a in alerts if not a.is_resolved]
                if active_alerts:
                    score = 0.0
                    for alert in active_alerts:
                        if alert.severity == "Urgence": score += 3
                        elif alert.severity == "Critique": score += 2
                        elif alert.severity == "Avertissement": score += 1
                    machine_risk_scores[mid] = score
            
            if machine_risk_scores:
                most_at_risk_id = max(machine_risk_scores, key=machine_risk_scores.get) # type: ignore
                most_at_risk_machine = machines_db[most_at_risk_id]
                answer = f"Actuellement, la machine **{most_at_risk_machine.name}** ({most_at_risk_machine.location}) présente le risque le plus élevé, avec plusieurs alertes actives."
            else:
                answer = "Toutes les machines sont actuellement en état normal et n'ont pas d'alertes actives."
        
        elif "dernières alertes" in question_lower or "alertes globales" in question_lower:
            global_active_alerts = []
            for mid in alerts_db:
                global_active_alerts.extend([a for a in alerts_db[mid] if not a.is_resolved])
            
            if len(global_active_alerts) > 0:
                latest_alerts = sorted(global_active_alerts, key=lambda x: x.timestamp, reverse=True)[:3]
                alert_messages = [f"'{a.message}' ({machines_db[a.machine_id].name}, {a.severity})" for a in latest_alerts]
                answer = f"Il y a un total de **{len(global_active_alerts)}** alertes actives sur l'ensemble du parc machines. Les alertes les plus récentes concernent : {'; '.join(alert_messages)}."
            else:
                answer = "Il n'y a aucune alerte active sur l'ensemble du parc machines. Tout semble normal."
        elif "quel est l'objectif" in question_lower or "ton but" in question_lower:
            answer = "Mon objectif est d'améliorer la fiabilité des équipements industriels en détectant les anomalies, en prédisant les pannes et en fournissant des informations actionnables pour optimiser la maintenance et réduire les coûts."
        elif "technologies" in question_lower:
            answer = "Ce système utilise des technologies comme Python (FastAPI), ReactJS/Next.js, des bases de données comme PostgreSQL/MongoDB, et des librairies de Machine Learning comme Scikit-learn et TensorFlow."
        else:
            answer = f"Je n'ai pas de réponse spécifique à votre question : '{question_data.question}'. Mon développement est en cours, mais je peux vous assurer que toutes les machines sont sous surveillance constante."
    
    await asyncio.sleep(random.uniform(1.0, 2.5))

    return {"response": answer}

# --- Simulateur de données de capteurs (pour le développement) ---
async def simulate_sensor_data():
    while True:
        await asyncio.sleep(random.uniform(3, 7))
        
        for machine_id, machine in machines_db.items(): 
            temp = random.uniform(60.0, 75.0)
            vib = random.uniform(5.0, 12.0)
            press = random.uniform(2.0, 4.0)
            curr = random.uniform(10.0, 20.0)
            
            if random.random() < 0.15:
                anomaly_type = random.choice(["high_temp", "high_vib", "high_press", "high_curr"])
                
                # Accès sécurisé aux seuils de configuration
                if anomaly_type == "high_temp":
                    temp = random.uniform(machine.thresholds_config.get("temperature_critique", 85.0) + 5, 100.0)
                elif anomaly_type == "high_vib":
                    vib = random.uniform(machine.thresholds_config.get("vibration_max", 18.5) + 3, 30.0)
                elif anomaly_type == "high_press":
                    press = random.uniform(machine.thresholds_config.get("pressure_max", 5.0) + 1.5, 8.0)
                elif anomaly_type == "high_curr":
                    curr = random.uniform(machine.thresholds_config.get("current_max", 25.0) + 5, 40.0)
            
            sensor_data_point = SensorDataPoint( 
                machine_id=machine_id, 
                temperature=temp,
                vibration=vib,
                pressure=press,
                current=curr,
                operating_hours=random.uniform(100.0, 5000.0)
            )
            
            try:
                if machine_id not in sensor_data_db:
                    sensor_data_db[machine_id] = deque(maxlen=1000)
                sensor_data_db[machine_id].append(sensor_data_point) 
                asyncio.create_task(predict_anomaly_internal(sensor_data_point)) 
                logging.debug(f"Simulated data sent for {machine.name}")
            except ValidationError as e:
                logging.error(f"Validation error in simulator for machine {machine_id}: {e}")
            except Exception as e:
                logging.error(f"Error sending simulated sensor data for machine {machine_id}: {e}")