from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # O coloca la URL exacta de tu Vercel
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)