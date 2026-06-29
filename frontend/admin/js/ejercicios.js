// js/ejercicios.js

document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("tablaEjercicios")) {
        cargarEjercicios();
    }
});

// CARGAR EJERCICIOS
async function cargarEjercicios() {
    try {
        const res = await fetch("/api/resultados");
        const data = await res.json();

        const tabla = document.getElementById("tablaEjercicios");
        tabla.innerHTML = "";

        data.forEach(e => {
            tabla.innerHTML += `
                <tr>
                    <td class="id-blue">#${e.id}</td> 
                    <td><strong>${e.usuario || "N/A"}</strong></td>
                    <td>${e.habilidad}</td>
                    <td>${e.puntaje}</td>
                    <td>
                        ${e.audio_url 
                            ? `<audio controls src="${e.audio_url}"></audio>` 
                            : "<span style='color: var(--text-dim)'>Sin audio</span>"}
                    </td>
                    <td style="text-align: left; font-size: 0.8rem; max-width: 300px;">${e.feedback}</td>
                    <td>
                        <button class="btn-delete" onclick="eliminarEjercicio(${e.id})">
                            <i class="fa-solid fa-trash-can"></i> Eliminar
                        </button>
                    </td>
                </tr>
            `;
        });
    } catch (error) {
        console.error("Error cargando ejercicios:", error);
    }
}

//  ELIMINAR EJERCICIO
async function eliminarEjercicio(id) {
    if (!confirm("¿Estás seguro de eliminar este ejercicio?")) return;

    try {
        const res = await fetch(`/api/resultados/${id}`, {
            method: "DELETE"
        });
        
        if (res.ok) {
            cargarEjercicios(); 
        }
    } catch (error) {
        alert("No se pudo eliminar el ejercicio");
        console.error("Error al eliminar:", error);
    }
}