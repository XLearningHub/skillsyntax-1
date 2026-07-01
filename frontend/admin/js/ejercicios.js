// js/ejercicios.js
// Módulo de Gestión de Ejercicios — SkillSyntax Admin (SPA multi-vista)
// Vistas: Todos | Por Alumno (lista + detalle) | Por Grupo (lista + detalle)

// ── Guardia de autenticación ──────────────────────────────────────────────────
const _sesionAdmin = JSON.parse(localStorage.getItem("usuario"));
if (!_sesionAdmin || _sesionAdmin.rol !== "admin") {
    window.location.href = "/index.html";
}

// ── Estado global del módulo ──────────────────────────────────────────────────
/** @type {{ ejercicios: Array, usuarios: Map<string,{nombre,email}>, grupos: Array } | null} */
let _cache = null;

/** Evita arranques dobles si el usuario navega rápido */
let _cargando = false;

/**
 * Guarda desde qué vista de lista vino el usuario antes de entrar al detalle.
 * Puede ser 'alumno' (desde lista de alumnos) o 'grupo' con un gid (desde detalle de grupo).
 * @type {{ vista: string, id?: string } | null}
 */
let _origenDetalle = null;

// ── Inicialización ─────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
    inicializar();
    // Escuchar cambios de URL (botón Atrás / Adelante del navegador)
    window.addEventListener("popstate", () => router());
});

/**
 * Carga los tres endpoints en paralelo, almacena el caché global y activa el router.
 */
async function inicializar() {
    if (_cargando) return;
    _cargando = true;

    _renderSpinner("Cargando datos...");

    try {
        const [ejercicios, usuarios, grupos] = await Promise.all([
            fetch("/api/resultados").then(r => r.json()),
            fetch("/api/usuarios").then(r => r.json()),
            fetch("/api/grupos").then(r => r.json()),
        ]);

        // Construir mapa de usuarios indexado por ID
        const usuariosMap = new Map(
            (usuarios || []).map(u => [u.id, { nombre: u.nombre || "Sin nombre", email: u.email || "" }])
        );

        _cache = {
            ejercicios: ejercicios || [],
            usuarios: usuariosMap,
            grupos: grupos || [],
        };

        router();

    } catch (err) {
        console.error("[EJERCICIOS] Error al inicializar:", err);
        document.getElementById("vistaContainer").innerHTML = `
            <div class="card">
                <div class="estado-tabla">
                    <i class="fas fa-triangle-exclamation"></i>
                    <p>Error al conectar con el servidor. Recarga la página e intenta de nuevo.</p>
                </div>
            </div>`;
    } finally {
        _cargando = false;
    }
}

// ── Router ─────────────────────────────────────────────────────────────────────
/**
 * Lee la URL actual y despacha la vista correspondiente.
 * Parámetros URL:
 *   ?vista=todos|alumno|grupo   (sin &id  → lista resumen)
 *   ?vista=alumno&id=UID        → detalle de alumno
 *   ?vista=grupo&id=GID         → detalle de grupo
 */
function router() {
    if (!_cache) return;

    const params = new URLSearchParams(window.location.search);
    const vista  = params.get("vista") || "todos";
    const id     = params.get("id")    || null;

    // Marcar el botón activo en la barra de vistas
    _actualizarTabsActivos(vista);

    // Ocultar selector de tabs cuando estamos en un detalle (tiene breadcrumb propio)
    const selectorBar = document.getElementById("vistaSelectorBar");
    if (selectorBar) {
        selectorBar.style.display = (id && vista !== "todos") ? "none" : "";
    }

    switch (vista) {
        case "alumno":
            id ? renderDetalleAlumno(id) : renderVistaAlumnos();
            break;
        case "grupo":
            id ? renderDetalleGrupo(id) : renderVistaGrupos();
            break;
        default:
            renderVistaTodos();
    }
}

