import requests
import time
import random
from datetime import datetime
import os

# Configuration de l'API
API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000") # Base URL de votre API FastAPI
INGESTION_ENDPOINT = f"{API_BASE_URL}/sensor-data/"
BATCH_INGESTION_ENDPOINT = f"{API_BASE_URL}/sensor-data/batch/"

# Intervalle d'envoi des données (en secondes)
SEND_INTERVAL_SECONDS = 5
BATCH_SIZE = 5 # Nombre de points de données à envoyer par lot

# Données de machines simulées (remplacez par les UUIDs réels de vos machines créées via l'API)
# Si vous n'avez pas encore créé de machines, lancez le simulateur après en avoir créé au moins une
# via l'interface Swagger de FastAPI (http://localhost:8000/docs).
SIMULATED_MACHINES = [
    {"id": "506ec75f-2df5-4ac2-b43d-8c3c366d993d", "name": "Broyeur Alpha", "current_temp": 70.0, "current_vibration": 10.0, "current_pressure": 5.0, "current_current": 25.0, "operating_hours": 0.0},
    {"id": "250d3447-a6ee-4451-85b3-8a9ce46c906e", "name": "Broyeur Alpha V4", "current_temp": 60.0, "current_vibration": 8.0, "current_pressure": 6.0, "current_current": 20.0, "operating_hours": 0.0},
    # Ajoutez d'autres machines si vous le souhaitez
]

# Fonction pour générer une valeur de capteur avec de petites variations et des pics occasionnels
def generate_sensor_value(base_value, anomaly_chance=0.05, anomaly_magnitude=0.2, normal_variation=0.02):
    if random.random() < anomaly_chance:
        # Génère une anomalie : variation plus importante
        return base_value * (1 + random.uniform(-anomaly_magnitude, anomaly_magnitude))
    else:
        # Variation normale
        return base_value * (1 + random.uniform(-normal_variation, normal_variation))

def generate_sensor_data_for_machine(machine_info):
    # Simuler des variations pour les capteurs
    machine_info["current_temp"] = generate_sensor_value(machine_info["current_temp"], anomaly_chance=0.02, anomaly_magnitude=0.1)
    machine_info["current_vibration"] = generate_sensor_value(machine_info["current_vibration"], anomaly_chance=0.03, anomaly_magnitude=0.2)
    machine_info["current_pressure"] = generate_sensor_value(machine_info["current_pressure"], anomaly_chance=0.01, anomaly_magnitude=0.05)
    machine_info["current_current"] = generate_sensor_value(machine_info["current_current"], anomaly_chance=0.02, anomaly_magnitude=0.15)
    machine_info["operating_hours"] += (SEND_INTERVAL_SECONDS / 3600.0) # Ajouter le temps passé en heures

    # Optionnel : Introduire des pics d'anomalies plus marqués
    if random.random() < 0.005: # 0.5% de chance d'un pic majeur
        print(f"!!! MAJOR ANOMALY DETECTED FOR MACHINE {machine_info['name']} !!!")
        machine_info["current_temp"] *= 1.5
        machine_info["current_vibration"] *= 2.0

    return {
        "machine_id": machine_info["id"],
        "timestamp": datetime.utcnow().isoformat() + "Z", # Format ISO 8601 avec Z pour UTC
        "temperature": round(machine_info["current_temp"], 2),
        "vibration": round(machine_info["current_vibration"], 2),
        "pressure": round(machine_info["current_pressure"], 2),
        "current": round(machine_info["current_current"], 2),
        "operating_hours": round(machine_info["operating_hours"], 2),
        "labels": [] # Les labels seront ajoutés par le modèle ML plus tard
    }

def send_data_to_api(data, is_batch=False):
    if is_batch:
        url = BATCH_INGESTION_ENDPOINT
    else:
        url = INGESTION_ENDPOINT

    try:
        response = requests.post(url, json=data)
        response.raise_for_status() # Lève une exception pour les codes d'erreur HTTP (4xx ou 5xx)
        if is_batch:
            print(f"[{datetime.now().strftime('%H:%M:%S')}] Sent {len(data)} sensor data points in batch to {url}. Status: {response.status_code}")
        else:
            print(f"[{datetime.now().strftime('%H:%M:%S')}] Sent 1 sensor data point to {url}. Status: {response.status_code}")
        # print(f"Response: {response.json()}") # Décommenter pour voir la réponse de l'API
    except requests.exceptions.HTTPError as e:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] HTTP Error: {e.response.status_code} - {e.response.text}")
    except requests.exceptions.ConnectionError as e:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Connection Error: Could not connect to API at {API_BASE_URL}. Is the backend running?")
    except Exception as e:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] An unexpected error occurred: {e}")

def main():
    print(f"Starting sensor data simulation. Sending data every {SEND_INTERVAL_SECONDS} seconds.")
    print(f"API Base URL: {API_BASE_URL}")
    print(f"Simulating {len(SIMULATED_MACHINES)} machines.")

    if not all(m["id"].strip() != "VOTRE_UUID_MACHINE_X" for m in SIMULATED_MACHINES):
        print("\nWARNING: Please update SIMULATED_MACHINES with actual UUIDs from your FastAPI /machines/ endpoint.")
        print("         You can create machines via http://localhost:8000/docs and then copy their IDs.")
        # return # Décommenter pour forcer l'utilisateur à mettre à jour les UUIDs

    batch_data = []

    while True:
        for machine in SIMULATED_MACHINES:
            data = generate_sensor_data_for_machine(machine)
            batch_data.append(data)

            if len(batch_data) >= BATCH_SIZE * len(SIMULATED_MACHINES): # Envoyer un lot complet pour toutes les machines
                send_data_to_api(batch_data, is_batch=True)
                batch_data = [] # Réinitialiser le lot

        time.sleep(SEND_INTERVAL_SECONDS)

if __name__ == "__main__":
    main()