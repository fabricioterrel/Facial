FROM python:3.9-slim

# Dependencias mínimas de OpenCV y compilador pre-requerido
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Descargar e instalar la rueda precompilada (wheel) de dlib para Linux sin usar RAM
RUN pip install --no-cache-dir https://github.com/dlib-models/dlib-wheels/releases/download/v19.22/dlib-19.22.99-cp39-cp39-linux_x86_64.whl

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]