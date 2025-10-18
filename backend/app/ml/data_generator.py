# backend/app/ml/data_generator.py

import random
from datetime import datetime, timedelta
import uuid

def generate_machine_data():
    """Génère des données de machine simulées."""
    machine_types = ["Broyeur", "Presse Hydraulique", "Convoyeur", "Four Industriel", "Robot d'Assemblage"]
    locations = ["Atelier 1", "Chaine de Prod A", "Zone de Stockage B", "Ligne 3"]
    
    machine_type = random.choice(machine_types)
    location = random.choice(locations)
    
    # Exemple de seuils spécifiques à la machine
    thresholds = {}
    if machine_type == "Broyeur":
        thresholds = {"temperature_max": 120.0, "vibration_max": 35.0, "pressure_min": 1.0, "pressure_max": 5.0}
    elif machine_type == "Presse Hydraulique":
        thresholds = {"temperature_max": 90.0, "vibration_max": 20.0, "pressure_min": 10.0, "pressure_max": 50.0}
    elif machine_type == "Convoyeur":
        thresholds = {"vibration_max": 25.0, "current_max": 15.0}

    return {
        "name": f"{machine_type} {random.choice(['Alpha', 'Beta', 'Gamma', 'Delta'])}",
        "location": location,
        "type": machine_type,
        "serial_number": f"SN-{random.randint(1000, 9999)}-{random.choice('ABCDEF')}",
        "installation_date": datetime.utcnow() - timedelta(days=random.randint(30, 730)), # Installé il y a 1 mois à 2 ans
        "thresholds_config": thresholds
    }

def generate_sensor_data(machine_id: str):
    """Génère des données de capteurs simulées pour une machine."""
    
    # Données de base, avec un peu de bruit
    temperature = random.uniform(60, 90) + random.gauss(0, 5) # 60-90°C base, bruit
    vibration = random.uniform(5, 15) + random.gauss(0, 2)   # 5-15 base, bruit
    pressure = random.uniform(2, 4) + random.gauss(0, 0.5)   # 2-4 bars base, bruit
    current = random.uniform(10, 20) + random.gauss(0, 1)    # 10-20 A base, bruit

    # Introduction d'anomalies occasionnelles
    if random.random() < 0.05: # 5% de chance d'une anomalie
        anomaly_type = random.choice(["high_temp", "high_vib", "low_pressure", "high_current"])
        if anomaly_type == "high_temp":
            temperature = random.uniform(100, 150) # Température élevée
        elif anomaly_type == "high_vib":
            vibration = random.uniform(25, 40)   # Vibration élevée
        elif anomaly_type == "low_pressure":
            pressure = random.uniform(0.5, 1.5)  # Basse pression
        elif anomaly_type == "high_current":
            current = random.uniform(25, 35)    # Courant élevé

    return {
        "machine_id": machine_id,
        "temperature": round(temperature, 2),
        "vibration": round(vibration, 2),
        "pressure": round(pressure, 2),
        "current": round(current, 2),
        "operating_hours": round(random.uniform(100, 5000), 2),
        "timestamp": datetime.utcnow()
    }

def generate_alert_data(machine_id: str):
    """Génère des données d'alerte simulées pour une machine."""
    alert_types = ["anomaly_detection", "threshold_exceeded", "predictive_warning", "sensor_failure"]
    severities = ["Avertissement", "Critique", "Urgence"]
    
    alert_type = random.choice(alert_types)
    severity = random.choice(severities)
    
    message = f"Alerte {severity} : {alert_type} détectée sur la machine {machine_id}. Inspection requise."
    if alert_type == "threshold_exceeded":
        message = f"Alerte {severity} : Un seuil a été dépassé pour un paramètre clé sur la machine {machine_id}."
    elif alert_type == "predictive_warning":
        message = f"Alerte {severity} : Risque de défaillance prédit dans les prochaines 48h pour la machine {machine_id}."
    
    return {
        "machine_id": machine_id,
        "type": alert_type,
        "severity": severity,
        "message": message,
        "timestamp": datetime.utcnow() - timedelta(minutes=random.randint(1, 120)),
        "is_resolved": False
    }