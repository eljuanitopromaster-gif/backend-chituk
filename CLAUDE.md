# CLAUDE.md — Reglas del Proyecto Chituk (ChitukScripts)

Plataforma web en español para descubrir, publicar y administrar scripts de Roblox, juegos del catálogo y herramientas/ejecutores.

## 1. Stack Tecnológico y Despliegue
- **Framework:** Next.js (App Router), React, TypeScript y Tailwind CSS.
- **Backend / BaaS:** Supabase (PostgreSQL, Auth con Google OAuth/Email, Storage).
- **Hosting:** Vercel (despliegue automático a producción desde `main`).
- **Idioma e Identidad:** Toda la interfaz visible para el usuario debe estar **100% en español** y mantener la estética propia de Chituk (modo oscuro con acentos amarillos y sistema de 15 temas). No dejar textos en inglés ni copiar layouts literales de terceros.

## 2. Restricciones Críticas de Producción (Vercel)
- **Sistema de archivos de solo lectura (`EROFS`):** NUNCA usar `fs` o `path` de Node.js para leer o escribir archivos locales (como `data/tools.json` o `data/games.json`) en rutas API o en tiempo de ejecución. Toda persistencia debe ir a Supabase.
- **Redirecciones de Auth dinámicas:** Nunca hardcodear `http://localhost:3000` en flujos de autenticación. Usar `window.location.origin` (o la URL dinámica del request) para compatibilidad entre local y producción.
- **Protección de secretos:** Nunca exponer `SUPABASE_SERVICE_ROLE_KEY` en componentes cliente ni en variables con prefijo `NEXT_PUBLIC_`.

## 3. Esquema de Base de Datos (Supabase - esquema `public`)
Respetar los nombres exactos de tablas y tipos de datos existentes:

- **`public.projects` (CRÍTICO):** Aquí se guardan los **scripts** publicados. **NO existe la tabla `public.scripts`.**
  - Columna `game_id`: `UUID` nullable con FK hacia `public.games(id) ON DELETE SET NULL`. Validar formato UUID antes de insertar o actualizar.
  - Columna `authorId`: tipo `text` (puede contener UUID de Supabase o `username` en registros legacy).
- **`public.games`:** Catálogo de juegos (`id` UUID, `title`, `description`, `cover_image_url`, `image`, `place_id`, `is_active`, `created_at`, `updated_at`).
- **`public.tools`:** Ejecutores y herramientas (`id` UUID, `name`, `category`, `platforms` TEXT[], `status`, `access_type`, `price_tag`, `download_url`, `image_url`, `description`, `features` TEXT[], `views`, `rating`, `created_at`, `updated_at`).
- **`public.users`:** Perfiles y roles (`id`, `username`, `role`, `banned`).
  - **GOTCHA SQL:** `public.users.id` es tipo **`text`**, mientras `auth.uid()` devuelve **`uuid`**. En políticas RLS o queries SQL, hacer cast explícito en ambos lados: `u.id::text = auth.uid()::text`.
- **Tablas relacionales existentes:** `comments`, `comment_likes`, `notifications`, `user_badges`, `user_favorites`, `user_likes`.
- **Regla SQL RLS de Postgres:** Las políticas `FOR INSERT` solo admiten `WITH CHECK (...)`, nunca `USING (...)`.
- **Storage:** Bucket público `covers` para portadas de juegos y herramientas.

## 4. Roles, Permisos y Seguridad
- **Roles de Staff:** `admin`, `moderator`, `mod`, `owner`, `creator` (normalizar siempre con `.toLowerCase()`).
- **Cliente Admin en API Routes:** Toda mutación privilegiada debe leer y validar `Authorization: Bearer <token>`, verificar rol y estado `banned` en `public.users`, y ejecutar la operación con `supabaseAdmin` (`SUPABASE_SERVICE_ROLE_KEY`, `autoRefreshToken: false`, `persistSession: false`).
- **Helpers de servidor (`app/lib/server/auth.ts`):** toda ruta que identifique a un usuario usa `requireActiveUser`, `requireStaff` o `requireUserAdmin`. La identidad sale solo del Bearer token; `role`, `username` y `banned` solo de `public.users`. Prohibido confiar en `X-User-Id`, en IDs del body o en `user_metadata`.
- **Gestión de usuarios y roles (`/admin/users`, `/api/admin/users`):** solo `owner` y `admin` (`app/lib/userPermissions.ts`).
  - Roles asignables (lista blanca): `user`, `creator`, `mod`, `moderator`, `admin`, `owner`.
  - Jerarquía estricta: un `admin` nunca puede promover a `owner` ni modificar o banear a un `owner`.
  - Nadie puede cambiar su propio rol ni banearse a sí mismo.
- **Helper central de permisos:** Usar `scriptPermissions.ts` (`isStaffRole`, `canUserDeleteScript`) como única fuente de verdad en frontend y backend.
- **Eliminación de Scripts (Validación Dual):**
  - Permitida si el usuario es **staff** O es el **autor original** (`user.id === script.authorId` o compatibilidad legacy `user.username === script.authorId` / `script.author`).
  - Requerir siempre confirmación visual mediante `DeleteScriptModal.tsx`.
- **Eliminación de Cuenta (`/preferencias` — Zona de Peligro):**
  - Exigir **3 confirmaciones consecutivas** obligatorias antes de invocar la eliminación definitiva.

## 5. Mapa y Contratos de Endpoints (`/api`)
Todos los endpoints deben operar exclusivamente contra Supabase, validar parámetros/UUIDs antes de consultar y devolver códigos HTTP semánticos (`400`, `401`, `403`, `404`, `500`).

