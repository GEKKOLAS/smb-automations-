# SMB Automations

Biblioteca de flujos de trabajo de automatización con **n8n** y **Zapier** para pequeñas y medianas empresas. Sirve para guardar cada flujo en un solo sitio, documentarlo y enseñarlo: cada uno tiene su propia página con el diagrama, los pasos de instalación, las credenciales que necesita y el archivo listo para importar.

- **Catálogo** con búsqueda (por app, objetivo o etiqueta) y filtros por plataforma y área.
- **Diagrama de n8n** dibujado a partir del JSON exportado, con las posiciones reales del editor.
- **Zaps de Zapier** como lista de pasos, con filtros, rutas (paths) y esperas.
- **Video de cada flujo**: una simulación animada en la que los datos de ejemplo recorren el flujo paso a paso, con la explicación de cada nodo. Se genera automáticamente como MP4 y también se puede ver en vivo a pantalla completa (`/demo/<slug>`).
- **Descarga / copia** del JSON de cada flujo.
- **Validación** automática de la biblioteca antes de cada build.

## Uso

```bash
npm install
npm run dev        # http://localhost:3000
npm run validate   # comprueba todos los flujos
npm run build      # valida y genera el sitio estático en out/
npm run videos     # genera los videos de todos los flujos y recompila
```

El build es una exportación estática (`out/`), así que se puede desplegar en Vercel, Netlify, GitHub Pages o cualquier hosting estático.

## Estructura

```
workflows/
  captacion-leads-crm/
    meta.json            # título, categoría, apps, instalación…
    workflow.n8n.json    # exportación de n8n, tal cual
  zapier-formulario-a-slack/
    meta.json
    zap.json             # pasos del Zap (esquema propio, ver abajo)
    demo.json            # guion de la simulación / video (opcional)
app/                     # páginas (Next.js App Router); /demo/<slug> = simulación a pantalla completa
components/              # catálogo, diagramas, reproductor de la simulación
lib/                     # tipos, carga de flujos, grafo n8n/Zapier, línea de tiempo de la demo
public/videos/           # videos generados
scripts/                 # validación y generación de videos
```

## Añadir un flujo

1. Crea una carpeta en `workflows/` con un nombre en kebab-case (será la URL: `/workflows/<nombre>`).
2. Añade el archivo del flujo:
   - **n8n**: en el editor, menú `⋯` → *Download*, y guárdalo como `workflow.n8n.json`. **Revisa que no contenga datos sensibles** (IDs de hojas, correos internos, URLs de webhooks de producción); las credenciales no se exportan, pero los parámetros sí.
   - **Zapier**: Zapier no ofrece una exportación pública estable, así que el Zap se describe en `zap.json`:
     ```json
     {
       "name": "Nombre del Zap",
       "steps": [
         { "type": "trigger", "app": "Typeform", "event": "New Entry" },
         { "type": "filter", "app": "Filter by Zapier", "event": "Only continue if…", "description": "…" },
         { "type": "action", "app": "Slack", "event": "Send Channel Message" },
         { "type": "path", "app": "Paths by Zapier", "event": "Split into paths", "branches": [
           { "name": "Rama A", "condition": "Importe > 5000", "steps": [ … ] }
         ] }
       ]
     }
     ```
     Tipos de paso: `trigger`, `action`, `filter`, `path`, `delay`, `formatter`. El primero debe ser `trigger`.
3. Crea `meta.json`:
   ```json
   {
     "title": "Captación de leads web → CRM",
     "platform": "n8n",
     "category": "Ventas",
     "summary": "Una frase para la tarjeta del catálogo.",
     "description": "Explicación completa para la página del flujo.",
     "apps": ["Webhook", "HubSpot", "Slack"],
     "tags": ["leads", "crm"],
     "trigger": "Webhook (envío de formulario)",
     "status": "produccion",
     "industry": "Servicios profesionales",
     "hoursSavedPerMonth": 12,
     "setup": ["Paso 1…", "Paso 2…"],
     "credentials": ["HubSpot (App privada)"],
     "updated": "2026-10-28"
   }
   ```
   `status`: `produccion`, `piloto` o `plantilla`. `industry`, `hoursSavedPerMonth`, `setup` y `credentials` son opcionales.
4. Ejecuta `npm run validate`.

## Videos de los flujos

Cada flujo tiene una simulación: el diagrama se anima paso a paso, los datos de ejemplo viajan por las conexiones y abajo se explica qué hace cada nodo. La simulación se define en `workflows/<slug>/demo.json`:

```json
{
  "intro": "Frase que aparece en la portada del video.",
  "scenes": [
    { "node": "Formulario web", "caption": "Llega un lead desde la web…", "data": { "email": "ana@acme.co" } },
    { "node": ["Avisar en Slack", "Respaldo en Sheets"], "caption": "Dos nodos que se ejecutan a la vez." }
  ]
}
```

- `node`: en n8n, el nombre del nodo; en Zapier, el número del paso (`"3"`), y dentro de una ruta `paso.rama.paso` (`"7.1.1"` = paso 7, primera rama, primer paso). Puede ser una lista para pasos en paralelo.
- `data` (opcional): los datos de ejemplo que se muestran en ese paso.
- Si un flujo no tiene `demo.json`, se genera un recorrido automático a partir del diagrama.

`npm run videos` graba cada simulación fotograma a fotograma (1920×1080, 30 fps) y guarda `public/videos/<slug>.mp4` y su portada `.jpg`; la página del flujo muestra el video en cuanto existe. Para regenerar solo algunos: `npm run build && npm run videos:render -- captacion-leads-crm`. Opciones: `--theme light|dark`, `--fps`, `--scale`.

Requisitos: **ffmpeg** (en el PATH o en `FFMPEG_PATH`) y Chromium para Playwright (`npx playwright install chromium`).

## Stack

Next.js 15 (App Router, exportación estática), React 19, TypeScript y Tailwind CSS 4. Sin base de datos: los flujos son archivos JSON versionados en el repo.
