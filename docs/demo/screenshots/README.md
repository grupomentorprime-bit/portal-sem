# Capturas — OT-SEM-DEMO-001

## Automático

Con el servidor en `http://localhost:3000`:

```bash
npx playwright install chromium
node scripts/capture-demo-screenshots.mjs
```

## Manual

Capturar la Home en:

| Carpeta | Anchos |
| --- | --- |
| `desktop/` | 1920, 1440, 1280 px |
| `tablet/` | 1024, 768 px |
| `mobile/` | 390 px |

Nomenclatura: `home-{dispositivo}-{ancho}.png`, `hero-mobile-390.png`, `programas-tablet-768.png`.

## Problemas frecuentes (Windows)

**Lockfile activo** (`__dirlock`):

```powershell
Remove-Item -Recurse -Force "$env:LOCALAPPDATA\ms-playwright\__dirlock"
npx playwright install chromium
```

**Instalación interrumpida:** si la descarga llegó al 100 % pero el proceso se canceló, elimina el lock y vuelve a ejecutar `npx playwright install chromium` (reutiliza el zip cacheado).

**Sin Playwright en el proyecto:** el script usa `npx playwright`; opcionalmente `npm install -D playwright` en el repo.
