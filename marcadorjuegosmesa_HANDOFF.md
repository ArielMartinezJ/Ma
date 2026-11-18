# HANDOFF — Marcador de Juegos de Mesa (app para Leandro)

**Última versión:** `marcadorjuegosmesa_v19.html` (publicada como `index.html`) · **Fecha:** 18 de noviembre de 2026
**Para continuar:** sube a la nueva conversación este handoff + el HTML de la última versión (`marcadorjuegosmesa_v19.html`) + `sw.js` + las suites `test_v19.js` y `sw_test.js`. Opcionalmente, sube también `estilo-apps-leandro.md` (receta de estilo común) y `SYSTEMPROMPTappsleandro.md` (la ingeniería común de las apps).

> **Alcance actual (decisión de Leandro, sep-2026):** la app es **solo local en el móvil**, sin sincronización ordenador↔móvil ni nube. Todas las mejoras se enfocan a la experiencia móvil en un **Samsung S24** (Android). Por eso NO hay push por servidor ni módulo de nube, y NO se deben añadir salvo que Leandro cambie de idea.

> Nota de versionado: cada entrega lleva un número nuevo (`_vN`), en el nombre del archivo y en `APP_VERSION`. Nunca reutilizar un número; se conservan para comparar una versión con la anterior.

## Qué es

App web **autocontenida en un único archivo HTML** (sin dependencias externas salvo Google Fonts), en **español**, tema oscuro por defecto, **móvil primero**, para llevar la puntuación de partidas de juegos de mesa. Se abre como archivo local en el móvil o dentro de la interfaz de Claude. Sigue la identidad visual y técnica de las demás apps de Leandro.

## Estética (constante con las otras apps de Leandro)

- Modo oscuro por defecto. Fondo `#0E1116` con glow radial. Fuentes: **Space Grotesk** (títulos/totales), **Inter** (cuerpo), **JetBrains Mono** (kicker, datos, etiquetas). Acento **dorado** `#E6C35C` (victoria). Bordes 11–26px, transiciones .15s, `prefers-reduced-motion` respetado.
- Tokens CSS en `:root`. Variables con sufijo `Txt` (`--goldTxt`, `--okTxt`, `--dangerTxt`…) se oscurecen en tema claro; las de relleno (`--gold`) no. En v18 todo el texto de acento usa `--goldTxt` (legible en tema claro); `--gold` solo para rellenos.
- El texto sobre las baldosas del Mosaico es negro o blanco según el color del jugador (`inkOn()`, elige el de más contraste con `contrastRatio`).

## Publicación en GitHub Pages (v19)

Carpeta del repositorio (7 archivos, todos en la raíz):

| Archivo | Para qué |
|---|---|
| `index.html` | la app (idéntica a `marcadorjuegosmesa_vNN.html`) |
| `sw.js` | service worker: caché `marcador-vNN`, documento red primero, resto caché primero |
| `manifest.webmanifest` | instalar en la pantalla de inicio; `start_url` y `scope` = `./` |
| `icon-180.png` | icono de Apple (opaco) |
| `icon-192.png`, `icon-512.png` | iconos «any» (esquinas redondeadas, fondo transparente) |
| `icon-maskable-512.png` | icono de Android con el dado dentro de la zona segura (62 %) |

