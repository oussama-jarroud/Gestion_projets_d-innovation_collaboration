# Utilise une image Python légère comme base
FROM python:3.10-slim-buster

# Définit le répertoire de travail dans le conteneur
WORKDIR /app

# Copie le fichier de dépendances en premier pour profiter de la mise en cache de Docker
COPY requirements.txt .

# Installe les dépendances Python
RUN pip install --no-cache-dir -r requirements.txt

# Copie le reste du code de l'application
COPY . .

# Commande par défaut pour exécuter l'application (peut être surchargée par docker-compose)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]