// ── Navegación SPA ─────────────────────────────────────────────────────────────
/**
 * Actualiza la URL sin recargar la página y dispara el router.
 * @param {string}      vista    - 'todos' | 'alumno' | 'grupo'
 * @param {string|null} id       - UID del alumno o GID del grupo (opcional)
 * @param {object|null} origen   - {vista, id} desde dónde se navega (para el botón Regresar)
 */
function navegar(vista, id = null, origen = null) {
    const params = new URLSearchParams();
    params.set("vista", vista);
    if (id) params.set("id", id);

    // Registrar origen solo cuando vamos a un detalle de alumno
    if (vista === "alumno" && id) {
        // Si se especifica un origen explícito, lo usamos; si no, inferimos desde la URL actual
        if (origen) {
            _origenDetalle = origen;
        } else {
            const currentParams = new URLSearchParams(window.location.search);
            const currentVista  = currentParams.get("vista");
            const currentId     = currentParams.get("id");
            // Si venimos del detalle de grupo, guardamos ese contexto
            if (currentVista === "grupo" && currentId) {
                _origenDetalle = { vista: "grupo", id: currentId };
            } else {
                _origenDetalle = { vista: "alumno" };
            }
        }
    } else if (vista !== "alumno" || !id) {
        // Al salir del detalle de alumno limpiamos el origen
        _origenDetalle = null;
    }

    const nuevaUrl = `${window.location.pathname}?${params.toString()}`;
    history.pushState({}, "", nuevaUrl);
    router();
}

// ── Helpers de UI ──────────────────────────────────────────────────────────────
function _actualizarTabsActivos(vista) {
    ["todos", "alumno", "grupo"].forEach(v => {
        document.getElementById(`btn-vista-${v}`)?.classList.toggle("active", v === vista);
    });
}

function _mostrarBreadcrumb(items) {
    const bc = document.getElementById("breadcrumb");
    if (!bc) return;

    if (!items || items.length === 0) {
        bc.style.display = "none";
        bc.innerHTML = "";
        return;
    }

    bc.style.display = "flex";
    bc.innerHTML = items.map((item, i) => {
        const esUltimo = i === items.length - 1;
        if (esUltimo) {
            return `<span>${escapeHtml(item.label)}</span>`;
        }
        return `<a href="#" onclick="event.preventDefault(); navegar('${item.vista}'${item.id ? `, '${item.id}'` : ""})">${escapeHtml(item.label)}</a>
                <i class="fas fa-chevron-right"></i>`;
    }).join("");
}

function _renderSpinner(texto = "Cargando...") {
    document.getElementById("vistaContainer").innerHTML = `
        <div class="card">
            <div class="estado-tabla">
                <i class="fas fa-spinner fa-spin"></i>
                <p>${texto}</p>
            </div>
        </div>`;
    _mostrarBreadcrumb(null);
}

function _getHabilidadClass(hab) {
    const mapa = { speaking: "hab-speaking", writing: "hab-writing", reading: "hab-reading", listening: "hab-listening" };
    return mapa[(hab || "").toLowerCase()] || "hab-default";
}

function _getScoreClass(score) {
    const n = parseFloat(score);
    if (isNaN(n)) return "score-mid";
    if (n >= 7) return "score-high";
    if (n >= 4) return "score-mid";
    return "score-low";
}

