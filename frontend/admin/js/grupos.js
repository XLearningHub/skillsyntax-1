// js/grupos.js
// Módulo de Gestión de Grupos — SkillSyntax Admin
// Comunicación con Firestore a través del backend REST (/api/grupos)

// ── Guardia de autenticación ──────────────────────────────────────────────────
const usuarioSesion = JSON.parse(localStorage.getItem("usuario"));
if (!usuarioSesion || usuarioSesion.rol !== "admin") {
    window.location.href = "/index.html";
}

// ── Inicialización al cargar el DOM ──────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
    // Carga inicial: grupos + precarga de usuarios en paralelo
    if (document.getElementById("tablaGrupos")) {
        _precargarUsuarios(); // un solo fetch → window.usuariosGlobales
        cargarGrupos();
    }

    // ── Buscador dinámico en tiempo real ──────────────────────────────────────
    const buscador      = document.getElementById("buscadorGrupos");
    const sinResultados = document.getElementById("sinResultados");

    if (buscador) {
        buscador.addEventListener("input", () => {
            const query    = buscador.value.trim().toLowerCase();
            // Solo filas principales (ignora las .fila-acordeon que se insertan dinámicamente)
            const filas    = document.querySelectorAll("#tablaGrupos tr.fila-grupo");
            let   visibles = 0;

            filas.forEach(fila => {
                // col 0 = ID, col 1 = Nombre del Grupo
                const id     = (fila.cells[0]?.textContent ?? "").toLowerCase();
                const nombre = (fila.cells[1]?.textContent ?? "").toLowerCase();
                const match  = id.includes(query) || nombre.includes(query);

                // Al ocultar una fila principal, también ocultar su fila-acordeon
                const filaAcordeon = fila.nextElementSibling;
                fila.style.display = match ? "" : "none";
                if (filaAcordeon?.classList.contains("fila-acordeon")) {
                    filaAcordeon.style.display = match ? "" : "none";
                }
                if (match) visibles++;
            });

            // Mostrar/ocultar mensaje de "sin resultados"
            if (sinResultados) {
                const hayFilas = filas.length > 0;
                sinResultados.style.display = (hayFilas && visibles === 0) ? "block" : "none";
            }
        });
    }

    // ── Wiring del Modal de confirmación de borrado ───────────────────────────
    const modal     = document.getElementById("modalEliminar");
    const btnCancel = document.getElementById("btnModalCancelar");
    const btnOk     = document.getElementById("btnModalConfirmar");

    if (btnCancel) {
        btnCancel.addEventListener("click", () => {
            modal.classList.remove("active");
            document.body.style.overflow = '';
            _pendingDeleteId = null;
        });
    }

    if (btnOk) {
        btnOk.addEventListener("click", async () => {
            modal.classList.remove("active");
            document.body.style.overflow = '';
            if (_pendingDeleteId === null) return;

            const id = _pendingDeleteId;
            _pendingDeleteId = null;
            await _ejecutarEliminarGrupo(id);
        });
    }

    // Cerrar modal haciendo clic en el fondo oscuro
    if (modal) {
        modal.addEventListener("click", (e) => {
            if (e.target === modal) {
                modal.classList.remove("active");
                document.body.style.overflow = '';
                _pendingDeleteId = null;
            }
        });
    }

    // ── Wiring del Modal EDITAR GRUPO ─────────────────────────────────────────
    const modalEditar      = document.getElementById("modalEditarGrupo");
    const btnEditarCancel  = document.getElementById("btnEditGrupoCancelar");
    const btnEditarGuardar = document.getElementById("btnEditGrupoGuardar");

    if (btnEditarCancel) {
        btnEditarCancel.addEventListener("click", () => _cerrarModalEditarGrupo());
    }

    if (btnEditarGuardar) {
        btnEditarGuardar.addEventListener("click", () => _guardarEditarGrupo());
    }

    if (modalEditar) {
        modalEditar.addEventListener("click", (e) => {
            if (e.target === modalEditar) _cerrarModalEditarGrupo();
        });
    }

    const inputEditNombre = document.getElementById("editNombreGrupo");
    if (inputEditNombre) {
        inputEditNombre.addEventListener("keydown", (e) => {
            if (e.key === "Enter") _guardarEditarGrupo();
        });
    }

    // ── Wiring del Modal de CREAR GRUPO ───────────────────────────────────────
    const modalCrear      = document.getElementById("modalCrearGrupo");
    const inputNombre     = document.getElementById("inputNombreGrupo");
    const btnCrearCancel  = document.getElementById("btnCrearCancelar");
    const btnCrearGuardar = document.getElementById("btnCrearGuardar");

    // Cancelar → cerrar y limpiar
    if (btnCrearCancel) {
        btnCrearCancel.addEventListener("click", () => _cerrarModalCrear());
    }

    // Cerrar al hacer clic en el overlay
    if (modalCrear) {
        modalCrear.addEventListener("click", (e) => {
            if (e.target === modalCrear) _cerrarModalCrear();
        });
    }

    // Guardar con el botón
    if (btnCrearGuardar) {
        btnCrearGuardar.addEventListener("click", () => _guardarNuevoGrupo());
    }

    // Guardar con Enter desde el input
    if (inputNombre) {
        inputNombre.addEventListener("keydown", (e) => {
            if (e.key === "Enter") _guardarNuevoGrupo();
        });
    }

    // ── Wiring del Modal ASIGNAR ALUMNOS ─────────────────────────────────────────
    const modalAsignar      = document.getElementById("modalAsignarAlumnos");
    const btnAsignarCancel  = document.getElementById("btnAsignarCancelar");
    const btnAsignarSave    = document.getElementById("btnAsignarGuardar");
    const buscadorModal     = document.getElementById("buscadorModalAlumnos");
    const toggleMostrar     = document.getElementById("toggleMostrarTodos");

    if (btnAsignarCancel) {
        btnAsignarCancel.addEventListener("click", () => _cerrarModalAsignar());
    }

    if (btnAsignarSave) {
        btnAsignarSave.addEventListener("click", () => _guardarAsignacion());
    }

    // Cerrar al hacer clic en el overlay
    if (modalAsignar) {
        modalAsignar.addEventListener("click", (e) => {
            if (e.target === modalAsignar) _cerrarModalAsignar();
        });
    }

    // Filtrado en tiempo real por nombre/email
    if (buscadorModal) {
        buscadorModal.addEventListener("input", () => {
            _renderizarListaAlumnos();
        });
    }

    // Re-renderizar al cambiar el toggle
    if (toggleMostrar) {
        toggleMostrar.addEventListener("change", () => {
            _renderizarListaAlumnos();
        });
    }
});

