# Cómo retomar las pruebas (mini-manual)

Necesitas **3 ventanas de PowerShell abiertas al mismo tiempo**, cada una con su propio comando corriendo sin cerrarse. Ábrelas en este orden.

---

## Ventana 1 — Proxy (conexión con la API real)

```powershell
cd "C:\Users\ELUMBRERAS\Videos\1.-AURA360AI-COMPLEMENTO\mobile\app-turno-movil\proxy-server"
node server.js
```

Debe quedar mostrando:
```
Proxy escuchando en http://localhost:4000
Reenviando a: https://aura-aranzazu-dataapi.miningcontrol.cloud
Origen permitido (CORS): *
```

**No cierres esta ventana.** Si necesitas reiniciarla (por ejemplo, después de que yo cambie código del proxy), presiona `Ctrl+C` aquí mismo y vuelve a correr `node server.js`.

---

## Ventana 2 — Servidor de la app (PWA)

```powershell
cd "C:\Users\ELUMBRERAS\Videos\1.-AURA360AI-COMPLEMENTO\mobile\app-turno-movil"
python -m http.server 8080
```

Debe quedar mostrando:
```
Serving HTTP on :: port 8080 ...
```

**No cierres esta ventana tampoco.**

---

## Ventana 3 — Puente USB con el celular (adb)

```powershell
cd C:\platform-tools
.\adb devices
```

Debe mostrar tu celular con estado `device` (si dice `unauthorized`, desbloquea el celular y acepta el popup de depuración USB; si dice `no devices/emulators found`, revisa el cable).

Una vez que lo vea, corre estas dos líneas (se pierden cada vez que el cable se desconecta, así que repítelas si el celular se desconectó):

```powershell
.\adb reverse tcp:8080 tcp:8080
.\adb reverse tcp:4000 tcp:4000
```

Para confirmar que quedaron activas en cualquier momento:
```powershell
.\adb reverse --list
```

---

## En el celular

1. Abre Chrome.
2. Entra a `http://localhost:8080`.
3. Si la app no carga o se ve rara / no trae los cambios más recientes: cierra la pestaña/app por completo (quítala de apps recientes) y ábrela de nuevo. Si sigue igual, borra los datos del sitio: toca el ícono de candado/info junto a la barra de direcciones → Configuración del sitio → Borrar y restablecer.
4. Haz login con tu usuario y contraseña reales de MiningControl.
5. Ve a ACARREO y prueba Día / Semana / Mes.

---

## Diagnóstico rápido si algo falla

| Síntoma | Dónde mirar |
|---|---|
| "Failed to fetch" en el celular | Ventana 3: `.\adb devices` — si no aparece el celular, se desconectó el cable; reconecta y repite `adb reverse`. |
| Error HTTP 400/500 al consultar un reporte | Ventana 1 (proxy) — ahí se imprime el cuerpo real de la respuesta de la API cuando hay error. |
| La app no refleja cambios de código nuevos | Borrar datos del sitio en el celular (paso 3 de arriba) — el Service Worker cachea la app. |
| `adb` no reconocido | Verifica que sigues en `C:\platform-tools` o usa la ruta completa `C:\platform-tools\adb.exe`. |

---

## Para guardar avances cuando terminemos algo

En cualquier ventana de PowerShell:
```powershell
cd "C:\Users\ELUMBRERAS\Videos\1.-AURA360AI-COMPLEMENTO"
git add -A
git commit -m "describe aqui que se hizo"
git push
```
