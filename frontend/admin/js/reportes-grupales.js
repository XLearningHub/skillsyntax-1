// js/reportes-grupales.js
// Módulo de analítica comparativa por grupos de clase.
// Gráficas:
//   1. Barras  → Desempeño Promedio por Grupo (puntaje medio de todos sus alumnos)
//   2. Dona    → Distribución de Ejercicios por Grupo (% del total de la plataforma)

// ── Instancias activas de Chart.js ──────────────────────────────────────────
window.chartDesempeno    = window.chartDesempeno    ?? null;
window.chartDistribucion = window.chartDistribucion ?? null;

// ── Paleta de colores para grupos (se cicla si hay más de N grupos) ──────────
const GRUPO_COLORS = [
    "#9b5de5",  // púrpura
    "#00c2cb",  // cyan
    "#f15bb5",  // rosa
    "#ffd166",  // ámbar
    "#06d6a0",  // verde menta
    "#ef476f",  // rojo coral
    "#118ab2",  // azul acero
    "#ffa552",  // naranja suave
];

function colorForIndex(i) {
    return GRUPO_COLORS[i % GRUPO_COLORS.length];
}

// ── Opciones base compartidas ────────────────────────────────────────────────
const baseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 600, easing: "easeInOutQuart" },
    plugins: {
        legend: {
            position: "bottom",
            labels: {
                color: "#a0aec0",
                font: { family: "Inter", size: 12, weight: "500" },
                padding: 22,
                usePointStyle: true,
                pointStyle: "circle",
            },
        },
        tooltip: {
            backgroundColor: "#0d1b2e",
            titleFont: { family: "Inter", size: 14, weight: "600" },
            bodyFont:  { family: "Inter", size: 13 },
            padding: 14,
            borderColor: "rgba(155, 93, 229, 0.35)",
            borderWidth: 1,
        },
    },
};

// ── Actualiza el badge de estado ────────────────────────────────────────────
function actualizarBadge(valor, loading = false) {
    const badge = document.getElementById("filterBadge");
    if (!badge) return;
    const etiquetas = { "7": "Últimos 7 días", "30": "Último mes", "all": "Histórico" };
    badge.textContent = loading ? "Actualizando…" : (etiquetas[valor] ?? valor);
    badge.classList.toggle("loading", loading);
}

// ── Construye la URL del endpoint con los query params adecuados ─────────────
function buildURL(filtro) {
    const base = "/api/resultados/reporte-general-grupos";
    return filtro !== "all" ? `${base}?dias=${filtro}` : base;
}

// ── Actualiza los KPI cards de resumen ──────────────────────────────────────
function actualizarKPIs(grupos) {
    const totalGrupos = grupos.length;
    const totalEj     = grupos.reduce((s, g) => s + g.totalEjercicios, 0);
    const promedioGen = totalGrupos > 0
        ? (grupos.reduce((s, g) => s + g.promedioGeneral, 0) / totalGrupos).toFixed(1)
        : "—";

    const el = (id) => document.getElementById(id);
    if (el("kpiGrupos"))            el("kpiGrupos").textContent           = totalGrupos;
    if (el("kpiPromedioGeneral"))   el("kpiPromedioGeneral").textContent  = promedioGen;
    if (el("kpiEjerciciosTotales")) el("kpiEjerciciosTotales").textContent = totalEj;
}

// ── GRÁFICA 1: Barras — Desempeño Promedio por Grupo ────────────────────────
/**
 * @param {Array<{grupo:string, promedioGeneral:number, totalEjercicios:number}>} datos
 */
function renderGraficaDesempeno(datos) {
    const canvas = document.getElementById("graficaDesempeno");
    if (!canvas) return;

    if (window.chartDesempeno) {
        window.chartDesempeno.destroy();
        window.chartDesempeno = null;
    }

    canvas.width = canvas.width; // reset limpio del contexto

    if (datos.length === 0) {
        renderEmptyState(canvas, "Sin datos de grupos para este período");
        return;
    }

    const ctx    = canvas.getContext("2d");

    // ── Top 10: grupos con mayor promedio ────────────────────────────────────
    const top10 = [...datos]
        .sort((a, b) => b.promedioGeneral - a.promedioGeneral)
        .slice(0, 10);

    const labels = top10.map((d) => d.grupo);
    const values = top10.map((d) => parseFloat(d.promedioGeneral.toFixed(2)));
    const colors = top10.map((_, i) => colorForIndex(i));

    // Degradado vertical por grupo
    const gradientes = colors.map((hex) => {
        const g = ctx.createLinearGradient(0, 0, 0, 360);
        g.addColorStop(0, hex + "ee");
        g.addColorStop(1, hex + "44");
        return g;
    });

    window.chartDesempeno = new Chart(canvas, {
        type: "bar",
        data: {
            labels,
            datasets: [{
                label: "Promedio de puntaje",
                data:  values,
                backgroundColor:      gradientes,
                hoverBackgroundColor:  colors,
                borderRadius:         14,
                borderSkipped:        false,
            }],
        },
        options: {
            ...baseOptions,
            plugins: {
                ...baseOptions.plugins,
                tooltip: {
                    ...baseOptions.plugins.tooltip,
                    callbacks: {
                        label: (ctx) => `  Promedio: ${ctx.parsed.y.toFixed(1)} pts`,
                    },
                },
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid:  { color: "rgba(255,255,255,0.04)", drawBorder: false },
                    ticks: { color: "#a0aec0", font: { family: "Inter" },
                             callback: (v) => `${v}` },
                    border: { dash: [4, 4] },
                },
                x: {
                    grid:   { display: false },
                    ticks:  { color: "#a0aec0", font: { family: "Inter", weight: "600" } },
                    border: { display: false },
                },
            },
        },
    });
}