// ── CARGAR GRUPOS ─────────────────────────────────────────────────────────────
/**
 * Consulta la colección "grupos" en Firestore (vía API REST) e inyecta
 * las filas resultantes en el tbody#tablaGrupos.
 * Además guarda el arreglo completo en window.gruposGlobales para
 * que el modal de asignación pueda saber en qué grupo está cada alumno
 * sin necesidad de nuevas peticiones al backend.
 */
async function cargarGrupos() {
    const tabla         = document.getElementById("tablaGrupos");
    const sinResultados = document.getElementById("sinResultados");

    // Estado de carga visual
    tabla.innerHTML = `
        <tr>
            <td colspan="4" style="color: var(--text-dim); padding: 40px; text-align: center;">
                <i class="fas fa-spinner fa-spin" style="margin-right: 8px;"></i> Cargando grupos...
            </td>
        </tr>`;
    if (sinResultados) sinResultados.style.display = "none";

    try {
        const res = await fetch("/api/grupos");

        if (!res.ok) {
            throw new Error(`Error HTTP ${res.status}`);
        }

        const grupos = await res.json();

        // ⭐ Guardamos globalmente para el modal de asignación
        window.gruposGlobales = grupos || [];

        tabla.innerHTML = "";

        if (!grupos || grupos.length === 0) {
            // Sin datos en Firestore
            if (sinResultados) sinResultados.style.display = "block";
            return;
        }

        grupos.forEach(grupo => {
            // Cantidad real de alumnos
            const cantidadAlumnos = grupo.alumnos ? grupo.alumnos.length : 0;

            // ── Crear la fila principal como elemento real (para poder adjuntar evento) ──
            const tr = document.createElement("tr");
            tr.className    = "fila-grupo";
            tr.dataset.id   = grupo.id;
            tr.innerHTML = `
                <td class="id-cell">${escapeHtml(grupo.id)}</td>
                <td class="name-cell">
                    <span class="name-cell-inner">
                        <span class="icono-flecha"><i class="fas fa-chevron-down"></i></span>
                        ${escapeHtml(grupo.nombre)}
                    </span>
                </td>
                <td>
                    <span class="badge role-user">${cantidadAlumnos} alumno${cantidadAlumnos !== 1 ? "s" : ""}</span>
                </td>
                <td>
                    <div class="action-cell">
                        <button class="btn-edit"
                                onclick="event.stopPropagation(); abrirModalEditarGrupo('${grupo.id}', '${escapeHtml(grupo.nombre)}')">
                            <i class="fas fa-pen"></i> Editar
                        </button>
                        <button class="btn-assign"
                                onclick="event.stopPropagation(); abrirModalAsignar('${grupo.id}')">
                            <i class="fas fa-user-plus"></i> Asignar
                        </button>
                        <button class="btn-delete"
                                onclick="event.stopPropagation(); eliminarGrupo('${grupo.id}')">
                            <i class="fas fa-trash-can"></i> Eliminar
                        </button>
                    </div>
                </td>`;

            // Evento acordeón en la fila
            tr.addEventListener("click", () => _toggleAcordeon(tr, grupo));

            tabla.appendChild(tr);
        });

    } catch (error) {
        console.error("[GRUPOS] Error al cargar:", error);
        tabla.innerHTML = `
            <tr>
                <td colspan="4" style="color: var(--danger); padding: 40px; text-align: center;">
                    <i class="fas fa-triangle-exclamation" style="margin-right: 8px;"></i>
                    Error al conectar con el servidor. Intenta de nuevo.
                </td>
            </tr>`;
    }
}