- **Cabecera (§1.1):** `noindex, nofollow`, CSP (`default-src 'self'`, `'unsafe-inline'` para script y estilo porque todo va dentro del HTML, Google Fonts permitido, `img-src data: blob:`, sin `unsafe-eval`), manifest e icono de Apple. NUNCA un `robots.txt` con `Disallow`.
- **Registro:** `sw.js?v=`+`APP_VERSION`, solo si la página va por http(s). Abierta como archivo o en la vista previa de Claude no hay service worker y la app funciona igual.
- **Ajustes → Versión** muestra «Service worker: caché vNN · funciona sin conexión», «instalándose…» o «⚠ desajuste…». Si hay desajuste, también sale un aviso a los 4 s.
- **Regla de despliegue (D7d):** re-subir `index.html` siempre; `sw.js` cuando la entrega lo diga. Los iconos y el manifest casi nunca cambian.
- **Dominio compartido:** en `usuario.github.io` todas las apps de Leandro comparten origen, así que comparten `localStorage` (por eso cada app usa su prefijo de claves, aquí `marcador_`) y la lista de cachés. Este `sw.js` solo borra cachés `marcador-` y solo atiende su carpeta. Si el `sw.js` de otra app borrase todas las cachés que no son la suya, se llevaría la copia sin conexión del marcador (no los datos). No se ha revisado el código de las otras apps.
- **Los datos no viajan entre orígenes:** lo guardado abriendo la app como archivo (u otra dirección) no aparece en la versión publicada. Para pasarlo: «Descargar copia» en la vieja e «Importar copia» en la nueva.

## Rediseño v18 — cómo está montada la interfaz (leer antes de tocar la pantalla principal)

Decidido con Leandro sobre dos maquetas (`marcador_conceptos_rediseno.html` y `_v2.html`). Él eligió **mantener pulsado** para ajustar.

**Armazón:** `.app` es una columna de altura fija (`height:calc(100dvh / var(--z))`): cabecera `.hd` → zona que se desplaza `#main` → zona inferior fija `#bottom`. `--z` es el factor del tamaño de texto (ver trampas).

**Tres vistas** (`state.opts.view`), elegibles en Ajustes y guardadas por juego:

| Vista | Pantalla (`#viewPartida`) | Zona inferior (`#bottom`) |
|---|---|---|
| **A · Lista** | filas: avatar con puesto, nombre + 🏆 + «ronda +N», − / TOTAL (abre teclado) / + | 3 tarjetas (Dados · Empieza · Turno) + barra de pestañas con «+ Ronda» en el centro |
| **B · Mosaico** (por defecto) | baldosa por jugador: mitad derecha suma, mitad izquierda resta `opts.step` (1/5/10); botón de teclado abajo | fila «Cada toque vale» + isla flotante (dado · Empieza · temporizador · + Ronda · ajustes) |
| **C · Turno** | lista compacta (puesto, nombre, 🏆, total); tocar = dar el turno | Dados + Empieza, panel del jugador activo (barra de tiempo, −1 +1 +5 −5 +10, Teclado, **Siguiente**) + pestañas sin «+ Ronda» |

- **Los jugadores van en el orden de la mesa** en las tres vistas; el puesto se ve en una insignia. Ya **no** se reordenan al puntuar (antes la tarjeta se movía bajo el dedo). `resortSoon` y `renderPodium` ya no existen.
- **El número grande es el TOTAL** (rondas + puntuación actual). −/+, baldosas y teclado cambian `p.extra` (la «puntuación actual» que captura «+ Ronda»), igual que antes.
- **Pestañas** `ui.tab` = `partida` | `rondas` (`#main[data-tab]`; CSS oculta la otra sección). Historial y Ajustes abren hojas. En Mosaico no hay barra de pestañas: Rondas e Historial se abren desde Ajustes, y la sección Rondas tiene «← Volver a la partida». En apaisado ancho (≥640 px) se ven Partida y Rondas a la vez (como en la v10).
- **«+ Jugador» y «⟲ Nueva partida»** están arriba a la derecha (`#addPlayerBtn`, `#newGameBtn`). **Revelación y Compartir** pasaron a Ajustes → «Final de partida».
- **Turno:** `state.turnId`, `state.firstId` (por **id** de jugador, robusto al reordenar o borrar) y `state.turnSet`. «Siguiente» pasa el turno, reinicia el temporizador (y lo vuelve a arrancar si estaba corriendo) y, al volver a quien empezó, **guarda la ronda sola** (solo en modo `capturar`). El sorteo fija `firstId` y `turnId`. En Lista y Mosaico no se marca de quién es el turno; la tarjeta «Empieza» muestra quién empezó.
- **Mantener pulsado (0,48 s, `LP_MS`) = ajustar; un toque = la acción.** Elementos con `data-lp`: `dice` → hoja de dados; `timer` → hoja de tiempo; `p:<id>` → editar jugador. Un oyente en fase de captura se come el clic que llega al soltar, para que la pulsación larga no tire el dado ni sume el punto. Se cancela si el dedo se mueve más de 10 px. Consejo «mantén pulsado…» una sola vez (`state.opts.hints`, guardado).
- **Teclado de puntos** (`#padSheet`): sustituye al campo pequeño del podio y al modo cálculo ∑ (eliminados). «+ Sumar otro» acumula valores (lo que hacía ∑), ⌫ con la entrada vacía recupera el último valor acumulado, «Editar jugador» abre la ficha. Acepta teclado físico.
- **Dados:** `state.opts.die` (d4–d20) y `state.opts.diceN` (1–10), guardados con la partida y por juego. Toque = tirar con animación + aviso «🎲 3 + 5 = 8»; la hoja (`#diceSheet`) tiene tipo, cantidad, Tirar y las últimas 12 tiradas.
- **Acciones de la pantalla principal:** atributo `data-act` + **un solo** `switch` (lista cerrada, sin `eval`). La prueba N16 comprueba que cada `data-act` del código tiene su `case`.
- **Repintado:** la vista se repinta entera en cada cambio (no tiene campos de texto). `withFocus()` devuelve el foco al botón equivalente por su `data-fk`, para no perderlo con teclado o lector de pantalla.
- **Escapado (D1):** `esc()` para texto y `escA()` (escapa también comillas) para todo valor dentro de un atributo: nombres **e ids**. Los colores pasan por `safeColor()` (`normHex` o gris).

