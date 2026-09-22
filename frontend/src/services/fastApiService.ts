import type { RespuestaAuthApi } from '../types';

const FASTAPI_URL = 'http://localhost:8000/api';

/**
 * Extrae el fotograma actual del HTMLVideoElement y lo convierte en Blob PNG
 */
export const capturarImagenDesdeVideo = (video: HTMLVideoElement): Promise<Blob | null> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      resolve(null);
      return;
    }
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      resolve(blob);
    }, 'image/png');
  });
};

/**
 * Envía la foto capturada a la API de FastAPI
 */
export const autenticarConFastAPI = async (imagenBlob: Blob): Promise<RespuestaAuthApi> => {
  const formData = new FormData();
  formData.append('file', imagenBlob, 'captura.png');

  const response = await fetch(`${FASTAPI_URL}/reconocer-rostro`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Error al conectar con la API de autenticación');
  }

  return await response.json();
};

/**
 * Envia el registro de un nuevo usuario a FastAPI
 */
export const registrarRostroConFastAPI = async (nombre: string, email: string, imagenBlob: Blob) => {
  const formData = new FormData();
  formData.append('nombre', nombre);
  formData.append('email', email);
  formData.append('file', imagenBlob, 'registro.png');

  const response = await fetch(`${FASTAPI_URL}/registrar-rostro`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Error al registrar rostro');
  }

  return await response.json();
};