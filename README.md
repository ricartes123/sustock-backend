# SuStock — Backend

API REST del sistema de gestión de inventario **SuStock**. Construida con NestJS y PostgreSQL, provee autenticación JWT, aislamiento multi-tenant por espacio de trabajo, y endpoints transaccionales para productos, ventas, movimientos de stock y clientes.

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
| Passport + JWT | — | Autenticación |
| class-validator | 0.14 | Validación de DTOs |
| bcrypt | 6 | Hash de contraseñas |
| Jest | 30 | Tests |

---

## Prerequisitos

- **Node.js** ≥ 22 ([descargar](https://nodejs.org))
- **npm** ≥ 10
- **PostgreSQL** 17 corriendo localmente, o **Docker** + **Docker Compose**

---

## Variables de entorno

Crear un archivo `.env` en la raíz de `sustock-backend/` copiando `.env.example`:

```bash
cp ../.env.example .env
```

| Variable | Requerida | Descripción | Ejemplo |
|---|---|---|---|
| `DATABASE_URL` | ✅ | Cadena de conexión a PostgreSQL | `postgresql://postgres:root@localhost:5432/sustock_db` |
| `JWT_SECRET` | ✅ | Clave secreta para firmar tokens JWT. Usar mínimo 32 caracteres aleatorios en producción | `mi_clave_super_secreta_32chars` |
| `FRONTEND_URL` | ✅ | Origen permitido por CORS (URL del frontend) | `http://localhost:4200` |
| `PORT` | — | Puerto en el que escucha la API (por defecto `3000`) | `3000` |

> **Importante:** nunca commitear el archivo `.env`. Está incluido en `.gitignore`.
> En Docker, el host debe ser `postgres` (nombre del servicio): 
> `postgresql://postgres:root@postgres:5432/sustock_db`

---

## Cómo correr localmente (sin Docker)

### 1. Instalar dependencias

```bash
cd sustock-backend
npm install
```

### 2. Configurar la base de datos

Asegurarse de tener PostgreSQL corriendo y crear la base de datos indicada en `DATABASE_URL`.

Ejecutar las migraciones:

```bash
npx prisma migrate deploy
```

Generar el cliente de Prisma (necesario tras cada cambio de esquema):

```bash
npx prisma generate
```

Opcionalmente, cargar datos de prueba:

```bash
npm run db:seed
```

### 3. Iniciar el servidor

```bash
# Modo desarrollo con hot-reload
npm run start:dev

# Modo desarrollo sin watch
npm run start

# Modo producción
npm run start:prod
```

La API queda disponible en `http://localhost:3000`.

---

## Cómo correr con Docker

La forma más sencilla de levantar el proyecto completo (base de datos + backend + frontend) es desde la raíz del monorepo:

```bash
cd ..                         # ir a la raíz SuStock/
cp .env.example .env          # configurar variables (editar JWT_SECRET como mínimo)
docker compose up --build
```

Docker Compose levanta tres servicios:

| Servicio | Imagen | Puerto expuesto |
|---|---|---|
| `postgres` | `postgres:17-alpine` | interno |
| `backend` | build local | interno (`:3000`) |
| `frontend` | build local + nginx | `${FRONTEND_PORT:-80}` |

El entrypoint del backend ejecuta automáticamente `prisma migrate deploy` antes de arrancar la API, garantizando que el esquema esté siempre actualizado.

Para levantar solo la base de datos y el backend:

```bash
docker compose up postgres backend
```

Para reconstruir las imágenes tras cambios en el código:

```bash
docker compose up --build backend
```

---

## Estructura de carpetas

```
sustock-backend/
├── prisma/
│   ├── schema.prisma          # Modelos, relaciones y enums
│   ├── migrations/            # Migraciones SQL versionadas
│   └── seed.ts                # Script para poblar la base de datos
├── src/
│   ├── main.ts                # Bootstrap: CORS, ValidationPipe, puerto
│   ├── app.module.ts          # Módulo raíz
│   ├── app.routes.ts          # Constantes de rutas centralizadas
│   ├── prisma/
│   │   └── prisma.service.ts  # Singleton de PrismaClient con pool pg
│   ├── auth/                  # Registro, login, estrategia JWT, guards
│   ├── workspace/             # CRUD de espacios de trabajo y cambio de moneda
│   ├── workspace-context/     # WorkspaceGuard + @CurrentWorkspace()
│   ├── team/                  # Invitación y eliminación de miembros
│   ├── products/              # Catálogo: CRUD, paginación, búsqueda, stock bajo
│   ├── movements/             # Movimientos de stock (IN / OUT / ADJUSTMENT)
│   ├── sales/                 # Ventas con anulación y auditoría
│   ├── clients/               # Gestión de clientes
│   └── dashboard/             # Métricas del espacio de trabajo
├── Dockerfile                 # Build multi-stage (build → runtime)
├── .env                       # Variables de entorno locales (no commitear)
└── .env.example               # Plantilla de variables requeridas
```

---

## Endpoints principales

Todos los endpoints (excepto `/auth/*`) requieren:
- Header `Authorization: Bearer <token>`
- Header `x-workspace-id: <id_del_workspace>`

| Módulo | Prefijo | Descripción |
|---|---|---|
| Auth | `/auth` | Registro, login, perfil |
| Workspace | `/workspaces` | CRUD y cambio de moneda |
| Equipo | `/team` | Invitar y eliminar miembros |
| Productos | `/products` | CRUD, paginación, filtros |
| Movimientos | `/movements` | Crear y listar movimientos |
| Ventas | `/sales` | Crear, listar, anular ventas |
| Clientes | `/clients` | CRUD y restauración |
| Dashboard | `/dashboard` | Resumen y métricas |

---

## Migraciones

```bash
# Aplicar migraciones pendientes (producción / CI)
npx prisma migrate deploy

# Crear una nueva migración en desarrollo
npx prisma migrate dev --name nombre_descriptivo

# Abrir Prisma Studio (UI para la base de datos)
npx prisma studio
```

---

## Scripts disponibles

| Script | Descripción |
|---|---|
| `npm run start` | Inicia el servidor (sin watch) |
| `npm run start:dev` | Inicia con hot-reload (desarrollo) |
| `npm run start:debug` | Inicia en modo debug con watch |
| `npm run start:prod` | Corre el build compilado |
| `npm run build` | Compila TypeScript a `dist/` |
| `npm run lint` | Corre ESLint con autofix |
| `npm run format` | Formatea con Prettier |
| `npm run test` | Ejecuta tests unitarios con Jest |
| `npm run test:watch` | Tests en modo watch |
| `npm run test:cov` | Tests con reporte de cobertura |
| `npm run test:e2e` | Tests end-to-end |
| `npx prisma db seed` | Pobla la base de datos con datos de prueba |