## Arquitectura técnica

- **Un solo `<script>`** al final del `<body>`, todo inline. Empieza con un **shim de `window.storage`** (fallback a `localStorage` y luego a memoria). El código real va en un IIFE `(function(){ 'use strict'; … })()`.
- **Persistencia con `window.storage`** (get/set/delete/list, devuelven Promesas). Claves:
  - `marcador_juegos_mesa_v2` — estado principal (`state`, clave `KEY`).
  - `marcador_historial_v1` — historial de partidas archivadas (`KEY_H`).
  - `marcador_perfiles_v1` — memoria por juego (`KEY_P`).
  - `marcador_theme_v1` — tema (`THEME_KEY`).
  - `marcador_auto_backup_1/2/3` — copias automáticas rotatorias (v16).
- **`APP_VERSION`** es la ÚNICA fuente de la versión. **Cuatro sitios deben cuadrar (D8):** nombre del archivo ↔ `APP_VERSION` ↔ primera fila de `CHANGELOG` ↔ `version` del payload de copia.
- **Estado** (`state`): `{gameName, players[], rounds[], startT, goalHit, winCounted, turnId, firstId, turnSet, opts{}}`.
  - `players`: `[{id, name, extra, color, wins}]`. **`extra` es la PUNTUACIÓN ACTUAL** (nombre histórico; NO renombrar).
  - `rounds`: `[{scores:{playerId:"texto"}}]` (strings; `num()` convierte).
  - `opts`: `{roundMode, winMode, closeOutside, wakeLock, vibrate, goal, turnSecs, view, die, diceN, step, hints{dice,timer}}`. Todo campo nuevo se carga con comprobación de tipo en `applyStateFromRaw`; los datos de la v17 abren en Mosaico con 1d6.
- **Memoria por juego** (`profiles[nombre en minúsculas]`): `{winMode, goal, roundMode, turnSecs, view, die, diceN, step}`. `profApply` ignora los campos que no traen los perfiles antiguos.
- **Estado de interfaz** (no se guarda): `ui = {tab, pickId, turnDelta, lastRoll, rolling}`.
- **Pintado:** `renderAll` → `renderTable` → `renderTotals` → `renderView` (+ `renderBottom` en Turno) + `checkGoal`. `renderBottom` pinta la zona inferior de la vista y llama a `ttRender`, que actualiza todo `[data-tl]` (tiempo), `[data-tp]` (progreso), `[data-ts]` (Iniciar/Pausar/Seguir) y `[data-tlive]` (clases `live`/`warn`/`done`) sin repintar.
- **Total** = `totalOf(p)=roundSum(p.id)+num(p.extra)`. Todos los cambios de puntos pasan por `quickAdd(pid,d)`.

