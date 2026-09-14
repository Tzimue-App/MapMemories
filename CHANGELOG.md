# Changelog

## [Unreleased]

_Description: Écrire le résumé ici..._

<!--
BUMP_TYPE :
1 = Major (X.0.0)
2 = Minor (0.X.0)
3 = Patch (0.0.X)
none = Pas de bump
-->
Backend Bump: none
Frontend Bump: none

### Backend
#### Features

#### Patches

#### Bug Fixes


### Frontend
#### Features

#### Patches

#### Bug Fixes


### Deployment & Configuration

### ChangeLog

---

## [v0.1.0-a] - 2026-09-14

# RememberMap - Alpha v0.1.0-a

> [!WARNING]
> **Statut : Alpha.** Version de développement destinée aux tests d'intégration internes.

#### Features
- Initialize Java 25 Spring Boot application with Maven build setup
- Configure Spring Web, Spring Data JPA, Spring Security, Hibernate Spatial, and MinIO Java SDK dependencies
- Implement REST health endpoint (`GET /api/health`) returning application status and Java runtime version
- Add public security filter chain configuration in `SecurityConfig`
- Add Spring Boot context load sanity test suite (`RememberMapApplicationTests`) with H2 test database profile
- Create multi-stage Java 25 `Dockerfile` (`eclipse-temurin:25-jdk` builder and `eclipse-temurin:25-jre` runner)

#### Bug Fixes
- Configure `mainClass` and `MAVEN_OPTS` for Java 25 Spring Boot 3.4 repackaging compatibility


#### Features
- Initialize React 19 + TypeScript + Vite 6 application framework
- Integrate Tailwind CSS (v4) with `@tailwindcss/vite` plugin and `@import "tailwindcss";` in `src/index.css`
- Set up Vitest test framework and component rendering test suite (`App.test.tsx`)
- Generate `package-lock.json` for deterministic `npm ci` builds
- Create multi-stage frontend `Dockerfile` (Node 22 builder and Nginx Alpine runner)

#### Bug Fixes
- Fix package-lock.json for CI

### Deployment & Configuration
- Configure local multi-container orchestration in `docker-compose.yml` (`postgres`, `minio`, `minio-init`, `backend`, `frontend`)
- Add PostgreSQL init script (`docker/postgres/init.sql`) enabling `postgis` and `postgis_topology` extensions
- Add automated MinIO bucket initialization helper (`remembermap-minio-init`) for `remembermap-photos`
- Create GitHub Actions test workflow (`.github/workflows/test.yml`) running Maven and Vitest suites on PRs and feature pushes
- Create GitHub Actions release workflow (`.github/workflows/bump-and-tag.yml`) with automated version tagging
- Update `bump_version.py` script supporting independent component version bumps for backend, frontend, and root package

### ChangeLog

---
