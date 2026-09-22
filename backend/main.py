import os
import io
import numpy as np
from PIL import Image
from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from supabase import create_client, Client
import face_recognition

# Cargar variables del archivo .env
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("Faltan las variables de entorno de Supabase (SUPABASE_URL, SUPABASE_KEY)")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

app = FastAPI(title="Face Recognition API", version="1.0.0")

# Middleware CORS activado
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def extraer_descriptor(image_bytes: bytes):
    """Procesa la foto capturada y extrae el vector de 128 dimensiones."""
    try:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        np_image = np.array(image)
        
        encodings = face_recognition.face_encodings(np_image)
        if len(encodings) == 0:
            return None
        return encodings[0].tolist()
    except Exception as err:
        print(f"[ERROR] Error al procesar imagen: {err}")
        return None

@app.get("/")
def home():
    return {"status": "ok", "message": "API de Reconocimiento Facial activa"}

@app.post("/api/reconocer-rostro")
async def reconocer_rostro(file: UploadFile = File(...)):
    """Autentica a un usuario comparando su rostro con la base de datos Supabase."""
    contents = await file.read()
    descriptor = extraer_descriptor(contents)
    
    if not descriptor:
        raise HTTPException(status_code=400, detail="No se detectó ningún rostro en la imagen.")
    
    try:
        # Llamada RPC a la función en Supabase con threshold 0.42
        response = supabase.rpc(
            "autenticar_por_rostro",
            {"embedding": descriptor, "threshold": 0.42}
        ).execute()
        
        resultados = response.data
        
        if resultados and len(resultados) > 0:
            usuario = resultados[0]
            
            # Intento opcional de registrar log de éxito
            try:
                supabase.table("logs_reconocimiento").insert({
                    "usuario_id": usuario["id"],
                    "exitoso": True,
                    "similitud": usuario["similarity"]
                }).execute()
            except Exception as log_error:
                print(f"[WARN] Error no crítico al guardar log exitoso: {log_error}")
            
            return {
                "exito": True,
                "usuario": usuario,
                "mensaje": f"Bienvenido {usuario['nombre']}"
            }
        else:
            # Intento opcional de registrar log fallido
            try:
                supabase.table("logs_reconocimiento").insert({
                    "usuario_id": None,
                    "exitoso": False,
                    "similitud": 0
                }).execute()
            except Exception as log_error:
                print(f"[WARN] Error no crítico al guardar log fallido: {log_error}")
            
            return {
                "exito": False,
                "mensaje": "Rostro no reconocido en el sistema"
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en el servidor/BD: {str(e)}")

@app.post("/api/registrar-rostro")
async def registrar_rostro(
    nombre: str = Form(...),
    email: str = Form(...),
    file: UploadFile = File(...)
):
    """Guarda un nuevo usuario con sus facciones extraídas."""
    contents = await file.read()
    descriptor = extraer_descriptor(contents)
    
    if not descriptor:
        raise HTTPException(status_code=400, detail="No se detectó un rostro claro en la imagen.")
    
    try:
        response = supabase.table("usuarios").insert({
            "nombre": nombre,
            "email": email,
            "face_descriptor": descriptor
        }).execute()
        
        return {"exito": True, "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al registrar: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)