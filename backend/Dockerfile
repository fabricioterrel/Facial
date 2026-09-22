FROM python:3.10-slim

# Instalar dependencias esenciales del sistema
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    libopenblas-dev \
    liblapack-dev \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 1. Instalar dlib-bin PRIMERO para evitar que face-recognition intente compilar dlib
RUN pip install --no-cache-dir dlib-bin

# 2. Copiar e instalar el resto de paquetes sin compilar dlib
COPY requirements.txt .
RUN pip install --no-cache-dir --no-build-isolation -r requirements.txt

# 3. Copiar el proyecto
COPY . .

# Comando de inicio
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]