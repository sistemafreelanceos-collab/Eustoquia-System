-- Corregir discrepancias de esquema para Fase 1B
-- Ejecutar este script en el SQL Editor de Supabase

-- 1. Asegurar que los nodos puedan pertenecer a un grupo
ALTER TABLE nodes 
ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES groups(id) ON DELETE SET NULL;

-- 2. Asegurar que las conexiones guarden tipos y estilos
ALTER TABLE connections 
ADD COLUMN IF NOT EXISTS from_type text,
ADD COLUMN IF NOT EXISTS to_type text,
ADD COLUMN IF NOT EXISTS style jsonb;

-- 3. Habilitar RLS para las nuevas columnas (si es necesario)
-- (Normalmente no se requiere si ya existe una política SELECT/INSERT/UPDATE para la tabla)
