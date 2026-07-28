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
    cargarGrafica();
});

// ── Gráfica 7 días ────────────────────────────────────────────────────────────
let dashChartInstance = null;

async function cargarGrafica() {
    const canvas = document.getElementById("dashboardChart");
    if (!canvas) return;

    try {
        const res  = await fetch("/api/dashboard/grafica-7-dias");
        const data = await res.json();

        // Destruir instancia previa si existe (p.ej. hot-reload)
        if (dashChartInstance) {
            dashChartInstance.destroy();
            dashChartInstance = null;
        }

        // Defaults globales oscuros
        Chart.defaults.color           = "#a0aec0";
        Chart.defaults.borderColor     = "rgba(255,255,255,0.06)";
        Chart.defaults.font.family     = "Inter, sans-serif";

        dashChartInstance = new Chart(canvas, {
            type: "line",
            data: {
                labels:   data.labels,
                datasets: data.datasets.map(ds => ({ ...ds, fill: true })),
            },
            options: {
                responsive:          true,
                maintainAspectRatio: true,
                interaction: { mode: "index", intersect: false },
                plugins: {
                    legend: {
                        position: "top",
                        align:    "end",
                        labels: {
                            usePointStyle: true,
                            pointStyle:    "circle",
                            padding:       20,
                            font:          { size: 12, weight: "600" },
                        },
                    },
                    tooltip: {
                        backgroundColor: "#0d1b2e",
                        borderColor:     "rgba(255,255,255,0.08)",
                        borderWidth:     1,
                        padding:         12,
                        titleFont:       { size: 13, weight: "700" },
                        bodyFont:        { size: 12 },
                        callbacks: {
                            label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y}`,
                        },
                    },
                },
                scales: {
                    x: {
                        grid:    { display: false },
                        ticks:   { font: { size: 11 } },
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize:         1,
                            font:             { size: 11 },
                            callback: v => Number.isInteger(v) ? v : "",
                        },
                        grid: { color: "rgba(255,255,255,0.05)" },
                    },
                },
            },
        });

    } catch (err) {
        console.error("Error al cargar gráfica:", err);
        const ctx = canvas.parentElement;
        if (ctx) ctx.innerHTML += `<p style="color:var(--text-dim);font-size:0.85rem;padding:10px 0;">No se pudo cargar la gráfica.</p>`;
    }
}



// ── Toast helper ─────────────────────────────────────────────────
function mostrarToastDash(mensaje, tipo = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${tipo}`;
    const icono = tipo === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation';
    toast.innerHTML = `
        <i class="fas ${icono} toast-icon"></i>
        <span class="toast-msg">${mensaje}</span>
        <div class="toast-progress"></div>
    `;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'toastOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// ── Modal Crear Usuario (acceso rápido desde el Dashboard) ──────────
async function dashCargarGrupos() {
    const select = document.getElementById('dash-createGrupo');
    if (!select) return;
    select.innerHTML = '<option value="">Sin grupo (Opcional)</option>';
    try {
        const res    = await fetch('/api/grupos');
        const grupos = await res.json();
        if (Array.isArray(grupos)) {
            grupos.forEach(g => {
                const opt = document.createElement('option');
                opt.value       = g.id;
                opt.textContent = g.nombre || g.id;
                select.appendChild(opt);
            });
        }
    } catch (e) {
        console.warn('[Dashboard] No se pudieron cargar grupos:', e);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Mostrar el botón solo en el dashboard
    const btnCrear = document.getElementById('btnQuickCreateUser');
    if (btnCrear) btnCrear.style.display = 'inline-flex';

    const modal        = document.getElementById('modalCrearUsuario');
    const btnCancelar  = document.getElementById('dash-btnCrearCancelar');
    const btnGuardar   = document.getElementById('dash-btnCrearGuardar');

    function abrirModal() {
        if (!modal) return;
        ['dash-createNombre','dash-createEmail','dash-createPassword'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
        const nivel = document.getElementById('dash-createNivel');
        if (nivel) nivel.value = '';
        dashCargarGrupos();
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        setTimeout(() => document.getElementById('dash-createNombre')?.focus(), 100);
    }

    function cerrarModal() {
        modal?.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Abrir desde el botón del header
    btnCrear?.addEventListener('click', abrirModal);

    // Cerrar con Cancelar y clic en overlay
    btnCancelar?.addEventListener('click', cerrarModal);
    modal?.addEventListener('click', e => { if (e.target === modal) cerrarModal(); });

    // Enviar formulario
    btnGuardar?.addEventListener('click', async () => {
        const nombre   = document.getElementById('dash-createNombre')?.value.trim()   ?? '';
        const email    = document.getElementById('dash-createEmail')?.value.trim()    ?? '';
        const password = document.getElementById('dash-createPassword')?.value.trim() ?? '';
        const nivel    = document.getElementById('dash-createNivel')?.value            ?? '';
        const grupoId  = document.getElementById('dash-createGrupo')?.value            ?? '';

        if (!nombre) { mostrarToastDash('El nombre es obligatorio.', 'error'); return; }
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            mostrarToastDash('Ingresa un email válido.', 'error'); return;
        }
        if (password.length < 6) { mostrarToastDash('La contraseña debe tener al menos 6 caracteres.', 'error'); return; }

        btnGuardar.disabled = true;
        btnGuardar.textContent = 'Creando...';

        try {
            const payload = { nombre, email, password, rol: 'alumno', nivel_general: nivel || 'A1' };
            if (grupoId && grupoId.trim() !== '') { 
                payload.grupo_id = grupoId.trim(); 
            }

            const res  = await fetch('/api/usuarios', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify(payload),
            });
            const data = await res.json();

            if (res.ok) {
                cerrarModal();
                const grupoMsg = grupoId ? ' y asignado al grupo.' : '.';
                mostrarToastDash(`Usuario "${nombre}" creado correctamente${grupoMsg}`, 'success');
                // Refrescar KPI de usuarios
                setTimeout(cargarEstadisticas, 800);
            } else {
                mostrarToastDash(data.error || 'No se pudo crear el usuario.', 'error');
            }
        } catch (err) {
            console.error('[Dashboard] Error al crear usuario:', err);
            mostrarToastDash('Error de conexión al crear el usuario.', 'error');
        } finally {
            btnGuardar.disabled = false;
            btnGuardar.innerHTML = '<i class="fas fa-user-plus" style="margin-right:6px;"></i>Crear Usuario';
        }
    });
});