// ── VISTA: TODOS ───────────────────────────────────────────────────────────────
function renderVistaTodos() {
    _mostrarBreadcrumb(null);

    const { ejercicios } = _cache;
    const container = document.getElementById("vistaContainer");

    if (!ejercicios.length) {
        container.innerHTML = `
            <div class="card">
                <div class="estado-tabla">
                    <i class="fas fa-book-open"></i>
                    <p>No hay ejercicios generados todavía.</p>
                </div>
            </div>`;
        return;
    }

    container.innerHTML = `
        <div class="card">
            <table>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Alumno</th>
                        <th>Habilidad</th>
                        <th>Puntaje</th>
                        <th>Feedback</th>
                        <th>Acción</th>
                    </tr>
                </thead>
                <tbody id="tbodyTodos"></tbody>
            </table>
        </div>`;

    const tbody = document.getElementById("tbodyTodos");
    const { usuarios } = _cache;

    ejercicios.forEach(e => {
        const inicial = (e.usuario || "?").charAt(0).toUpperCase();
        const hab     = e.habilidad || "—";
        const habCls  = _getHabilidadClass(hab);
        const scoreCls = _getScoreClass(e.puntaje);

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td class="id-cell">#${escapeHtml(String(e.id).slice(-5))}</td>
            <td>
                <div class="user-chip">
                    <div class="avatar">${inicial}</div>
                    <div>
                        <div class="user-info-name">${escapeHtml(e.usuario || "Desconocido")}</div>
                        ${e.usuarioId
                            ? `<button class="btn-link" style="font-size:0.75rem; font-weight:500; color:var(--text-dim);"
                                  onclick="navegar('alumno','${escapeHtml(e.usuarioId)}')">
                                    Ver todos sus ejercicios
                               </button>`
                            : ""}
                    </div>
                </div>
            </td>
            <td><span class="badge-hab ${habCls}">${escapeHtml(hab)}</span></td>
            <td><span class="score-badge ${scoreCls}">${e.puntaje ?? "—"}</span></td>
            <td class="feedback-cell">${escapeHtml(e.feedback || "Sin feedback")}</td>
            <td>
                <button class="btn-delete" onclick="eliminarEjercicio('${escapeHtml(String(e.id))}', 'todos')">
                    <i class="fas fa-trash-can"></i> Eliminar
                </button>
            </td>`;
        tbody.appendChild(tr);
    });
}

// ── VISTA: LISTA DE ALUMNOS ────────────────────────────────────────────────────
function renderVistaAlumnos() {
    _mostrarBreadcrumb([
        { label: "Ejercicios", vista: "todos" },
        { label: "Por Alumno",  vista: "alumno" },
    ]);

    const { ejercicios, usuarios } = _cache;
    const container = document.getElementById("vistaContainer");

    // ── MEJORA 1: Padrón completo ──────────────────────────────────────────────
    // Comenzar con TODOS los usuarios registrados (con total 0)
    /** @type {Map<string, {nombre:string, email:string, total:number}>} */
    const mapa = new Map();

    usuarios.forEach((info, uid) => {
        mapa.set(uid, { nombre: info.nombre || "Sin nombre", email: info.email || "", total: 0 });
    });

    // Sumar ejercicios encima del padrón
    ejercicios.forEach(e => {
        const uid = e.usuarioId || `nombre:${e.usuario}`;
        if (mapa.has(uid)) {
            mapa.get(uid).total++;
        } else {
            // Alumno con ejercicios pero sin registro en users (edge case)
            mapa.set(uid, { nombre: e.usuario || "Desconocido", email: e.email || "", total: 1 });
        }
    });

    if (!mapa.size) {
        container.innerHTML = `
            <div class="card">
                <div class="estado-tabla">
                    <i class="fas fa-user-slash"></i>
                    <p>No hay alumnos registrados en el sistema.</p>
                </div>
            </div>`;
        return;
    }

    // Ordenar: primero los que tienen ejercicios (desc), luego el resto por nombre
    const alumnos = [...mapa.entries()].sort((a, b) => {
        if (b[1].total !== a[1].total) return b[1].total - a[1].total;
        return a[1].nombre.localeCompare(b[1].nombre, 'es');
    });

    container.innerHTML = `
        <div class="card">
            <!-- ── MEJORA 2: Buscador en tiempo real ──────────────────────── -->
            <div class="search-wrapper">
                <i class="fas fa-search search-icon"></i>
                <input
                    type="search"
                    id="buscadorAlumnos"
                    class="search-input"
                    placeholder="Buscar alumno por nombre..."
                    autocomplete="off"
                    oninput="filtrarTablaAlumnos(this.value)"
                >
            </div>

            <table>
                <thead>
                    <tr>
                        <th style="text-align:left; padding-left:15px;">#</th>
                        <th>Alumno</th>
                        <th>Email</th>
                        <th style="text-align:center;">Ejercicios Totales</th>
                        <th>Acción</th>
                    </tr>
                </thead>
                <tbody id="tbodyAlumnos"></tbody>
            </table>
            <div id="sinResultadosBusqueda" style="display:none;" class="estado-tabla">
                <i class="fas fa-search"></i>
                <p>No se encontraron alumnos con ese nombre.</p>
            </div>
        </div>`;

    const tbody = document.getElementById("tbodyAlumnos");

    alumnos.forEach(([uid, datos], idx) => {
        const inicial = datos.nombre.charAt(0).toUpperCase();
        const sinEjercicios = datos.total === 0;
        const tr = document.createElement("tr");
        tr.setAttribute("data-nombre", datos.nombre.toLowerCase());
        tr.innerHTML = `
            <td class="id-cell" style="text-align:left;">${idx + 1}</td>
            <td>
                <div class="user-chip">
                    <div class="avatar" style="${sinEjercicios ? 'opacity:0.5;' : ''}">${inicial}</div>
                    <div>
                        <button class="btn-link user-info-name" onclick="navegar('alumno','${escapeHtml(uid)}')">
                            ${escapeHtml(datos.nombre)}
                        </button>
                        ${sinEjercicios ? '<div class="user-info-email">Sin ejercicios aún</div>' : ''}
                    </div>
                </div>
            </td>
            <td style="color:var(--text-dim); font-size:0.85rem;">${escapeHtml(datos.email) || "—"}</td>
            <td style="text-align:center;">
                <span class="count-badge" style="${sinEjercicios ? 'opacity:0.45; background:rgba(160,174,192,0.1); border-color:rgba(160,174,192,0.2); color:var(--text-dim);' : ''}">
                    ${datos.total}
                </span>
            </td>
            <td>
                <button class="btn-nav" onclick="navegar('alumno','${escapeHtml(uid)}')">
                    <i class="fas fa-eye"></i> Ver ejercicios
                </button>
            </td>`;
        tbody.appendChild(tr);
    });
}

/**
 * MEJORA 2: Filtra dinámicamente las filas de la tabla de alumnos.
 * @param {string} query - Texto escrito en el buscador.
 */
function filtrarTablaAlumnos(query) {
    const texto = query.trim().toLowerCase();
    const filas = document.querySelectorAll("#tbodyAlumnos tr");
    const sinResultados = document.getElementById("sinResultadosBusqueda");
    let visibles = 0;

    filas.forEach(fila => {
        const nombre = fila.getAttribute("data-nombre") || "";
        const coincide = nombre.includes(texto);
        fila.style.display = coincide ? "" : "none";
        if (coincide) visibles++;
    });

    if (sinResultados) {
        sinResultados.style.display = visibles === 0 ? "block" : "none";
    }
}

// ── VISTA: DETALLE DE ALUMNO ───────────────────────────────────────────────────
function renderDetalleAlumno(uid) {
    const { ejercicios, usuarios } = _cache;

    // Filtrar ejercicios de este alumno
    const mios   = ejercicios.filter(e => e.usuarioId === uid || `nombre:${e.usuario}` === uid);
    const nombre = usuarios.get(uid)?.nombre || mios[0]?.usuario || uid;
    const email  = usuarios.get(uid)?.email || "";

    _mostrarBreadcrumb([
        { label: "Ejercicios", vista: "todos" },
        { label: "Por Alumno",  vista: "alumno" },
        { label: nombre,        vista: "alumno", id: uid },
    ]);

    // ── MEJORA 3: Determinar el origen para el botón Regresar ─────────────────
    // Si _origenDetalle fue establecido al navegar desde un grupo, lo usamos.
    // Caso contrario, regresamos a la lista de alumnos.
    const origenVista = _origenDetalle?.vista || "alumno";
    const origenId    = _origenDetalle?.id    || null;
    const textoRegreso = origenId ? "Volver al grupo" : "Volver a alumnos";
    const accionRegreso = origenId
        ? `navegar('${origenVista}','${escapeHtml(origenId)}')`
        : `navegar('alumno')`;

    const container = document.getElementById("vistaContainer");

    // Stat card de resumen
    const porHabilidad = mios.reduce((acc, e) => {
        acc[e.habilidad] = (acc[e.habilidad] || 0) + 1;
        return acc;
    }, {});
    const mejorHab = Object.entries(porHabilidad).sort((a,b) => b[1]-a[1])[0]?.[0] || "—";
    const avgScore = mios.length
        ? (mios.reduce((s, e) => s + (parseFloat(e.puntaje) || 0), 0) / mios.length).toFixed(1)
        : "—";

    container.innerHTML = `
        <!-- Botón Regresar -->
        <div style="margin-bottom: 20px;">
            <button class="btn-back" onclick="${accionRegreso}">
                <i class="fas fa-arrow-left"></i> ${textoRegreso}
            </button>
        </div>

        <div class="stats-row">
            <div class="stat-card">
                <div class="stat-label"><i class="fas fa-graduation-cap" style="margin-right:5px;"></i>Alumno</div>
                <div class="stat-value" style="font-size:1.3rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(nombre)}</div>
                <div class="stat-sub">${escapeHtml(email)}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label"><i class="fas fa-dumbbell" style="margin-right:5px;"></i>Ejercicios</div>
                <div class="stat-value">${mios.length}</div>
                <div class="stat-sub">total generados</div>
            </div>
            <div class="stat-card">
                <div class="stat-label"><i class="fas fa-star" style="margin-right:5px;"></i>Puntaje promedio</div>
                <div class="stat-value">${avgScore}</div>
                <div class="stat-sub">/ 10</div>
            </div>
            <div class="stat-card">
                <div class="stat-label"><i class="fas fa-fire" style="margin-right:5px;"></i>Habilidad top</div>
                <div class="stat-value" style="font-size:1.2rem;">${mios.length ? escapeHtml(mejorHab) : '—'}</div>
                <div class="stat-sub">${mios.length ? (porHabilidad[mejorHab] || 0) + ' ejercicios' : 'Sin datos'}</div>
            </div>
        </div>

        <div class="card">
            ${!mios.length ? `
                <div class="estado-tabla">
                    <i class="fas fa-book-open"></i>
                    <p>Este alumno no tiene ejercicios registrados todavía.</p>
                </div>
            ` : `
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Habilidad</th>
                            <th style="text-align:center;">Puntaje</th>
                            <th>Feedback</th>
                            <th>Acción</th>
                        </tr>
                    </thead>
                    <tbody id="tbodyDetalleAlumno"></tbody>
                </table>
            `}
        </div>`;

    if (!mios.length) return;

    const tbody = document.getElementById("tbodyDetalleAlumno");
    mios.forEach((e, idx) => {
        const hab      = e.habilidad || "—";
        const habCls   = _getHabilidadClass(hab);
        const scoreCls = _getScoreClass(e.puntaje);

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td class="id-cell">${idx + 1}</td>
            <td><span class="badge-hab ${habCls}">${escapeHtml(hab)}</span></td>
            <td style="text-align:center;"><span class="score-badge ${scoreCls}">${e.puntaje ?? "—"}</span></td>
            <td class="feedback-cell">${escapeHtml(e.feedback || "Sin feedback")}</td>
            <td>
                <button class="btn-delete" onclick="eliminarEjercicio('${escapeHtml(String(e.id))}', 'alumno', '${escapeHtml(uid)}')">
                    <i class="fas fa-trash-can"></i> Eliminar
                </button>
            </td>`;
        tbody.appendChild(tr);
    });
}

