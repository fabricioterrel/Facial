FROM python:3.10-slim

# Dependencias necesarias para OpenCV y C++
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiar requerimientos
COPY requirements.txt .

# Instalar dlib-bin e ignorar la compilación desde fuentes
RUN pip install --no-cache-dir dlib-bin
RUN pip install --no-cache-dir --no-deps face-recognition
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]