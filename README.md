# RememberMap

Collaborative interactive mapping application for dropping pins, drawing configurable radii, selecting administrative boundaries, and associating rich media (photos & notes).

## Technology Stack

- **Backend:** Java 25 (LTS), Spring Boot 3.4+, Spring Data JPA, Hibernate Spatial, PostgreSQL / PostGIS, Spring Security, MinIO Java SDK.
- **Frontend:** React 19, TypeScript, Vite, Vitest, Tailwind CSS, Leaflet.
- **Orchestration:** Docker & Docker Compose.

---

## Quickstart (Local Development with Docker Compose)

To launch the full containerized environment (`postgres`, `minio`, `backend`, `frontend`, and automated bucket creation helper):

```bash
docker compose up --build
```

### Services & Endpoints

| Service | Local URL / Endpoint | Port | Description |
|:---|:---|:---|:---|
| **Frontend UI** | `http://localhost:3000` | `3000` | React + TypeScript SPA |
| **Backend REST API** | `http://localhost:8080/api/health` | `8080` | Java 25 Spring Boot API |
| **MinIO Console** | `http://localhost:9001` | `9001` | Object Storage UI (`remembermap_access` / `remembermap_secret`) |
| **MinIO API** | `http://localhost:9000` | `9000` | S3-compatible Storage API |
| **PostgreSQL + PostGIS** | `localhost:5432` | `5432` | Spatial DB (`remembermap` / `remembermap` / `remembermap`) |

---

## Running Local Tests

### Backend (Java 25 Spring Boot)

```bash
cd backend
.\mvnw.cmd test    # Windows
./mvnw test        # Linux / macOS
```

### Frontend (React + Vitest)

```bash
cd frontend
npm install        # First time setup
npm test           # Run Vitest suite
```
