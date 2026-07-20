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
                    <a href="grupos.html" id="link-grupos"><i class="fas fa-layer-group"></i> Grupos</a>
                    <a href="ejercicios.html" id="link-ejercicios"><i class="fas fa-book"></i> Ejercicios</a>
                    <a href="reportes.html" id="link-reportes"><i class="fas fa-file-alt"></i> Reportes</a>
                    <a href="reportes-grupales.html" id="link-reportes-grupales"><i class="fas fa-chart-bar"></i> Reportes Grupales</a>
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
            'dashboard.html':         'Dashboard',
            'usuarios.html':          'Usuarios',
            'grupos.html':            'Grupos',
            'ejercicios.html':        'Ejercicios',
            'reportes.html':          'Reportes',
            'reportes-grupales.html': 'Reportes Grupales'
        };
        const page = window.location.pathname.split('/').pop();
        const titleEl = document.getElementById('admin-page-title');
        if (titleEl) titleEl.textContent = titles[page] || '';
    }

    const path = window.location.pathname.split("/").pop();
    const links = {
        "dashboard.html":          "link-dashboard",
        "usuarios.html":           "link-usuarios",
        "grupos.html":             "link-grupos",
        "ejercicios.html":         "link-ejercicios",
        "reportes.html":           "link-reportes",
        "reportes-grupales.html":  "link-reportes-grupales"
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