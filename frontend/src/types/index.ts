// Define la estructura exacta que tiene la tabla 'usuarios' en Supabase
export interface AuthUser {
  id: string;
  email: string;
}

export interface Usuario {
  id: string;              // UUID retornado por Supabase
  nombre: string;          // Nombre completo del usuario
  email: string;           // Correo electrónico
  face_descriptor?: number[]; // Array de 128 números decimales (el vector facial)
  created_at?: string;     // Fecha de creación (opcional)
}

// Interfaz para la respuesta que retorna la función RPC 'buscar_usuario_por_rostro'
export interface UsuarioReconocido {
  id: string;
  nombre: string;
  email: string;
  similarity: number;      // Porcentaje o valor de similitud retornado por pgvector
}

// Estructura para los datos del formulario de registro
export interface RegistroForm {
  nombre: string;
  email: string;
}

export interface LogReconocimiento {
  id: string;
  usuario_id: string | null;
  exitoso: boolean;
  similitud: number;
  created_at: string;
  usuarios?: {
    nombre: string;
    email: string;
  };
}

export interface StatsDashboard {
  totalUsuarios: number;
  totalEscaneos: number;
  escaneosExitosos: number;
  tasaEfectividad: number;
}

export interface RespuestaAuthApi {
  exito: boolean;
  usuario?: UsuarioReconocido;
  mensaje: string;
}

export interface UsuarioFacial {
  id: string;
  nombre: string;
  email: string;
  similarity?: number;
}

export interface RespuestaAuthApi {
  exito: boolean;
  mensaje: string;
  usuarios?: UsuarioFacial;
  similitud?: number;
}