-- Insertar datos iniciales (Seed) para el Workspace "Eustoquia System"

DO $$
DECLARE
  v_project_id uuid := '11111111-1111-1111-1111-111111111111';
  v_board_id uuid := '22222222-2222-2222-2222-222222222222';
  v_group_id uuid := '33333333-3333-3333-3333-333333333333';
  v_chat_id uuid := '55555555-5555-5555-5555-555555555555';
BEGIN
  -- Insertar Proyecto de prueba
  INSERT INTO public.projects (id, name, client_handle, color)
  VALUES (v_project_id, 'Producción Semanal', '@vendecomopro', '#E8621A')
  ON CONFLICT (id) DO NOTHING;

  -- Insertar Tablero
  INSERT INTO public.boards (id, project_id, name)
  VALUES (v_board_id, v_project_id, 'Clips Alejandro')
  ON CONFLICT (id) DO NOTHING;

  -- Insertar Grupo Principal
  INSERT INTO public.groups (id, board_id, title, x, y, w, h, color)
  VALUES (v_group_id, v_board_id, '📺 Lives Alejandro — Clips', 60, 60, 520, 380, '#E8621A')
  ON CONFLICT (id) DO NOTHING;

  -- Insertar Nodos Base
  INSERT INTO public.nodes (id, board_id, group_id, type, title, metadata, position_x, position_y)
  VALUES
    ('44444444-4444-4444-4444-444444444441', v_board_id, v_group_id, 'basic', 'Live: Habilidad Mejor Pagada 2026', '{"type": "youtube", "meta": "1:23:45 • Transcrito ✅ • 10 clips"}', 20, 60),
    ('44444444-4444-4444-4444-444444444442', v_board_id, v_group_id, 'basic', 'Hooks extraídos', '{"type": "note", "meta": "\"El 90% de vendedores cometen este error…\""}', 20, 150),
    ('44444444-4444-4444-4444-444444444443', v_board_id, v_group_id, 'basic', 'Thumbnail referencia', '{"type": "image", "meta": "1280x720 • Estilo naranja/negro"}', 20, 240)
  ON CONFLICT (id) DO NOTHING;

  -- Insertar Nodo Chat IA (sin group_id o con metadatos específicos)
  INSERT INTO public.nodes (id, board_id, group_id, type, title, metadata, position_x, position_y)
  VALUES
    (v_chat_id, v_board_id, NULL, 'chat', 'Chat IA', '{"model": "Claude Sonnet 4.6", "messages": [{"role": "assistant", "text": "Hola Omar. Tengo acceso a los clips del live de Alejandro y su brand kit. ¿Qué necesitas?"}, {"role": "user", "text": "Dame 5 captions para los clips, estilo @vendecomopro"}], "connectedGroups": ["📺 Lives Alejandro — Clips"], "width": 420, "height": 380}', 640, 60)
  ON CONFLICT (id) DO NOTHING;

  -- Conexión de prueba (Edge)
  INSERT INTO public.connections (board_id, from_id, from_type, to_id, to_type)
  VALUES (v_board_id, v_group_id, 'customGroup', v_chat_id, 'chat')
  ON CONFLICT (id) DO NOTHING;

END $$;