// ── GRÁFICA 2: Dona — Distribución de Ejercicios por Grupo ──────────────────
/**
 * @param {Array<{grupo:string, totalEjercicios:number}>} datos
 */
function renderGraficaDistribucion(datos) {
    const canvas = document.getElementById("graficaDistribucion");
    if (!canvas) return;

    if (window.chartDistribucion) {
        window.chartDistribucion.destroy();
        window.chartDistribucion = null;
    }

    canvas.width = canvas.width;

    if (datos.length === 0) {
        renderEmptyState(canvas, "Sin datos de grupos para este período");
        return;
    }

    // ── Top 10 + "Otros": mantiene el 100% sin saturar la dona ────────────────
    const TOP_N = 10;
    const ordenados = [...datos].sort((a, b) => b.totalEjercicios - a.totalEjercicios);
    const top10    = ordenados.slice(0, TOP_N);
    const resto    = ordenados.slice(TOP_N);
    const sumaResto = resto.reduce((s, d) => s + d.totalEjercicios, 0);

    const labels = top10.map((d) => d.grupo);
    const values = top10.map((d) => d.totalEjercicios);
    const colors = top10.map((_, i) => colorForIndex(i));

    // Si quedan grupos fuera del Top 10, agregarlos como "Otros"
    if (sumaResto > 0) {
        labels.push(`Otros (${resto.length})`);
        values.push(sumaResto);
        colors.push("#4a5568"); // gris neutro para "Otros"
    }

    const total = values.reduce((a, b) => a + b, 0);

    window.chartDistribucion = new Chart(canvas, {
        type: "doughnut",
        data: {
            labels,
            datasets: [{
                data:             values,
                backgroundColor:  colors,
                borderWidth:      3,
                borderColor:      "#060e1a",
                hoverOffset:      24,
                hoverBorderWidth: 4,
                hoverBorderColor: "rgba(255,255,255,0.15)",
                offset:           8,
            }],
        },
        options: {
            ...baseOptions,
            cutout: "72%",
            plugins: {
                ...baseOptions.plugins,
                legend: { ...baseOptions.plugins.legend, position: "right" },
                tooltip: {
                    ...baseOptions.plugins.tooltip,
                    callbacks: {
                        label: (ctx) => {
                            const val = ctx.parsed ?? 0;
                            const pct = total > 0
                                ? ((val / total) * 100).toFixed(1)
                                : "0.0";
                            return `  ${ctx.label}: ${val} ejercicios (${pct}%)`;
                        },
                    },
                },
            },
        },
    });
}

// ── Dibuja un mensaje vacío sobre el canvas ─────────────────────────────────
function renderEmptyState(canvas, mensaje = "Sin datos") {
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#a0aec0";
    ctx.font      = "500 14px Inter";
    ctx.textAlign = "center";
    ctx.fillText(mensaje, canvas.width / 2, canvas.height / 2);
}

// ── Fetch principal + render de ambas gráficas ──────────────────────────────
async function cargarReporteGrupal(filtro) {
    const url = buildURL(filtro);
    console.log(`[ReportesGrupales] Fetch → ${url}`);

    let datos = [];
    try {
        const res  = await fetch(url);
        const json = await res.json();
        datos = Array.isArray(json) ? json : [];
        if (!Array.isArray(json)) {
            console.error("[ReportesGrupales] Respuesta inesperada:", json);
        }
        console.log(`[ReportesGrupales] ${datos.length} grupos recibidos`, datos);
    } catch (err) {
        console.error("[ReportesGrupales] Error fetch:", err);
    }

    actualizarKPIs(datos);
    renderGraficaDesempeno(datos);
    renderGraficaDistribucion(datos);
}

// ── Bootstrap ────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
    if (!document.getElementById("graficaDesempeno")) return;

    const dateSelect = document.getElementById("dateFilter");
    const filtroInicial = dateSelect?.value ?? "all";

    actualizarBadge(filtroInicial, true);
    await cargarReporteGrupal(filtroInicial);
    actualizarBadge(filtroInicial, false);

    dateSelect?.addEventListener("change", async (e) => {
        const filtro = e.target.value;
        actualizarBadge(filtro, true);
        await cargarReporteGrupal(filtro);
        actualizarBadge(filtro, false);
    });
});
