-- 1. Habilitar extensión vectorial para 128 dimensiones
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Tabla de usuarios registrados
CREATE TABLE IF NOT EXISTS public.usuarios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    face_descriptor VECTOR(128) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabla de registros de auditoría / logs
CREATE TABLE IF NOT EXISTS public.logs_reconocimiento (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    usuario_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
    exitoso BOOLEAN NOT NULL,
    similitud DOUBLE PRECISION NOT NULL,
    fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Habilitar Row Level Security (RLS) por seguridad
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs_reconocimiento ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura/escritura públicas para las peticiones desde Backend (Service Role/Anon)
CREATE POLICY "Permitir acceso lectura/escritura a usuarios" 
ON public.usuarios FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Permitir acceso lectura/escritura a logs" 
ON public.logs_reconocimiento FOR ALL USING (true) WITH CHECK (true);

-- 5. Función RPC de búsqueda por distancia L2 (Euclidiana) convertida a Similitud
CREATE OR REPLACE FUNCTION autenticar_por_rostro(
    embedding VECTOR(128),
    threshold FLOAT DEFAULT 0.42
)
RETURNS TABLE (
    id UUID,
    nombre TEXT,
    email TEXT,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        u.id,
        u.nombre,
        u.email,
        (1 - (u.face_descriptor <-> embedding))::FLOAT AS similarity
    FROM public.usuarios u
    WHERE (u.face_descriptor <-> embedding) < threshold
    ORDER BY u.face_descriptor <-> embedding ASC
    LIMIT 1;
END;
$$;