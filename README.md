# Lens Mobile

Cliente móvil híbrido (Ionic + Capacitor) de **Lens** para consultar la salud de servicios, explorar trazas y recibir alertas desde el celular. Es local-first: funciona sin red con un dataset de telemetría sembrado en el dispositivo, y el servidor Lens es una fuente de datos opcional.

Proyecto del curso **Énfasis en Programación Móvil**.

## Inicio rápido

```bash
npm install
npm start            # servidor de desarrollo en el navegador
```

Para generar y abrir el proyecto Android:

```bash
npm run build
npx cap sync android
npx cap open android
```

## Stack

| Área | Tecnología |
|------|------------|
| UI | Angular 22 (standalone) + Ionic 9 |
| Nativo | Capacitor 8 (Android, API 26+) |
| Datos | Fixtures JSON en memoria → SQLite (`@capacitor-community/sqlite`) |
| Pruebas | Vitest (unitarias) + Playwright (e2e) |
| Calidad | ESLint + Prettier |

## Arquitectura

Screaming architecture: las carpetas de primer nivel describen el dominio, no la tecnología.

```
src/app/
├── core/              # Infraestructura técnica: SQLite, Preferences, Secure Storage, notificaciones
├── shared/            # Componentes de UI reutilizables sin lógica de negocio
├── telemetry/         # Dominio compartido
│   ├── domain/        # Modelos, interfaz TelemetryRepository, cálculos puros (RED, ruta crítica)
│   └── infrastructure/# Implementaciones del repositorio (en memoria, SQLite, remota)
├── features/
│   ├── service-health/ # Servicios y su resumen RED
│   ├── traces/         # Búsqueda de trazas, waterfall, detalle de span, comparación
│   ├── alerts/         # Reglas de alerta e historial
│   └── settings/       # Fuente de datos, escenarios de demo, tema
└── tabs/              # Shell de navegación por pestañas
```

Cada feature contiene `pages/`, `components/`, `services/` (opcional) y su propio `<feature>.routes.ts`, cargado de forma diferida desde `tabs/`.

### Reglas

- Una feature **nunca** importa de otra feature. Lo compartido sube a `telemetry/`, `core/` o `shared/`.
- Las páginas dependen de la interfaz `TelemetryRepository`, nunca de una implementación concreta.
- Los cálculos de dominio son funciones puras, testeables sin `TestBed`.

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm start` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run lint` | ESLint, typecheck e2e y Prettier |
| `npm run test:unit` | Pruebas unitarias |
| `npm run test:e2e` | Pruebas e2e |

## Estado

En construcción: estructura base lista; siguiente paso, modelar `telemetry/domain`.
