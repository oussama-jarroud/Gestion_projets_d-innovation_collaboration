import logging
import asyncio # <-- NOUVEL IMPORT
from uuid import UUID, uuid4
from datetime import datetime, timedelta
from typing import List, Dict, Optional # <-- Ajout de Optional
from collections import deque
import random

from fastapi import FastAPI, HTTPException, Body, status, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field # <-- BaseModel et Field sont importants
from fastapi.middleware.cors import CORSMiddleware # <-- NOUVEL IMPORT pour CORS

# Configure logging
logging.basicConfig(level=logging.INFO)

# --- Configuration de FastAPI ---
app = FastAPI(
    title="API de Maintenance Prédictive Industrielle",
    description="API pour la gestion des machines, des données de capteurs, des prédictions ML et de l'assistant IA.",
    version="1.0.0",
)

# --- Configuration CORS ---
# Permet au frontend (http://localhost:3000) de communiquer avec cette API
origins = [
    "http://localhost",
    "http://localhost:3000", 
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # Permet toutes les méthodes (GET, POST, etc.)
    allow_headers=["*"],  # Permet tous les headers
)

# --- Modèles de données ---
class Machine(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    name: str
    location: str
    type: str
    serial_number: str
    installation_date: datetime = Field(default_factory=datetime.now)
    status: str = "Active"
    last_maintenance: datetime = Field(default_factory=datetime.now)
    thresholds_config: Dict = {} # Seuils pour la détection d'anomalies

class SensorData(BaseModel):
    timestamp: datetime = Field(default_factory=datetime.now)
    machine_id: UUID
    temperature: float
    vibration: float
    pressure: float
    current: float
    operating_hours: Optional[float] = None
    labels: Optional[List[str]] = None # Pour des labels de données ML

class AnomalyPrediction(BaseModel):
    machine_id: UUID
    timestamp: datetime = Field(default_factory=datetime.now)
    anomaly_score: float
    is_anomaly: bool
    predicted_label: Optional[str] = None # Ex: 'Normal', 'Mild Fault', 'Severe Fault'
    sensor_readings: Optional[dict] = None # Les lectures qui ont mené à la prédiction

class Alert(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    machine_id: UUID
    timestamp: datetime = Field(default_factory=datetime.now)
    type: str # Ex: 'anomaly_detection', 'threshold_breach', 'predictive_maintenance'
    severity: str # Ex: 'Avertissement', 'Critique', 'Urgence'
    message: str
    is_resolved: bool = False
    details: Optional[Dict] = None

class AIQuestion(BaseModel): # <-- NOUVEAU MODÈLE pour l'Assistant IA
    question: str
    machine_id: Optional[UUID] = None

# --- Stockage en mémoire (pour la démonstration) ---
machines_db: Dict[UUID, Machine] = {}
sensor_data_db: Dict[UUID, deque] = {} # Chaque machine a son propre deque de données
alerts_db: Dict[UUID, List[Alert]] = {} # Chaque machine a sa liste d'alertes
predictions_db: Dict[UUID, List[AnomalyPrediction]] = {} # Chaque machine a ses prédictions

# --- Données initiales (pour le test) ---
def create_initial_data():
    # Machine 1
    machine1_id = uuid4()
    machine1 = Machine(
        id=machine1_id,
        name="Broyeur Alpha",
        location="Ligne 1",
        type="Broyeur",
        serial_number="BRYR-A-001",
        installation_date=datetime.now() - timedelta(days=365),
        thresholds_config={"temperature_critique": 85, "vibration_max": 18.5}
    )
    machines_db[machine1_id] = machine1
    sensor_data_db[machine1_id] = deque(maxlen=1000) # Garde les 1000 dernières entrées
    alerts_db[machine1_id] = []
    predictions_db[machine1_id] = []

    # Machine 2
    machine2_id = uuid4()
    machine2 = Machine(
        id=machine2_id,
        name="Broyeur Alpha V4",
        location="Ligne 1",
        type="Broyeur V4",
        serial_number="BRYR-V4-001",
        installation_date=datetime.now() - timedelta(days=180),
        thresholds_config={"temperature_critique": 80, "vibration_max": 15.0}
    )
    machines_db[machine2_id] = machine2
    sensor_data_db[machine2_id] = deque(maxlen=1000)
    alerts_db[machine2_id] = []
    predictions_db[machine2_id] = []

    logging.info(f"Initialised with {len(machines_db)} machines.")

# Appeler la fonction d'initialisation au démarrage
create_initial_data()

# --- Endpoints de l'API ---

@app.get("/")
async def read_root():
    return {"message": "Bienvenue sur l'API de Maintenance Prédictive Industrielle"}

@app.get("/machines/", response_model=List[Machine])
async def get_machines():
    return list(machines_db.values())

@app.get("/machines/{machine_id}", response_model=Machine)
async def get_machine(machine_id: UUID):
    if machine_id not in machines_db:
        raise HTTPException(status_code=404, detail="Machine non trouvée")
    return machines_db[machine_id]

@app.post("/sensor-data/", response_model=SensorData, status_code=status.HTTP_201_CREATED)
async def create_sensor_data(sensor_data: SensorData):
    if sensor_data.machine_id not in machines_db:
        raise HTTPException(status_code=404, detail="Machine non trouvée")
    
    if sensor_data.machine_id not in sensor_data_db:
        sensor_data_db[sensor_data.machine_id] = deque(maxlen=1000)
    sensor_data_db[sensor_data.machine_id].append(sensor_data)
    logging.info(f"Sensor data received for machine {sensor_data.machine_id}: {sensor_data.temperature}°C, {sensor_data.vibration} vib")
    return sensor_data

@app.get("/machines/{machine_id}/sensor-data/", response_model=List[SensorData])
async def get_machine_sensor_data(
    machine_id: UUID,
    start_time: Optional[datetime] = None,
    end_time: Optional[datetime] = None,
    limit: int = 100
):
    if machine_id not in sensor_data_db:
        raise HTTPException(status_code=404, detail="Aucune donnée de capteur pour cette machine")

    all_data = list(sensor_data_db[machine_id])
    
    # Filtrer par temps
    if start_time:
        all_data = [d for d in all_data if d.timestamp >= start_time]
    if end_time:
        all_data = [d for d in all_data if d.timestamp <= end_time]
    
    # Trier par timestamp (le plus récent en premier) et limiter
    sorted_data = sorted(all_data, key=lambda x: x.timestamp, reverse=True)
    
    return sorted_data[:limit]


@app.post("/predict-anomaly/", response_model=AnomalyPrediction)
async def predict_anomaly(data: SensorData):
    logging.info(f"Received data for anomaly prediction for machine {data.machine_id}")

    # --- SIMULATION DE LA PRÉDICTION D'ANOMALIE ---
    # Ici, vous intégreriez votre modèle ML réel.
    # Pour la démonstration, nous allons créer une logique simple basée sur des seuils
    # et générer une alerte si une anomalie est détectée.

    if data.machine_id not in machines_db:
        raise HTTPException(status_code=404, detail="Machine non trouvée pour la prédiction")

    machine = machines_db[data.machine_id]
    is_anomaly = False
    anomaly_score = 0.0
    message = "Données normales."
    severity = "Avertissement" # Default, will be overridden

    # Exemple de logique d'anomalie simplifiée
    if data.temperature > machine.thresholds_config.get("temperature_critique", 90): # Ex: 90°C
        is_anomaly = True
        anomaly_score += 0.6
        message = f"Température ({data.temperature}°C) dépasse le seuil critique ({machine.thresholds_config.get('temperature_critique', 'N/A')}°C)."
        severity = "Critique"
    
    if data.vibration > machine.thresholds_config.get("vibration_max", 20.0): # Ex: 20.0
        is_anomaly = True
        anomaly_score += 0.4
        if message == "Données normales.":
            message = f"Vibration ({data.vibration}) dépasse le seuil maximal ({machine.thresholds_config.get('vibration_max', 'N/A')})."
        else:
            message += f" Et vibration ({data.vibration}) dépasse le seuil maximal ({machine.thresholds_config.get('vibration_max', 'N/A')})."
        
        if anomaly_score > 0.8: # Si les deux sont en anomalie, c'est plus grave
            severity = "Urgence"
        elif severity != "Urgence":
            severity = "Critique"
            
    if is_anomaly:
        anomaly_score = min(anomaly_score, 1.0) # Cap at 1.0

        # Créer une alerte si une anomalie est détectée
        new_alert = Alert(
            machine_id=data.machine_id,
            type="anomaly_detection",
            severity=severity,
            message=message,
            details=data.dict()
        )
        if data.machine_id not in alerts_db:
            alerts_db[data.machine_id] = []
        alerts_db[data.machine_id].append(new_alert)
        logging.warning(f"Alerte générée pour {data.machine_id}: {message}")

    prediction = AnomalyPrediction(
        machine_id=data.machine_id,
        anomaly_score=anomaly_score,
        is_anomaly=is_anomaly,
        predicted_label="Anomaly" if is_anomaly else "Normal",
        sensor_readings=data.dict() # Enregistre les lectures pour référence
    )
    if data.machine_id not in predictions_db:
        predictions_db[data.machine_id] = []
    predictions_db[data.machine_id].append(prediction)
    return prediction

@app.get("/machines/{machine_id}/alerts/", response_model=List[Alert])
async def get_machine_alerts(
    machine_id: UUID,
    include_resolved: bool = False,
    limit: int = 50
):
    if machine_id not in alerts_db:
        return [] # Pas d'alertes pour cette machine

    all_alerts = list(alerts_db[machine_id]) # Convertir deque en list si c'est un deque

    if not include_resolved:
        all_alerts = [alert for alert in all_alerts if not alert.is_resolved]

    # Tri par timestamp (le plus récent en premier)
    sorted_alerts = sorted(all_alerts, key=lambda x: x.timestamp, reverse=True)
    return sorted_alerts[:limit]

@app.post("/alerts/{alert_id}/resolve/", response_model=Alert)
async def resolve_alert(alert_id: UUID):
    # Chercher l'alerte dans toutes les listes de machines
    for machine_id in alerts_db:
        for alert in alerts_db[machine_id]:
            if alert.id == alert_id:
                alert.is_resolved = True
                logging.info(f"Alert {alert_id} resolved.")
                return alert
    raise HTTPException(status_code=404, detail="Alerte non trouvée")


# --- Endpoint de l'Assistant IA ---
@app.post("/ai-assistant/", response_model=dict, tags=["AI Assistant"])
async def ask_ai(question_data: AIQuestion): # <-- Implémentation corrigée et statique
    logging.info(f"Received AI question: {question_data.question} for machine {question_data.machine_id}")
    
    # Ceci est une implémentation simulée.
    # Dans un cas réel, vous feriez appel à votre modèle LLM (ex: OpenAI, Llama, etc.)
    # en lui passant la question et éventuellement le machine_id pour un contexte spécifique.
    
    question_lower = question_data.question.lower()
    answer = ""

    if "risque" in question_lower or "probabilité de panne" in question_lower:
        answer = "La machine Broyeur Alpha V4 présente un risque modéré de panne dû à des vibrations légèrement élevées. La probabilité de panne cette semaine est estimée à 15%."
    elif "alertes" in question_lower:
        # Ici, vous pourriez interroger alerts_db pour des alertes réelles
        machine_alerts_count = 0
        if question_data.machine_id and question_data.machine_id in alerts_db:
            machine_alerts_count = len([a for a in alerts_db[question_data.machine_id] if not a.is_resolved])
        
        if machine_alerts_count > 0:
            answer = f"Il y a actuellement {machine_alerts_count} alerte(s) active(s) pour la machine {'sélectionnée' if question_data.machine_id else 'en général'}. La plupart concernent des détections d'anomalies de vibration."
        else:
            answer = "Il n'y a pas d'alertes actives pour le moment. Tout semble fonctionner correctement."
    elif "bonjour" in question_lower or "salut" in question_lower:
        answer = "Bonjour ! Je suis votre assistant IA pour la maintenance prédictive. Comment puis-je vous aider ?"
    elif "aide" in question_lower:
        answer = "Je peux répondre à des questions sur le statut des machines, les risques de panne, les alertes, ou vous fournir des informations générales sur la maintenance prédictive. Essayez 'Quelle est la machine la plus à risque ?'"
    else:
        answer = f"Je n'ai pas de réponse spécifique à votre question : '{question_data.question}'. Mon développement est en cours, mais je peux vous assurer que toutes les machines sont sous surveillance constante."
    
    # Simuler un délai de traitement de l'IA pour une meilleure UX
    await asyncio.sleep(1.5) 

    return {"answer": answer}