// ── CACHÉ GLOBAL DE USUARIOS ──────────────────────────────────────────────────
/**
 * Descarga una sola vez la lista de usuarios y la guarda en
 * window.usuariosGlobales como Map<id, {nombre, email}> para
 * que el acordeón pueda resolver nombres sin fetch adicional.
 */
async function _precargarUsuarios() {
    if (window.usuariosGlobales instanceof Map) return; // ya cargado
    try {
        const res      = await fetch("/api/usuarios");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const usuarios = await res.json();
        window.usuariosGlobales = new Map(
            (usuarios || []).map(u => [u.id, { nombre: u.nombre || "Sin nombre", email: u.email || "" }])
        );
    } catch (e) {
        console.warn("[GRUPOS] No se pudo precargar usuarios:", e);
        window.usuariosGlobales = new Map();
    }
}

// ── ACORDEÓN ──────────────────────────────────────────────────────────────────
/**
 * Abre o cierra el panel acordeón de una fila de grupo.
 * @param {HTMLTableRowElement} trGrupo - La fila <tr> principal.
 * @param {Object}              grupo   - Datos del grupo (id, nombre, alumnos).
 */
function _toggleAcordeon(trGrupo, grupo) {
    const estaAbierto = trGrupo.classList.contains("acordeon-abierto");

    if (estaAbierto) {
        // ── Cerrar ──
        trGrupo.classList.remove("acordeon-abierto");
        const filaAcordeon = trGrupo.nextElementSibling;
        if (filaAcordeon?.classList.contains("fila-acordeon")) {
            const inner = filaAcordeon.querySelector(".acordeon-inner");
            inner?.classList.remove("acordeon-open");
            inner?.addEventListener("transitionend", () => filaAcordeon.remove(), { once: true });
        }
    } else {
        // ── Abrir ──
        trGrupo.classList.add("acordeon-abierto");
        const filaAcordeon = document.createElement("tr");
        filaAcordeon.className = "fila-acordeon";
        filaAcordeon.innerHTML = `
            <td colspan="4">
                <div class="acordeon-inner">
                    <div class="acordeon-panel">
                        <p class="acordeon-titulo">
                            <i class="fas fa-users" style="margin-right:6px;"></i>
                            Integrantes del grupo
                        </p>
                        ${_construirChips(grupo.alumnos || [])}
                    </div>
                </div>
            </td>`;

        trGrupo.after(filaAcordeon);

        // Forzar reflow antes de añadir la clase para que arranque la transición
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                filaAcordeon.querySelector(".acordeon-inner")?.classList.add("acordeon-open");
            });
        });
    }
}

