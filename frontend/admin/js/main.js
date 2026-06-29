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

  
    const path = window.location.pathname.split("/").pop();
    const links = {
        "dashboard.html": "link-dashboard",
        "usuarios.html": "link-usuarios",
        "ejercicios.html": "link-ejercicios",
        "reportes.html": "link-reportes"
    };
    
    const activeId = links[path];
    if (activeId) {
        document.getElementById(activeId)?.classList.add("active");
    }
}


function logout() {
    console.log("Cerrando sesión...");
    localStorage.clear();
    // Ruta relativa: el navegador resuelve contra el host actual (local o producción)
    window.location.href = "/";
}

// Ejecutar al cargar
document.addEventListener("DOMContentLoaded", inyectarMenu);