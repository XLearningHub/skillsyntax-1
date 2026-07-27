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

        // Ordenar por id_num ASC; usuarios sin id_num van al final ordenados por nombre
        usuarios.sort((a, b) => {
            if (a.id_num != null && b.id_num != null) return a.id_num - b.id_num;
            if (a.id_num != null) return -1;
            if (b.id_num != null) return  1;
            return (a.nombre || "").localeCompare(b.nombre || "");
        });

        usuarios.forEach(user => {
            const roleClass = user.rol.toLowerCase() === 'admin' ? 'role-admin' : 'role-user';
         
            const nivelText = user.nivel_general || "N/A";

            tabla.innerHTML += `
                <tr>
                    <td style="font-weight: 600; color: var(--primary);">#${user.id_num ?? user.id}</td>
                    <td class="nombre-cell" style="font-weight: 500;">${user.nombre}</td>
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
                                <i class="fas fa-trash-can"></i> Eliminar
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

// \u2500\u2500 MODAL CREAR USUARIO \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

/**
 * Carga los grupos desde /api/grupos y rellena el select#createGrupo.
 * Se llama cada vez que se abre el modal para asegurar datos frescos.
 */
async function cargarGruposEnCrear() {
    const select = document.getElementById('createGrupo');
    if (!select) return;

    select.innerHTML = '<option value="">Sin grupo (Opcional)</option>';

    try {
        const res    = await fetch('/api/grupos');
        const grupos = await res.json();

        if (Array.isArray(grupos) && grupos.length > 0) {
            grupos.forEach((g) => {
                const opt = document.createElement('option');
                opt.value       = g.id;
                opt.textContent = g.nombre || g.id;
                select.appendChild(opt);
            });
        }
    } catch (err) {
        console.warn('[Usuarios] No se pudieron cargar grupos:', err);
    }
}

/** Abre el modal de creaci\u00f3n y carga los grupos disponibles. */
function abrirModalCrear() {
    const modal = document.getElementById('modalCrearUsuario');
    if (!modal) return;

    // Limpiar formulario
    ['createNombre', 'createEmail', 'createPassword'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    const nivel  = document.getElementById('createNivel');
    if (nivel) nivel.value = '';

    cargarGruposEnCrear();
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    setTimeout(() => document.getElementById('createNombre')?.focus(), 100);
}


// ── MODAL EDITAR USUARIO ──
let _currentEditId = null;

function abrirModalEditar(id, nombre, rol, email, nivel) {
    _currentEditId = id;
    document.getElementById('editNombre').value        = nombre;
    document.getElementById('editEmail').value         = email;
    document.getElementById('editRol').value           = rol;
    document.getElementById('editNivelUsuario').value  = nivel || '';

    // Resetear campo de contraseña al abrir
    const chkPass  = document.getElementById('editCambiarPass');
    const passInput = document.getElementById('editNuevaPassword');
    if (chkPass)  { chkPass.checked = false; }
    if (passInput) { passInput.value = ''; passInput.disabled = true; passInput.style.opacity = '0.4'; }

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

    // Toggle del campo de contraseña
    const chkPass   = document.getElementById('editCambiarPass');
    const passInput = document.getElementById('editNuevaPassword');
    if (chkPass && passInput) {
        chkPass.addEventListener('change', () => {
            passInput.disabled    = !chkPass.checked;
            passInput.style.opacity = chkPass.checked ? '1' : '0.4';
            if (!chkPass.checked) passInput.value = '';
            if (chkPass.checked) setTimeout(() => passInput.focus(), 50);
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

            // Contraseña: solo si el admin marcó el checkbox
            const cambiarPass = document.getElementById('editCambiarPass')?.checked;
            const nuevaPass   = document.getElementById('editNuevaPassword')?.value.trim() ?? '';

            if (!nombre) {
                mostrarToast('El nombre no puede estar vacío.', 'error');
                return;
            }
            if (!email) {
                mostrarToast('El email no puede estar vacío.', 'error');
                return;
            }
            if (cambiarPass && nuevaPass.length < 6) {
                mostrarToast('La nueva contraseña debe tener al menos 6 caracteres.', 'error');
                return;
            }

            // Bloquear botón para evitar doble envío
            btnGuardar.disabled = true;
            btnGuardar.textContent = 'Guardando...';

            const payload = { nombre, email, rol, nivel_general: nivel };
            if (cambiarPass && nuevaPass) payload.nueva_password = nuevaPass;

            try {
                const res = await fetch(`/api/usuarios/${_currentEditId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
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

// \u2500\u2500 MODAL CREAR USUARIO: listeners \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
document.addEventListener('DOMContentLoaded', () => {
    const modalCrear    = document.getElementById('modalCrearUsuario');
    const btnCancelar   = document.getElementById('btnCrearCancelar');
    const btnGuardar    = document.getElementById('btnCrearGuardar');

    function cerrarModalCrear() {
        if (modalCrear) {
            modalCrear.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    // Cerrar con botón Cancelar
    btnCancelar?.addEventListener('click', cerrarModalCrear);

    // Cerrar al hacer clic en el overlay (fuera de la tarjeta)
    modalCrear?.addEventListener('click', (e) => {
        if (e.target === modalCrear) cerrarModalCrear();
    });

    // Envío del formulario
    btnGuardar?.addEventListener('click', async () => {
        const nombre   = document.getElementById('createNombre')?.value.trim()   ?? '';
        const email    = document.getElementById('createEmail')?.value.trim()    ?? '';
        const password = document.getElementById('createPassword')?.value.trim() ?? '';
        const nivel    = document.getElementById('createNivel')?.value            ?? '';
        const grupoId  = document.getElementById('createGrupo')?.value            ?? '';

        // Validaciones básicas
        if (!nombre) {
            mostrarToast('El nombre es obligatorio.', 'error');
            return;
        }
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            mostrarToast('Ingresa un email v\u00e1lido.', 'error');
            return;
        }
        if (password.length < 6) {
            mostrarToast('La contrase\u00f1a debe tener al menos 6 caracteres.', 'error');
            return;
        }

        // Bloquear botón para evitar doble envío
        btnGuardar.disabled = true;
        btnGuardar.textContent = 'Creando...';

        try {
            const payload = { nombre, email, password, rol: 'alumno', nivel_general: nivel || 'A1' };
            if (grupoId) payload.grupoId = grupoId;   // solo si el admin seleccionó uno

            const res = await fetch('/api/usuarios', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify(payload),
            });

            const data = await res.json();

            if (res.ok) {
                cerrarModalCrear();
                const grupoMsg = grupoId ? ' y asignado al grupo.' : '.';
                mostrarToast(`Usuario "${nombre}" creado correctamente${grupoMsg}`, 'success');
                cargarUsuarios();
            } else {
                mostrarToast(data.error || 'No se pudo crear el usuario.', 'error');
            }
        } catch (err) {
            console.error('[Usuarios] Error al crear:', err);
            mostrarToast('Error de conexión al crear el usuario.', 'error');
        } finally {
            btnGuardar.disabled = false;
            btnGuardar.innerHTML = '<i class="fas fa-user-plus" style="margin-right:6px;"></i>Crear Usuario';
        }
    });
});