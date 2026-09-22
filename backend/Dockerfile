FROM animeweb/dlib-opencv-python:3.10

WORKDIR /app

# Copiar requerimientos e instalar sin dlib
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el backend
COPY . .

# Comando de arranque
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]