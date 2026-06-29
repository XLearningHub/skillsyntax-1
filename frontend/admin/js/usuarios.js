// js/usuarios.js

const usuario = JSON.parse(localStorage.getItem("usuario"));

if (!usuario || usuario.rol !== "admin") {
    window.location.href = "/index.html";
}

document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("tablaUsuarios")) {
        cargarUsuarios();
    }

    // \u2500\u2500 BUSCADOR DIN\u00c1MICO EN TIEMPO REAL \u2500\u2500
    const buscador       = document.getElementById("buscadorUsuarios");
    const sinResultados  = document.getElementById("sinResultados");

    if (buscador) {
        buscador.addEventListener("input", () => {
            const query  = buscador.value.trim().toLowerCase();
            const filas  = document.querySelectorAll("#tablaUsuarios tr");
            let visibles = 0;

            filas.forEach(fila => {
                // col 1 = Nombre, col 2 = Email (0-indexados)
                const nombre = (fila.cells[1]?.textContent ?? "").toLowerCase();
                const email  = (fila.cells[2]?.textContent ?? "").toLowerCase();
                const match  = nombre.includes(query) || email.includes(query);

                fila.style.display = match ? "" : "none";
                if (match) visibles++;
            });

            // Mostrar mensaje cuando no hay coincidencias
            if (sinResultados) {
                sinResultados.style.display = (filas.length > 0 && visibles === 0) ? "block" : "none";
            }
        });
    }
});

async function cargarUsuarios() {
    const tabla = document.getElementById("tablaUsuarios");
    
    try {
        const res = await fetch("/api/usuarios");
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
                        <div class="action-cell">
                            <button class="btn-edit" onclick="abrirModalEditar('${user.id}', '${(user.nombre||'').replace(/'/g, "\\'") }', '${user.rol}', '${user.email}', '${user.nivel_general||''}')">
                                <i class="fas fa-pen"></i> Editar
                            </button>
                            <button class="btn-delete" onclick="eliminarUsuario('${user.id}')">
                                🗑️ Eliminar
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });

    } catch (error) {
        console.error("Error al cargar usuarios:", error);
        tabla.innerHTML = `<tr><td colspan="6" style="color: var(--danger); padding: 40px;">Error al conectar con el servidor</td></tr>`;
    }
}

// ── SISTEMA DE TOASTS ──
function mostrarToast(mensaje, tipo = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const iconos = { success: '✅', error: '❌' };

    const toast = document.createElement('div');
    toast.className = `toast ${tipo}`;
    toast.innerHTML = `
        <span class="toast-icon">${iconos[tipo] ?? 'ℹ️'}</span>
        <span class="toast-msg">${mensaje}</span>
        <div class="toast-progress"></div>
    `;

    container.appendChild(toast);

    // Destruir tras 3.5 s (0.3 s de animación de salida + 3.2 s de espera)
    const timeout = setTimeout(() => {
        toast.classList.add('hide');
        toast.addEventListener('animationend', () => toast.remove(), { once: true });
    }, 3200);

    // Permitir cierre manual al hacer clic
    toast.addEventListener('click', () => {
        clearTimeout(timeout);
        toast.classList.add('hide');
        toast.addEventListener('animationend', () => toast.remove(), { once: true });
    });
}

// ── MODAL DE CONFIRMACIÓN ──
let _pendingDeleteId = null;

document.addEventListener("DOMContentLoaded", () => {
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

            try {
                const res = await fetch(`/api/usuarios/${id}`, {
                    method: "DELETE"
                });

                if (res.ok) {
                    const data = await res.json();
                    console.log("Usuario eliminado:", data);
                    mostrarToast('Usuario eliminado correctamente.', 'success');
                    cargarUsuarios();
                } else {
                    mostrarToast('No se pudo eliminar el usuario del servidor.', 'error');
                }
            } catch (error) {
                console.error("Error al eliminar:", error);
                mostrarToast('Hubo un error en la conexión al intentar eliminar.', 'error');
            }
        });
    }

    // Cerrar modal al hacer clic en el overlay
    if (modal) {
        modal.addEventListener("click", (e) => {
            if (e.target === modal) {
                modal.classList.remove("active");
                document.body.style.overflow = '';
                _pendingDeleteId = null;
            }
        });
    }
});

//  ELIMINAR USUARIO — muestra el modal en lugar de confirm()
function eliminarUsuario(id) {
    _pendingDeleteId = id;
    const modal = document.getElementById("modalEliminar");
    if (modal) {
        modal.classList.add("active");
        document.body.style.overflow = 'hidden';
    }
}

function irCrearUsuario() {
    window.location.href = "../register.html";
}

// ── MODAL EDITAR USUARIO ──
let _currentEditId = null;

function abrirModalEditar(id, nombre, rol, email, nivel) {
    _currentEditId = id;
    document.getElementById('editNombre').value        = nombre;
    document.getElementById('editEmail').value         = email;
    document.getElementById('editRol').value           = rol;
    document.getElementById('editNivelUsuario').value  = nivel || '';
    document.getElementById('modalEditarUsuario').classList.add('active');
    document.body.style.overflow = 'hidden';
}

document.addEventListener('DOMContentLoaded', () => {
    const modalEditar   = document.getElementById('modalEditarUsuario');
    const btnCancelar   = document.getElementById('btnEditCancelar');
    const btnGuardar    = document.getElementById('btnEditGuardar');

    // Cerrar con botón Cancelar
    if (btnCancelar) {
        btnCancelar.addEventListener('click', () => {
            modalEditar.classList.remove('active');
            document.body.style.overflow = '';
            _currentEditId = null;
        });
    }

    // Cerrar al hacer clic en el overlay
    if (modalEditar) {
        modalEditar.addEventListener('click', (e) => {
            if (e.target === modalEditar) {
                modalEditar.classList.remove('active');
                document.body.style.overflow = '';
                _currentEditId = null;
            }
        });
    }

    // Guardar Cambios
    if (btnGuardar) {
        btnGuardar.addEventListener('click', async () => {
            if (!_currentEditId) return;

            const nombre = document.getElementById('editNombre').value.trim();
            const email  = document.getElementById('editEmail').value.trim();
            const rol    = document.getElementById('editRol').value;
            const nivel  = document.getElementById('editNivelUsuario').value;

            if (!nombre) {
                mostrarToast('El nombre no puede estar vacío.', 'error');
                return;
            }
            if (!email) {
                mostrarToast('El email no puede estar vacío.', 'error');
                return;
            }

            // Bloquear botón para evitar doble envío
            btnGuardar.disabled = true;
            btnGuardar.textContent = 'Guardando...';

            try {
                const res = await fetch(`/api/usuarios/${_currentEditId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nombre, email, rol, nivel_general: nivel })
                });

                if (res.ok) {
                    modalEditar.classList.remove('active');
                    document.body.style.overflow = '';
                    _currentEditId = null;
                    mostrarToast('Usuario actualizado correctamente.', 'success');
                    cargarUsuarios();
                } else {
                    const err = await res.json();
                    mostrarToast(err.error || 'No se pudo actualizar el usuario.', 'error');
                }
            } catch (e) {
                console.error('Error al actualizar:', e);
                mostrarToast('Error de conexión al actualizar.', 'error');
            } finally {
                btnGuardar.disabled = false;
                btnGuardar.innerHTML = '<i class="fas fa-save" style="margin-right:6px;"></i>Guardar Cambios';
            }
        });
    }
});