// ── VISTA: LISTA DE GRUPOS ─────────────────────────────────────────────────────
function renderVistaGrupos() {
    _mostrarBreadcrumb([
        { label: "Ejercicios", vista: "todos" },
        { label: "Por Grupo",  vista: "grupo" },
    ]);

    const { ejercicios, grupos, usuarios } = _cache;
    const container = document.getElementById("vistaContainer");

    if (!grupos.length) {
        container.innerHTML = `
            <div class="card">
                <div class="estado-tabla">
                    <i class="fas fa-layer-group"></i>
                    <p>No hay grupos creados todavía. Ve a la sección <a href="grupos.html" style="color:var(--primary);">Grupos</a> para crear uno.</p>
                </div>
            </div>`;
        return;
    }

    container.innerHTML = `
        <div class="card">
            <table>
                <thead>
                    <tr>
                        <th style="text-align:left; padding-left:15px;">#</th>
                        <th>Grupo</th>
                        <th style="text-align:center;">Alumnos</th>
                        <th style="text-align:center;">Ejercicios Totales</th>
                        <th style="text-align:center;">Promedio del Grupo</th>
                        <th>Acción</th>
                    </tr>
                </thead>
                <tbody id="tbodyGrupos"></tbody>
            </table>
        </div>`;

    const tbody = document.getElementById("tbodyGrupos");

    // Calcular total de ejercicios y promedio por grupo
    const gruposConTotal = grupos.map(g => {
        const alumnos   = g.alumnos || [];
        const ejGrupo   = ejercicios.filter(e => alumnos.includes(e.usuarioId));
        const total     = ejGrupo.length;
        const puntuados = ejGrupo.filter(e => e.puntaje != null && !isNaN(parseFloat(e.puntaje)));
        const promedio  = puntuados.length
            ? (puntuados.reduce((s, e) => s + parseFloat(e.puntaje), 0) / puntuados.length).toFixed(1)
            : null;
        return { ...g, total, promedio };
    }).sort((a, b) => b.total - a.total);

    gruposConTotal.forEach((g, idx) => {
        const cantAlumnos = (g.alumnos || []).length;
        const promCls     = g.promedio !== null ? _getScoreClass(g.promedio) : "score-mid";
        const promTxt     = g.promedio !== null ? g.promedio : "N/A";
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td class="id-cell" style="text-align:left;">${idx + 1}</td>
            <td>
                <button class="btn-link name-cell" onclick="navegar('grupo','${escapeHtml(g.id)}')">
                    <i class="fas fa-layer-group" style="margin-right:8px; opacity:0.6;"></i>${escapeHtml(g.nombre)}
                </button>
            </td>
            <td style="text-align:center;"><span class="count-badge">${cantAlumnos}</span></td>
            <td style="text-align:center;"><span class="count-badge">${g.total}</span></td>
            <td style="text-align:center;">
                <span class="score-badge ${promCls}" title="Promedio ponderado del grupo">${promTxt}</span>
            </td>
            <td>
                <button class="btn-nav" onclick="navegar('grupo','${escapeHtml(g.id)}')">
                    <i class="fas fa-eye"></i> Ver detalles
                </button>
            </td>`;
        tbody.appendChild(tr);
    });
}

// ── VISTA: DETALLE DE GRUPO ────────────────────────────────────────────────────
function renderDetalleGrupo(gid) {
    const { ejercicios, grupos, usuarios } = _cache;

    const grupo = grupos.find(g => g.id === gid);
    if (!grupo) {
        document.getElementById("vistaContainer").innerHTML = `
            <div class="card">
                <div class="estado-tabla">
                    <i class="fas fa-triangle-exclamation"></i>
                    <p>Grupo no encontrado.</p>
                </div>
            </div>`;
        return;
    }

    _mostrarBreadcrumb([
        { label: "Ejercicios", vista: "todos" },
        { label: "Por Grupo",  vista: "grupo" },
        { label: grupo.nombre, vista: "grupo", id: gid },
    ]);

    const alumnosIds     = grupo.alumnos || [];
    const ejerciciosGrupo = ejercicios.filter(e => alumnosIds.includes(e.usuarioId));

    // ── Métricas del grupo ────────────────────────────────────────────────────
    // Conteo y suma de puntajes por alumno
    const statsAlumno = new Map(); // uid → { total, suma, count }
    ejerciciosGrupo.forEach(e => {
        if (!e.usuarioId) return;
        const s = statsAlumno.get(e.usuarioId) || { total: 0, suma: 0, count: 0 };
        s.total++;
        const p = parseFloat(e.puntaje);
        if (!isNaN(p)) { s.suma += p; s.count++; }
        statsAlumno.set(e.usuarioId, s);
    });

    // Promedio ponderado del grupo completo
    const puntuadosGrupo = ejerciciosGrupo.filter(e => e.puntaje != null && !isNaN(parseFloat(e.puntaje)));
    const promedioGrupo  = puntuadosGrupo.length
        ? (puntuadosGrupo.reduce((s, e) => s + parseFloat(e.puntaje), 0) / puntuadosGrupo.length).toFixed(1)
        : null;


    const container = document.getElementById("vistaContainer");

    // ── Stats de cabecera ─────────────────────────────────────────────────────
    container.innerHTML = `
        <!-- Botón Regresar -->
        <div style="margin-bottom: 20px;">
            <button class="btn-back" onclick="navegar('grupo')">
                <i class="fas fa-arrow-left"></i> Volver a grupos
            </button>
        </div>

        <div class="stats-row">
            <div class="stat-card">
                <div class="stat-label"><i class="fas fa-layer-group" style="margin-right:5px;"></i>Grupo</div>
                <div class="stat-value" style="font-size:1.3rem;">${escapeHtml(grupo.nombre)}</div>
                <div class="stat-sub">ID: ${escapeHtml(gid)}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label"><i class="fas fa-users" style="margin-right:5px;"></i>Alumnos</div>
                <div class="stat-value">${alumnosIds.length}</div>
                <div class="stat-sub">integrantes</div>
            </div>
            <div class="stat-card">
                <div class="stat-label"><i class="fas fa-dumbbell" style="margin-right:5px;"></i>Ejercicios del grupo</div>
                <div class="stat-value">${ejerciciosGrupo.length}</div>
                <div class="stat-sub">total generados</div>
            </div>
            <div class="stat-card">
                <div class="stat-label"><i class="fas fa-chart-line" style="margin-right:5px;"></i>Promedio del grupo</div>
                <div class="stat-value" style="font-size:2rem;">
                    ${promedioGrupo !== null ? promedioGrupo : 'N/A'}
                </div>
                <div class="stat-sub">${promedioGrupo !== null ? '/ 10 — ponderado' : 'Sin ejercicios calificados'}</div>
            </div>
        </div>

        <div class="section-title">
            <i class="fas fa-user-graduate" style="margin-right:6px; color:var(--primary);"></i>
            Alumnos del grupo — haz clic en un nombre para ver sus ejercicios
        </div>

        <div class="card">
            <table>
                <thead>
                    <tr>
                        <th style="text-align:left; padding-left:15px;">#</th>
                        <th>Alumno</th>
                        <th>Email</th>
                        <th style="text-align:center;">Ejercicios</th>
                        <th style="text-align:center;">Promedio Individual</th>
                        <th>Acción</th>
                    </tr>
                </thead>
                <tbody id="tbodyDetalleGrupo"></tbody>
            </table>
        </div>`;

    const tbody = document.getElementById("tbodyDetalleGrupo");

    if (!alumnosIds.length) {
        tbody.innerHTML = `
            <tr><td colspan="6">
                <div class="estado-tabla" style="padding:30px 0;">
                    <i class="fas fa-user-slash"></i>
                    <p>No hay alumnos asignados a este grupo.</p>
                </div>
            </td></tr>`;
        return;
    }

    alumnosIds.forEach((uid, idx) => {
        const info    = usuarios.get(uid) || {};
        const nombre  = info.nombre || uid;
        const email   = info.email  || "—";
        const inicial = nombre.charAt(0).toUpperCase();
        const stats   = statsAlumno.get(uid) || { total: 0, suma: 0, count: 0 };
        const total   = stats.total;

        // Promedio individual de este alumno en este grupo
        const promInd    = stats.count > 0
            ? (stats.suma / stats.count).toFixed(1)
            : null;
        const promIndCls = promInd !== null ? _getScoreClass(promInd) : "score-mid";
        const promIndTxt = promInd !== null ? promInd : 'N/A';

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td class="id-cell" style="text-align:left;">${idx + 1}</td>
            <td>
                <div class="user-chip">
                    <div class="avatar">${inicial}</div>
                    <div>
                        <button class="btn-link user-info-name" onclick="navegar('alumno','${escapeHtml(uid)}')">
                            ${escapeHtml(nombre)}
                        </button>
                    </div>
                </div>
            </td>
            <td style="color:var(--text-dim); font-size:0.85rem;">${escapeHtml(email)}</td>
            <td style="text-align:center;">
                <span class="count-badge" style="${total === 0 ? 'opacity:0.45; background:rgba(160,174,192,0.1); border-color:rgba(160,174,192,0.2); color:var(--text-dim);' : ''}">${total}</span>
            </td>
            <td style="text-align:center;">
                <span class="score-badge ${promIndCls}" title="Promedio individual en este grupo">${promIndTxt}</span>
            </td>
            <td>
                <button class="btn-nav" onclick="navegar('alumno','${escapeHtml(uid)}')">
                    <i class="fas fa-eye"></i> Ver ejercicios
                </button>
            </td>`;
        tbody.appendChild(tr);
    });
}

