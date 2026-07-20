// js/reportes.js

// ─── Referencias a instancias activas de Chart.js (en window para acceso global seguro)
window.chartUsuarios    = window.chartUsuarios    ?? null;
window.chartHabilidades = window.chartHabilidades ?? null;

// ─── Datos crudos cacheados (ya no se usan para filtrar; solo como referencia)
let rawUsuarios    = [];
let rawHabilidades = [];


// ─── Paleta profesional (una por habilidad canónica) ─────────────────────────
const SKILL_COLORS = {
    Reading:   "#00c2cb",   // cyan
    Listening: "#9b5de5",   // púrpura
    Speaking:  "#f15bb5",   // rosa
    Grammar:   "#ffd166",   // ámbar dorado
    Writing:   "#06d6a0",   // verde menta
};

// ─── Las 5 categorías canónicas en orden fijo ────────────────────────────────
const CANONICAL_SKILLS = ["Reading", "Listening", "Speaking", "Grammar", "Writing"];

/**
 * Normaliza cualquier etiqueta del backend a una de las 5 categorías.
 * Cubre aliases históricos (writing → Writing, grammar antigua, etc.).
 */
function normalizeSkill(raw) {
    const key = (raw || "").toLowerCase().trim();
    const MAP = {
        reading:   "Reading",
        listen:    "Listening",
        listening: "Listening",
        speak:     "Speaking",
        speaking:  "Speaking",
        grammar:   "Grammar",
        // registros viejos donde writing se mostraba como "Grammar" en frontend
        writing:   "Writing",
        write:     "Writing",
    };
    return MAP[key] || "Writing";
}

// ─── Opciones comunes ────────────────────────────────────────────────────────
const opcionesComunes = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 500, easing: "easeInOutQuart" },
    plugins: {
        legend: {
            position: "bottom",
            labels: {
                color: "#a0aec0",
                font: { family: "Inter", size: 12, weight: "500" },
                padding: 25,
                usePointStyle: true,
                pointStyle: "circle",
            },
        },
        tooltip: {
            backgroundColor: "#0d1b2e",
            titleFont: { family: "Inter", size: 14, weight: "600" },
            bodyFont:  { family: "Inter", size: 13 },
            padding: 14,
            borderColor: "rgba(0, 194, 203, 0.35)",
            borderWidth: 1,
            displayColors: true,
        },
    },
};

// ─── Utilidad: calcula la fecha mínima según los días elegidos ────────────────
/**
 * @param {string|number} dias  – "7", "30" o "all"
 * @returns {Date|null}         – fecha límite inferior, o null si es "all"
 */
function calcularFechaMinima(dias) {
    if (dias === "all") return null;
    const fecha = new Date();
    fecha.setDate(fecha.getDate() - Number(dias));
    fecha.setHours(0, 0, 0, 0);
    return fecha;
}

// ─── Parseo seguro de cualquier formato de fecha ──────────────────────────────
/**
 * Convierte el valor de fecha del item (ISO string, Firestore Timestamp,
 * epoch en ms o epoch en segundos) a un objeto Date nativo válido.
 * Devuelve null si el valor está ausente o no es parseable.
 * @param {*} val
 * @returns {Date|null}
 */
function parsearFecha(val) {
    if (!val) return null;

    // Firestore Timestamp objeto: { seconds: N, nanoseconds: M }
    if (val && typeof val === "object" && typeof val.seconds === "number") {
        return new Date(val.seconds * 1000);
    }

    // Número: si es < 1e10 se asume segundos Unix; si es >= 1e10, milisegundos
    if (typeof val === "number") {
        return new Date(val < 1e10 ? val * 1000 : val);
    }

    // String ISO u otros formatos reconocibles por Date
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
}

// ─── Actualiza el badge de estado del filtro ─────────────────────────────────
function actualizarBadge(valor, loading = false) {
    const badge = document.getElementById("filterBadge");
    if (!badge) return;
    const etiquetas = { "7": "Últimos 7 días", "30": "Último mes", "all": "Histórico" };
    badge.textContent = loading ? "Actualizando…" : (etiquetas[valor] ?? valor);
    badge.classList.toggle("loading", loading);
}


