import logging
import asyncio
from uuid import UUID, uuid4
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Deque
from collections import deque
import random

from fastapi import FastAPI, HTTPException, Body, Response, status, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, ValidationError # Import ValidationError
from fastapi.middleware.cors import CORSMiddleware

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# --- Configuration de FastAPI ---
app = FastAPI(
    title="API de Maintenance Prédictive Industrielle",
    description="API pour la gestion des machines, des données de capteurs, des prédictions ML et de l'assistant IA.",
    version="1.0.0",
)

# --- Configuration CORS ---
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
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        from_attributes = True
        json_encoders = {
            UUID: str # Pour sérialiser l'UUID en string lors du renvoi JSON
        }

# Base de données simple en mémoire pour les utilisateurs (pour le moment)
db_users: List[UserInDB] = []

# Ajoutez quelques utilisateurs par défaut
db_users.append(UserInDB(
    id=uuid4(),
    name="Alice Smith",
    email="alice@example.com",
    role="Administrateur",
    status="Actif",
    created_at=datetime.utcnow(),
    updated_at=datetime.utcnow()
))
db_users.append(UserInDB(
    id=uuid4(),
    name="Bob Johnson",
    email="bob@example.com",
    role="Ingénieur",
    status="Actif",
    created_at=datetime.utcnow(),
    updated_at=datetime.utcnow()
))
db_users.append(UserInDB(
    id=uuid4(),
    name="Charlie Brown",
    email="charlie@example.com",
    role="Technicien",
    status="Actif",
    created_at=datetime.utcnow(),
    updated_at=datetime.utcnow()
))


# Routes pour les utilisateurs
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
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db_users.append(new_user)
    return new_user

@app.put("/users/{user_id}", response_model=UserInDB, tags=["Users"])
async def update_user(user_id: UUID, user_update: UserUpdate):
    for idx, existing_user in enumerate(db_users):
        if existing_user.id == user_id:
            updated_user_data = user_update.model_dump(exclude_unset=True)
            # Mise à jour des champs
            for key, value in updated_user_data.items():
                setattr(existing_user, key, value)
            existing_user.updated_at = datetime.utcnow()
            return existing_user
    raise HTTPException(status_code=404, detail="User not found")

@app.delete("/users/{user_id}", status_code=204, tags=["Users"])
async def delete_user(user_id: UUID):
    global db_users # Important pour modifier la liste globale
    initial_len = len(db_users)
    db_users = [user for user in db_users if user.id != user_id]
    if len(db_users) == initial_len:
        raise HTTPException(status_code=404, detail="User not found")
    return Response(status_code=204)

# --- Modèles de données Pydantic ---
class Machine(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    name: str
    location: str
    type: str
    serial_number: str
    installation_date: datetime = Field(default_factory=datetime.now)
    status: str = "Active"
    last_maintenance: datetime = Field(default_factory=datetime.now)
    # Seuils pour la détection d'anomalies (peuvent être plus complexes)
    thresholds_config: Dict[str, float] = Field(default_factory=dict)

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
    anomaly_score: float # Score entre 0 et 1
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

class AIQuestion(BaseModel):
    question: str
    machine_id: Optional[UUID] = None

# --- Stockage en mémoire (pour la démonstration) ---
# Utilisation de Deque pour les données de capteurs afin de maintenir une taille fixe
machines_db: Dict[UUID, Machine] = {}
sensor_data_db: Dict[UUID, Deque[SensorData]] = {}
alerts_db: Dict[UUID, List[Alert]] = {}
predictions_db: Dict[UUID, List[AnomalyPrediction]] = {}

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
        installation_date=datetime.now() - timedelta(days=365),
        thresholds_config={"temperature_critique": 85.0, "vibration_max": 18.5, "pressure_max": 5.0, "current_max": 25.0}
    )
    machines_db[machine1_id] = machine1
    sensor_data_db[machine1_id] = deque(maxlen=1000) # Garde les 1000 dernières entrées
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
        installation_date=datetime.now() - timedelta(days=180),
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
        installation_date=datetime.now() - timedelta(days=90),
        thresholds_config={"temperature_critique": 70.0, "vibration_max": 10.0, "pressure_max": 3.0, "current_max": 18.0}
    )
    machines_db[machine3_id] = machine3
    sensor_data_db[machine3_id] = deque(maxlen=1000)
    alerts_db[machine3_id] = []
    predictions_db[machine3_id] = []

    logging.info(f"Initialised with {len(machines_db)} machines.")

# Appeler la fonction d'initialisation au démarrage
@app.on_event("startup")
async def startup_event():
    create_initial_data()

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