// ── ELIMINAR EJERCICIO ─────────────────────────────────────────────────────────
/**
 * Elimina un ejercicio y recarga la vista actual (sin volver a "Todos").
 * @param {string}      id      - ID del ejercicio en Firestore.
 * @param {string}      vista   - Vista activa para recargar tras eliminar.
 * @param {string|null} extraId - UID o GID si estamos en una sub-vista.
 */
async function eliminarEjercicio(id, vista = "todos", extraId = null) {
    if (!confirm("¿Estás seguro de eliminar este ejercicio? Esta acción no se puede deshacer.")) return;

    try {
        const res = await fetch(`/api/resultados/${id}`, { method: "DELETE" });

        if (res.ok) {
            // Actualizar caché en memoria (evita refetch completo)
            _cache.ejercicios = _cache.ejercicios.filter(e => String(e.id) !== String(id));
            mostrarToast("Ejercicio eliminado correctamente.", "success");

            // Re-renderizar la vista actual
            if (vista === "alumno" && extraId) {
                renderDetalleAlumno(extraId);
            } else if (vista === "grupo" && extraId) {
                renderDetalleGrupo(extraId);
            } else if (vista === "alumno") {
                renderVistaAlumnos();
            } else if (vista === "grupo") {
                renderVistaGrupos();
            } else {
                renderVistaTodos();
            }
        } else {
            mostrarToast("No se pudo eliminar el ejercicio.", "error");
        }
    } catch (err) {
        console.error("[EJERCICIOS] Error al eliminar:", err);
        mostrarToast("Error de conexión al intentar eliminar.", "error");
    }
}

// ── Sistema de Toasts ──────────────────────────────────────────────────────────
function mostrarToast(mensaje, tipo = "success") {
    const container = document.getElementById("toastContainer");
    if (!container) return;

    const iconos = { success: "✅", error: "❌" };
    const toast  = document.createElement("div");
    toast.className = `toast ${tipo}`;
    toast.innerHTML = `
        <span class="toast-icon">${iconos[tipo] ?? "ℹ️"}</span>
        <span class="toast-msg">${mensaje}</span>
        <div class="toast-progress"></div>`;

    container.appendChild(toast);

    const timeout = setTimeout(() => {
        toast.classList.add("hide");
        toast.addEventListener("animationend", () => toast.remove(), { once: true });
    }, 3200);

    toast.addEventListener("click", () => {
        clearTimeout(timeout);
        toast.classList.add("hide");
        toast.addEventListener("animationend", () => toast.remove(), { once: true });
    });
}

// ── Utilidades ─────────────────────────────────────────────────────────────────
function escapeHtml(str) {
    return String(str ?? "")
        .replace(/&/g,  "&amp;")
        .replace(/</g,  "&lt;")
        .replace(/>/g,  "&gt;")
        .replace(/"/g,  "&quot;")
        .replace(/'/g,  "&#039;");
}