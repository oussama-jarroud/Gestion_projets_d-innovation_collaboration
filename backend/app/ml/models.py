import pandas as pd
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sklearn.ensemble import IsolationForest
import joblib
import os
from datetime import datetime, timedelta
import uuid
import logging

# Configuration du logger
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Configuration de la base de données (réutiliser la conf de database.py)
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/predictive_maintenance_db")
engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Chemin où sauvegarder/charger le modèle
MODEL_PATH = "app/ml/isolation_forest_model.joblib"
# Caractéristiques (features) que le modèle va utiliser
FEATURES = ['temperature', 'vibration', 'pressure', 'current']

def fetch_data_for_training(machine_id: uuid.UUID, duration_days: int = 7) -> pd.DataFrame:
    """
    Récupère les données historiques d'une machine pour l'entraînement.
    """
    logger.info(f"Fetching data for machine {machine_id} for the last {duration_days} days...")
    end_time = datetime.utcnow()
    start_time = end_time - timedelta(days=duration_days)

    query = f"""
    SELECT timestamp, temperature, vibration, pressure, "current", operating_hours
    FROM sensor_data
    WHERE machine_id = '{machine_id}'
      AND timestamp >= '{start_time.isoformat()}'
      AND timestamp <= '{end_time.isoformat()}'
    ORDER BY timestamp ASC;
    """
    try:
        df = pd.read_sql(text(query), engine)
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        logger.info(f"Fetched {len(df)} data points.")
        return df
    except Exception as e:
        logger.error(f"Error fetching data: {e}")
        return pd.DataFrame()

def train_isolation_forest(df: pd.DataFrame, contamination: float = 0.01):
    """
    Entraîne un modèle Isolation Forest.
    contamination: la proportion estimée d'anomalies dans les données (important pour la détection).
    """
    if df.empty or len(df) < 40: # Minimum de données pour un entraînement significatif
        logger.warning("Not enough data to train Isolation Forest. Returning None.")
        return None

    X = df[FEATURES]
    model = IsolationForest(contamination=0.05, random_state=42)
    model.fit(X)
    logger.info("Isolation Forest model trained successfully.")
    return model

def save_model(model, path=MODEL_PATH):
    """Sauvegarde le modèle entraîné."""
    joblib.dump(model, path)
    logger.info(f"Model saved to {path}")

def load_model(path=MODEL_PATH):
    """Charge un modèle entraîné."""
    if not os.path.exists(path):
        logger.warning(f"Model file not found at {path}. Model needs to be trained first.")
        return None
    model = joblib.load(path)
    logger.info(f"Model loaded from {path}")
    return model

# Variable globale pour stocker le modèle chargé en mémoire
# En production, on utiliserait une solution plus robuste pour la gestion des modèles (MLflow, etc.)
# Mais pour ce prototype, c'est suffisant.
_loaded_model = None

def get_anomaly_detector_model():
    """Récupère le modèle, le charge s'il n'est pas déjà en mémoire."""
    global _loaded_model
    if _loaded_model is None:
        _loaded_model = load_model()
    return _loaded_model

def predict_anomaly(data_point: pd.DataFrame):
    """
    Prédit les anomalies pour un point de données donné.
    Retourne -1 pour une anomalie, 1 pour normal.
    """
    model = get_anomaly_detector_model()
    if model is None:
        logger.warning("No model loaded for prediction. Cannot predict anomaly.")
        return None

    if data_point.empty:
        return None

    # Assurez-vous que le point de données a les mêmes features que celles utilisées pour l'entraînement
    X_predict = data_point[FEATURES]
    prediction = model.predict(X_predict)
    return prediction[0] # Renvoie la prédiction pour le premier (et unique) point


if __name__ == "__main__":
    # Ceci est un exemple d'utilisation pour entraîner et tester le modèle localement
    # Remplacez par un UUID de machine réel que vous avez dans votre DB
    test_machine_id = "250d3447-a6ee-4451-85b3-8a9ce46c906e" # !!! METTEZ UN UUID RÉEL ICI !!!

    if test_machine_id == "VOTRE_UUID_MACHINE_1":
        logger.error("Please replace 'VOTRE_UUID_MACHINE_1' with an actual machine UUID from your database.")
        sys.exit(1)

    logger.info(f"--- Starting ML Model Training for machine {test_machine_id} ---")

    # 1. Récupérer des données pour l'entraînement (par exemple, les 3 derniers jours)
    training_data = fetch_data_for_training(uuid.UUID(test_machine_id), duration_days=3)

    if not training_data.empty:
        # 2. Entraîner le modèle
        trained_model = train_isolation_forest(training_data)

        if trained_model:
            # 3. Sauvegarder le modèle
            save_model(trained_model)

            # 4. Charger et tester le modèle (simule un redémarrage de l'app)
            _loaded_model = None # Réinitialise le modèle global pour forcer le rechargement
            loaded_model = get_anomaly_detector_model()

            if loaded_model:
                logger.info("Model loaded successfully for testing.")
                # Créer un point de données normal pour test
                normal_data_point = pd.DataFrame([[70, 10, 5, 25]], columns=FEATURES)
                prediction_normal = predict_anomaly(normal_data_point)
                logger.info(f"Prediction for normal data (temperature=70, vibration=10...): {prediction_normal} (1=Normal, -1=Anomaly)")

                # Créer un point de données anormal pour test (ex: surchauffe et vibrations excessives)
                anomaly_data_point = pd.DataFrame([[150, 50, 5, 25]], columns=FEATURES)
                prediction_anomaly = predict_anomaly(anomaly_data_point)
                logger.info(f"Prediction for ANOMALOUS data (temperature=150, vibration=50...): {prediction_anomaly} (1=Normal, -1=Anomaly)")
            else:
                logger.error("Failed to load model after training.")
        else:
            logger.error("Failed to train model.")
    else:
        logger.error(f"No sufficient training data found for machine {test_machine_id}.")