@app.post("/sensor-data/", response_model=SensorData, status_code=status.HTTP_201_CREATED, tags=["Sensor Data"])
async def create_sensor_data(sensor_data: SensorData):
    """
    Enregistre de nouvelles données de capteurs pour une machine.
    """
    if sensor_data.machine_id not in machines_db:
        raise HTTPException(status_code=404, detail="Machine non trouvée")

    if sensor_data.machine_id not in sensor_data_db:
        sensor_data_db[sensor_data.machine_id] = deque(maxlen=1000)
    sensor_data_db[sensor_data.machine_id].append(sensor_data)
    logging.info(f"Sensor data received for machine {sensor_data.machine_id}: T={sensor_data.temperature}°C, V={sensor_data.vibration} vib")
    
    # Appel asynchrone pour la prédiction d'anomalie
    # Cela évite de bloquer la réponse de l'API
    asyncio.create_task(predict_anomaly_internal(sensor_data))
    
    return sensor_data

@app.get("/machines/{machine_id}/sensor-data/", response_model=List[SensorData], tags=["Sensor Data"])
async def get_machine_sensor_data(
    machine_id: UUID,
    start_time: Optional[datetime] = None,
    end_time: Optional[datetime] = None,
    limit: int = 100
):
    """
    Récupère les données de capteurs pour une machine spécifique, avec options de filtrage temporel et de limitation.
    """
    if machine_id not in sensor_data_db or not sensor_data_db[machine_id]:
        # Retourne une liste vide si pas de données pour éviter 404 non nécessaire
        return [] 

    all_data = list(sensor_data_db[machine_id])

    # Filtrer par temps
    if start_time:
        all_data = [d for d in all_data if d.timestamp >= start_time]
    if end_time:
        all_data = [d for d in all_data if d.timestamp <= end_time]

    # Trier par timestamp (le plus récent en premier) et limiter
    sorted_data = sorted(all_data, key=lambda x: x.timestamp, reverse=True)

    return sorted_data[:limit]


# Fonction interne pour la prédiction d'anomalie, appelée asynchrone après réception des données
async def predict_anomaly_internal(data: SensorData):
    """
    Fonction interne pour simuler la prédiction d'anomalie et générer des alertes.
    Ne renvoie pas de réponse HTTP directement.
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

    # Exemple de logique d'anomalie simplifiée basée sur les seuils configurés
    # Chaque dépassement de seuil augmente le score et potentiellement la sévérité
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
        # Un dépassement de pression seul peut rester un avertissement si les autres paramètres sont bons

    if data.current > machine.thresholds_config.get("current_max", 35.0):
        is_anomaly = True
        anomaly_score += 0.15
        message_parts.append(f"Courant ({data.current:.1f}) dépasse le seuil maximal ({machine.thresholds_config.get('current_max', 'N/A')}).")
        if severity == "Avertissement": severity = "Critique"

    # Si le score d'anomalie est très élevé, on peut monter à 'Urgence'
    if anomaly_score > 0.7:
        severity = "Urgence"
    elif anomaly_score > 0.4 and severity != "Urgence":
        severity = "Critique" # Assure que la sévérité est au moins critique si le score est modéré

    if is_anomaly:
        anomaly_score = min(anomaly_score, 1.0) # Cap score at 1.0
        final_message = " et ".join(message_parts) if message_parts else f"Anomalie de type '{severity}' détectée."

        new_alert = Alert(
            machine_id=data.machine_id,
            type="anomaly_detection",
            severity=severity,
            message=final_message,
            details=data.dict()
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
        sensor_readings=data.dict()
    )
    if data.machine_id not in predictions_db:
        predictions_db[data.machine_id] = []
    predictions_db[data.machine_id].append(prediction)
    logging.debug(f"Anomaly prediction recorded for {machine.name}: is_anomaly={is_anomaly}, score={anomaly_score:.2f}")


# Endpoint pour récupérer les prédictions d'anomalie (pour le debug/historique ML)
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
    Par défaut, ne retourne que les alertes non résolues.
    """
    all_filtered_alerts: List[Alert] = []
    for machine_id in alerts_db:
        for alert in alerts_db[machine_id]:
            if alert.is_resolved == resolved: # Filtrer par resolved
                all_filtered_alerts.append(alert)

    sorted_alerts = sorted(all_filtered_alerts, key=lambda x: x.timestamp, reverse=True)
    return sorted_alerts[:limit]

@app.get("/machines/{machine_id}/alerts/", response_model=List[Alert], tags=["Alerts"])
async def get_machine_alerts(
    machine_id: UUID,
    resolved: Optional[bool] = False, # Par défaut, n'afficher que les alertes non résolues
    limit: int = 50
):
    """
    Récupère les alertes pour une machine spécifique, avec option de filtrage par résolution.
    """
    if machine_id not in alerts_db or not alerts_db[machine_id]:
        return []

    all_machine_alerts = list(alerts_db[machine_id])

    # Filtrer par `resolved`
    all_machine_alerts = [alert for alert in all_machine_alerts if alert.is_resolved == resolved]

    sorted_alerts = sorted(all_machine_alerts, key=lambda x: x.timestamp, reverse=True)
    return sorted_alerts[:limit]

