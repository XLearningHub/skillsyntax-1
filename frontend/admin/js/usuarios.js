// js/usuarios.js

const usuario = JSON.parse(localStorage.getItem("usuario"));

if (!usuario || usuario.rol !== "admin") {
    window.location.href = "/index.html";
}

document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("tablaUsuarios")) {
        cargarUsuarios();
    }
});

async function cargarUsuarios() {
    const tabla = document.getElementById("tablaUsuarios");
    
    try {
        const res = await fetch("https://skillsyntax-2war.onrender.com/api/usuarios");
        const usuarios = await res.json();

        tabla.innerHTML = "";

        if (!usuarios || usuarios.length === 0) {
            tabla.innerHTML = `<tr><td colspan="6" style="color: var(--text-dim); padding: 40px;">No hay usuarios registrados</td></tr>`;
            return;
        }

        usuarios.forEach(user => {
            const roleClass = user.rol.toLowerCase() === 'admin' ? 'role-admin' : 'role-user';
         
            const nivelText = user.nivel_general || "N/A";

            tabla.innerHTML += `
                <tr>
                    <td style="font-weight: 600; color: var(--primary);">#${user.id}</td>
                    <td style="font-weight: 500;">${user.nombre}</td>
                    <td style="color: var(--text-dim);">${user.email}</td>
                    <td>
                        <span class="level-badge">${nivelText}</span>
                    </td>
                    <td>
                        <span class="badge ${roleClass}">${user.rol}</span>
                    </td>
                    <td>
                        <button class="btn-delete" onclick="eliminarUsuario(${user.id})">
                            🗑️ Eliminar
                        </button>
                    </td>
                </tr>
            `;
        });

    } catch (error) {
        console.error("Error al cargar usuarios:", error);
        tabla.innerHTML = `<tr><td colspan="6" style="color: var(--danger); padding: 40px;">Error al conectar con el servidor</td></tr>`;
    }
}

//  ELIMINAR USUARIO
async function eliminarUsuario(id) {
  
    if (!confirm("¿Estás seguro? Esta acción eliminará al usuario permanentemente.")) return;

    try {
        const res = await fetch(`https://skillsyntax-2war.onrender.com/api/usuarios/${id}`, { 
            method: "DELETE" 
        });

        if (res.ok) {
            const data = await res.json();
            console.log("Usuario eliminado:", data);
            cargarUsuarios(); 
        } else {
            alert("No se pudo eliminar el usuario del servidor.");
        }
    } catch (error) {
        console.error("Error al eliminar:", error);
        alert("Hubo un error en la conexión al intentar eliminar.");
    }
}

function irCrearUsuario() {
    window.location.href = "../register.html";
}