## Red de seguridad de datos (v16–v17) — sin cambios en v18

Sin nube, un dato pisado **no se recupera**.

1. **Guardia de lectura `ESTADO_LEIDO`** (§6.1/D10): mientras no se hayan leído bien estado, historial y perfiles (3 reintentos 0/400/1200 ms con `readRaw`), `save/saveNow/profSave/histSave` no escriben. Si falla: overlay `#loadFail` con Reintentar, Restaurar copia automática y Empezar de cero (dos pasos; la única salida que escribe encima). El tema no bloquea.
2. **Copia automática rotatoria** (§8/A4): una por **día natural de uso** en `marcador_auto_backup_1/2/3`, en el slot vacío o más antiguo. Restaurable desde Ajustes → «Copias automáticas» con confirmación en dos pasos (`twoStepBtn`). `applyBackupObject` sirve para importar y restaurar.
3. **Residual cerrado (v17):** `histReadSafe()` rechaza en vez de devolver `[]`; `resetGame` solo vacía y cuenta la victoria si el archivado tuvo éxito; JSON/CSV abortan con aviso si no pueden leer el historial.
- **Regla general:** cualquier lectura previa a una **escritura** o **exportación** debe rechazar si no pudo leer. El `.catch(return [])` solo vale para lecturas de **solo pintado**.

## Funcionalidades (recorrido)

- **Pantalla principal:** tres vistas (arriba). Puesto con empates compartidos (`rankMap`), indicador de último cambio (+3/−2), victorias 🏆 visibles en las tres, «ronda +N» cuando ya hay rondas guardadas.
- **Herramientas a la vista:** Dados (toque tira, mantener ajusta), Empieza (sorteo con animación sobre la vista + anuncio a pantalla completa), Turno (toque inicia/pausa, mantener ajusta; presets 15 s–2 min y barra 5 s–5 min; pitido, vibración y destello al acabar).
- **+ Ronda:** modos capturar (la puntuación actual pasa a la ronda y se pone a 0) o vacía (abre la pestaña Rondas para escribir a mano). En capturar, aviso **«Deshacer»** que quita la ronda y devuelve los puntos (sumando lo añadido después).
- **Rondas:** tabla con jugadores en filas y rondas en columnas (Total fija), anchos con `fitTable()`, tocar Rx borra la ronda (con Deshacer), tocar un nombre lo edita.
- **Editar jugador:** nombre, puntuación, victorias, color, orden en la mesa, eliminar (con Deshacer).
- **⟲ Nueva partida:** misma gente / reiniciar victorias / empezar de cero. Archiva y cuenta la victoria antes de vaciar.
- **Objetivo de puntos, gana el más alto o el más bajo, revelación de resultados, compartir resultado, historial con estadísticas, memoria por juego, copia JSON/CSV, copias automáticas, temas (claro/oscuro/auto, presets, contraste WCAG, alto contraste, tamaño de texto), pantalla encendida, vibración, versión + registro.**

## Metodología de trabajo (seguir tal cual)

