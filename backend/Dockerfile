FROM python:3.10-slim

# Instalar librerías nativas del sistema que necesita OpenCV
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    libopenblas-dev \
    liblapack-dev \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .

# Forzar la instalación de dlib-bin precompilado PRIMERO y evitar que pip compile código fuente
RUN pip install --no-cache-dir dlib-bin
RUN pip install --no-cache-dir --only-binary=:all: -r requirements.txt || pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]