// ─── GRÁFICA DE BARRAS ───────────────────────────────────────────────────────
/**
 * Pide al backend los datos YA FILTRADOS por período y dibuja la gráfica.
 * REGLA CRÍTICA: destroy() antes de crear nueva instancia → elimina ghost-hover.
 * @param {string} filtro  – "7", "30" o "all"
 */
async function renderGraficaUsuarios(filtro) {
    const canvas = document.getElementById("graficaUsuarios");
    if (!canvas) return;

    // ✔ Guard seguro usando window.* → evita crash si la instancia es null/undefined
    if (window.chartUsuarios) {
        window.chartUsuarios.destroy();
        window.chartUsuarios = null;
    }

    // Construir URL: sólo añadir ?dias=N cuando NO es "all"
    const url = filtro !== "all"
        ? `/api/resultados/reporte-usuarios?dias=${filtro}`
        : "/api/resultados/reporte-usuarios";

    let datos = [];
    try {
        const res  = await fetch(url);
        const json = await res.json();
        // Guard: si el servidor devuelve un objeto de error en lugar de un array
        datos = Array.isArray(json) ? json : [];
        if (!Array.isArray(json)) console.error("[Reportes] Respuesta inesperada reporte-usuarios:", json);

        // ▶ DEBUG: inspección de la respuesta del backend
        console.log(`[Reportes] reporte-usuarios (filtro=${filtro}):`, datos);
    } catch (err) {
        console.error("[Reportes] Error fetch reporte-usuarios:", err);
    }

    // Empty-state
    if (datos.length === 0) {
        console.warn(`[Reportes] Sin datos de usuarios para el rango "${filtro}".`);
    } else {
        console.log(`[DEBUG reporte-usuarios] ${datos.length} items. Primer item:`, datos[0]);
    }

    const nombres = datos.length > 0 ? datos.map((d) => d.usuario) : ["Sin datos"];
    const totales = datos.length > 0 ? datos.map((d) => d.total)   : [0];

    // ✔ Reset del canvas: garantiza contexto 2D limpio tras destroy()
    // (Chart.js puede dejar estado sucio en el canvas al destruirse)
    canvas.width = canvas.width; // eslint-disable-line no-self-assign

    const ctx  = canvas.getContext("2d");
    console.log("[DEBUG canvas usuarios] contexto obtenido:", !!ctx);

    const grad = ctx.createLinearGradient(0, 0, 0, 350);
    grad.addColorStop(0, "rgba(0, 194, 203, 0.95)");
    grad.addColorStop(1, "rgba(155, 93, 229, 0.50)");

    window.chartUsuarios = new Chart(canvas, {
        type: "bar",
        data: {
            labels: nombres,
            datasets: [{
                label: "Ejercicios completados",
                data:  totales,
                backgroundColor:      grad,
                borderRadius:         12,
                borderSkipped:        false,
                hoverBackgroundColor: "rgba(0, 194, 203, 1)",
            }],
        },
        options: {
            ...opcionesComunes,
            plugins: {
                ...opcionesComunes.plugins,
                tooltip: {
                    ...opcionesComunes.plugins.tooltip,
                    callbacks: { label: (ctx) => `  Ejercicios: ${ctx.parsed.y}` },
                },
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: "rgba(255,255,255,0.04)", drawBorder: false },
                    ticks:  { color: "#a0aec0", font: { family: "Inter" } },
                    border: { dash: [4, 4] },
                },
                x: {
                    grid:   { display: false },
                    ticks:  { color: "#a0aec0", font: { family: "Inter" } },
                    border: { display: false },
                },
            },
        },
    });
}

// ─── GRÁFICA DE DONA ─────────────────────────────────────────────────────────
/**
 * Pide al backend los datos YA FILTRADOS por período y dibuja la dona.
 * REGLA CRÍTICA: destroy() antes de crear nueva instancia → elimina ghost-hover.
 * @param {string} filtro  – "7", "30" o "all"
 */