1. **Cambios pequeños:** `str_replace` sobre una copia `vN → vN+1`, con anclas exactas y únicas. **Cambios grandes (como la v18):** un script `build_vN.py` que aplica todos los reemplazos con anclas que deben aparecer **exactamente una vez** (si no, para) y **escribe el archivo solo al final**; al terminar comprueba que no queda ninguna referencia a lo eliminado. Cuidado: los comentarios de sección del CSS y del JS a veces se llaman igual (p. ej. «Modo revelación»); usa el ancla larga del CSS (`/* ── Modo revelación ───`).
2. **UTF-8 real** en el HTML/JS (acentos, −, ±, ⌫, 🏆). Comillas simples en strings JS.
3. **Verificación:**
   - **Sintaxis:** `new Function(textoDelScript)` — NO `node --check` (cuenta mal por los Unicode).
   - **Estructura:** cada `$('id')` del código existe; cada `data-act` tiene su `case`.
   - **jsdom** (`npm i jsdom`): `test_v18.js` corre **44 comprobaciones** sobre la v18 y sobre la v17 (no-vacuidad). Stubs: `window.storage` (Promesas), `matchMedia`, `<dialog>` (`showModal/close` poniendo y quitando el atributo `open`), `URL.createObjectURL`, `navigator.vibrate`, `confirm`. La pulsación larga se simula con `MouseEvent('pointerdown')`, espera de 620 ms, `pointerup` y `click`. Cuenta los errores de consola con `VirtualConsole`.
   - **Esperar al guardado:** `save()` agrupa escrituras con un retardo de 300 ms. Una prueba que lee el almacén debe esperar ≥ 350 ms (en v18 dos pruebas fallaron solo por esto; se comprobó antes de cambiarlas).
   - **Service worker sin navegador:** `sw_test.js` (11 comprobaciones con `self`/`caches`/`fetch` simulados con `vm`). El `self.location` simulado debe tener `origin`: sin él, el worker deja pasar todo y varias pruebas pasan sin probar nada (pasó en v19). Verificado mutando el worker: sin sus protecciones fallan S5, S10 y S11.
   - **Sitio real:** `e2e19.js` sirve la carpeta con `python3 -m http.server` en `/marcador/` y Chromium (`--no-proxy-server`) comprueba: el SW controla la página, caché con los 7 archivos, línea de versión, manifest e iconos, datos en `localStorage`, descarga JSON con la CSP, **abrir sin conexión**, que una versión nueva no borre cachés de otras apps, aviso de desajuste, 0 violaciones de CSP.
   - **Chromium** (Playwright, preinstalado; NO `playwright install`) a **360×780** (S24): capturas de las vistas y las hojas, tema claro, texto «Muy grande», apaisado (780×360 y 1024×700), 7 jugadores con nombres largos, y **pulsación larga táctil real** con CDP (`Input.dispatchTouchEvent` touchStart → 700 ms → touchEnd).
4. **Entrega:** a `/mnt/user-data/outputs/`, conservando los HTML intermedios (v15, v16, v17, v18…).
5. **Idioma/estilo:** español, tono cercano, respuestas escaneables con tablas y ejemplos concretos, **lenguaje literal** sin modismos. No corregir la falta de `¿`/`¡`.
6. **Honestidad:** decir qué se ha comprobado aquí y qué solo puede confirmar él en su S24.
7. **Una decisión a la vez**; **maqueta antes de picar** lo visual nuevo; el comportamiento no visual se confirma con un plan y sus parámetros.
8. **Mejoras proactivas** al terminar. **Buscar en la web solo al inicio del chat** o pidiendo permiso.

## Trampas conocidas (aprendidas en esta app)