/**
 * Genera el HTML de chips de alumnos (o el mensaje vacío)
 * cruzando los IDs con window.usuariosGlobales.
 * @param {string[]} alumnosIds
 * @returns {string} HTML listo para inyectar
 */
function _construirChips(alumnosIds) {
    if (!alumnosIds || alumnosIds.length === 0) {
        return `
            <div class="acordeon-vacio">
                <i class="fas fa-user-slash"></i>
                No hay alumnos asignados a este grupo aún.
            </div>`;
    }

    const cache = window.usuariosGlobales instanceof Map
        ? window.usuariosGlobales
        : new Map();

    const chips = alumnosIds.map(uid => {
        const info    = cache.get(uid);
        const nombre  = escapeHtml(info?.nombre ?? uid);
        const email   = escapeHtml(info?.email  ?? "");
        const inicial = (info?.nombre ?? uid).charAt(0).toUpperCase();

        return `
            <li class="acordeon-chip" title="${email || nombre}">
                <span class="acordeon-chip-avatar">${inicial}</span>
                <span>${nombre}</span>
                ${email ? `<span class="acordeon-chip-email">${email}</span>` : ""}
            </li>`;
    }).join("");

    return `<ul class="acordeon-lista">${chips}</ul>`;
}

// ── CREAR GRUPO ───────────────────────────────────────────────────────────────
/**
 * Abre el modal de creación de grupo y enfoca el input.
 */
function irCrearGrupo() {
    const modalCrear  = document.getElementById("modalCrearGrupo");
    const inputNombre = document.getElementById("inputNombreGrupo");
    if (!modalCrear) return;

    inputNombre.value = "";          // limpiar por si quedó texto anterior
    modalCrear.classList.add("active");
    document.body.style.overflow = 'hidden';
    // Pequeño delay para que la animación del modal termine antes del focus
    setTimeout(() => inputNombre?.focus(), 80);
}

/**
 * Cierra el modal de creación y limpia el input.
 */
function _cerrarModalCrear() {
    const modalCrear  = document.getElementById("modalCrearGrupo");
    const inputNombre = document.getElementById("inputNombreGrupo");
    if (modalCrear) modalCrear.classList.remove("active");
    if (inputNombre) inputNombre.value = "";
    document.body.style.overflow = '';
}

/**
 * Lee el input, valida, hace POST a /api/grupos, cierra el modal y recarga.
 */
