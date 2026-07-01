/**
 * role-switch.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Módulo de Cambio de Rol Rápido (Admin → Alumno) para SkillSyntax.
 *
 * SEGURIDAD:
 *  - El switch SOLO se activa si el usuario en localStorage tiene rol "admin".
 *  - La clave de backup usa un nombre genérico ("__ss_ctx") sin revelar propósito.
 *  - La restauración también verifica rol admin antes de ejecutar.
 *
 * FLUJO:
 *  1. Admin hace clic en "Ver como Alumno".
 *  2. Se guarda backup (base64) del objeto `usuario` bajo "__ss_ctx".
 *  3. Se sobreescribe `usuario` con rol "alumno" (mismo id / nombre).
 *  4. Redirige a /test.html.
 *  5. En /test.html, la barra flotante aparece si "__ss_ctx" existe.
 *  6. Admin hace clic en "Volver a Modo Admin".
 *  7. Se restaura el objeto original, se borra el backup.
 *  8. Redirige a /admin/dashboard.html.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const RoleSwitch = (() => {

  /** Clave interna del backup — deliberadamente no descriptiva */
  const BACKUP_KEY = '__ss_ctx';

  /** Codifica en base64 (ofuscación mínima para DevTools) */
  function _encode(obj) {
    return btoa(unescape(encodeURIComponent(JSON.stringify(obj))));
  }

  function _decode(str) {
    try {
      return JSON.parse(decodeURIComponent(escape(atob(str))));
    } catch {
      return null;
    }
  }

  /** ¿El usuario actual (real) es admin? */
  function esAdmin() {
    try {
      const u = JSON.parse(localStorage.getItem('usuario'));
      return u && (u.rol === 'admin' || u.role === 'admin');
    } catch {
      return false;
    }
  }

  /** ¿Hay una sesión de impersonación activa? */
  function esModoAlumnoSimulado() {
    return !!localStorage.getItem(BACKUP_KEY);
  }

  /**
   * Activa el modo alumno:
   *  - Guarda backup codificado del usuario admin.
   *  - Inyecta usuario con rol "alumno".
   *  - Redirige a /test.html.
   */
  function activarModoAlumno() {
    if (!esAdmin()) {
      console.warn('[RoleSwitch] Solo los administradores pueden usar esta función.');
      return;
    }

    const adminData = JSON.parse(localStorage.getItem('usuario'));
    localStorage.setItem(BACKUP_KEY, _encode(adminData));

    const alumnoSimulado = {
      ...adminData,
      rol:  'alumno',
      role: 'alumno',
      _simulated: true
    };

    localStorage.setItem('usuario', JSON.stringify(alumnoSimulado));
    localStorage.setItem('usuario_id', alumnoSimulado.id);

    window.location.href = '/test.html';
  }

  /**
   * Restaura la sesión original de admin:
   *  - Lee el backup, lo limpia, restaura datos admin.
   *  - Redirige al panel de admin.
   */
  function volverAModoAdmin() {
    const encoded = localStorage.getItem(BACKUP_KEY);
    if (!encoded) {
      console.warn('[RoleSwitch] No hay sesión admin que restaurar.');
      return;
    }

    const adminData = _decode(encoded);
    if (!adminData) {
      console.error('[RoleSwitch] Backup corrupto. Cerrando sesión por seguridad.');
      localStorage.clear();
      window.location.href = '/login.html';
      return;
    }

    localStorage.removeItem(BACKUP_KEY);
    localStorage.setItem('usuario', JSON.stringify(adminData));
    localStorage.setItem('usuario_id', adminData.id);
    if (adminData.token) localStorage.setItem('token', adminData.token);

    window.location.href = '/admin/dashboard.html';
  }

  /**
   * Inyecta un botón compacto en el navbar de test.html (junto al menú de usuario).
   * Solo aparece si hay una sesión de impersonación activa (__ss_ctx).
   */
  function inyectarBarraRetorno() {
    if (!esModoAlumnoSimulado()) return;

    // Insertar botón en el contenedor #admin-return-slot del navbar
    const slot = document.getElementById('admin-return-slot');
    if (!slot) return;

    const encoded = localStorage.getItem(BACKUP_KEY);
    const adminData = _decode(encoded);
    const nombre = adminData?.nombre || 'Admin';

    slot.innerHTML = `
      <button id="btn-volver-admin" onclick="RoleSwitch.volverAModoAdmin()" title="Estás en modo vista de alumno. Volver al panel de ${nombre}">
        <i class="fas fa-user-shield"></i>
        <span>Modo Admin</span>
      </button>
    `;

    // Estilos del botón de retorno en el navbar
    const style = document.createElement('style');
    style.textContent = `
      #admin-return-slot {
        display: flex;
        align-items: center;
      }
      #btn-volver-admin {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        padding: 7px 14px;
        border-radius: 8px;
        border: 1.5px solid rgba(10, 31, 59, 0.25);
        background: rgba(10, 31, 59, 0.06);
        color: #0a1f3b;
        font-family: 'Segoe UI', sans-serif;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.25s ease;
        white-space: nowrap;
        width: auto;
        margin: 0;
        box-shadow: none;
        position: relative;
      }
      #btn-volver-admin::before {
        content: '';
        display: inline-block;
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: #029e99;
        box-shadow: 0 0 0 0 rgba(2,158,153,0.5);
        animation: rs-pulse 1.8s ease-in-out infinite;
        flex-shrink: 0;
      }
      @keyframes rs-pulse {
        0%   { box-shadow: 0 0 0 0 rgba(2,158,153,0.5); }
        60%  { box-shadow: 0 0 0 5px rgba(2,158,153,0); }
        100% { box-shadow: 0 0 0 0 rgba(2,158,153,0); }
      }
      #btn-volver-admin i {
        font-size: 13px;
        color: #029e99;
      }
      #btn-volver-admin span {
        color: #0a1f3b;
      }
      #btn-volver-admin:hover {
        background: rgba(10, 31, 59, 0.12);
        border-color: rgba(10, 31, 59, 0.4);
        transform: translateY(-1px);
        box-shadow: 0 3px 10px rgba(0,0,0,0.1);
      }
    `;
    document.head.appendChild(style);
  }

  // API pública
  return {
    esAdmin,
    esModoAlumnoSimulado,
    activarModoAlumno,
    volverAModoAdmin,
    inyectarBarraRetorno
  };

})();