@app.post("/alerts/{alert_id}/resolve/", response_model=Alert, tags=["Alerts"])
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


# --- Endpoint de l'Assistant IA ---
@app.post("/ai-assistant/", response_model=dict, tags=["AI Assistant"])
async def ask_ai(question_data: AIQuestion):
    """
    Interagit avec l'assistant IA pour poser des questions sur les machines ou la maintenance.
    """
    logging.info(f"Received AI question: '{question_data.question}' for machine {question_data.machine_id}")

    question_lower = question_data.question.lower()
    answer = ""

    # Contexte spécifique à la machine si fournie
    machine_name = "une machine non spécifiée"
    machine_status_info = ""

    if question_data.machine_id and question_data.machine_id in machines_db:
        machine = machines_db[question_data.machine_id]
        machine_name = machine.name
        machine_status_info = f"La machine **{machine_name}** ({machine.type}, à {machine.location}) est actuellement {machine.status}."

        # Logique améliorée pour les questions spécifiques à la machine
        if "risque" in question_lower or "probabilité de panne" in question_lower:
            # Simuler un risque basé sur l'état des alertes ou un facteur aléatoire pour la démo
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
                 # Si pas d'alertes, on peut quand même simuler un risque aléatoire
                 if random.random() < 0.1: # 10% de chance d'un risque modéré même sans alerte
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

    # Réponses générales si aucune machine n'est sélectionnée ou question générale
    if not answer: 
        if "bonjour" in question_lower or "salut" in question_lower:
            answer = "Bonjour ! Je suis votre assistant IA pour la maintenance prédictive. Comment puis-je vous aider ?"
        elif "aide" in question_lower:
            answer = "Je peux répondre à des questions sur le statut des machines, les risques de panne, les alertes, ou vous fournir des informations générales sur la maintenance prédictive. Essayez 'Quelle est la machine la plus à risque ?' ou 'Quelles sont les dernières alertes ?' Vous pouvez aussi me poser des questions spécifiques si une machine est sélectionnée."
        elif "machine la plus à risque" in question_lower:
            # Identifier la machine la plus à risque en fonction des alertes actives
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
    
    # Simuler un délai de traitement de l'IA pour une meilleure UX
    await asyncio.sleep(random.uniform(1.0, 2.5)) # Délai plus réaliste

    return {"response": answer}

# --- Simulateur de données de capteurs (pour le développement) ---
async def simulate_sensor_data():
    while True:
        await asyncio.sleep(random.uniform(3, 7)) # Envoie des données toutes les 3-7 secondes
        
        for machine_id, machine in machines_db.items():
            # Générer des données "normales" avec de légères variations
            temp = random.uniform(60.0, 75.0)
            vib = random.uniform(5.0, 12.0)
            press = random.uniform(2.0, 4.0)
            curr = random.uniform(10.0, 20.0)
            
            # Introduire occasionnellement des anomalies aléatoires pour le test
            if random.random() < 0.15: # 15% de chance d'une anomalie
                anomaly_type = random.choice(["high_temp", "high_vib", "high_press", "high_curr"])
                
                if anomaly_type == "high_temp":
                    temp = random.uniform(machine.thresholds_config.get("temperature_critique", 85.0) + 5, 100.0)
                elif anomaly_type == "high_vib":
                    vib = random.uniform(machine.thresholds_config.get("vibration_max", 18.5) + 3, 30.0)
                elif anomaly_type == "high_press":
                    press = random.uniform(machine.thresholds_config.get("pressure_max", 5.0) + 1.5, 8.0)
                elif anomaly_type == "high_curr":
                    curr = random.uniform(machine.thresholds_config.get("current_max", 25.0) + 5, 40.0)
            
            sensor_data = SensorData(
                machine_id=machine_id,
                temperature=temp,
                vibration=vib,
                pressure=press,
                current=curr,
                operating_hours=random.uniform(100.0, 5000.0) # Valeur aléatoire pour la démo
            )
            
            try:
                # Appeler l'endpoint directement (ou la fonction interne)
                # Utiliser la fonction interne est plus direct pour un simulateur
                # et évite le surcoût de requête HTTP.
                # await create_sensor_data(sensor_data) # Si on veut passer par l'endpoint HTTP
                sensor_data_db[machine_id].append(sensor_data)
                asyncio.create_task(predict_anomaly_internal(sensor_data)) # Appel direct à la logique de prédiction
                logging.debug(f"Simulated data sent for {machine.name}")
            except ValidationError as e:
                logging.error(f"Validation error in simulator for machine {machine_id}: {e}")
            except Exception as e:
                logging.error(f"Error sending simulated sensor data for machine {machine_id}: {e}")

# Lancer le simulateur en tant que tâche de fond au démarrage de l'application
@app.on_event("startup")
async def start_simulator():
    logging.info("Starting sensor data simulator...")
    asyncio.create_task(simulate_sensor_data())