- **`*{margin:0}` rompe el centrado de `<dialog>`** → hojas como *bottom sheets*. (v1→v2.)
- **`hidden` + `display` propio:** desde v18 hay una regla global `[hidden]{display:none!important}` (D12).
- **No partir funciones al insertar código** (v13). La prueba de sintaxis lo detecta.
- **Al vaciar `state.players`, la vista debe repintarse** (v14). En v18 `renderView` pinta el estado vacío.
- **`confirm()`/`alert()` se capan incrustado** → hojas propias o **dos pasos**. Quedan dos `confirm()`: borrar historial e importar copia.
- **Pickers `<input type=color>`:** usar `change`, no `input`, si el handler repinta.
- **Compatibilidad de datos guardados:** cargar cada campo con comprobación de tipo; la clave sigue en `_v2`.
- **Victorias: dos registros conviven** (`p.wins` vs conteo del historial por nombre). Pendiente unificar.
- **(v16) No devolver `[]` en el `.catch` de una lectura que luego se escribe.**
- **(v16) La copia automática crea una copia al arrancar:** al sembrar copias en una prueba, usa fecha de hoy si no quieres que se cree otra.
- **(v18) Tamaño de texto y altura fija:** el tamaño de texto usa `body.style.zoom`; una altura `100dvh` dentro de un body con zoom se haría más alta que la pantalla. Por eso `.app` usa `calc(100dvh / var(--z))` y `applyTheme` pone `--z`. Comprobado en Chromium con «Muy grande» (1,25): la app ocupa exactamente 780 px de 780.
- **(v18) Botones con aspecto propio:** las zonas nuevas reinician el estilo de botón con `:where(.hd,#main,#bottom,#padSheet) button{…}` (especificidad mínima) para que las clases de cada botón ganen.
- **(v18) Un `data-act` sin su `case` no hace nada en silencio** (como la lista blanca de Calma). Lo vigila N16 leyendo el código fuente.
- **(v19) En GitHub Pages todas las apps comparten dominio:** un `sw.js` que borre «todas las cachés menos la mía» rompe la copia sin conexión de las demás. Filtrar siempre por prefijo propio.
- **(v19) La CSP no la comprueba jsdom:** solo se verifica en Chromium con el sitio servido por http.
- **(v18) Pantallas muy bajas (móvil apaisado, ≤500 px de alto):** toda la app se desplaza y la zona inferior va al final; si no, el panel de Turno no cabría.

## Historial de versiones (resumen)

- **v1–v3**: marcador básico; identidad visual; bottom sheets; tabla transpuesta.
- **v4–v6**: puntuación por jugador; temas (contraste WCAG); modo cálculo; colores; gana el más bajo; sorteo; dados d4–d20.
- **v7–v9**: Wake Lock; revelación; cronómetro; tamaño de texto; vibración; guardado con retardo; icono; Deshacer; reordenar jugadores.
- **v10–v12**: diseño apaisado; objetivo de puntos; compartir; empates; copia JSON/CSV; temporizador de turno; memoria por juego; estadísticas del historial.
- **v13–v15**: columnas adaptativas; campo de puntuación escribible; ⟲ con hoja sin `confirm`; victorias por jugador; ⟲ con tres niveles.
- **v16**: guardia de lectura + copia automática diaria + versión visible y registro.
- **v17**: cierra el residual del historial (`histReadSafe`).
- **v18**: **rediseño para móvil** — tres vistas (Lista, Mosaico, Turno) elegibles en Ajustes y guardadas por juego; dados, sorteo y temporizador a la vista; mantener pulsado para ajustar (dados, tiempo, jugador); teclado numérico con suma acumulada (sustituye al campo pequeño y a ∑); victorias en las tres vistas; turno con «Siguiente» que cierra la ronda; pestañas Partida · Rondas · Historial · Ajustes; «+ Ronda» con Deshacer; escapado de ids en atributos.

- **v19** (actual): **lista para GitHub Pages** — manifest e iconos (instalable), `sw.js` con caché por versión (abre sin conexión), `noindex`, CSP, y la caché visible en Ajustes → Versión con aviso de desajuste.

## Ideas / pendientes para futuras versiones

- **Probar en su S24 ya publicada:** instalar en la pantalla de inicio (menú de Chrome → «Añadir a pantalla de inicio» / «Instalar aplicación»), abrir en modo avión, y que el icono se vea bien.

- **Probar en su S24:** si 0,48 s de pulsación larga resulta cómodo; que la pulsación larga no abra el menú del navegador; vibración y pitido del temporizador; Web Share.
- **Diagnóstico plegable (A10)** — aún no existe; útil para depurar en el móvil.
- **Unificar los dos registros de victorias** (`p.wins` vs historial).
- **Convertir a dos pasos los dos `confirm()` restantes** (borrar historial, importar copia).
- **Reordenar jugadores por arrastre** (hoy ↑/↓ en la ficha); **más plantillas de compartir** (imagen).
- **Búsqueda / vista de una partida en el historial (C3/C5)** cuando el historial crezca.
- Posible: mostrar de quién es el turno también en Lista y Mosaico (hoy solo en Turno) si Leandro lo pide.