- **Scripts (`public.projects`):**
  - `GET / POST /api/scripts`: Listado y publicación de scripts (validar `game_id` como UUID si viene informado; bloquear usuarios con `banned = true`).
  - `DELETE /api/scripts/[id]`: Valida Bearer token, consulta `id` y `authorId` en `projects` (`404` si no existe), verifica `banned` y permiso dual (autor o staff; `403` si no aplica), limpia registros dependientes (`user_likes`, `user_favorites`, `comment_likes`, `comments`) y borra la fila en `projects` vía `supabaseAdmin`. Si hay imagen asociada en Storage, eliminarla también.
- **Herramientas / Ejecutores (`public.tools`):**
  - `GET / POST / PUT / DELETE /api/admin/tools` (y lectura pública de herramientas): CRUD completo en `public.tools`. Mutaciones restringidas a roles de staff. Las imágenes locales se suben al bucket `covers` y su URL pública (`getPublicUrl`) se guarda en `image_url`.
- **Juegos (`public.games`):**
  - `GET / POST / PUT / DELETE /api/admin/games` (y catálogo público): CRUD completo en `public.games`. Mutaciones restringidas a roles de staff. Subida de portadas al bucket `covers` guardando la URL pública en `cover_image_url` / `image`.
- **Dashboard y Cuenta:**
  - `GET /api/dashboard/stats`: Devuelve los `scripts` publicados por el usuario autenticado (incluyendo `authorId` e `id` en `chartData`) y los totales (`totals`) para gestión directa en `/dashboard`.
  - `POST /api/user/delete`: Valida Bearer token, purga datos relacionados (`comments`, `comment_likes`, `user_likes`, `user_favorites`, `projects`, `user_badges`, `public.users`) y elimina la cuenta con `supabase.auth.admin.deleteUser`.

## 6. Reglas Estrictas de UI/UX y Navegación Global
Al modificar navegación o layouts, editar siempre los componentes **globales** (`app/components/Sidebar.tsx`, `app/components/Navbar.tsx`) y no solo sub-layouts de `/admin`.

- **Sidebar Global (`app/components/Sidebar.tsx`):**
  - Contiene ÚNICAMENTE navegación principal (`Inicio`, `Scripts`, `Juegos`, `Favoritos`, `Publicar Script` para autenticados, `Herramientas`, `Comunidad`) y el footer minimalista (`Términos`, `Privacidad`, `Discord`, `© 2026 Chituk`).
  - **PROHIBIDO** incluir secciones de `ADMINISTRACIÓN`, `CUENTA`, tarjeta de perfil, `Dashboard`, `Mis Favoritos`, `Acceder`, `Registrarse`, `Cerrar Sesión` o el botón `Temas y Apariencia`.
- **Navbar Global (`app/components/Navbar.tsx`):**
  - **PROHIBIDO** incluir el botón de `Temas` junto a la campana de notificaciones.
  - **Usuario NO autenticado (`!user`):** Mostrar `Acceder` y `Registrarse` únicamente en la esquina superior derecha.
  - **Usuario autenticado (`user`, de CUALQUIER rol):** Mostrar el botón de **icono de engranaje** con menú desplegable (dropdown). No dejar botones sueltos de `Cerrar Sesión` fuera del menú.
  - **Contenido del Dropdown del Engranaje:**
    1. Encabezado con avatar, usuario, correo y badge de rol (si aplica).
    2. Sección `Administración` (solo para roles de staff): Cola de Scripts (`/admin/queue`), Usuarios y Roles (`/admin/users`, visible solo para `owner` y `admin`), Gestionar Herramientas (`/admin/herramientas`), Gestionar Juegos (`/admin/games`).
    3. Sección `Cuenta` (para TODOS los usuarios autenticados): Dashboard (`/dashboard`), Mis Favoritos (`/favoritos`), Preferencias (`/preferencias`).
    4. Divisor visual y acción `Cerrar Sesión` en rojo.
- **Selector de Temas:** Vive **exclusivamente** en `/preferencias` (pestaña `Tema y Apariencia`, 15 temas). No crear accesos duplicados ni modales redundantes en la navegación principal.
- **Subida de Imágenes en Admin (Juegos y Herramientas):**
  - Usar `<input type="file" accept="image/jpeg, image/png, image/webp" />` con previsualización en vivo y subida al bucket `covers` de Supabase Storage (no inputs de ruta local).
  - Mostrar texto guía recomendando formato horizontal `16:9` (~`800x450` px) y peso menor a `2MB`.

## 7. Flujo de Git, Ramas y Verificación Obligatoria
- **Ramas:**
  - `main`: Producción (despliega directo a Vercel). **No desarrollar ni hacer push directo de cambios sin probar a `main`.**
  - `develop`: Rama de integración para probar cambios antes de pasarlos a `main`.
  - Ramas de trabajo desde `develop` (o `main` si es hotfix urgente): usar prefijos `feat/<nombre>`, `fix/<nombre>` o `refactor/<nombre>`.
- **Commits (Conventional Commits):** Usar prefijos claros y descriptivos en español o inglés consistente, por ejemplo:
  - `feat(scripts): habilitar eliminacion de scripts para autor y staff`
  - `fix(admin): eliminar uso de fs en api de herramientas`
  - `refactor(ui): mover menu de cuenta al dropdown del engranaje`
- **Higiene de Git:**
  - Nunca subir archivos `.env`, `.env.local`, ni credenciales de Supabase.
  - Nunca usar `git push --force` en `main` ni en `develop`.
  - Mantener `migration.sql` actualizado y **idempotente** (`IF NOT EXISTS`, bloques `DO $$`) cuando se modifique el esquema o políticas RLS.
- **Verificación obligatoria antes de cada commit o PR (0 errores):**
  ```bash
  npx tsc --noEmit
  npm run lint
  npm run build
  ```