async function renderGraficaHabilidades(filtro) {
    const canvas = document.getElementById("graficaHabilidades");
    if (!canvas) return;

    // ✔ Guard seguro usando window.* → evita crash si la instancia es null/undefined
    if (window.chartHabilidades) {
        window.chartHabilidades.destroy();
        window.chartHabilidades = null;
    }

    // Construir URL: sólo añadir ?dias=N cuando NO es "all"
    const url = filtro !== "all"
        ? `/api/resultados/reporte-habilidades?dias=${filtro}`
        : "/api/resultados/reporte-habilidades";

    let datos = [];
    try {
        const res  = await fetch(url);
        const json = await res.json();
        // Guard: si el servidor devuelve un objeto de error en lugar de un array
        datos = Array.isArray(json) ? json : [];
        if (!Array.isArray(json)) console.error("[Reportes] Respuesta inesperada reporte-habilidades:", json);

        // ▶ DEBUG: inspección de la respuesta del backend
        console.log(`[Reportes] reporte-habilidades (filtro=${filtro}):`, datos);
    } catch (err) {
        console.error("[Reportes] Error fetch reporte-habilidades:", err);
    }

    // Empty-state
    if (datos.length === 0) {
        console.warn(`[Reportes] Sin datos de habilidades para el rango "${filtro}".`);
    } else {
        console.log(`[DEBUG reporte-habilidades] ${datos.length} items. Primer item:`, datos[0]);
    }

    // Acumular en las 5 categorías
    const acumulado = {};
    CANONICAL_SKILLS.forEach((s) => (acumulado[s] = 0));
    datos.forEach((d) => {
        const skill = normalizeSkill(d.habilidad);
        acumulado[skill] += Number(d.total) || 0;
    });

    const labels   = CANONICAL_SKILLS;
    const totales  = CANONICAL_SKILLS.map((s) => acumulado[s]);
    const colors   = CANONICAL_SKILLS.map((s) => SKILL_COLORS[s]);
    const sumTotal = totales.reduce((a, b) => a + b, 0);

    // ✔ Reset del canvas: garantiza contexto 2D limpio tras destroy()
    canvas.width = canvas.width; // eslint-disable-line no-self-assign

    window.chartHabilidades = new Chart(canvas, {
        type: "doughnut",
        data: {
            labels,
            datasets: [{
                data:             totales,
                backgroundColor:  colors,
                borderWidth:      3,
                borderColor:      "#060e1a",
                hoverOffset:      22,
                hoverBorderWidth: 4,
                hoverBorderColor: "rgba(255,255,255,0.15)",
                offset:           8,
            }],
        },
        options: {
            ...opcionesComunes,
            cutout: "72%",
            plugins: {
                ...opcionesComunes.plugins,
                legend: { ...opcionesComunes.plugins.legend, position: "right" },
                tooltip: {
                    ...opcionesComunes.plugins.tooltip,
                    callbacks: {
                        label: (ctx) => {
                            const val = ctx.parsed ?? 0;
                            const pct = sumTotal > 0
                                ? ((val / sumTotal) * 100).toFixed(1)
                                : "0.0";
                            return `  ${ctx.label}: ${val}  (${pct}%)`;
                        },
                    },
                },
            },
        },
    });
}

// ─── Listener del filtro ──────────────────────────────────────────────────────
function inicializarFiltro() {
    const select = document.getElementById("dateFilter");
    if (!select) return;

    select.addEventListener("change", async (e) => {
        const filtro = e.target.value;
        actualizarBadge(filtro, true);

        // Las funciones de render son async → esperamos ambas antes de quitar el spinner
        await Promise.all([
            renderGraficaUsuarios(filtro),
            renderGraficaHabilidades(filtro),
        ]);

        actualizarBadge(filtro, false);
    });
}

// ─── Bootstrap ───────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
    if (!document.getElementById("graficaUsuarios")) return;

    // Render inicial con el filtro por defecto ("all" – Histórico)
    const filtroInicial = document.getElementById("dateFilter")?.value ?? "all";
    await Promise.all([
        renderGraficaUsuarios(filtroInicial),
        renderGraficaHabilidades(filtroInicial),
    ]);

    inicializarFiltro();
});