// js/dashboard.js
document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("totalUsuarios")) {
        cargarEstadisticas();
    }
});

async function cargarEstadisticas() {
    try {
        const [usuarios, ejercicios, sesiones] = await Promise.all([
            fetch("http://localhost:3000/api/admin/total-usuarios").then(res => res.json()),
            fetch("http://localhost:3000/api/admin/total-ejercicios").then(res => res.json()),
            fetch("http://localhost:3000/api/admin/total-sesiones").then(res => res.json())
        ]);

        document.getElementById("totalUsuarios").innerText = usuarios.total || 0;
        document.getElementById("totalEjercicios").innerText = ejercicios.total || 0;
        document.getElementById("totalSesiones").innerText = sesiones.total || 0;
    } catch (error) {
        console.error("Error al cargar estadísticas:", error);
    }
}