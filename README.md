# Lens Mobile

Cliente móvil híbrido (Ionic + Capacitor) de **Lens** para consultar la salud de servicios, explorar trazas y recibir alertas desde el celular, pensado para quien está de turno (on-call). Es local-first: funciona sin red con telemetría simulada que se genera en el dispositivo a partir de una semilla fija, por lo que los datos son reproducibles. El servidor Lens será una fuente de datos opcional en la versión final.

Proyecto del curso **Énfasis en Programación Móvil**.

## Funcionalidades

| Pantalla | Qué hace |
|----------|----------|
| Servicios | Lista los servicios con su tasa, errores y p99 (RED) en el rango elegido |
| Detalle de servicio | Gráficas de tasa, errores y latencia p50/p90/p99, y las 5 operaciones más lentas |
| Búsqueda de trazas | Filtra trazas por servicio, operación, estado y duración |
| Vista en cascada | Muestra los spans de una traza en el tiempo y resalta la ruta crítica |
| Detalle de span | Atributos, eventos y textos largos expandibles |
| Alertas | Reglas con su estado (FIRING / OK) evaluadas contra la telemetría |
| Crear o editar regla | Formulario con validación de nombre, servicio, umbral y ventana |
| Historial de alertas | Transiciones de cada regla (FIRED / RESOLVED) |
| Ajustes | Escenario de demostración, tema claro/oscuro/sistema y fuente de datos |

### Escenarios de demostración

Desde Ajustes se puede cargar uno de cuatro incidentes simulados: latencia de base de datos, dependencia que responde 503, consultas N+1 y tormenta de reintentos. Al cambiar de escenario, todas las pantallas se recargan con los datos nuevos.

## Inicio rápido

```bash
npm install
npm start            # servidor de desarrollo en http://localhost:4200
```

También funciona con la CLI de Ionic (`npm install -g @ionic/cli`) usando `ionic serve`.

## Generar el APK

Requiere el SDK de Android y JDK 21.

```bash
npm run build
npx cap sync android
cd android && ./gradlew assembleDebug
```

El APK queda en `android/app/build/outputs/apk/debug/app-debug.apk`. Para abrir el proyecto en Android Studio: `npx cap open android`.

## Stack

| Área | Tecnología |
|------|------------|
| UI | Angular 22 (standalone, signals) + Ionic 9 |
| Nativo | Capacitor 8 (Android, API 26+) |
| Datos | Generador de telemetría con semilla + repositorios en memoria (SQLite planeado) |
| Gráficas | SVG propio, sin librerías |
| Pruebas | Vitest (unitarias) + Playwright (e2e) |
| Calidad | ESLint + Prettier |

## Arquitectura

Arquitectura hexagonal con screaming architecture: las carpetas de primer nivel describen el dominio, no la tecnología.

```
src/app/
├── shared/              # Componentes de UI reutilizables (gráfica de líneas, texto expandible)
├── telemetry/           # Dominio compartido
│   ├── domain/          # Modelos, puertos (repositorios) y cálculos puros: RED, ruta crítica,
│   │                    # series por minuto, evaluación de reglas, transiciones de alerta
│   └── infrastructure/
│       ├── demo/        # Generador de datasets y escenarios con semilla
│       └── in-memory/   # Repositorios de telemetría y alertas en memoria
├── features/
│   ├── service-health/  # Servicios y su detalle RED
│   ├── traces/          # Búsqueda de trazas, cascada y detalle de span
│   ├── alerts/          # Reglas de alerta, formulario e historial
│   └── settings/        # Escenario de demo, tema y fuente de datos
└── tabs/                # Navegación por pestañas
```

Cada feature contiene `pages/` y su propio `<feature>.routes.ts`, cargado de forma diferida desde `tabs/`.

### Reglas

- Una feature **nunca** importa de otra feature. Lo compartido sube a `telemetry/` o `shared/`.
- Las páginas dependen de los puertos (`TELEMETRY_REPOSITORY`, `ALERT_REPOSITORY`), nunca de una implementación concreta.
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

Segunda entrega: las nueve pantallas son navegables y funcionan 8 de los 10 requerimientos funcionales.

Pendiente para la entrega final:

- Comparación de trazas (RF-06) y notificaciones locales de alertas (RF-08).
- Persistencia en SQLite de reglas, historial y telemetría.
- Diseño visual alineado con los wireframes.
- Vista en cascada virtualizada para trazas grandes.
- Selector de idioma (la primera versión está en inglés).
