# SuStock — Backend

API REST del sistema de gestión de inventario **SuStock**. Construida con NestJS y PostgreSQL, provee autenticación con sesión en cookie httpOnly, aislamiento multi-tenant por espacio de trabajo, permisos por rol y operaciones transaccionales de stock para productos, ventas, movimientos y clientes.

**Demo en vivo:** https://sustock.vercel.app — usuario `demo@sustock.com`, contraseña `demo1234`

> La API corre en el plan gratuito de Render, que se suspende tras 15 minutos sin uso: la primera carga puede tardar ~50 segundos.

Frontend: [ricartes123/sustock-frontend](https://github.com/ricartes123/sustock-frontend)

---

## Stack tecnológico

| Tecnología | Versión | Uso |
|---|---|---|
| Node.js | ≥ 22 | Runtime |
| NestJS | 11 | Framework HTTP |
| TypeScript | 5.7 | Lenguaje |
| Prisma | 7 | ORM + migraciones |
| PostgreSQL | 17 | Base de datos |
| `@prisma/adapter-pg` | 7 | Pool de conexiones vía `pg` |
| Passport + JWT | — | Autenticación (token en cookie httpOnly) |
| class-validator | 0.14 | Validación de DTOs |
| bcrypt | 6 | Hash de contraseñas |
| Jest | 30 | Tests |

---

## Arquitectura en producción

```
Navegador ──► Vercel (sustock.vercel.app)
                 ├─ /*      → SPA Angular
                 └─ /api/*  → rewrite ──► Render (esta API) ──► Neon (PostgreSQL)
```

El frontend llama siempre a `/api` en su propio dominio, por lo que el navegador ve todo como *same-origin*: la cookie de sesión funciona con `SameSite=Strict` y no hace falta CORS.

---

## Decisiones de diseño

- **Sesión en cookie httpOnly:** login y registro emiten la cookie `access_token` (`httpOnly`, `SameSite=Strict`, `Secure` en producción, 1 día de vida). El token nunca queda expuesto a JavaScript. `POST /auth/logout` la elimina.
- **Multi-tenancy por header:** cada request de un espacio de trabajo envía `x-workspace-id`. `WorkspaceGuard` lo exige, verifica que el usuario pertenezca al workspace y resuelve su rol.
- **Roles:** `OWNER`, `ADMIN` y `STAFF`. `RolesGuard` + `@Roles()` restringen rutas; la gestión del equipo es solo para OWNER/ADMIN, nadie puede ser invitado como OWNER y solo el OWNER gestiona ADMINs.
- **Stock transaccional:** toda mutación de stock corre en `prisma.$transaction()` con bloqueos `SELECT ... FOR UPDATE` filtrados por workspace y tomados en orden de id para evitar deadlocks. Anular una venta bloquea primero la venta, así el stock se repone una sola vez. Editar el stock de un producto registra un movimiento `ADJUSTMENT`.
- **Dinero con `Decimal`:** los montos se guardan como `Decimal(10,2)` y se operan con `Prisma.Decimal`, nunca con `number`.
- **Precios de venta:** `unitPrice` es opcional y funciona como descuento: entre 0 y el precio de lista.
- **Borrado lógico:** productos y clientes se archivan (`isActive: false`); los productos se restauran con `POST /products/:id/restore`.
- **Zonas horarias:** el dashboard recibe `?tz=<IANA>` y calcula "hoy" y "este mes" en esa zona.

---

## Prerequisitos

- **Node.js** ≥ 22 ([descargar](https://nodejs.org))
- **npm** ≥ 10
- **PostgreSQL** 17 (instalado localmente o en un contenedor)

---

## Variables de entorno

Crear un archivo `.env` en la raíz de `sustock-backend/` a partir de la plantilla:

```bash
cp .env.example .env
```

| Variable | Requerida | Descripción | Ejemplo |
|---|---|---|---|
| `DATABASE_URL` | ✅ | Cadena de conexión a PostgreSQL | `postgresql://postgres:change_me@localhost:5432/sustock_db` |
| `JWT_SECRET` | ✅ | Clave para firmar los JWT. En producción, mínimo 32 caracteres aleatorios | `change_me_to_a_long_random_secret` |
| `CORS_ORIGINS` | — | Orígenes con acceso cross-origin, separados por coma. El tráfico vía proxy/rewrite no necesita figurar | `http://localhost:4200` |
| `NODE_ENV` | — | `production` marca la cookie como `Secure` y bloquea el seed | `development` |
| `PORT` | — | Puerto de la API (por defecto `3000`) | `3000` |

> Nunca commitear el archivo `.env`: está incluido en `.gitignore`.

---

## Cómo correr localmente

### 1. Levantar PostgreSQL

Con una instalación local, crear la base indicada en `DATABASE_URL`. O bien con Docker:

```bash
docker run -d --name sustock-db -p 5432:5432 \
  -e POSTGRES_PASSWORD=change_me -e POSTGRES_DB=sustock_db postgres:17-alpine
```

### 2. Instalar dependencias y preparar la base

```bash
npm install
npx prisma migrate deploy   # aplica las migraciones
npx prisma generate         # genera el cliente de Prisma
npx prisma db seed          # opcional: datos de prueba
```

El seed crea los usuarios `demo@sustock.com` y `staff@sustock.com` (contraseña `password123`). No borra datos existentes salvo que se ejecute con `SEED_RESET=true`, y se niega a correr con `NODE_ENV=production`.

### 3. Iniciar el servidor

```bash
npm run start:dev
```

La API queda disponible en `http://localhost:3000`. `GET /health` verifica la conexión con la base.

---

## Estructura de carpetas

```
sustock-backend/
├── prisma/
│   ├── schema.prisma          # Modelos, relaciones, enums e índices
│   ├── migrations/            # Migraciones SQL versionadas
│   └── seed.ts                # Datos de prueba
├── prisma.config.ts           # Configuración de Prisma 7 (schema, seed)
├── src/
│   ├── main.ts                # Bootstrap: CORS, ValidationPipe, puerto
│   ├── app.module.ts          # Módulo raíz
│   ├── app.routes.ts          # Constantes de rutas centralizadas (APP_ROUTES)
│   ├── app.controller.ts      # GET /health
│   ├── prisma/                # PrismaService global con pool pg
│   ├── auth/                  # Registro, login, logout, /me, cookie de sesión, estrategia JWT
│   ├── workspace-context/     # WorkspaceGuard, RolesGuard y decoradores
│   ├── workspace/             # Espacios de trabajo y cambio de moneda
│   ├── team/                  # Invitación y eliminación de miembros
│   ├── products/              # Catálogo: CRUD, filtros, stock bajo, importación Excel/CSV
│   ├── movements/             # Movimientos de stock (IN / OUT / ADJUSTMENT)
│   ├── sales/                 # Ventas y anulaciones
│   ├── clients/               # Gestión de clientes
│   └── dashboard/             # Métricas del espacio de trabajo
└── .env.example               # Plantilla de variables
```

---

## Endpoints principales

Todos los endpoints, salvo `/auth/*` y `/health`, requieren:
- La cookie de sesión `access_token` (la emiten `POST /auth/login` y `POST /auth/register`)
- El header `x-workspace-id: <id del workspace>`

| Módulo | Prefijo | Descripción |
|---|---|---|
| Salud | `/health` | Estado de la API y de la base |
| Auth | `/auth` | Registro, login, logout, perfil (`/me`) |
| Workspace | `/workspaces` | Listado y cambio de moneda |
| Equipo | `/team` | Invitar y eliminar miembros (OWNER/ADMIN) |
| Productos | `/products` | CRUD, paginación, filtros, importación, restauración |
| Movimientos | `/movements` | Crear y listar movimientos |
| Ventas | `/sales` | Crear, listar y anular ventas; compras por cliente |
| Clientes | `/clients` | CRUD con archivado y restauración |
| Dashboard | `/dashboard` | Resumen y métricas (`?tz=` opcional) |

Las respuestas paginadas tienen la forma `{ data: T[], meta: { total, page, limit, totalPages } }`.

---

## Tests

Tests unitarios con Jest junto al código (`*.spec.ts`), con Prisma mockeado. Cubren autenticación por cookie, guards de workspace y roles, gestión del equipo, ventas (precios, duplicados, anulación) y productos (unicidad de SKU, importación).

```bash
npm run test
npm run test:cov
```

---

## Despliegue

La API se despliega en **Render** y la base de datos está en **Neon**. Variables necesarias en Render: `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=production`. Ruta de health check: `/health`. Las migraciones se aplican con `npx prisma migrate deploy` en cada deploy.

Los cambios que afectan el contrato de sesión (cookie, headers) deben desplegarse junto con el frontend.

---

## Scripts disponibles

| Script | Descripción |
|---|---|
| `npm run start:dev` | Inicia con hot-reload (desarrollo) |
| `npm run start` | Inicia el servidor sin watch |
| `npm run start:debug` | Inicia en modo debug con watch |
| `npm run build` | Compila TypeScript a `dist/` |
| `npm run start:prod` | Corre el build compilado |
| `npm run lint` | Corre ESLint con autofix |
| `npm run format` | Formatea con Prettier |
| `npm run test` | Ejecuta los tests unitarios |
| `npm run test:watch` | Tests en modo watch |
| `npm run test:cov` | Tests con reporte de cobertura |
| `npm run prisma:migrate` | Crea y aplica una migración en desarrollo |
| `npm run prisma:studio` | Abre Prisma Studio |
| `npx prisma db seed` | Carga datos de prueba |
