// js/main.js

function inyectarMenu() {
    const sidebarContainer = document.getElementById('sidebar-container');
    if (!sidebarContainer) return;

    sidebarContainer.innerHTML = `
        <div class="sidebar">
            <div class="sidebar-top">
                <h2>SkillSyntax Admin</h2>
                <nav>
                    <a href="dashboard.html" id="link-dashboard"><i class="fas fa-chart-pie"></i> Dashboard</a>
                    <a href="usuarios.html" id="link-usuarios"><i class="fas fa-users"></i> Usuarios</a>
                    <a href="ejercicios.html" id="link-ejercicios"><i class="fas fa-book"></i> Ejercicios</a>
                    <a href="reportes.html" id="link-reportes"><i class="fas fa-file-alt"></i> Reportes</a>
                </nav>
            </div>
            <a href="#" class="logout" onclick="event.preventDefault(); logout();">
                    <i class="fas fa-sign-out-alt"></i> Cerrar sesión
                </a>
        </div>
    `;

    // Inyectar header del admin con el botón de role switch
    const headerContainer = document.getElementById('admin-header');
    if (headerContainer) {
        const usuario = JSON.parse(localStorage.getItem('usuario'));
        const nombre  = usuario?.nombre || 'Admin';
        headerContainer.innerHTML = `
            <div class="admin-header-left">
                <h1 id="admin-page-title"></h1>
            </div>
            <div class="admin-header-right">
                <button class="btn-ver-alumno" onclick="RoleSwitch.activarModoAlumno()" title="Ver la plataforma como alumno">
                    <i class="fas fa-eye"></i>
                    Ver como Alumno
                </button>
                <div class="admin-user-chip">
                    <div class="admin-avatar">${nombre.charAt(0).toUpperCase()}</div>
                    <span>${nombre}</span>
                </div>
            </div>
        `;
        // Poner el título de la página activa
        const titles = {
            'dashboard.html': 'Dashboard',
            'usuarios.html':  'Usuarios',
            'ejercicios.html': 'Ejercicios',
            'grupos.html':    'Grupos',
            'reportes.html':  'Reportes'
        };
        const page = window.location.pathname.split('/').pop();
        const titleEl = document.getElementById('admin-page-title');
        if (titleEl) titleEl.textContent = titles[page] || '';
    }

    const path = window.location.pathname.split("/").pop();
    const links = {
        "dashboard.html": "link-dashboard",
        "usuarios.html":  "link-usuarios",
        "ejercicios.html": "link-ejercicios",
        "reportes.html":  "link-reportes"
    };
    
    const activeId = links[path];
    if (activeId) {
        document.getElementById(activeId)?.classList.add("active");
    }
}


function logout() {
    console.log("Cerrando sesión...");
    localStorage.clear();
    window.location.href = "/";
}

// Ejecutar al cargar
document.addEventListener("DOMContentLoaded", inyectarMenu);