async function _guardarNuevoGrupo() {
    const inputNombre     = document.getElementById("inputNombreGrupo");
    const btnCrearGuardar = document.getElementById("btnCrearGuardar");
    const nombreTrimmed   = (inputNombre?.value ?? "").trim();

    if (!nombreTrimmed) {
        // Sacude el input para feedback visual
        inputNombre?.classList.add("shake");
        inputNombre?.addEventListener("animationend", () =>
            inputNombre.classList.remove("shake"), { once: true }
        );
        mostrarToast("El nombre del grupo no puede estar vacío.", "error");
        return;
    }

    // Estado de carga en el botón
    const textoOriginal = btnCrearGuardar.innerHTML;
    btnCrearGuardar.disabled  = true;
    btnCrearGuardar.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Guardando...`;

    try {
        const res = await fetch("/api/grupos", {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ nombre: nombreTrimmed }),
        });

        const data = await res.json();

        if (res.ok && data.success) {
            _cerrarModalCrear();
            mostrarToast(`Grupo "${escapeHtml(nombreTrimmed)}" creado correctamente.`, "success");
            cargarGrupos();
        } else {
            mostrarToast(data.error || "No se pudo crear el grupo.", "error");
        }
    } catch (error) {
        console.error("[GRUPOS] Error al crear:", error);
        mostrarToast("Error de conexión al intentar crear el grupo.", "error");
    } finally {
        // Restaurar botón siempre
        btnCrearGuardar.disabled  = false;
        btnCrearGuardar.innerHTML = textoOriginal;
    }
}

// ── EDITAR GRUPO ──────────────────────────────────────────────────────────────
let _pendingEditId     = null;
let _pendingEditNombre = "";

/**
 * Abre el modal de edición inyectando el nombre actual en el input.
 * @param {string} id           - ID del documento en Firestore.
 * @param {string} nombreActual - Nombre actual del grupo.
 */
function abrirModalEditarGrupo(id, nombreActual) {
    _pendingEditId     = id;
    _pendingEditNombre = nombreActual;

    const modal = document.getElementById("modalEditarGrupo");
    const input = document.getElementById("editNombreGrupo");
    if (!modal || !input) return;

    input.value = nombreActual;
    modal.classList.add("active");
    document.body.style.overflow = 'hidden';
    setTimeout(() => input.focus(), 80);
}

/**
 * Cierra el modal de edición y limpia el estado.
 */
function _cerrarModalEditarGrupo() {
    const modal = document.getElementById("modalEditarGrupo");
    const input = document.getElementById("editNombreGrupo");
    if (modal) modal.classList.remove("active");
    if (input) input.value = "";
    document.body.style.overflow = '';
    _pendingEditId     = null;
    _pendingEditNombre = "";
}

/**
 * Recolecta el nuevo nombre, hace PUT /api/grupos/:id,
 * cierra el modal, muestra toast de éxito y recarga la vista.
 */
async function _guardarEditarGrupo() {
    const input       = document.getElementById("editNombreGrupo");
    const btnSave     = document.getElementById("btnEditGrupoGuardar");
    const nuevoNombre = (input?.value ?? "").trim();

    if (!nuevoNombre) {
        input?.classList.add("shake");
        input?.addEventListener("animationend", () =>
            input.classList.remove("shake"), { once: true }
        );
        mostrarToast("El nombre del grupo no puede estar vacío.", "error");
        return;
    }

    if (!_pendingEditId) return;

    const textoOriginal = btnSave.innerHTML;
    btnSave.disabled    = true;
    btnSave.innerHTML   = `<i class="fas fa-spinner fa-spin"></i> Guardando...`;

    try {
        const res = await fetch(`/api/grupos/${_pendingEditId}`, {
            method:  "PUT",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ nombre: nuevoNombre }),
        });

        const data = await res.json();

        if (res.ok && data.success) {
            _cerrarModalEditarGrupo();
            mostrarToast(`Grupo renombrado a "${escapeHtml(nuevoNombre)}" correctamente.`, "success");
            cargarGrupos();
        } else {
            mostrarToast(data.error || "No se pudo actualizar el grupo.", "error");
        }
    } catch (error) {
        console.error("[GRUPOS] Error al editar grupo:", error);
        mostrarToast("Error de conexión al intentar editar el grupo.", "error");
    } finally {
        btnSave.disabled  = false;
        btnSave.innerHTML = textoOriginal;
    }
}

// ── ELIMINAR GRUPO ────────────────────────────────────────────────────────────
// ID del documento pendiente de borrar (usado por el modal de confirmación)
let _pendingDeleteId = null;

/**
 * Muestra el modal de confirmación antes de borrar.
 * @param {string} id - ID del documento en Firestore.
 */
function eliminarGrupo(id) {
    _pendingDeleteId = id;
    const modal = document.getElementById("modalEliminar");
    if (modal) modal.classList.add("active");
}

/**
 * Realiza el DELETE en Firestore (vía API REST) y recarga la tabla.
 * Llamado por el botón "Sí, eliminar" del modal.
 * @param {string} id - ID del documento a borrar.
 */
async function _ejecutarEliminarGrupo(id) {
    try {
        const res = await fetch(`/api/grupos/${id}`, {
            method: "DELETE",
        });

        const data = await res.json();

        if (res.ok && data.success) {
            mostrarToast("Grupo eliminado correctamente.", "success");
            cargarGrupos();
        } else {
            mostrarToast(data.error || "No se pudo eliminar el grupo.", "error");
        }
    } catch (error) {
        console.error("[GRUPOS] Error al eliminar:", error);
        mostrarToast("Error de conexión al intentar eliminar el grupo.", "error");
    }
}

// ── SISTEMA DE TOASTS ─────────────────────────────────────────────────────────
/**
 * Muestra una notificación flotante (toast) en la esquina inferior derecha.
 * @param {string} mensaje - Texto a mostrar.
 * @param {'success'|'error'} tipo - Variante visual del toast.
 */
function mostrarToast(mensaje, tipo = "success") {
    const container = document.getElementById("toastContainer");
    if (!container) return;

    const iconos = { success: "✅", error: "❌" };

    const toast = document.createElement("div");
    toast.className = `toast ${tipo}`;
    toast.innerHTML = `
        <span class="toast-icon">${iconos[tipo] ?? "ℹ️"}</span>
        <span class="toast-msg">${mensaje}</span>
        <div class="toast-progress"></div>
    `;

    container.appendChild(toast);

    // Auto-destruir tras 3.2 s + 0.3 s de animación de salida
    const timeout = setTimeout(() => {
        toast.classList.add("hide");
        toast.addEventListener("animationend", () => toast.remove(), { once: true });
    }, 3200);

    // Cierre manual al hacer clic
    toast.addEventListener("click", () => {
        clearTimeout(timeout);
        toast.classList.add("hide");
        toast.addEventListener("animationend", () => toast.remove(), { once: true });
    });
}

// ── UTILIDADES ────────────────────────────────────────────────────────────────
/**
 * Escapa caracteres HTML especiales para prevenir XSS al inyectar texto en el DOM.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
    return String(str)
        .replace(/&/g,  "&amp;")
        .replace(/</g,  "&lt;")
        .replace(/>/g,  "&gt;")
        .replace(/"/g,  "&quot;")
        .replace(/'/g,  "&#039;");
}

// ── ASIGNAR ALUMNOS ───────────────────────────────────────────────────────────
// ID del grupo cuya asignación está en curso
let _pendingAsignarId    = null;
/** Caché de usuarios obtenidos del backend (reutilizada por el render) */
let _usuariosCacheModal  = [];
/** Alumnos ya en el grupo que se está editando */
let _alumnosActualesSet  = new Set();

/**
 * Cierra el modal de asignación y limpia el estado.
 */
function _cerrarModalAsignar() {
    const modal = document.getElementById("modalAsignarAlumnos");
    if (modal) modal.classList.remove("active");
    document.body.style.overflow = '';
    _pendingAsignarId   = null;
    _usuariosCacheModal = [];
    _alumnosActualesSet = new Set();
    // Limpiar controles
    const buscador = document.getElementById("buscadorModalAlumnos");
    const toggle   = document.getElementById("toggleMostrarTodos");
    if (buscador) buscador.value    = "";
    if (toggle)   toggle.checked   = false;
}

/**
 * Construye el mapa grupoId → nombre a partir de window.gruposGlobales.
 * @returns {Map<string, string>} mapa userId → nombreGrupo (solo si está en otro grupo)
 */
function _mapearAlumnosOcupados() {
    /** @type {Map<string, string>} */
    const ocupados = new Map();
    const grupos   = window.gruposGlobales || [];

    grupos.forEach(grupo => {
        // Saltar el grupo que estamos editando
        if (grupo.id === _pendingAsignarId) return;
        (grupo.alumnos || []).forEach(uid => {
            ocupados.set(uid, grupo.nombre || grupo.id);
        });
    });

    return ocupados;
}

/**
 * Renderiza (o re-renderiza) la lista de alumnos en el modal.
 * Respeta el estado actual del buscador y del toggle.
 * Llamada tanto en la carga inicial como cada vez que cambia un filtro.
 */
function _renderizarListaAlumnos() {
    const lista       = document.getElementById("listaAlumnosModal");
    const sinMsg      = document.getElementById("modalSinResultados");
    const buscador    = document.getElementById("buscadorModalAlumnos");
    const toggle      = document.getElementById("toggleMostrarTodos");

    if (!lista) return;

    const query         = (buscador?.value ?? "").trim().toLowerCase();
    const mostrarTodos  = toggle?.checked ?? false;
    const ocupadosMap   = _mapearAlumnosOcupados();

    // Filtrar usuarios según el toggle y la búsqueda
    const usuariosFiltrados = _usuariosCacheModal.filter(usuario => {
        const enEsteGrupo = _alumnosActualesSet.has(usuario.id);
        const ocupado     = ocupadosMap.has(usuario.id);
        const libre       = !ocupado;

        // Filtro de visibilidad: solo mostrar los libres o los del grupo actual
        // a menos que el toggle esté encendido
        const visible = mostrarTodos || libre || enEsteGrupo;
        if (!visible) return false;

        // Filtro de búsqueda
        if (query) {
            const nombre = (usuario.nombre || "").toLowerCase();
            const email  = (usuario.email  || "").toLowerCase();
            if (!nombre.includes(query) && !email.includes(query)) return false;
        }

        return true;
    });

    if (usuariosFiltrados.length === 0) {
        lista.innerHTML = "";
        if (sinMsg) { sinMsg.style.display = "flex"; }
        return;
    }

    if (sinMsg) sinMsg.style.display = "none";

    lista.innerHTML = usuariosFiltrados.map(usuario => {
        const estaAsignado = _alumnosActualesSet.has(usuario.id);
        const enOtroGrupo  = ocupadosMap.has(usuario.id);
        const nombreGrupo  = enOtroGrupo ? escapeHtml(ocupadosMap.get(usuario.id)) : "";

        const nombre = escapeHtml(usuario.nombre || "Sin nombre");
        const email  = escapeHtml(usuario.email  || "");
        const rol    = escapeHtml(usuario.rol    || "user");

        // Clases extra según el estado del alumno
        const claseExtra = enOtroGrupo ? " alumno-ocupado" : "";
        const checkedAttr = estaAsignado ? " checked" : "";
        const itemCheckedClass = estaAsignado ? " checked" : "";

        // Badge de estado: «ya en otro grupo» vs rol normal
        const badgeHtml = enOtroGrupo
            ? `<span class="badge-ocupado"><i class="fas fa-exclamation-triangle"></i> Otro grupo</span>`
            : `<span class="alumno-item-badge">${rol}</span>`;

        // Tooltip informativo cuando está en otro grupo
        const titleAttr = enOtroGrupo
            ? `title="Ya está en: ${nombreGrupo}"`
            : "";

        return `
            <label class="alumno-item${claseExtra}${itemCheckedClass}" for="chk-${usuario.id}" ${titleAttr}>
                <input
                    type="checkbox"
                    id="chk-${usuario.id}"
                    value="${usuario.id}"
                    ${checkedAttr}
                    onchange="this.closest('.alumno-item').classList.toggle('checked', this.checked)"
                >
                <div class="alumno-item-info">
                    <span class="alumno-item-name">${nombre}</span>
                    <span class="alumno-item-email">${email}</span>
                </div>
                ${badgeHtml}
            </label>`;
    }).join("");
}

/**
 * Abre el modal de asignación de alumnos para un grupo específico.
 * Lee los alumnos actuales de window.gruposGlobales (sin parámetro extra),
 * hace fetch a /api/usuarios, guarda la caché y renderiza la lista.
 *
 * @param {string} idGrupo - ID del documento de grupo en Firestore.
 */
async function abrirModalAsignar(idGrupo) {
    _pendingAsignarId = idGrupo;

    const modal   = document.getElementById("modalAsignarAlumnos");
    const lista   = document.getElementById("listaAlumnosModal");
    const btnSave = document.getElementById("btnAsignarGuardar");
    const sinMsg  = document.getElementById("modalSinResultados");

    // Resetear controles de filtro
    const buscador = document.getElementById("buscadorModalAlumnos");
    const toggle   = document.getElementById("toggleMostrarTodos");
    if (buscador) buscador.value  = "";
    if (toggle)   toggle.checked = false;
    if (sinMsg)   sinMsg.style.display = "none";

    if (!modal || !lista) return;

    // Leer alumnos actuales directamente desde el caché global (sin necesidad de parámetro)
    const grupoActual   = (window.gruposGlobales || []).find(g => g.id === idGrupo);
    const alumnosActuales = grupoActual?.alumnos || [];

    // Guardar en el estado del módulo
    _alumnosActualesSet = new Set(alumnosActuales);

    // Mostrar modal con spinner de carga
    lista.innerHTML = `
        <div class="modal-loading">
            <i class="fas fa-spinner fa-spin"></i>
            Cargando usuarios...
        </div>`;
    btnSave.disabled = true;
    modal.classList.add("active");
    document.body.style.overflow = 'hidden';

    try {
        const res = await fetch("/api/usuarios");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const usuarios = await res.json();

        if (!usuarios || usuarios.length === 0) {
            lista.innerHTML = `
                <div class="modal-loading">
                    <i class="fas fa-users-slash"></i>
                    No hay usuarios registrados.
                </div>`;
            return;
        }

        // Cachear usuarios y renderizar
        _usuariosCacheModal = usuarios;
        _renderizarListaAlumnos();
        btnSave.disabled = false;

    } catch (error) {
        console.error("[GRUPOS] Error al cargar usuarios para asignar:", error);
        lista.innerHTML = `
            <div class="modal-loading" style="color: var(--danger);">
                <i class="fas fa-triangle-exclamation"></i>
                Error al cargar usuarios. Intenta de nuevo.
            </div>`;
    }
}

/**
 * Recolecta los checkboxes marcados y hace PUT /api/grupos/:id/alumnos.
 * Cierra el modal, muestra toast y recarga la tabla al finalizar.
 */
async function _guardarAsignacion() {
    const modal   = document.getElementById("modalAsignarAlumnos");
    const btnSave = document.getElementById("btnAsignarGuardar");

    if (!_pendingAsignarId) return;

    // Recolectar IDs marcados
    const checkboxes  = document.querySelectorAll("#listaAlumnosModal input[type='checkbox']:checked");
    const alumnosIds  = Array.from(checkboxes).map(cb => cb.value);

    // Estado de carga en el botón
    const textoOriginal   = btnSave.innerHTML;
    btnSave.disabled      = true;
    btnSave.innerHTML     = `<i class="fas fa-spinner fa-spin"></i> Guardando...`;

    try {
        const res = await fetch(`/api/grupos/${_pendingAsignarId}/alumnos`, {
            method:  "PUT",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ alumnos: alumnosIds }),
        });

        const data = await res.json();

        if (res.ok && data.success) {
            modal.classList.remove("active");
            _pendingAsignarId = null;
            mostrarToast(
                `${alumnosIds.length} alumno${alumnosIds.length !== 1 ? "s" : ""} asignado${alumnosIds.length !== 1 ? "s" : ""} correctamente.`,
                "success"
            );
            cargarGrupos();
        } else {
            mostrarToast(data.error || "No se pudo guardar la asignación.", "error");
        }
    } catch (error) {
        console.error("[GRUPOS] Error al guardar asignación:", error);
        mostrarToast("Error de conexión al intentar guardar.", "error");
    } finally {
        btnSave.disabled  = false;
        btnSave.innerHTML = textoOriginal;
    }
}
