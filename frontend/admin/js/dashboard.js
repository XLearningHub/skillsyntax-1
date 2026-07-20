// js/dashboard.js
console.log("DASHBOARD NUEVO FUNCIONANDO 🚀");

// ── Helpers ────────────────────────────────────────────────────────────────────
/**
 * Formatea una fecha ISO a texto relativo legible (ej. "hace 3 min", "hoy 14:22").
 */
function tiempoRelativo(isoStr) {
    if (!isoStr) return "—";
    const ahora = new Date();
    const fecha  = new Date(isoStr);
    const diffMs = ahora - fecha;
    const diffMin = Math.floor(diffMs / 60000);
    const diffH   = Math.floor(diffMin / 60);

    if (diffMin < 1)  return "justo ahora";
    if (diffMin < 60) return `hace ${diffMin} min`;
    if (diffH   < 24) return `hace ${diffH} h`;
    // Más de 24 h → fecha legible
    return fecha.toLocaleDateString("es-MX", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

// ── Contador animado ──────────────────────────────────────────────────────────
function animarContador(el, target, duration = 900) {
    if (!el) return;
    const start = performance.now();
    const from  = parseInt(el.textContent) || 0;

    function tick(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased    = 1 - Math.pow(1 - progress, 3); // ease-out cubic
        el.textContent = Math.round(from + (target - from) * eased);
        if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
}

// ── Carga KPIs ────────────────────────────────────────────────────────────────
async function cargarEstadisticas() {
    try {
        const [usuarios, ejercicios, sesiones] = await Promise.all([
            fetch("/api/admin/total-usuarios").then(r => r.json()),
            fetch("/api/admin/total-ejercicios").then(r => r.json()),
            fetch("/api/admin/total-sesiones").then(r => r.json()),
        ]);

        animarContador(document.getElementById("totalUsuarios"),    usuarios.total    ?? 0);
        animarContador(document.getElementById("totalEjercicios"),  ejercicios.total  ?? 0);
        animarContador(document.getElementById("totalSesiones"),    sesiones.total    ?? 0);
    } catch (err) {
        console.error("Error al cargar estadísticas:", err);
    }
}

// ── Carga Feed de Actividad ───────────────────────────────────────────────────
async function cargarActividad() {
    const feed = document.getElementById("actividadFeed");
    if (!feed) return;

    try {
        const res      = await fetch("/api/admin/actividad-reciente");
        const eventos  = await res.json();

        if (!Array.isArray(eventos) || eventos.length === 0) {
            feed.innerHTML = `
                <div class="timeline-empty">
                    <i class="fas fa-inbox"></i>
                    <p>Sin actividad reciente</p>
                </div>`;
            return;
        }

        feed.innerHTML = eventos.map(ev => `
            <div class="timeline-item">
                <div class="timeline-dot" style="background:${ev.color}; box-shadow: 0 0 8px ${ev.color}66;">
                    <i class="fas ${ev.icono}"></i>
                </div>
                <div class="timeline-body">
                    <span class="timeline-text">${ev.texto}</span>
                    <span class="timeline-time">${tiempoRelativo(ev.fecha)}</span>
                </div>
            </div>
        `).join("");

    } catch (err) {
        console.error("Error al cargar actividad:", err);
        feed.innerHTML = `<p style="color:var(--text-dim);padding:20px;">Error al cargar actividad.</p>`;
    }
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
    cargarEstadisticas();
    cargarActividad();
});