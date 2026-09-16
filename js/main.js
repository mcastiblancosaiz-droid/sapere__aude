/* ==========================================================================
   SAPERE AUDE — E-Learning & Consultoría
   js/main.js

   Funcionalidades generales del sitio. Este mismo archivo se carga en las
   8 páginas del proyecto, así que cada función revisa primero si los
   elementos que necesita existen en la página actual antes de hacer nada.

   Índice:
     1. Utilidades
     2. Menú móvil
     3. Header al hacer scroll
     4. Año automático en el footer
     5. Validación de formularios (contacto, login, registro)
     6. (integrado en la sección 11 — ver Recursos)
     7. Usuarios y sesión con localStorage (registro.html, login.html,
        header de las 8 páginas)
     8. Dashboard (dashboard.html)
     9. Sistema de reservas (reservas.html + integración con Dashboard)
    10. Formación + inscripción + progreso de cursos (formacion.html +
        integración con Dashboard)
    11. Recursos: catálogo, buscador, filtros, favoritos, descarga y
        "Mis recursos guardados" (recursos.html + integración con Dashboard)
    12. Chat con asesores: conversaciones demostrativas, mensajería con
        persistencia y respuestas automáticas (chat.html + integración con
        Dashboard). NO es un chatbot con IA real: es un prototipo funcional
        de mensajería con datos y respuestas de demostración, sin backend.
     13. SAPEREBOT: asistente virtual de orientación (banco de respuestas
        fijas + palabras clave + reglas de derivación), visible en las 12
        páginas del proyecto. NO es un chatbot con IA real y NO sustituye
        al Chat con asesores ni al formulario de Contacto: solo orienta
        con información ya confirmada en el resto del sitio y enlaza hacia
        esos módulos existentes cuando corresponde.
     14. Mi Perfil (perfil.html): ver/editar los datos reales del usuario
        (nombre, apellido, correo, tipoUsuario) que ya guarda registro.html
        en sapereaude_usuarios. Reutiliza el mismo shell privado del
        Dashboard (initDashboardPage ya rellena avatar/nombre/tipo) y las
        mismas funciones de sesión de la sección 7. El cambio de contraseña
        queda fuera de alcance por ahora.
    15. Seguimiento (seguimiento.html): vista de solo lectura que reúne en
        un mismo lugar el estado real de las reservas (sección 9,
        sapereaude_reservas) y de las inscripciones a cursos (sección 10,
        sapereaude_cursos_usuario) del usuario autenticado. No crea
        almacenamiento nuevo ni estados inventados: reutiliza exactamente
        los mismos datos y los mismos estados ("Confirmada"/"Cancelada",
        "En progreso"/"Completado") que ya se muestran en Mis reservas y
        Mis cursos. También incluye "Pagos (simulados)", ver sección 16.
    16. Simulación de pagos (pagos.html): PROTOTIPO ACADÉMICO. Permite
        simular el flujo "seleccionar proceso → revisar información →
        simular pago → confirmación demostrativa" reutilizando las reservas
        (sección 9) y las inscripciones a cursos (sección 10) reales del
        usuario autenticado. NO es una pasarela de pago real: no se conecta
        con bancos, no cobra dinero y no almacena datos financieros (ni
        siquiera de prueba). Los valores que se muestran están expresados en
        "Unidades Demostrativas (UD)", una unidad ficticia creada solo para
        esta simulación, y nunca se presentan como precios oficiales de
        SAPERE AUDE (que no existen en la documentación de este proyecto).
        Las simulaciones se guardan en sapereaude_pagos (clave propia,
        independiente de sapereaude_reservas y sapereaude_cursos_usuario) y
        se reflejan en modo de solo lectura dentro de Seguimiento.
    17. Roles y datos de demostración: agrega el campo "rol" ("usuario" /
        "administrador") a cada cuenta (sección 7), siembra UNA vez por
        navegador una cuenta administradora de demostración y un pequeño
        conjunto de datos DEMO claramente identificados (ver
        initSeedDemoData), y expone eliminarDatosDemo() para borrarlos desde
        el Panel de Administración.
    18. Panel de Administración (admin.html): dashboard independiente del
        Dashboard de usuario, solo accesible con rol "administrador" (ver
        isAdmin(), sección 7). Reúne en modo de solo lectura (salvo el
        estado de las solicitudes, que sí se puede cambiar) los mismos
        datos reales que ya usan el resto de módulos: usuarios (sección 7),
        solicitudes de servicio (sección 5.0), reservas (sección 9),
        inscripciones a formación (sección 10), conversaciones del Chat
        (sección 12) y pagos simulados (sección 16). No crea ninguna
        colección de datos nueva aparte de sapereaude_solicitudes.

   NOTA IMPORTANTE SOBRE ALCANCE:
   Este proyecto no tiene backend ni base de datos. Los "usuarios" y la
   "sesión" que maneja la sección 7 se guardan únicamente en el navegador
   del propio visitante, mediante localStorage. Esto es válido solo como
   demostración académica: cualquier persona con acceso a ese navegador
   puede leer esos datos desde las herramientas de desarrollador, y la
   información no se comparte entre dispositivos ni navegadores distintos.
   No debe usarse como base para un sistema de autenticación real.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', function () {
  initSeedDemoData();
  initMobileMenu();
  initHeaderScroll();
  initFooterYear();
  initContactForm();
  initLoginForm();
  initRegistroForm();
  initSessionState();
  initBookingLinks();
  initSessionExpiryWatcher();
  initDashboardPage();
  initDashboardSessionCard();
  initReservasPage();
  initDashboardCoursesProgress();
  initFormacionPage();
  initResourceActions();
  initRecursosPage();
  initChatPage();
  initDashboardMessagesCard();
  initPerfilPage();
  initSeguimientoPage();
  initPagosPage();
  initSaperebot();
  initAdminPage();
});


/* ==========================================================================
   1. UTILIDADES
   ========================================================================== */

/**
 * Expresión regular simple para validar formato básico de correo electrónico.
 * No pretende cubrir el estándar RFC completo, solo un formato razonable
 * para validación en el cliente (usuario@dominio.algo).
 */
var EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Longitud mínima razonable para contraseñas en esta etapa de demostración. */
var MIN_PASSWORD_LENGTH = 6;

/** Longitud máxima para contraseñas (límite defensivo básico, no depende solo del atributo HTML). */
var MAX_PASSWORD_LENGTH = 72;

/**
 * Longitudes máximas para texto libre introducido por el usuario. No se
 * confía únicamente en el atributo HTML "maxlength": todos los formularios
 * de la sección 5 validan también aquí, en JavaScript, antes de guardar
 * nada en localStorage (ver auditoría de ciberseguridad).
 */
var MAX_LENGTHS = {
  nombre: 80,
  apellido: 80,
  correo: 120,
  mensajeContacto: 1000,
  motivoReserva: 500,
  mensajeChat: 1000
};

/**
 * Corta un texto a una longitud máxima, sin romper caracteres a la mitad de
 * forma peligrosa. Se usa como límite defensivo adicional antes de guardar
 * texto libre del usuario en localStorage.
 */
function truncateToMax(text, maxLength) {
  var value = (text == null ? '' : String(text)).trim();
  return value.length > maxLength ? value.slice(0, maxLength) : value;
}


/* ==========================================================================
   1.1 HASHING DE CONTRASEÑAS EN EL CLIENTE (ver auditoría de ciberseguridad)

   NOTA DE SEGURIDAD — LÉASE ANTES DE MODIFICAR:
   Este proyecto es un prototipo 100% frontend, sin backend ni base de datos
   real. Por lo tanto, esto NO es hashing seguro de producción:

     - En una aplicación real, la contraseña en texto plano se envía una
       sola vez (por HTTPS) a un servidor, que la hashea con un algoritmo
       lento y con "salt" propio (bcrypt, scrypt o Argon2) y solo guarda
       ese hash en una base de datos que el usuario nunca puede leer.
     - Aquí no existe ese servidor: el propio navegador calcula el hash Y
       lo compara, así que cualquier persona con acceso a las herramientas
       de desarrollador puede leer este mismo código y calcular el hash de
       cualquier contraseña que quiera probar. El "secreto" no está
       protegido de un atacante que controla el cliente, porque en este
       prototipo el cliente ES la única pieza que existe.

   Lo que SÍ logra esta medida, y por lo que se implementa: evita que la
   contraseña quede guardada LITERALMENTE en texto plano dentro de
   localStorage. Antes, cualquiera que abriera "Application → Local
   Storage" en el navegador podía leer la contraseña de cualquier usuario
   registrado en ese navegador. Con esto, lo que se guarda es un hash
   SHA-256 con salt aleatorio por usuario, generado con la API nativa
   Web Crypto (crypto.subtle) cuando el navegador la ofrece en un contexto
   seguro (HTTPS o localhost).

   Si el navegador NO ofrece Web Crypto (contexto no seguro, ej. http:// en
   un dominio distinto de localhost), se usa un hash simple no criptográfico
   (djb2) solo para no dejar la contraseña en texto plano; se documenta
   explícitamente como NO seguro, y es solo una alternativa de última
   instancia para que el registro/login sigan funcionando.
   ========================================================================== */

/** Convierte un ArrayBuffer (resultado de crypto.subtle.digest) a una cadena hexadecimal. */
function bufferToHex(buffer) {
  return Array.prototype.map.call(new Uint8Array(buffer), function (b) {
    return b.toString(16).padStart(2, '0');
  }).join('');
}

/** Genera un salt aleatorio (hexadecimal) usando crypto.getRandomValues cuando está disponible. */
function generateSaltHex(byteLength) {
  byteLength = byteLength || 16;
  var bytes = new Uint8Array(byteLength);
  if (window.crypto && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(bytes);
  } else {
    // Respaldo si ni siquiera getRandomValues está disponible: no es
    // aleatoriedad criptográfica, pero sigue siendo mejor que un salt fijo.
    for (var i = 0; i < byteLength; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.prototype.map.call(bytes, function (b) { return b.toString(16).padStart(2, '0'); }).join('');
}

/**
 * Calcula el hash de una contraseña + salt. Devuelve una Promise<string>
 * (SHA-256 vía Web Crypto cuando es posible; ver nota de seguridad arriba).
 * NUNCA se guarda la contraseña en texto plano: solo el valor devuelto aquí.
 */
function hashPassword(password, saltHex) {
  var texto = saltHex + ':' + password;

  if (window.crypto && window.crypto.subtle && window.isSecureContext) {
    try {
      var data = new TextEncoder().encode(texto);
      return window.crypto.subtle.digest('SHA-256', data).then(bufferToHex);
    } catch (error) {
      // Si algo falla con Web Crypto, se cae al respaldo no criptográfico
      // de abajo en vez de dejar sin funcionar el registro/login.
    }
  }

  // Respaldo NO criptográfico (djb2): ver nota de seguridad arriba. Solo se
  // usa si Web Crypto no está disponible en este navegador/contexto.
  var hash = 5381;
  for (var i = 0; i < texto.length; i++) {
    hash = ((hash << 5) + hash + texto.charCodeAt(i)) >>> 0;
  }
  return Promise.resolve('djb2:' + hash.toString(16));
}

/**
 * Muestra un mensaje de error debajo de un campo y marca su .form-group
 * como inválido. Si el campo o el elemento de error no existen en el DOM,
 * no hace nada (para que el mismo código no falle en otras páginas).
 */
function showFieldError(inputEl, errorEl, message) {
  if (!inputEl || !errorEl) return;
  var group = inputEl.closest('.form-group');
  if (group) group.classList.add('is-invalid');
  errorEl.textContent = message;
  errorEl.classList.add('is-visible');
}

/** Limpia el estado de error de un campo (usado antes de revalidar). */
function clearFieldError(inputEl, errorEl) {
  if (!inputEl || !errorEl) return;
  var group = inputEl.closest('.form-group');
  if (group) group.classList.remove('is-invalid');
  errorEl.textContent = '';
  errorEl.classList.remove('is-visible');
}

/**
 * Muestra un mensaje de nivel de formulario (no ligado a un campo concreto),
 * como "correo o contraseña incorrectos" o una confirmación de éxito.
 * Se usa junto con las clases .form-error / .form-success ya existentes.
 */
function showFormMessage(el, message) {
  if (!el) return;
  el.textContent = message;
  el.classList.add('is-visible');
}

/** Oculta un mensaje de nivel de formulario mostrado con showFormMessage(). */
function hideFormMessage(el) {
  if (!el) return;
  el.textContent = '';
  el.classList.remove('is-visible');
}

/** Genera un ID simple y suficientemente único para esta demostración local. */
function generateLocalId() {
  return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);
}

/**
 * Devuelve las iniciales (nombre + apellido) para el avatar del dashboard.
 * Si falta algún dato, usa lo que haya disponible; si no hay nada, "SA"
 * (iniciales de SAPERE AUDE) como respaldo.
 */
function getInitials(nombre, apellido) {
  var first = (nombre || '').trim().charAt(0);
  var second = (apellido || '').trim().charAt(0);
  var initials = (first + second).toUpperCase();
  return initials || 'SA';
}

/** Etiquetas legibles para el campo tipoUsuario guardado en el registro. */
var USER_TYPE_LABELS = {
  estudiante: 'Estudiante',
  profesional: 'Profesional',
  empresa: 'Empresa / Organización'
};

/**
 * Etiquetas legibles para el campo "rol" del usuario (sección 7 y Panel de
 * Administración, sección 18). Todo usuario creado desde registro.html
 * recibe rol "usuario" de forma automática: no existe ningún formulario
 * público para crear una cuenta "administrador" (ver sección 17).
 */
var ROLE_LABELS = {
  usuario: 'Usuario',
  administrador: 'Administrador'
};

/** Etiquetas legibles para el campo "motivo" del formulario de contacto (contacto.html). */
var REQUEST_REASON_LABELS = {
  asesoria: 'Asesoría académica',
  formacion: 'Cursos de idiomas',
  consultoria: 'Consultoría organizacional',
  proyectos: 'Consultoría de ciclo de proyectos',
  otro: 'Otro'
};


/* ==========================================================================
   2. MENÚ MÓVIL
   ========================================================================== */
function initMobileMenu() {
  var toggle = document.getElementById('nav-toggle');
  var nav = document.getElementById('primary-nav');
  if (!toggle || !nav) return;

  // Punto de quiebre en el que el menú hamburguesa deja de usarse (ver CSS: 840px).
  var DESKTOP_BREAKPOINT = 840;

  function openMenu() {
    nav.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
  }

  function closeMenu() {
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
  }

  toggle.addEventListener('click', function () {
    var isOpen = nav.classList.contains('is-open');
    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  // Cerrar el menú al hacer clic en cualquier enlace de navegación.
  var navLinks = nav.querySelectorAll('.primary-nav__link');
  navLinks.forEach(function (link) {
    link.addEventListener('click', closeMenu);
  });

  // Si el usuario agranda la ventana (o gira el dispositivo) hasta el
  // tamaño de escritorio, nos aseguramos de que el menú móvil quede cerrado
  // y no interfiera con la navegación de escritorio.
  window.addEventListener('resize', function () {
    if (window.innerWidth > DESKTOP_BREAKPOINT) {
      closeMenu();
    }
  });
}


/* ==========================================================================
   3. HEADER AL HACER SCROLL
   ========================================================================== */
function initHeaderScroll() {
  var header = document.getElementById('site-header');
  if (!header) return;

  var SCROLL_THRESHOLD = 12;
  var ticking = false;

  function updateHeaderState() {
    if (window.scrollY > SCROLL_THRESHOLD) {
      header.classList.add('is-scrolled');
    } else {
      header.classList.remove('is-scrolled');
    }
    ticking = false;
  }

  // Se usa requestAnimationFrame para no ejecutar la lógica en cada evento
  // de scroll (que puede dispararse decenas de veces por segundo), sino como
  // máximo una vez por frame — una forma sencilla y eficiente de limitarlo.
  window.addEventListener('scroll', function () {
    if (!ticking) {
      window.requestAnimationFrame(updateHeaderState);
      ticking = true;
    }
  });

  // Estado inicial (por si la página se carga con scroll ya restaurado).
  updateHeaderState();
}


/* ==========================================================================
   4. AÑO AUTOMÁTICO EN EL FOOTER
   ========================================================================== */
function initFooterYear() {
  var yearEl = document.getElementById('current-year');
  if (!yearEl) return;
  yearEl.textContent = new Date().getFullYear();
}


/* ==========================================================================
   5. VALIDACIÓN DE FORMULARIOS
   ========================================================================== */

/* ==========================================================================
   5.0 SOLICITUDES DE SERVICIO (contacto.html + Panel de Administración)

   Cada envío válido del formulario de contacto se guarda como una
   "solicitud de servicio" en localStorage, bajo su propia clave
   (sapereaude_solicitudes), independiente de sapereaude_reservas: el
   formulario de contacto no agenda una fecha/hora concreta (eso lo hace
   reservas.html), solo registra que alguien pidió información sobre un
   servicio. El Panel de Administración (sección 18) lee esta misma
   colección para la vista "Servicios" — no se inventa ningún dato aquí.
   ========================================================================== */
var REQUESTS_STORAGE_KEY = 'sapereaude_solicitudes';

/** Estados posibles de una solicitud de servicio, en el orden en que avanzan normalmente. */
var REQUEST_STATES = ['Pendiente', 'Confirmado', 'Atendido', 'Cancelado'];

/** Lee la colección de solicitudes de servicio desde localStorage. */
function getSolicitudes() {
  try {
    var raw = window.localStorage.getItem(REQUESTS_STORAGE_KEY);
    var solicitudes = raw ? JSON.parse(raw) : [];
    return Array.isArray(solicitudes) ? solicitudes : [];
  } catch (error) {
    return [];
  }
}

/** Guarda la colección completa de solicitudes de servicio en localStorage. */
function saveSolicitudes(solicitudes) {
  try {
    window.localStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify(solicitudes));
  } catch (error) {
    // Ver nota en saveUsers(): localStorage puede no estar disponible.
  }
}

/** Agrega una solicitud de servicio y la persiste de inmediato. */
function addSolicitud(solicitud) {
  var solicitudes = getSolicitudes();
  solicitudes.push(solicitud);
  saveSolicitudes(solicitudes);
  return solicitud;
}

/**
 * Actualiza el estado de una solicitud existente (usado desde el Panel de
 * Administración, sección 18). Si el estado recibido no es uno de los
 * REQUEST_STATES válidos, no hace ningún cambio.
 */
function updateSolicitudEstado(id, nuevoEstado) {
  if (REQUEST_STATES.indexOf(nuevoEstado) === -1) return;
  var solicitudes = getSolicitudes();
  for (var i = 0; i < solicitudes.length; i++) {
    if (solicitudes[i].id === id) {
      solicitudes[i].estado = nuevoEstado;
      break;
    }
  }
  saveSolicitudes(solicitudes);
}

/* ---- 5.1 Formulario de contacto (contacto.html) ---- */
function initContactForm() {
  var form = document.getElementById('contact-form');
  if (!form) return;

  var nameInput = document.getElementById('contact-name');
  var nameError = document.getElementById('contact-name-error');
  var emailInput = document.getElementById('contact-email');
  var emailError = document.getElementById('contact-email-error');
  var messageInput = document.getElementById('contact-message');
  var messageError = document.getElementById('contact-message-error');
  var successEl = document.getElementById('contact-form-success');

  form.addEventListener('submit', function (event) {
    event.preventDefault(); // Demostración: no se envía a ningún servidor.

    clearFieldError(nameInput, nameError);
    clearFieldError(emailInput, emailError);
    clearFieldError(messageInput, messageError);
    if (successEl) successEl.classList.remove('is-visible');

    var isValid = true;

    if (!nameInput.value.trim()) {
      showFieldError(nameInput, nameError, 'Por favor escribe tu nombre.');
      isValid = false;
    } else if (nameInput.value.trim().length > MAX_LENGTHS.nombre) {
      showFieldError(nameInput, nameError, 'El nombre es demasiado largo.');
      isValid = false;
    }

    if (!emailInput.value.trim()) {
      showFieldError(emailInput, emailError, 'Por favor escribe tu correo electrónico.');
      isValid = false;
    } else if (!EMAIL_PATTERN.test(emailInput.value.trim())) {
      showFieldError(emailInput, emailError, 'Escribe un correo electrónico válido.');
      isValid = false;
    } else if (emailInput.value.trim().length > MAX_LENGTHS.correo) {
      showFieldError(emailInput, emailError, 'El correo es demasiado largo.');
      isValid = false;
    }

    if (!messageInput.value.trim()) {
      showFieldError(messageInput, messageError, 'Cuéntanos brevemente qué necesitas.');
      isValid = false;
    } else if (messageInput.value.trim().length > MAX_LENGTHS.mensajeContacto) {
      showFieldError(messageInput, messageError, 'El mensaje es demasiado largo (máximo ' + MAX_LENGTHS.mensajeContacto + ' caracteres).');
      isValid = false;
    }

    if (!isValid) return;

    // Todo válido: se registra como una solicitud de servicio (ver sección
    // 5.0) para que el Panel de Administración pueda mostrarla en
    // "Servicios" — nunca se envía por correo ni a ningún servidor, porque
    // este prototipo no tiene backend. Si quien escribe ya tiene sesión
    // iniciada, se asocia la solicitud a su cuenta (usuarioId); si no, la
    // solicitud queda igualmente registrada con el nombre y correo del
    // formulario, sin necesidad de una cuenta.
    var sessionActual = getSession();
    var tipoUsuarioInput = document.getElementById('contact-user-type');
    var motivoInput = document.getElementById('contact-reason');

    addSolicitud({
      id: generateLocalId(),
      usuarioId: (sessionActual && sessionActual.userId) || null,
      nombre: truncateToMax(nameInput.value, MAX_LENGTHS.nombre),
      correo: emailInput.value.trim().toLowerCase(),
      tipoUsuario: tipoUsuarioInput ? tipoUsuarioInput.value : '',
      motivo: motivoInput ? motivoInput.value : 'otro',
      mensaje: truncateToMax(messageInput.value, MAX_LENGTHS.mensajeContacto),
      estado: 'Pendiente',
      creadaEn: new Date().toISOString()
    });

    // Mostramos la confirmación de demostración y reiniciamos el formulario.
    if (successEl) successEl.classList.add('is-visible');
    form.reset();
  });
}

/* ---- 5.2 Formulario de inicio de sesión (login.html) ---- */
function initLoginForm() {
  var form = document.getElementById('login-form');
  if (!form) return;

  var emailInput = document.getElementById('login-email');
  var emailError = document.getElementById('login-email-error');
  var passwordInput = document.getElementById('login-password');
  var passwordError = document.getElementById('login-password-error');
  var formErrorEl = document.getElementById('login-form-error');
  var formSuccessEl = document.getElementById('login-form-success');
  var submitBtn = document.getElementById('login-submit');

  form.addEventListener('submit', function (event) {
    event.preventDefault(); // Demostración local: no hay backend real.

    clearFieldError(emailInput, emailError);
    clearFieldError(passwordInput, passwordError);
    hideFormMessage(formErrorEl);
    hideFormMessage(formSuccessEl);

    var isValid = true;

    if (!emailInput.value.trim()) {
      showFieldError(emailInput, emailError, 'Por favor escribe tu correo electrónico.');
      isValid = false;
    } else if (!EMAIL_PATTERN.test(emailInput.value.trim())) {
      showFieldError(emailInput, emailError, 'Escribe un correo electrónico válido.');
      isValid = false;
    }

    if (!passwordInput.value) {
      showFieldError(passwordInput, passwordError, 'Por favor escribe tu contraseña.');
      isValid = false;
    } else if (passwordInput.value.length < MIN_PASSWORD_LENGTH) {
      showFieldError(passwordInput, passwordError, 'La contraseña debe tener al menos ' + MIN_PASSWORD_LENGTH + ' caracteres.');
      isValid = false;
    } else if (passwordInput.value.length > MAX_PASSWORD_LENGTH) {
      showFieldError(passwordInput, passwordError, 'La contraseña es demasiado larga.');
      isValid = false;
    }

    if (!isValid) return;

    // Validación de formato superada: ahora se comparan las credenciales
    // contra los usuarios guardados en localStorage (ver sección 7 y la
    // nota de seguridad 1.1 sobre el hashing de contraseñas en el cliente).
    var correo = emailInput.value.trim().toLowerCase();
    var passwordEscrita = passwordInput.value;
    var user = findUserByEmail(correo);

    // Mensaje genérico a propósito, en ambos casos (usuario inexistente o
    // contraseña incorrecta): no decimos cuál falló, para no revelar qué
    // correos están registrados ni filtrar detalles internos del error.
    var credencialesInvalidas = function () {
      showFormMessage(formErrorEl, 'Correo o contraseña incorrectos.');
    };

    if (!user) {
      credencialesInvalidas();
      return;
    }

    if (submitBtn) submitBtn.disabled = true;

    function completarLogin() {
      // rol determina a dónde se redirige y qué interfaz puede ver la
      // persona (ver sección 17): las cuentas creadas antes de esta
      // actualización no tienen "rol" guardado, así que se tratan como
      // "usuario" por defecto, nunca como "administrador".
      var rolUsuario = user.rol === 'administrador' ? 'administrador' : 'usuario';

      createSession({
        userId: user.id,
        nombre: user.nombre,
        tipoUsuario: user.tipoUsuario,
        rol: rolUsuario,
        loggedIn: true,
        creadaEn: new Date().toISOString()
      });

      var destino = rolUsuario === 'administrador' ? 'admin.html' : 'dashboard.html';
      showFormMessage(formSuccessEl, 'Sesión iniciada correctamente. Redirigiendo...');
      form.reset();

      // Tras iniciar sesión, se redirige al panel correspondiente al rol.
      setTimeout(function () {
        window.location.href = destino;
      }, 1200);
    }

    if (user.passwordHash && user.passwordSalt) {
      // Cuenta ya migrada al esquema con hash: se compara hash contra hash,
      // nunca contraseña en texto plano contra nada.
      hashPassword(passwordEscrita, user.passwordSalt).then(function (hashCalculado) {
        if (hashCalculado !== user.passwordHash) {
          if (submitBtn) submitBtn.disabled = false;
          credencialesInvalidas();
          return;
        }
        completarLogin();
      });
    } else if (user.password) {
      // Cuenta antigua (previa a esta actualización), todavía con
      // "password" en texto plano: se valida como antes y, si es correcta,
      // se migra de inmediato a passwordHash/passwordSalt, eliminando el
      // texto plano de localStorage para no volver a exponerlo.
      if (user.password !== passwordEscrita) {
        if (submitBtn) submitBtn.disabled = false;
        credencialesInvalidas();
        return;
      }

      var saltMigracion = generateSaltHex();
      hashPassword(passwordEscrita, saltMigracion).then(function (hashMigracion) {
        var users = getUsers();
        for (var i = 0; i < users.length; i++) {
          if (users[i].id === user.id) {
            users[i].passwordHash = hashMigracion;
            users[i].passwordSalt = saltMigracion;
            delete users[i].password;
            break;
          }
        }
        saveUsers(users);
        completarLogin();
      });
    } else {
      // Estado inesperado (usuario sin password ni passwordHash): no se
      // revela el motivo exacto, mismo mensaje genérico que el resto.
      if (submitBtn) submitBtn.disabled = false;
      credencialesInvalidas();
    }
  });
}

/* ---- 5.3 Formulario de registro (registro.html) ---- */
function initRegistroForm() {
  var form = document.getElementById('registro-form');
  if (!form) return;

  var nombreInput = document.getElementById('registro-nombre');
  var nombreError = document.getElementById('registro-nombre-error');
  var apellidoInput = document.getElementById('registro-apellido');
  var apellidoError = document.getElementById('registro-apellido-error');
  var correoInput = document.getElementById('registro-correo');
  var correoError = document.getElementById('registro-correo-error');
  var passwordInput = document.getElementById('registro-password');
  var passwordError = document.getElementById('registro-password-error');
  var confirmInput = document.getElementById('registro-password-confirm');
  var confirmError = document.getElementById('registro-password-confirm-error');
  var terminosInput = document.getElementById('registro-terminos');
  var terminosError = document.getElementById('registro-terminos-error');
  var formSuccessEl = document.getElementById('registro-form-success');
  var submitBtn = document.getElementById('registro-submit');

  form.addEventListener('submit', function (event) {
    event.preventDefault(); // Demostración local: no hay backend real.

    hideFormMessage(formSuccessEl);
    clearFieldError(nombreInput, nombreError);
    clearFieldError(apellidoInput, apellidoError);
    clearFieldError(correoInput, correoError);
    clearFieldError(passwordInput, passwordError);
    clearFieldError(confirmInput, confirmError);
    clearFieldError(terminosInput, terminosError);

    var isValid = true;

    if (!nombreInput.value.trim()) {
      showFieldError(nombreInput, nombreError, 'Por favor escribe tu nombre.');
      isValid = false;
    } else if (nombreInput.value.trim().length > MAX_LENGTHS.nombre) {
      showFieldError(nombreInput, nombreError, 'El nombre es demasiado largo.');
      isValid = false;
    }

    if (!apellidoInput.value.trim()) {
      showFieldError(apellidoInput, apellidoError, 'Por favor escribe tu apellido.');
      isValid = false;
    } else if (apellidoInput.value.trim().length > MAX_LENGTHS.apellido) {
      showFieldError(apellidoInput, apellidoError, 'El apellido es demasiado largo.');
      isValid = false;
    }

    if (!correoInput.value.trim()) {
      showFieldError(correoInput, correoError, 'Por favor escribe tu correo electrónico.');
      isValid = false;
    } else if (!EMAIL_PATTERN.test(correoInput.value.trim())) {
      showFieldError(correoInput, correoError, 'Escribe un correo electrónico válido.');
      isValid = false;
    } else if (correoInput.value.trim().length > MAX_LENGTHS.correo) {
      showFieldError(correoInput, correoError, 'El correo es demasiado largo.');
      isValid = false;
    }

    if (!passwordInput.value) {
      showFieldError(passwordInput, passwordError, 'Por favor crea una contraseña.');
      isValid = false;
    } else if (passwordInput.value.length < MIN_PASSWORD_LENGTH) {
      showFieldError(passwordInput, passwordError, 'La contraseña debe tener al menos ' + MIN_PASSWORD_LENGTH + ' caracteres.');
      isValid = false;
    } else if (passwordInput.value.length > MAX_PASSWORD_LENGTH) {
      showFieldError(passwordInput, passwordError, 'La contraseña es demasiado larga.');
      isValid = false;
    }

    if (!confirmInput.value) {
      showFieldError(confirmInput, confirmError, 'Por favor confirma tu contraseña.');
      isValid = false;
    } else if (confirmInput.value !== passwordInput.value) {
      showFieldError(confirmInput, confirmError, 'Las contraseñas no coinciden.');
      isValid = false;
    }

    if (terminosInput && !terminosInput.checked) {
      showFieldError(terminosInput, terminosError, 'Debes aceptar los términos y condiciones.');
      isValid = false;
    }

    if (!isValid) return;

    // Validación de campos superada: ahora se revisa contra los usuarios ya
    // guardados en localStorage (ver sección 7) antes de crear la cuenta.
    var correo = correoInput.value.trim().toLowerCase();

    if (findUserByEmail(correo)) {
      showFieldError(correoInput, correoError, 'Ese correo ya está registrado. Inicia sesión o usa otro correo.');
      return;
    }

    var tipoUsuarioInput = form.querySelector('input[name="tipo-usuario"]:checked');

    if (submitBtn) submitBtn.disabled = true;

    // NOTA DE SEGURIDAD: la contraseña NUNCA se guarda en texto plano (ver
    // sección 1.1, hashPassword). Se calcula un salt aleatorio por usuario
    // y se guarda únicamente el hash resultante (passwordHash/passwordSalt);
    // el valor de passwordInput.value se descarta después de este cálculo.
    var saltNuevo = generateSaltHex();
    hashPassword(passwordInput.value, saltNuevo).then(function (hashCalculado) {
      var newUser = {
        id: generateLocalId(),
        nombre: truncateToMax(nombreInput.value, MAX_LENGTHS.nombre),
        apellido: truncateToMax(apellidoInput.value, MAX_LENGTHS.apellido),
        correo: correo,
        passwordHash: hashCalculado,
        passwordSalt: saltNuevo,
        tipoUsuario: tipoUsuarioInput ? tipoUsuarioInput.value : 'estudiante',
        // Toda cuenta creada desde este formulario público es "usuario": no
        // existe ningún control en este formulario para elegir el rol
        // "administrador" (ver sección 17, Panel de Administración).
        rol: 'usuario',
        estado: 'Activo',
        creadaEn: new Date().toISOString()
      };

      var users = getUsers();
      users.push(newUser);
      saveUsers(users);

      showFormMessage(formSuccessEl, 'Cuenta creada correctamente. Te llevaremos a iniciar sesión...');
      form.reset();

      setTimeout(function () {
        window.location.href = 'login.html';
      }, 1800);
    });
  });
}


/* ==========================================================================
   6. (Buscador y filtros de recursos)
   Movido e integrado en la sección 11 (RECURSOS), que ahora también cubre
   favoritos, descarga y la vista "Mis recursos guardados" — ver
   initRecursosPage() más abajo, junto al resto del módulo de Recursos.
   ========================================================================== */


/* ==========================================================================
   7. USUARIOS Y SESIÓN CON localStorage
   (registro.html, login.html, header de las 8 páginas)

   Todo lo de esta sección es una demostración académica sin backend:
   - Los usuarios y la sesión viven solo en el localStorage de este
     navegador; no se sincronizan entre dispositivos ni son "reales".
   - Las contraseñas NO se guardan en texto plano: se guarda un hash
     SHA-256 con salt aleatorio por usuario (ver sección 1.1, hashPassword).
     Esto reduce la exposición si alguien inspecciona localStorage, pero
     NO equivale a una autenticación segura de producción, porque aquí el
     propio navegador calcula y compara el hash — ver la nota completa en
     la sección 1.1 para el detalle de esta limitación.
   - Las sesiones expiran por tiempo (ver SESSION_MAX_AGE_MS más abajo):
     pasado ese tiempo desde que se creó la sesión, isLoggedIn() la trata
     como inválida y la elimina, igual que si el usuario cerrara sesión.
   - No hay cookies, ni tokens, ni ninguna verificación del lado servidor.
   ========================================================================== */

var USERS_STORAGE_KEY = 'sapereaude_usuarios';
var SESSION_STORAGE_KEY = 'sapereaude_sesion';

/**
 * Duración máxima de una sesión local, en milisegundos, contada desde
 * session.creadaEn (ver createSession). Pasado este tiempo, isLoggedIn()
 * considera la sesión expirada y la elimina (ver isSessionExpired). Esto
 * es una medida básica de expiración del lado del cliente: en una
 * aplicación real, la expiración de sesión la controla el servidor (p.ej.
 * un token con tiempo de vida corto), no el propio navegador.
 */
var SESSION_MAX_AGE_MS = 2 * 60 * 60 * 1000; // 2 horas

/**
 * Lee la colección de usuarios registrados desde localStorage.
 * Devuelve siempre un array (vacío si no hay nada guardado o si el valor
 * guardado está corrupto), para que el resto del código no tenga que
 * revisar null/undefined en cada uso.
 */
function getUsers() {
  try {
    var raw = window.localStorage.getItem(USERS_STORAGE_KEY);
    var users = raw ? JSON.parse(raw) : [];
    return Array.isArray(users) ? users : [];
  } catch (error) {
    return [];
  }
}

/** Guarda la colección completa de usuarios en localStorage. */
function saveUsers(users) {
  try {
    window.localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (error) {
    // localStorage puede no estar disponible (modo privado, cuota llena, etc.).
    // En esta demostración simplemente no persistimos el cambio.
  }
}

/** Busca un usuario por correo (comparación insensible a mayúsculas). */
function findUserByEmail(correo) {
  if (!correo) return null;
  var correoNormalizado = correo.trim().toLowerCase();
  var users = getUsers();
  for (var i = 0; i < users.length; i++) {
    if (users[i].correo === correoNormalizado) return users[i];
  }
  return null;
}

/** Busca un usuario por id (usado por dashboard.html a partir de session.userId). */
function findUserById(id) {
  if (!id) return null;
  var users = getUsers();
  for (var i = 0; i < users.length; i++) {
    if (users[i].id === id) return users[i];
  }
  return null;
}

/** Lee la sesión activa desde localStorage, o null si no hay ninguna. */
function getSession() {
  try {
    var raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
}

/**
 * Crea (o reemplaza) la sesión local con los datos mínimos necesarios.
 * Si el objeto recibido no trae "creadaEn" (marca de tiempo para la
 * expiración, ver SESSION_MAX_AGE_MS e isSessionExpired), se agrega aquí
 * automáticamente con la hora actual, para que ningún punto de creación de
 * sesión pueda olvidarla por accidente.
 */
function createSession(session) {
  try {
    var sessionConFecha = Object.assign({}, session);
    if (!sessionConFecha.creadaEn) {
      sessionConFecha.creadaEn = new Date().toISOString();
    }
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionConFecha));
  } catch (error) {
    // Ver nota en saveUsers().
  }
}

/** Elimina la sesión local (cierre de sesión). */
function clearSession() {
  try {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (error) {
    // Ver nota en saveUsers().
  }
}

/**
 * Indica si una sesión ya superó su tiempo máximo de vida
 * (SESSION_MAX_AGE_MS). Las sesiones sin "creadaEn" (creadas antes de esta
 * actualización) no se invalidan retroactivamente: se tratan como vigentes
 * hasta que el usuario vuelva a iniciar sesión de forma normal.
 */
function isSessionExpired(session) {
  if (!session || !session.creadaEn) return false;
  var creada = new Date(session.creadaEn).getTime();
  if (isNaN(creada)) return false;
  return (Date.now() - creada) > SESSION_MAX_AGE_MS;
}

/** Indica si hay una sesión activa, válida (con usuario asociado) y no expirada. */
function isLoggedIn() {
  var session = getSession();
  if (!session || !session.loggedIn || !session.userId) return false;
  if (isSessionExpired(session)) {
    clearSession();
    return false;
  }
  return true;
}

/**
 * Indica si hay una sesión activa, válida y con rol "administrador". Se
 * apoya en isLoggedIn() (misma expiración de sesión) y en el "rol" guardado
 * en la sesión al iniciar sesión (ver completarLogin, sección 5.2). Usado
 * por el guardia de admin.html y por initAdminPage() (sección 18).
 *
 * LÍMITE DE SEGURIDAD IMPORTANTE: como este prototipo no tiene backend, el
 * valor "rol" vive en localStorage, en el propio navegador de la persona.
 * Cualquiera con acceso a las herramientas de desarrollador de su propio
 * navegador podría editar ese valor a mano. Esto NO es un control de acceso
 * seguro de nivel producción: solo evita que un usuario normal llegue al
 * Panel de Administración por la navegación normal del sitio. Un sistema
 * real necesitaría verificar el rol en un servidor, no en el cliente.
 */
function isAdmin() {
  var session = getSession();
  return isLoggedIn() && !!session && session.rol === 'administrador';
}

/**
 * Vigilancia periódica de expiración de sesión para páginas privadas: si la
 * sesión expira mientras la pestaña sigue abierta (sin recargar), redirige
 * a login.html en cuanto isLoggedIn() detecta la expiración. Se ejecuta
 * solo en páginas con el shell privado (#dashboard, mismo elemento raíz que
 * usan dashboard.html, reservas.html, chat.html, perfil.html,
 * seguimiento.html y pagos.html).
 */
function initSessionExpiryWatcher() {
  if (!document.getElementById('dashboard')) return;
  window.setInterval(function () {
    if (!isLoggedIn()) {
      window.location.replace('login.html');
    }
  }, 60 * 1000);
}

/**
 * Actualiza el header (las mismas 8 páginas comparten esta estructura) para
 * reflejar si hay una sesión activa: oculta "Iniciar sesión" / "Crear
 * cuenta" y muestra "Hola, [Nombre]" junto con "Cerrar sesión", o viceversa.
 * Se ejecuta en todas las páginas al cargar, ya que main.js es compartido.
 */
function initSessionState() {
  var guestElements = document.querySelectorAll('[data-auth="guest"]');
  var userElements = document.querySelectorAll('[data-auth="user"]');
  var greetingEl = document.getElementById('nav-greeting');
  var logoutBtn = document.getElementById('nav-logout');

  // Si el header de esta página no tiene los elementos esperados, no hacemos nada.
  if (!guestElements.length && !userElements.length) return;

  var session = getSession();
  var loggedIn = isLoggedIn();

  guestElements.forEach(function (el) { el.hidden = loggedIn; });
  userElements.forEach(function (el) { el.hidden = !loggedIn; });

  if (loggedIn && greetingEl && session) {
    greetingEl.textContent = 'Hola, ' + session.nombre;
  }

  // Si quien inició sesión es una cuenta administradora, "Mi panel" en el
  // header público debe llevar al Panel de Administración (admin.html),
  // nunca al dashboard de usuario (ver sección 17 y 18).
  var dashboardLinkEl = document.getElementById('nav-dashboard-link');
  if (loggedIn && dashboardLinkEl && session && session.rol === 'administrador') {
    dashboardLinkEl.setAttribute('href', 'admin.html');
    dashboardLinkEl.textContent = 'Panel admin';
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', function () {
      clearSession();
      // Redirigimos siempre a index.html, donde el header ya se mostrará
      // en su estado "sin sesión" al volver a cargar la página.
      window.location.href = 'index.html';
    });
  }
}


/**
 * Botones genéricos de "Agendar/Agenda una asesoría" que aparecen en páginas
 * públicas (index.html, servicios.html). Estos enlaces llevan el atributo
 * data-booking-link en el HTML y su destino se decide aquí según haya o no
 * sesión activa: reservas.html si está autenticado, login.html si no.
 * El href original en el HTML (normalmente contacto.html) queda como
 * respaldo si por algún motivo JavaScript no llegara a ejecutarse.
 */
function initBookingLinks() {
  var links = document.querySelectorAll('[data-booking-link]');
  if (!links.length) return;

  var destino = isLoggedIn() ? 'reservas.html' : 'login.html';
  links.forEach(function (link) {
    link.setAttribute('href', destino);
  });
}


/* ==========================================================================
   8. DASHBOARD (dashboard.html)

   Área privada del usuario. Reutiliza por completo las funciones de la
   sección 7 (getSession, isLoggedIn, clearSession, findUserById) en vez de
   duplicar la lógica de sesión: esta sección solo se encarga de pintar los
   datos en el HTML del panel y de manejar el sidebar en móvil.

   NOTA SOBRE EL GUARDIA DE ACCESO: dashboard.html incluye además un
   pequeño script en línea en el <head> que revisa 'sapereaude_sesion'
   ANTES de que se pinte la página, para evitar que el contenido privado
   llegue a mostrarse un instante antes de redirigir. La comprobación de
   aquí abajo (isLoggedIn()) es un refuerzo que usa las funciones ya
   existentes y que también protege el caso de "volver atrás" con el
   navegador después de cerrar sesión (ver listener 'pageshow' al final).
   ========================================================================== */
function initDashboardPage() {
  var root = document.getElementById('dashboard');
  if (!root) return; // Esta función solo aplica a dashboard.html

  if (!isLoggedIn()) {
    window.location.replace('login.html');
    return;
  }

  var session = getSession();
  var user = findUserById(session.userId);

  // Nombre a mostrar: nombre + apellido si el usuario existe en la
  // colección (registro completo); si no, el nombre guardado en la sesión.
  var nombreCompleto = session.nombre;
  if (user && user.apellido) {
    nombreCompleto = user.nombre + ' ' + user.apellido;
  }

  var tipoUsuario = (user && user.tipoUsuario) || session.tipoUsuario || 'estudiante';
  var tipoLabel = USER_TYPE_LABELS[tipoUsuario] || 'Estudiante';

  var avatarEl = document.getElementById('dashboard-avatar');
  var nameEl = document.getElementById('dashboard-user-name');
  var typeEl = document.getElementById('dashboard-user-type');
  var welcomeNameEl = document.getElementById('dashboard-welcome-name');

  if (avatarEl) avatarEl.textContent = getInitials(session.nombre, user ? user.apellido : '');
  if (nameEl) nameEl.textContent = nombreCompleto;
  if (typeEl) typeEl.textContent = tipoLabel;
  if (welcomeNameEl) welcomeNameEl.textContent = session.nombre;

  var logoutBtn = document.getElementById('dashboard-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function () {
      clearSession();
      window.location.href = 'index.html';
    });
  }

  initDashboardSidebar();
}

/**
 * Sidebar deslizante en móvil/tablet. Sigue el mismo patrón que
 * initMobileMenu() (clase .is-open alternada por JS, cierre al hacer clic
 * en un enlace o al volver a tamaño de escritorio), adaptado a los
 * elementos propios del dashboard en vez de duplicar esa función.
 */
function initDashboardSidebar() {
  var toggle = document.getElementById('dashboard-sidebar-toggle');
  var sidebar = document.getElementById('dashboard-sidebar');
  var closeBtn = document.getElementById('dashboard-sidebar-close');
  var overlay = document.getElementById('dashboard-overlay');
  if (!toggle || !sidebar) return;

  // Debe coincidir con el media query correspondiente en el CSS.
  var DESKTOP_BREAKPOINT = 960;

  function openSidebar() {
    sidebar.classList.add('is-open');
    if (overlay) overlay.classList.add('is-visible');
    toggle.setAttribute('aria-expanded', 'true');
  }

  function closeSidebar() {
    sidebar.classList.remove('is-open');
    if (overlay) overlay.classList.remove('is-visible');
    toggle.setAttribute('aria-expanded', 'false');
  }

  toggle.addEventListener('click', function () {
    if (sidebar.classList.contains('is-open')) {
      closeSidebar();
    } else {
      openSidebar();
    }
  });

  if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
  if (overlay) overlay.addEventListener('click', closeSidebar);

  var navLinks = sidebar.querySelectorAll('a.dashboard-nav__link');
  navLinks.forEach(function (link) {
    link.addEventListener('click', closeSidebar);
  });

  window.addEventListener('resize', function () {
    if (window.innerWidth > DESKTOP_BREAKPOINT) closeSidebar();
  });
}

/**
 * Actualiza la tarjeta "Próxima sesión" del Dashboard con la próxima reserva
 * ACTIVA (estado "Confirmada" y con fecha/hora aún no pasada) del usuario
 * autenticado, leyendo directamente de sapereaude_reservas. Solo se ejecuta
 * si dashboard.html incluye el contenedor #dashboard-session-content; en
 * cualquier otra página no hace nada.
 */
function initDashboardSessionCard() {
  var container = document.getElementById('dashboard-session-content');
  if (!container) return;
  if (!isLoggedIn()) return; // dashboard.html ya redirige por su cuenta

  var session = getSession();
  var proxima = getNextActiveReserva(session.userId);

  if (!proxima) {
    container.innerHTML =
      '<p class="dashboard-card__empty">Sin próximas sesiones</p>' +
      '<a href="reservas.html" class="btn btn--primary">Agendar asesoría</a>';
    return;
  }

  container.innerHTML =
    '<dl class="reserva-summary">' +
      '<div><dt>Servicio</dt><dd>' + escapeHtml(proxima.servicio) + '</dd></div>' +
      '<div><dt>Fecha</dt><dd>' + escapeHtml(formatFechaLarga(proxima.fecha)) + '</dd></div>' +
      '<div><dt>Hora</dt><dd>' + escapeHtml(proxima.hora) + '</dd></div>' +
      '<div><dt>Modalidad</dt><dd>' + escapeHtml(proxima.modalidad) + '</dd></div>' +
      '<div><dt>Estado</dt><dd><span class="tag tag--confirmada">' + escapeHtml(proxima.estado) + '</span></dd></div>' +
    '</dl>' +
    '<a href="reservas.html" class="btn btn--primary">Ver reserva</a>';
}


/* ==========================================================================
   9. SISTEMA DE RESERVAS (reservas.html + integración con Dashboard)

   Igual que la sección 7 (usuarios y sesión), esto es una demostración
   académica: las reservas se guardan solo en localStorage, bajo la clave
   sapereaude_reservas, y no hay backend ni verificación real de
   disponibilidad más allá de lo que el propio navegador simula.
   ========================================================================== */

var RESERVATIONS_STORAGE_KEY = 'sapereaude_reservas';

/** Servicios ofrecidos, tal como aparecen en servicios.html. */
var SERVICIOS_RESERVA = [
  'Asesorías académicas',
  'Apoyo en actividades académicas',
  'Formación virtual',
  'Creación de contenido educativo',
  'Consultoría',
  'Capacitación organizacional',
  'Diseño de estrategias y procesos formativos'
];

/** Áreas de conocimiento, tal como aparecen en formacion.html y el PDF del proyecto. */
var AREAS_RESERVA = [
  'Idiomas',
  'Matemáticas',
  'Ciencias sociales',
  'Administración',
  'Enfermería y áreas de la salud',
  'Desarrollo profesional'
];

var MODALIDADES_RESERVA = ['Virtual', 'Presencial'];

/** Horarios simulados disponibles para agendar. */
var HORARIOS_RESERVA = [
  '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
  '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM'
];

/** Conversión de los horarios legibles anteriores a formato 24h, para comparar fechas. */
var HORARIOS_24H = {
  '8:00 AM': '08:00', '9:00 AM': '09:00', '10:00 AM': '10:00', '11:00 AM': '11:00',
  '2:00 PM': '14:00', '3:00 PM': '15:00', '4:00 PM': '16:00', '5:00 PM': '17:00', '6:00 PM': '18:00'
};

/** Escapa texto antes de insertarlo como HTML (motivo, nombre, etc. son texto libre del usuario). */
function escapeHtml(text) {
  var div = document.createElement('div');
  div.textContent = text == null ? '' : String(text);
  return div.innerHTML;
}

/** Devuelve la fecha de hoy en formato YYYY-MM-DD (para el atributo min del input date). */
function getTodayISO() {
  var now = new Date();
  var month = String(now.getMonth() + 1).padStart(2, '0');
  var day = String(now.getDate()).padStart(2, '0');
  return now.getFullYear() + '-' + month + '-' + day;
}

/** Combina fecha (YYYY-MM-DD) + hora legible en un objeto Date para comparaciones. */
function getReservaDateTime(reserva) {
  var hora24 = HORARIOS_24H[reserva.hora] || '00:00';
  return new Date(reserva.fecha + 'T' + hora24 + ':00');
}

/** Formatea una fecha YYYY-MM-DD como texto largo en español (ej. "12 de septiembre de 2026"). */
function formatFechaLarga(fechaISO) {
  try {
    var fecha = new Date(fechaISO + 'T00:00:00');
    return fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch (error) {
    return fechaISO;
  }
}

/** Lee todas las reservas guardadas (de todos los usuarios) desde localStorage. */
function getReservas() {
  try {
    var raw = window.localStorage.getItem(RESERVATIONS_STORAGE_KEY);
    var reservas = raw ? JSON.parse(raw) : [];
    return Array.isArray(reservas) ? reservas : [];
  } catch (error) {
    return [];
  }
}

/** Guarda la colección completa de reservas en localStorage. */
function saveReservas(reservas) {
  try {
    window.localStorage.setItem(RESERVATIONS_STORAGE_KEY, JSON.stringify(reservas));
  } catch (error) {
    // Ver nota en saveUsers(): localStorage puede no estar disponible.
  }
}

/** Reservas del usuario autenticado, más recientes primero. */
function getReservasDeUsuario(userId) {
  return getReservas()
    .filter(function (r) { return r.usuarioId === userId; })
    .sort(function (a, b) { return new Date(b.creadaEn) - new Date(a.creadaEn); });
}

/**
 * Próxima reserva activa (estado "Confirmada" y con fecha/hora aún no
 * pasada) de un usuario, ordenada por la más cercana en el tiempo.
 */
function getNextActiveReserva(userId) {
  var ahora = new Date();
  var activas = getReservas().filter(function (r) {
    return r.usuarioId === userId && r.estado === 'Confirmada' && getReservaDateTime(r) >= ahora;
  });
  activas.sort(function (a, b) { return getReservaDateTime(a) - getReservaDateTime(b); });
  return activas.length ? activas[0] : null;
}

/**
 * Horas disponibles para un usuario en una fecha dada: excluye las horas ya
 * pasadas (si la fecha es hoy) y las horas que ese mismo usuario ya tiene
 * reservadas y confirmadas ese día. excludeId permite ignorar la reserva
 * que se está reprogramando, para que su propia hora actual siga apareciendo.
 */
function getHorasDisponibles(userId, fechaISO, excludeId) {
  if (!fechaISO) return [];

  var ahora = new Date();
  var esHoy = fechaISO === getTodayISO();

  var ocupadas = getReservas()
    .filter(function (r) {
      return r.usuarioId === userId &&
        r.estado === 'Confirmada' &&
        r.fecha === fechaISO &&
        r.id !== excludeId;
    })
    .map(function (r) { return r.hora; });

  return HORARIOS_RESERVA.filter(function (hora) {
    if (ocupadas.indexOf(hora) !== -1) return false;
    if (esHoy) {
      var horaFecha = new Date(fechaISO + 'T' + HORARIOS_24H[hora] + ':00');
      if (horaFecha <= ahora) return false;
    }
    return true;
  });
}

/**
 * Controlador principal de reservas.html. Se apoya en las mismas funciones
 * de sesión de la sección 7 (getSession, isLoggedIn, findUserById) en vez
 * de duplicar esa lógica.
 */
function initReservasPage() {
  var page = document.getElementById('reservas-page');
  if (!page) return; // Esta función solo aplica a reservas.html

  if (!isLoggedIn()) {
    window.location.replace('login.html');
    return;
  }

  var session = getSession();
  var user = findUserById(session.userId);
  var nombreCompleto = session.nombre;
  if (user && user.apellido) nombreCompleto = user.nombre + ' ' + user.apellido;
  var correoUsuario = user ? user.correo : '';

  // ---- Elementos del formulario de nueva reserva ----
  var form = document.getElementById('reserva-form');
  var servicioInput = document.getElementById('reserva-servicio');
  var servicioError = document.getElementById('reserva-servicio-error');
  var areaInput = document.getElementById('reserva-area');
  var areaError = document.getElementById('reserva-area-error');
  var modalidadInput = document.getElementById('reserva-modalidad');
  var modalidadError = document.getElementById('reserva-modalidad-error');
  var fechaInput = document.getElementById('reserva-fecha');
  var fechaError = document.getElementById('reserva-fecha-error');
  var horaInput = document.getElementById('reserva-hora');
  var horaError = document.getElementById('reserva-hora-error');
  var motivoInput = document.getElementById('reserva-motivo');
  var motivoError = document.getElementById('reserva-motivo-error');
  var formSection = document.getElementById('reserva-form-section');
  var confirmSection = document.getElementById('reserva-confirmacion');

  var listaEl = document.getElementById('mis-reservas-lista');
  var vaciaEl = document.getElementById('mis-reservas-vacia');

  var modalOverlay = document.getElementById('modal-overlay');
  var modalBody = document.getElementById('modal-body');
  var modalClose = document.getElementById('modal-close');

  if (fechaInput) fechaInput.min = getTodayISO();

  /** Repuebla el <select> de horas según la fecha elegida en el formulario principal. */
  function actualizarHorasDisponibles(excludeId) {
    if (!horaInput) return;
    var horasDisponibles = getHorasDisponibles(session.userId, fechaInput.value, excludeId);
    var valorPrevio = horaInput.value;

    horaInput.innerHTML = '';

    if (!fechaInput.value) {
      horaInput.innerHTML = '<option value="">Selecciona una fecha primero</option>';
      horaInput.disabled = true;
      return;
    }

    if (!horasDisponibles.length) {
      horaInput.innerHTML = '<option value="">No hay horarios disponibles ese día</option>';
      horaInput.disabled = true;
      return;
    }

    horaInput.disabled = false;
    horaInput.innerHTML = '<option value="">Selecciona una hora</option>' +
      horasDisponibles.map(function (hora) {
        return '<option value="' + hora + '">' + hora + '</option>';
      }).join('');

    if (horasDisponibles.indexOf(valorPrevio) !== -1) {
      horaInput.value = valorPrevio;
    }
  }

  if (fechaInput) {
    fechaInput.addEventListener('change', function () { actualizarHorasDisponibles(); });
    actualizarHorasDisponibles();
  }

  /** Muestra la confirmación de una reserva recién creada y refresca las listas relacionadas. */
  function mostrarConfirmacion(reserva) {
    if (!confirmSection) return;
    confirmSection.innerHTML =
      '<h2 class="dashboard-card__title">¡Reserva confirmada!</h2>' +
      '<dl class="reserva-summary">' +
        '<div><dt>Servicio</dt><dd>' + escapeHtml(reserva.servicio) + '</dd></div>' +
        '<div><dt>Área</dt><dd>' + escapeHtml(reserva.area) + '</dd></div>' +
        '<div><dt>Modalidad</dt><dd>' + escapeHtml(reserva.modalidad) + '</dd></div>' +
        '<div><dt>Fecha</dt><dd>' + escapeHtml(formatFechaLarga(reserva.fecha)) + '</dd></div>' +
        '<div><dt>Hora</dt><dd>' + escapeHtml(reserva.hora) + '</dd></div>' +
        '<div><dt>Motivo</dt><dd>' + escapeHtml(reserva.motivo) + '</dd></div>' +
        '<div><dt>Estado</dt><dd><span class="tag tag--confirmada">' + escapeHtml(reserva.estado) + '</span></dd></div>' +
      '</dl>' +
      '<div class="quick-actions">' +
        '<a href="#mis-reservas" class="btn btn--primary" id="reserva-ver-mias">Ver mis reservas</a>' +
        '<a href="dashboard.html" class="btn btn--secondary">Volver al Dashboard</a>' +
      '</div>';
    confirmSection.hidden = false;
    confirmSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  if (form) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();

      clearFieldError(servicioInput, servicioError);
      clearFieldError(areaInput, areaError);
      clearFieldError(modalidadInput, modalidadError);
      clearFieldError(fechaInput, fechaError);
      clearFieldError(horaInput, horaError);
      clearFieldError(motivoInput, motivoError);
      if (confirmSection) confirmSection.hidden = true;

      var isValid = true;

      if (!servicioInput.value) {
        showFieldError(servicioInput, servicioError, 'Selecciona un servicio.');
        isValid = false;
      }
      if (!areaInput.value) {
        showFieldError(areaInput, areaError, 'Selecciona un área.');
        isValid = false;
      }
      if (!modalidadInput.value) {
        showFieldError(modalidadInput, modalidadError, 'Selecciona una modalidad.');
        isValid = false;
      }
      if (!fechaInput.value) {
        showFieldError(fechaInput, fechaError, 'Selecciona una fecha.');
        isValid = false;
      } else if (fechaInput.value < getTodayISO()) {
        showFieldError(fechaInput, fechaError, 'La fecha no puede ser anterior a hoy.');
        isValid = false;
      }
      if (!horaInput.value) {
        showFieldError(horaInput, horaError, 'Selecciona una hora disponible.');
        isValid = false;
      }
      if (!motivoInput.value.trim()) {
        showFieldError(motivoInput, motivoError, 'Cuéntanos brevemente qué necesitas.');
        isValid = false;
      } else if (motivoInput.value.trim().length > MAX_LENGTHS.motivoReserva) {
        showFieldError(motivoInput, motivoError, 'El motivo es demasiado largo (máximo ' + MAX_LENGTHS.motivoReserva + ' caracteres).');
        isValid = false;
      }

      if (!isValid) return;

      // Revalidación de disponibilidad justo antes de guardar (evita duplicar
      // una reserva activa idéntica si, por ejemplo, el usuario dejó el
      // formulario abierto un rato antes de enviarlo).
      var disponibles = getHorasDisponibles(session.userId, fechaInput.value);
      if (disponibles.indexOf(horaInput.value) === -1) {
        showFieldError(horaInput, horaError, 'Esa hora ya no está disponible. Elige otra.');
        actualizarHorasDisponibles();
        return;
      }

      var nuevaReserva = {
        id: generateLocalId(),
        usuarioId: session.userId,
        usuarioEmail: correoUsuario,
        usuarioNombre: nombreCompleto,
        servicio: servicioInput.value,
        area: areaInput.value,
        modalidad: modalidadInput.value,
        fecha: fechaInput.value,
        hora: horaInput.value,
        motivo: truncateToMax(motivoInput.value, MAX_LENGTHS.motivoReserva),
        estado: 'Confirmada',
        creadaEn: new Date().toISOString()
      };

      var reservas = getReservas();
      reservas.push(nuevaReserva);
      saveReservas(reservas);

      form.reset();
      actualizarHorasDisponibles();
      mostrarConfirmacion(nuevaReserva);
      renderMisReservas();
    });
  }

  /** Cierra el modal de detalles/reprogramación. */
  function cerrarModal() {
    if (!modalOverlay) return;
    modalOverlay.classList.remove('is-visible');
    if (modalBody) modalBody.innerHTML = '';
  }

  function abrirModal() {
    if (!modalOverlay) return;
    modalOverlay.classList.add('is-visible');
  }

  if (modalClose) modalClose.addEventListener('click', cerrarModal);
  if (modalOverlay) {
    modalOverlay.addEventListener('click', function (event) {
      if (event.target === modalOverlay) cerrarModal();
    });
  }
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') cerrarModal();
  });

  /** Modal: "Ver detalles" de una reserva puntual. */
  function abrirDetalles(reserva) {
    if (!modalBody) return;
    modalBody.innerHTML =
      '<h2 class="dashboard-card__title">Detalles de la reserva</h2>' +
      '<dl class="reserva-summary">' +
        '<div><dt>Servicio</dt><dd>' + escapeHtml(reserva.servicio) + '</dd></div>' +
        '<div><dt>Área</dt><dd>' + escapeHtml(reserva.area) + '</dd></div>' +
        '<div><dt>Modalidad</dt><dd>' + escapeHtml(reserva.modalidad) + '</dd></div>' +
        '<div><dt>Fecha</dt><dd>' + escapeHtml(formatFechaLarga(reserva.fecha)) + '</dd></div>' +
        '<div><dt>Hora</dt><dd>' + escapeHtml(reserva.hora) + '</dd></div>' +
        '<div><dt>Motivo</dt><dd>' + escapeHtml(reserva.motivo) + '</dd></div>' +
        '<div><dt>Estado</dt><dd><span class="tag ' + (reserva.estado === 'Cancelada' ? 'tag--cancelada' : 'tag--confirmada') + '">' + escapeHtml(reserva.estado) + '</span></dd></div>' +
        '<div><dt>Creada el</dt><dd>' + escapeHtml(new Date(reserva.creadaEn).toLocaleString('es-ES')) + '</dd></div>' +
      '</dl>' +
      '<div class="quick-actions"><button type="button" class="btn btn--secondary" id="modal-cerrar-detalles">Cerrar</button></div>';

    var cerrarBtn = document.getElementById('modal-cerrar-detalles');
    if (cerrarBtn) cerrarBtn.addEventListener('click', cerrarModal);
    abrirModal();
  }

  /** Modal: "Reprogramar" — permite cambiar solo fecha y hora. */
  function abrirReprogramar(reserva) {
    if (!modalBody) return;

    modalBody.innerHTML =
      '<h2 class="dashboard-card__title">Reprogramar reserva</h2>' +
      '<p class="dashboard-card__hint">Servicio: ' + escapeHtml(reserva.servicio) + ' · Área: ' + escapeHtml(reserva.area) + '</p>' +
      '<form id="reprogramar-form" novalidate>' +
        '<div class="form-group">' +
          '<label for="reprogramar-fecha" class="form-label">Nueva fecha</label>' +
          '<input type="date" id="reprogramar-fecha" class="form-input" min="' + getTodayISO() + '" value="' + reserva.fecha + '" required>' +
          '<p class="form-error" id="reprogramar-fecha-error"></p>' +
        '</div>' +
        '<div class="form-group">' +
          '<label for="reprogramar-hora" class="form-label">Nueva hora</label>' +
          '<select id="reprogramar-hora" class="form-select" required></select>' +
          '<p class="form-error" id="reprogramar-hora-error"></p>' +
        '</div>' +
        '<div class="quick-actions">' +
          '<button type="submit" class="btn btn--primary">Guardar cambios</button>' +
          '<button type="button" class="btn btn--ghost" id="reprogramar-cancelar">Cancelar</button>' +
        '</div>' +
      '</form>';

    var fechaEl = document.getElementById('reprogramar-fecha');
    var fechaErrorEl = document.getElementById('reprogramar-fecha-error');
    var horaEl = document.getElementById('reprogramar-hora');
    var horaErrorEl = document.getElementById('reprogramar-hora-error');
    var cancelBtn = document.getElementById('reprogramar-cancelar');
    var formEl = document.getElementById('reprogramar-form');

    function refrescarHoras() {
      var disponibles = getHorasDisponibles(session.userId, fechaEl.value, reserva.id);
      var valorPrevio = horaEl.value || reserva.hora;
      if (!disponibles.length) {
        horaEl.innerHTML = '<option value="">No hay horarios disponibles ese día</option>';
        return;
      }
      horaEl.innerHTML = disponibles.map(function (hora) {
        return '<option value="' + hora + '">' + hora + '</option>';
      }).join('');
      if (disponibles.indexOf(valorPrevio) !== -1) horaEl.value = valorPrevio;
    }

    refrescarHoras();
    fechaEl.addEventListener('change', refrescarHoras);
    if (cancelBtn) cancelBtn.addEventListener('click', cerrarModal);

    formEl.addEventListener('submit', function (event) {
      event.preventDefault();
      clearFieldError(fechaEl, fechaErrorEl);
      clearFieldError(horaEl, horaErrorEl);

      var isValid = true;
      if (!fechaEl.value) {
        showFieldError(fechaEl, fechaErrorEl, 'Selecciona una fecha.');
        isValid = false;
      } else if (fechaEl.value < getTodayISO()) {
        showFieldError(fechaEl, fechaErrorEl, 'La fecha no puede ser anterior a hoy.');
        isValid = false;
      }
      if (!horaEl.value) {
        showFieldError(horaEl, horaErrorEl, 'Selecciona una hora disponible.');
        isValid = false;
      }
      if (!isValid) return;

      var disponibles = getHorasDisponibles(session.userId, fechaEl.value, reserva.id);
      if (disponibles.indexOf(horaEl.value) === -1) {
        showFieldError(horaEl, horaErrorEl, 'Esa hora ya no está disponible. Elige otra.');
        refrescarHoras();
        return;
      }

      var reservas = getReservas();
      for (var i = 0; i < reservas.length; i++) {
        if (reservas[i].id === reserva.id) {
          reservas[i].fecha = fechaEl.value;
          reservas[i].hora = horaEl.value;
          break;
        }
      }
      saveReservas(reservas);
      cerrarModal();
      renderMisReservas();
      initDashboardSessionCard(); // no-op fuera de dashboard.html, seguro llamarla aquí
      if (fechaInput) actualizarHorasDisponibles();
    });

    abrirModal();
  }

  /** Cancela (sin borrar) una reserva, previa confirmación del usuario. */
  function cancelarReserva(reserva) {
    var confirmado = window.confirm('¿Estás seguro de que deseas cancelar esta reserva?');
    if (!confirmado) return;

    var reservas = getReservas();
    for (var i = 0; i < reservas.length; i++) {
      if (reservas[i].id === reserva.id) {
        reservas[i].estado = 'Cancelada';
        break;
      }
    }
    saveReservas(reservas);
    renderMisReservas();
    if (fechaInput) actualizarHorasDisponibles();
  }

  /** Dibuja la sección "Mis reservas" con las reservas del usuario autenticado. */
  function renderMisReservas() {
    if (!listaEl) return;
    var reservas = getReservasDeUsuario(session.userId);

    if (!reservas.length) {
      listaEl.innerHTML = '';
      listaEl.hidden = true;
      if (vaciaEl) vaciaEl.hidden = false;
      return;
    }

    listaEl.hidden = false;
    if (vaciaEl) vaciaEl.hidden = true;

    listaEl.innerHTML = reservas.map(function (reserva) {
      var esCancelada = reserva.estado === 'Cancelada';
      var tagClass = esCancelada ? 'tag--cancelada' : 'tag--confirmada';
      return (
        '<article class="reserva-card" data-reserva-id="' + reserva.id + '">' +
          '<div class="reserva-card__header">' +
            '<span class="tag tag--outline">' + escapeHtml(reserva.servicio) + '</span>' +
            '<span class="tag ' + tagClass + '">' + escapeHtml(reserva.estado) + '</span>' +
          '</div>' +
          '<h3 class="reserva-card__title">' + escapeHtml(reserva.area) + '</h3>' +
          '<p class="reserva-card__text">' +
            escapeHtml(formatFechaLarga(reserva.fecha)) + ' · ' + escapeHtml(reserva.hora) +
            ' · ' + escapeHtml(reserva.modalidad) +
          '</p>' +
          '<div class="reserva-card__footer">' +
            '<button type="button" class="btn btn--secondary" data-action="detalles">Ver detalles</button>' +
            (esCancelada ? '' :
              '<button type="button" class="btn btn--secondary" data-action="reprogramar">Reprogramar</button>' +
              '<button type="button" class="btn btn--ghost" data-action="cancelar">Cancelar</button>'
            ) +
          '</div>' +
        '</article>'
      );
    }).join('');

    var cards = listaEl.querySelectorAll('.reserva-card');
    cards.forEach(function (card) {
      var id = card.getAttribute('data-reserva-id');
      var reserva = reservas.filter(function (r) { return r.id === id; })[0];
      if (!reserva) return;

      var detallesBtn = card.querySelector('[data-action="detalles"]');
      var reprogramarBtn = card.querySelector('[data-action="reprogramar"]');
      var cancelarBtn = card.querySelector('[data-action="cancelar"]');

      if (detallesBtn) detallesBtn.addEventListener('click', function () { abrirDetalles(reserva); });
      if (reprogramarBtn) reprogramarBtn.addEventListener('click', function () { abrirReprogramar(reserva); });
      if (cancelarBtn) cancelarBtn.addEventListener('click', function () { cancelarReserva(reserva); });
    });
  }

  renderMisReservas();
}


/* ==========================================================================
   10. FORMACIÓN + INSCRIPCIÓN + PROGRESO DE CURSOS
   (formacion.html + integración con Dashboard)

   Igual que las secciones 7 y 9, es una demostración académica: los cursos
   son un catálogo fijo definido aquí mismo (no hay backend con contenido
   real), y las inscripciones/progreso de cada usuario se guardan solo en
   localStorage, bajo la clave sapereaude_cursos_usuario, asociadas siempre
   a session.userId (nunca por nombre o correo), igual que sapereaude_reservas.
   ========================================================================== */

var COURSES_STORAGE_KEY = 'sapereaude_cursos_usuario';

/**
 * Catálogo de cursos. Los ÚNICOS cursos de SAPERE AUDE son de idiomas:
 * inglés y francés. Las demás áreas (matemáticas, ciencias sociales,
 * administración, salud, desarrollo profesional) no son cursos: se
 * atienden como asesorías o consultorías y se agendan desde reservas.html.
 * Por eso no aparecen aquí. Las funciones que leen inscripciones antiguas
 * ignoran los ids que ya no existen en el catálogo (if (!curso) return).
 */
var COURSES_CATALOG = [
  {
    id: 'ingles-conversacional',
    nombre: 'Inglés conversacional',
    categoria: 'Idiomas',
    nivel: 'Nivel A2–B1',
    modalidad: 'Virtual',
    duracion: '6 semanas',
    descripcion: 'Práctica oral guiada y vocabulario aplicado a situaciones cotidianas y profesionales.',
    contenido: 'Curso centrado en la fluidez oral, la comprensión auditiva y el vocabulario práctico para el día a día y el entorno profesional.',
    modulos: [
      'Diagnóstico de nivel y objetivos',
      'Vocabulario cotidiano y profesional',
      'Práctica de conversación guiada',
      'Comprensión auditiva aplicada',
      'Evaluación final de fluidez'
    ]
  },
  {
    id: 'frances-basico',
    nombre: 'Francés básico',
    categoria: 'Idiomas',
    nivel: 'Nivel A1',
    modalidad: 'Virtual',
    duracion: '8 semanas',
    descripcion: 'Fundamentos de gramática, pronunciación y comprensión para comenzar desde cero.',
    contenido: 'Introducción al francés desde cero, con énfasis en pronunciación, estructuras gramaticales básicas y comprensión de textos simples.',
    modulos: [
      'Introducción a la pronunciación francesa',
      'Gramática básica y estructuras clave',
      'Vocabulario esencial',
      'Comprensión de textos simples',
      'Evaluación de nivel A1'
    ]
  },
];

/** Busca un curso del catálogo por id. */
function getCourseById(id) {
  for (var i = 0; i < COURSES_CATALOG.length; i++) {
    if (COURSES_CATALOG[i].id === id) return COURSES_CATALOG[i];
  }
  return null;
}

/** Lee todas las inscripciones (de todos los usuarios) desde localStorage. */
function getInscripciones() {
  try {
    var raw = window.localStorage.getItem(COURSES_STORAGE_KEY);
    var data = raw ? JSON.parse(raw) : [];
    return Array.isArray(data) ? data : [];
  } catch (error) {
    return [];
  }
}

/** Guarda la colección completa de inscripciones en localStorage. */
function saveInscripciones(inscripciones) {
  try {
    window.localStorage.setItem(COURSES_STORAGE_KEY, JSON.stringify(inscripciones));
  } catch (error) {
    // Ver nota en saveUsers(): localStorage puede no estar disponible.
  }
}

/** Inscripciones del usuario autenticado, más recientes primero. */
function getInscripcionesUsuario(userId) {
  return getInscripciones()
    .filter(function (i) { return i.usuarioId === userId; })
    // Inscripciones a cursos que ya no están en el catálogo (por ejemplo, las
    // creadas antes de dejar los cursos solo en idiomas) se omiten para que
    // los contadores no muestren un número que luego no tiene tarjeta.
    .filter(function (i) { return !!getCourseById(i.cursoId); })
    .sort(function (a, b) { return new Date(b.fechaInscripcion) - new Date(a.fechaInscripcion); });
}

/** Busca la inscripción de un usuario en un curso concreto (o null si no existe). */
function getInscripcion(userId, cursoId) {
  var lista = getInscripciones();
  for (var i = 0; i < lista.length; i++) {
    if (lista[i].usuarioId === userId && lista[i].cursoId === cursoId) return lista[i];
  }
  return null;
}

/** Progreso (0–100) de una inscripción según módulos completados / módulos totales. */
function calcularProgreso(inscripcion, curso) {
  if (!curso || !curso.modulos.length) return 0;
  return Math.round((inscripcion.modulosCompletados.length / curso.modulos.length) * 100);
}

/**
 * Crea la inscripción de un usuario a un curso si no existe ya una
 * (evita inscripciones duplicadas, ver sección 6 del módulo). Si ya existe,
 * simplemente la devuelve sin crear una nueva.
 */
function crearInscripcion(userId, usuarioEmail, curso) {
  var existente = getInscripcion(userId, curso.id);
  if (existente) return existente;

  var nueva = {
    id: generateLocalId(),
    usuarioId: userId,
    usuarioEmail: usuarioEmail || '',
    cursoId: curso.id,
    cursoNombre: curso.nombre,
    fechaInscripcion: getTodayISO(),
    progreso: 0,
    estado: 'En progreso',
    modulosCompletados: []
  };

  var lista = getInscripciones();
  lista.push(nueva);
  saveInscripciones(lista);
  return nueva;
}

/**
 * Marca un módulo como completado para la inscripción de un usuario en un
 * curso. Actualiza progreso y estado ("Completado" cuando ya no quedan
 * módulos pendientes) y persiste el cambio.
 */
function completarModulo(userId, cursoId, moduloIndex) {
  var curso = getCourseById(cursoId);
  if (!curso) return null;

  var lista = getInscripciones();
  var inscripcion = null;
  for (var i = 0; i < lista.length; i++) {
    if (lista[i].usuarioId === userId && lista[i].cursoId === cursoId) {
      inscripcion = lista[i];
      break;
    }
  }
  if (!inscripcion) return null;

  if (inscripcion.modulosCompletados.indexOf(moduloIndex) === -1) {
    inscripcion.modulosCompletados.push(moduloIndex);
  }
  inscripcion.progreso = calcularProgreso(inscripcion, curso);
  inscripcion.estado = inscripcion.modulosCompletados.length >= curso.modulos.length ? 'Completado' : 'En progreso';

  saveInscripciones(lista);
  return inscripcion;
}

/**
 * Controlador principal de formacion.html: catálogo interactivo ("Ver
 * curso" abre un modal con el detalle, inscripción y módulos), sección
 * "Mis cursos" para el usuario autenticado, y apertura automática del
 * detalle de un curso cuando se llega con un enlace tipo
 * formacion.html#curso-<id> (usado desde el Dashboard).
 */
function initFormacionPage() {
  var grid = document.getElementById('formacion-cursos-grid');
  var misCursosSection = document.getElementById('mis-cursos');
  if (!grid && !misCursosSection) return; // Esta función solo aplica a formacion.html

  var modalOverlay = document.getElementById('modal-overlay');
  var modalBody = document.getElementById('modal-body');
  var modalClose = document.getElementById('modal-close');

  var listaEl = document.getElementById('mis-cursos-lista');
  var vaciaEl = document.getElementById('mis-cursos-vacia');

  function cerrarModal() {
    if (!modalOverlay) return;
    modalOverlay.classList.remove('is-visible');
    if (modalBody) modalBody.innerHTML = '';
  }

  function abrirModal() {
    if (!modalOverlay) return;
    modalOverlay.classList.add('is-visible');
  }

  if (modalClose) modalClose.addEventListener('click', cerrarModal);
  if (modalOverlay) {
    modalOverlay.addEventListener('click', function (event) {
      if (event.target === modalOverlay) cerrarModal();
    });
  }
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') cerrarModal();
  });

  /** Añade/actualiza la insignia de estado (En progreso/Completado) en cada tarjeta del catálogo. */
  function renderCatalogStates() {
    if (!grid) return;
    var cards = grid.querySelectorAll('.course-card[data-course-id]');
    var loggedIn = isLoggedIn();
    var session = loggedIn ? getSession() : null;

    cards.forEach(function (card) {
      var courseId = card.getAttribute('data-course-id');
      var curso = getCourseById(courseId);
      if (!curso) return;

      var badgeExistente = card.querySelector('.course-card__status');
      if (badgeExistente) badgeExistente.remove();

      var inscripcion = loggedIn ? getInscripcion(session.userId, courseId) : null;
      if (!inscripcion) return;

      var completado = inscripcion.estado === 'Completado';
      var meta = card.querySelector('.course-card__meta');
      if (!meta) return;

      var badge = document.createElement('span');
      badge.className = 'tag course-card__status ' + (completado ? 'tag--completado' : 'tag--progreso');
      badge.textContent = completado ? 'Completado' : ('En progreso · ' + calcularProgreso(inscripcion, curso) + '%');
      meta.appendChild(badge);
    });
  }

  /** Dibuja la sección "Mis cursos" con las inscripciones del usuario autenticado. */
  function renderMisCursos() {
    if (!listaEl) return;
    if (!isLoggedIn()) {
      listaEl.hidden = true;
      listaEl.innerHTML = '';
      if (vaciaEl) vaciaEl.hidden = true;
      return;
    }

    var session = getSession();
    var inscripciones = getInscripcionesUsuario(session.userId);

    if (!inscripciones.length) {
      listaEl.hidden = true;
      listaEl.innerHTML = '';
      if (vaciaEl) vaciaEl.hidden = false;
      return;
    }

    listaEl.hidden = false;
    if (vaciaEl) vaciaEl.hidden = true;

    listaEl.innerHTML = inscripciones.map(function (insc) {
      var curso = getCourseById(insc.cursoId);
      if (!curso) return '';
      var progreso = calcularProgreso(insc, curso);
      var completado = insc.estado === 'Completado';
      return (
        '<article class="reserva-card" data-course-id="' + insc.cursoId + '">' +
          '<div class="reserva-card__header">' +
            '<span class="tag tag--outline">' + escapeHtml(curso.categoria) + '</span>' +
            '<span class="tag ' + (completado ? 'tag--completado' : 'tag--progreso') + '">' + escapeHtml(insc.estado) + '</span>' +
          '</div>' +
          '<h3 class="reserva-card__title">' + escapeHtml(curso.nombre) + '</h3>' +
          '<div class="progress-bar' + (completado ? ' progress-bar--complete' : '') + '"><div class="progress-bar__fill" style="width:' + progreso + '%"></div></div>' +
          '<p class="reserva-card__text">' +
            insc.modulosCompletados.length + ' de ' + curso.modulos.length + ' módulos · ' + progreso + '% · Inscrito el ' + escapeHtml(formatFechaLarga(insc.fechaInscripcion)) +
          '</p>' +
          '<div class="reserva-card__footer">' +
            '<button type="button" class="btn btn--primary" data-action="continuar">' + (completado ? 'Ver curso' : 'Continuar curso') + '</button>' +
          '</div>' +
        '</article>'
      );
    }).join('');

    var botones = listaEl.querySelectorAll('[data-action="continuar"]');
    botones.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var card = btn.closest('[data-course-id]');
        var courseId = card ? card.getAttribute('data-course-id') : null;
        if (courseId) abrirCourseModal(courseId);
      });
    });
  }

  /** Construye el contenido del modal de detalle/progreso de un curso y lo pinta. */
  function renderCourseModal(courseId) {
    var curso = getCourseById(courseId);
    if (!curso || !modalBody) return;

    var loggedIn = isLoggedIn();
    var session = loggedIn ? getSession() : null;
    var user = (loggedIn && session) ? findUserById(session.userId) : null;
    var inscripcion = loggedIn ? getInscripcion(session.userId, courseId) : null;

    var metaTags =
      '<span class="tag tag--outline">' + escapeHtml(curso.categoria) + '</span>' +
      '<span class="tag tag--outline">' + escapeHtml(curso.modalidad) + '</span>' +
      '<span class="tag tag--outline">' + escapeHtml(curso.duracion) + '</span>' +
      '<span class="tag tag--outline">' + escapeHtml(curso.nivel) + '</span>';

    var html =
      '<h2 class="dashboard-card__title">' + escapeHtml(curso.nombre) + '</h2>' +
      '<div class="course-detail__meta">' + metaTags + '</div>' +
      '<p class="reserva-card__text">' + escapeHtml(curso.descripcion) + '</p>' +
      '<p class="course-detail__section-title">Contenido del curso</p>' +
      '<p class="reserva-card__text">' + escapeHtml(curso.contenido) + '</p>';

    if (!loggedIn) {
      html += '<ul class="benefits-list">' + curso.modulos.map(function (m) { return '<li>' + escapeHtml(m) + '</li>'; }).join('') + '</ul>';
      html += '<div class="quick-actions"><a href="login.html" class="btn btn--primary">Inicia sesión para inscribirte</a></div>';
    } else if (!inscripcion) {
      html += '<ul class="benefits-list">' + curso.modulos.map(function (m) { return '<li>' + escapeHtml(m) + '</li>'; }).join('') + '</ul>';
      html += '<div class="quick-actions"><button type="button" class="btn btn--primary" id="modal-inscribirme">Inscribirme</button></div>';
    } else {
      var progreso = calcularProgreso(inscripcion, curso);
      var completado = inscripcion.estado === 'Completado';

      if (completado) {
        html += '<div class="course-complete-banner">¡Curso completado!</div>';
      }

      html +=
        '<p class="course-detail__section-title">Tu progreso</p>' +
        '<div class="progress-bar' + (completado ? ' progress-bar--complete' : '') + '"><div class="progress-bar__fill" style="width:' + progreso + '%"></div></div>' +
        '<p class="reserva-card__text">' + inscripcion.modulosCompletados.length + ' de ' + curso.modulos.length + ' módulos · ' + progreso + '%</p>' +
        '<div class="course-modules">' +
        curso.modulos.map(function (modulo, idx) {
          var isDone = inscripcion.modulosCompletados.indexOf(idx) !== -1;
          return (
            '<div class="course-module' + (isDone ? ' is-complete' : '') + '">' +
              '<span class="course-module__name"><span class="course-module__check" aria-hidden="true"></span>' + escapeHtml(modulo) + '</span>' +
              (isDone ? '' : '<button type="button" class="btn btn--secondary" data-action="completar-modulo" data-modulo-index="' + idx + '">Completar módulo</button>') +
            '</div>'
          );
        }).join('') +
        '</div>';
    }

    modalBody.innerHTML = html;

    var inscribirBtn = document.getElementById('modal-inscribirme');
    if (inscribirBtn && session) {
      inscribirBtn.addEventListener('click', function () {
        crearInscripcion(session.userId, user ? user.correo : '', curso);
        renderCourseModal(courseId);
        renderMisCursos();
        renderCatalogStates();
        initDashboardCoursesProgress(); // no-op fuera de dashboard.html, seguro llamarla aquí
      });
    }

    var completarBtns = modalBody.querySelectorAll('[data-action="completar-modulo"]');
    completarBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (!session) return;
        var idx = parseInt(btn.getAttribute('data-modulo-index'), 10);
        completarModulo(session.userId, courseId, idx);
        renderCourseModal(courseId);
        renderMisCursos();
        renderCatalogStates();
        initDashboardCoursesProgress(); // no-op fuera de dashboard.html, seguro llamarla aquí
      });
    });
  }

  function abrirCourseModal(courseId) {
    renderCourseModal(courseId);
    abrirModal();
  }

  if (grid) {
    var verCursoBtns = grid.querySelectorAll('[data-action="ver-curso"]');
    verCursoBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var card = btn.closest('.course-card');
        var courseId = card ? card.getAttribute('data-course-id') : null;
        if (courseId) abrirCourseModal(courseId);
      });
    });
    renderCatalogStates();
  }

  renderMisCursos();

  // Apertura automática del detalle de un curso al llegar con un enlace
  // tipo formacion.html#curso-<id> (usado por los botones "Ver curso" del
  // Dashboard, que enlazan directamente aquí).
  if (window.location.hash && window.location.hash.indexOf('#curso-') === 0) {
    var hashCourseId = window.location.hash.replace('#curso-', '');
    if (getCourseById(hashCourseId)) {
      abrirCourseModal(hashCourseId);
    }
  }
}

/**
 * Actualiza la tarjeta "Mi progreso" del Dashboard con datos reales de
 * sapereaude_cursos_usuario para el usuario autenticado: cursos activos,
 * cursos completados, progreso general (promedio) y sesiones agendadas
 * (a partir de sapereaude_reservas). Si el usuario no tiene cursos, muestra
 * el estado vacío con acceso directo a Formación. Solo se ejecuta si la
 * página incluye el contenedor #dashboard-progress-content.
 */
function initDashboardCoursesProgress() {
  var container = document.getElementById('dashboard-progress-content');
  if (!container) return;
  if (!isLoggedIn()) return; // dashboard.html ya redirige por su cuenta

  var session = getSession();
  var inscripciones = getInscripcionesUsuario(session.userId);

  if (!inscripciones.length) {
    container.innerHTML =
      '<p class="dashboard-card__empty">Comienza tu aprendizaje</p>' +
      '<a href="formacion.html" class="btn btn--primary">Ver cursos de idiomas</a>';
    return;
  }

  var activos = inscripciones.filter(function (i) { return i.estado === 'En progreso'; });
  var completados = inscripciones.filter(function (i) { return i.estado === 'Completado'; });

  var sumaProgreso = inscripciones.reduce(function (acc, i) {
    var curso = getCourseById(i.cursoId);
    return acc + (curso ? calcularProgreso(i, curso) : 0);
  }, 0);
  var progresoGeneral = Math.round(sumaProgreso / inscripciones.length);

  var sesionesAgendadas = getReservas().filter(function (r) {
    return r.usuarioId === session.userId && r.estado === 'Confirmada';
  }).length;

  var activosPreview = activos.slice(0, 3).map(function (i) {
    var curso = getCourseById(i.cursoId);
    if (!curso) return '';
    var progreso = calcularProgreso(i, curso);
    return (
      '<div class="mini-course-progress">' +
        '<div class="mini-course-progress__header"><span>' + escapeHtml(curso.nombre) + '</span><span>' + progreso + '%</span></div>' +
        '<div class="progress-bar"><div class="progress-bar__fill" style="width:' + progreso + '%"></div></div>' +
      '</div>'
    );
  }).join('');

  container.innerHTML =
    '<div class="stat-grid">' +
      '<div class="stat"><span class="stat__value">' + activos.length + '</span><span class="stat__label">Cursos activos</span></div>' +
      '<div class="stat"><span class="stat__value">' + completados.length + '</span><span class="stat__label">Cursos completados</span></div>' +
      '<div class="stat"><span class="stat__value">' + progresoGeneral + '%</span><span class="stat__label">Progreso general</span></div>' +
      '<div class="stat"><span class="stat__value">' + sesionesAgendadas + '</span><span class="stat__label">Sesiones agendadas</span></div>' +
    '</div>' +
    (activosPreview ? '<div class="mini-course-progress-list">' + activosPreview + '</div>' : '') +
    '<div class="quick-actions"><a href="formacion.html" class="btn btn--secondary">Ver cursos de idiomas</a></div>';
}


/* ==========================================================================
   11. RECURSOS (recursos.html + integración con Dashboard)

   Igual que reservas y cursos: catálogo fijo definido aquí (sin backend).
   Lo único que se guarda por usuario en localStorage son los favoritos,
   bajo la clave sapereaude_recursos_guardados, como un mapa
   { userId: [idRecurso, idRecurso, ...] } — nunca por nombre o correo,
   igual que sapereaude_reservas y sapereaude_cursos_usuario.
   ========================================================================== */

var RESOURCES_STORAGE_KEY = 'sapereaude_recursos_guardados';

/**
 * Catálogo de recursos. Mantiene exactamente los mismos recursos
 * demostrativos que ya existían en recursos.html y dashboard.html (mismo
 * título, categoría y tipo); solo se añade un id estable y una descripción
 * de "contenido disponible" para el modal de detalle.
 */
var RESOURCES_CATALOG = [
  {
    id: 'guia-tecnicas-estudio',
    titulo: 'Guía de técnicas de estudio',
    categoria: 'guias',
    categoriaLabel: 'Guía',
    tipo: 'PDF',
    descripcion: 'Estrategias prácticas para organizar el tiempo de estudio y mejorar la comprensión.',
    contenido: 'Técnicas de gestión del tiempo, repaso activo y organización de apuntes, aplicables a distintas áreas de estudio.'
  },
  {
    id: 'plantilla-plan-proyecto',
    titulo: 'Plantilla de plan de proyecto',
    categoria: 'plantillas',
    categoriaLabel: 'Plantilla',
    tipo: 'DOCX',
    descripcion: 'Estructura editable para formular objetivos, actividades y cronograma de un proyecto.',
    contenido: 'Plantilla editable con secciones para objetivos, actividades, cronograma y responsables de un proyecto.'
  },
  {
    id: 'glosario-administracion',
    titulo: 'Glosario de administración',
    categoria: 'documentos',
    categoriaLabel: 'Documento',
    tipo: 'PDF',
    descripcion: 'Definiciones clave de términos usados en las asesorías de administración.',
    contenido: 'Glosario de referencia con definiciones de términos frecuentes en administración.'
  },
  {
    id: 'checklist-seguimiento-proyectos',
    titulo: 'Checklist de seguimiento de proyectos',
    categoria: 'herramientas',
    categoriaLabel: 'Herramienta',
    tipo: 'PDF',
    descripcion: 'Lista de verificación para acompañar cada etapa del ciclo de proyectos.',
    contenido: 'Checklist con puntos de verificación para formulación, ejecución, seguimiento y evaluación de proyectos.'
  },
  {
    id: 'guia-vocabulario-ingles',
    titulo: 'Guía de vocabulario en inglés académico',
    categoria: 'guias',
    categoriaLabel: 'Guía',
    tipo: 'PDF',
    descripcion: 'Vocabulario frecuente para lectura y escritura de textos académicos en inglés.',
    contenido: 'Listado de vocabulario académico en inglés organizado por tema, útil para lectura y escritura universitaria.'
  },
  {
    id: 'plantilla-evaluacion-desempeno',
    titulo: 'Plantilla de evaluación de desempeño',
    categoria: 'plantillas',
    categoriaLabel: 'Plantilla',
    tipo: 'XLSX',
    descripcion: 'Formato base para diseñar procesos de evaluación en equipos de trabajo.',
    contenido: 'Plantilla base en formato de hoja de cálculo para diseñar criterios y escalas de evaluación de desempeño.'
  }
];

/** Busca un recurso del catálogo por id. */
function getResourceById(id) {
  for (var i = 0; i < RESOURCES_CATALOG.length; i++) {
    if (RESOURCES_CATALOG[i].id === id) return RESOURCES_CATALOG[i];
  }
  return null;
}

/** Lee el mapa completo { userId: [ids] } de recursos guardados desde localStorage. */
function getRecursosGuardadosMap() {
  try {
    var raw = window.localStorage.getItem(RESOURCES_STORAGE_KEY);
    var data = raw ? JSON.parse(raw) : {};
    return (data && typeof data === 'object' && !Array.isArray(data)) ? data : {};
  } catch (error) {
    return {};
  }
}

/** Guarda el mapa completo de recursos guardados en localStorage. */
function saveRecursosGuardadosMap(map) {
  try {
    window.localStorage.setItem(RESOURCES_STORAGE_KEY, JSON.stringify(map));
  } catch (error) {
    // Ver nota en saveUsers(): localStorage puede no estar disponible.
  }
}

/** Ids de recursos guardados por un usuario concreto (array vacío si no tiene ninguno). */
function getGuardadosUsuario(userId) {
  var map = getRecursosGuardadosMap();
  return Array.isArray(map[userId]) ? map[userId] : [];
}

/** Indica si un usuario tiene guardado un recurso concreto. */
function isRecursoGuardado(userId, id) {
  return getGuardadosUsuario(userId).indexOf(id) !== -1;
}

/**
 * Agrega o quita un recurso de los guardados de un usuario (toggle) y
 * persiste el cambio. Devuelve true si quedó guardado, false si se quitó.
 */
function toggleFavorito(userId, id) {
  var map = getRecursosGuardadosMap();
  var lista = Array.isArray(map[userId]) ? map[userId].slice() : [];
  var idx = lista.indexOf(id);
  if (idx === -1) {
    lista.push(id);
  } else {
    lista.splice(idx, 1);
  }
  map[userId] = lista;
  saveRecursosGuardadosMap(map);
  return lista.indexOf(id) !== -1;
}

/**
 * Genera y descarga un archivo de demostración para un recurso del
 * catálogo. No existen archivos oficiales de SAPERE AUDE asociados a estos
 * recursos (son contenido demostrativo del proyecto), así que el archivo
 * generado lo indica explícitamente en su propio contenido: es una
 * descarga real y funcional, pero identificada como material de
 * demostración académica, nunca como un documento oficial.
 */
function descargarRecurso(id) {
  var recurso = getResourceById(id);
  if (!recurso) return;

  var contenido =
    'SAPERE AUDE — Documento de demostración\n' +
    '========================================\n\n' +
    'Título: ' + recurso.titulo + '\n' +
    'Categoría: ' + recurso.categoriaLabel + '\n' +
    'Tipo original del recurso: ' + recurso.tipo + '\n\n' +
    recurso.descripcion + '\n\n' +
    recurso.contenido + '\n\n' +
    '----------------------------------------\n' +
    'Este archivo fue generado localmente como contenido de demostración\n' +
    'para el proyecto académico SAPERE AUDE. No es un documento oficial\n' +
    'de la organización.';

  try {
    var blob = new Blob([contenido], { type: 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = recurso.id + '.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  } catch (error) {
    // Respaldo si Blob/URL.createObjectURL no estuviera disponible: abre el
    // contenido como data URI en una nueva pestaña para que igual pueda
    // guardarse manualmente.
    window.open('data:text/plain;charset=utf-8,' + encodeURIComponent(contenido), '_blank');
  }
}

/**
 * Actualiza el estado visual (aria-pressed, clase is-active, aria-label) de
 * un botón de favorito según si el recurso correspondiente está guardado
 * por el usuario autenticado. Sin sesión activa, siempre se muestra como
 * "no guardado" (el botón redirige a login.html al hacer clic).
 */
function updateFavoritoButtonState(btn) {
  var id = btn.getAttribute('data-resource-id');
  var guardado = isLoggedIn() && isRecursoGuardado(getSession().userId, id);
  btn.classList.toggle('is-active', !!guardado);
  btn.setAttribute('aria-pressed', guardado ? 'true' : 'false');
  btn.setAttribute('aria-label', guardado ? 'Quitar de guardados' : 'Guardar recurso');
}

/**
 * Wiring genérico, válido en CUALQUIER página que incluya botones con
 * data-action="descargar" o data-action="favorito" (recursos.html y las
 * tarjetas de "Recursos recomendados" en dashboard.html). Así, dashboard.html
 * no necesita duplicar esta lógica ni tener su propio modal para que
 * "Descargar" funcione de verdad.
 */
function initResourceActions() {
  var descargarBtns = document.querySelectorAll('[data-action="descargar"][data-resource-id]');
  descargarBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      descargarRecurso(btn.getAttribute('data-resource-id'));
    });
  });

  var favoritoBtns = document.querySelectorAll('[data-action="favorito"][data-resource-id]');
  favoritoBtns.forEach(function (btn) {
    updateFavoritoButtonState(btn);
    btn.addEventListener('click', function () {
      if (!isLoggedIn()) {
        window.location.href = 'login.html';
        return;
      }
      var id = btn.getAttribute('data-resource-id');
      toggleFavorito(getSession().userId, id);

      // Actualiza cualquier botón de favorito de este mismo recurso en la
      // página (por ahora solo hay uno por tarjeta, pero así queda a salvo
      // de duplicados futuros) y avisa a initRecursosPage() para que
      // refresque la vista "Mis recursos guardados" si está activa.
      document.querySelectorAll('[data-action="favorito"][data-resource-id="' + id + '"]').forEach(updateFavoritoButtonState);
      document.dispatchEvent(new CustomEvent('recursos:guardados-cambiaron'));
    });
  });
}

/**
 * Controlador principal de recursos.html: buscador, filtros por categoría,
 * vista "Todos" / "Mis recursos guardados", modal de detalle (ver, descargar,
 * guardar/quitar de favoritos) y apertura automática de un recurso al llegar
 * con un enlace tipo recursos.html#recurso-<id> (mismo patrón que
 * formacion.html#curso-<id>, usado por los botones "Ver recurso" del
 * Dashboard). No hace nada en las demás páginas.
 */
function initRecursosPage() {
  var grid = document.getElementById('resources-grid');
  if (!grid) return; // Esta función solo aplica a recursos.html

  var searchInput = document.getElementById('resource-search');
  var filterBar = document.getElementById('resource-filters');
  var viewTabs = document.getElementById('resource-view-tabs');
  var emptyState = document.getElementById('resources-empty');

  var modalOverlay = document.getElementById('modal-overlay');
  var modalBody = document.getElementById('modal-body');
  var modalClose = document.getElementById('modal-close');

  var cards = Array.prototype.slice.call(grid.querySelectorAll('.resource-card'));
  var activeFilter = 'todos';
  var activeView = 'todos'; // 'todos' | 'guardados'

  var MENSAJE_SIN_RESULTADOS = 'No encontramos recursos que coincidan con tu búsqueda o filtro.';
  var MENSAJE_SIN_GUARDADOS = 'Aún no tienes recursos guardados. Explora el catálogo y guarda los que te interesen.';

  function cerrarModal() {
    if (!modalOverlay) return;
    modalOverlay.classList.remove('is-visible');
    if (modalBody) modalBody.innerHTML = '';
  }

  function abrirModal() {
    if (!modalOverlay) return;
    modalOverlay.classList.add('is-visible');
  }

  if (modalClose) modalClose.addEventListener('click', cerrarModal);
  if (modalOverlay) {
    modalOverlay.addEventListener('click', function (event) {
      if (event.target === modalOverlay) cerrarModal();
    });
  }
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') cerrarModal();
  });

  /** Construye y pinta el contenido del modal de detalle de un recurso. */
  function renderResourceModal(id) {
    var recurso = getResourceById(id);
    if (!recurso || !modalBody) return;

    var loggedIn = isLoggedIn();
    var session = loggedIn ? getSession() : null;
    var guardado = loggedIn && isRecursoGuardado(session.userId, id);

    var html =
      '<h2 class="dashboard-card__title">' + escapeHtml(recurso.titulo) + '</h2>' +
      '<div class="course-detail__meta">' +
        '<span class="tag tag--outline">' + escapeHtml(recurso.categoriaLabel) + '</span>' +
        '<span class="tag tag--outline">' + escapeHtml(recurso.tipo) + '</span>' +
      '</div>' +
      '<p class="reserva-card__text">' + escapeHtml(recurso.descripcion) + '</p>' +
      '<p class="course-detail__section-title">Contenido disponible</p>' +
      '<p class="reserva-card__text">' + escapeHtml(recurso.contenido) + '</p>' +
      '<div class="quick-actions">' +
        '<button type="button" class="btn btn--primary" id="modal-descargar-recurso">Descargar</button>' +
        (loggedIn
          ? '<button type="button" class="btn btn--secondary" id="modal-favorito-recurso">' + (guardado ? 'Quitar de guardados' : 'Guardar recurso') + '</button>'
          : '<a href="login.html" class="btn btn--secondary">Inicia sesión para guardar</a>'
        ) +
      '</div>';

    modalBody.innerHTML = html;

    var descargarBtn = document.getElementById('modal-descargar-recurso');
    if (descargarBtn) descargarBtn.addEventListener('click', function () { descargarRecurso(id); });

    var favBtn = document.getElementById('modal-favorito-recurso');
    if (favBtn && session) {
      favBtn.addEventListener('click', function () {
        toggleFavorito(session.userId, id);
        document.querySelectorAll('[data-action="favorito"][data-resource-id="' + id + '"]').forEach(updateFavoritoButtonState);
        document.dispatchEvent(new CustomEvent('recursos:guardados-cambiaron'));
        renderResourceModal(id);
      });
    }
  }

  function abrirRecursoModal(id) {
    renderResourceModal(id);
    abrirModal();
  }

  /** Aplica búsqueda + filtro de categoría + vista (todos/guardados) sobre las tarjetas. */
  function applyFilters() {
    var query = searchInput ? searchInput.value.trim().toLowerCase() : '';
    var loggedIn = isLoggedIn();
    var guardados = loggedIn ? getGuardadosUsuario(getSession().userId) : [];
    var visibleCount = 0;

    cards.forEach(function (card) {
      var id = card.getAttribute('data-resource-id');
      var category = card.getAttribute('data-category') || '';
      var titleEl = card.querySelector('.resource-card__title');
      var textEl = card.querySelector('.resource-card__text');
      var tagEl = card.querySelector('.tag');

      var haystack = [
        titleEl ? titleEl.textContent : '',
        textEl ? textEl.textContent : '',
        tagEl ? tagEl.textContent : '',
        category
      ].join(' ').toLowerCase();

      var matchesCategory = activeFilter === 'todos' || category === activeFilter;
      var matchesSearch = query === '' || haystack.indexOf(query) !== -1;
      var matchesView = activeView === 'todos' || guardados.indexOf(id) !== -1;
      var isVisible = matchesCategory && matchesSearch && matchesView;

      card.style.display = isVisible ? '' : 'none';
      if (isVisible) visibleCount += 1;
    });

    if (emptyState) {
      emptyState.textContent = activeView === 'guardados' ? MENSAJE_SIN_GUARDADOS : MENSAJE_SIN_RESULTADOS;
      emptyState.classList.toggle('is-visible', visibleCount === 0);
    }
  }

  if (searchInput) {
    searchInput.addEventListener('input', applyFilters);
  }

  if (filterBar) {
    var chips = Array.prototype.slice.call(filterBar.querySelectorAll('.filter-chip'));
    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        chips.forEach(function (c) { c.classList.remove('is-active'); });
        chip.classList.add('is-active');
        activeFilter = chip.getAttribute('data-filter') || 'todos';
        applyFilters();
      });
    });
  }

  if (viewTabs) {
    var tabButtons = Array.prototype.slice.call(viewTabs.querySelectorAll('[data-view]'));
    tabButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var view = btn.getAttribute('data-view');

        // "Mis recursos guardados" requiere sesión activa; sin sesión, se
        // redirige a login.html en vez de mostrar una vista vacía confusa.
        if (view === 'guardados' && !isLoggedIn()) {
          window.location.href = 'login.html';
          return;
        }

        tabButtons.forEach(function (b) { b.classList.remove('is-active'); });
        btn.classList.add('is-active');
        activeView = view;
        applyFilters();
      });
    });
  }

  // Si un favorito cambia desde cualquier botón de tarjeta (ver
  // initResourceActions) o desde el modal, refrescamos la vista actual —
  // relevante sobre todo en "Mis recursos guardados", donde quitar un
  // favorito debe ocultar la tarjeta de inmediato.
  document.addEventListener('recursos:guardados-cambiaron', applyFilters);

  cards.forEach(function (card) {
    var id = card.getAttribute('data-resource-id');
    var verBtn = card.querySelector('[data-action="ver-recurso"]');
    if (verBtn) {
      verBtn.addEventListener('click', function () { abrirRecursoModal(id); });
    }
    // Los botones [data-action="descargar"] y [data-action="favorito"] de
    // cada tarjeta ya quedan conectados por initResourceActions(), que se
    // ejecuta en todas las páginas antes que este controlador.
  });

  // Estado inicial (por si el navegador conserva el valor del buscador al recargar).
  applyFilters();

  // Apertura automática del detalle de un recurso al llegar con un enlace
  // tipo recursos.html#recurso-<id> (usado por los botones "Ver recurso"
  // del Dashboard, que enlazan directamente aquí).
  if (window.location.hash && window.location.hash.indexOf('#recurso-') === 0) {
    var hashResourceId = window.location.hash.replace('#recurso-', '');
    if (getResourceById(hashResourceId)) {
      abrirRecursoModal(hashResourceId);
    }
  }
}


/* ==========================================================================
   12. CHAT CON ASESORES (chat.html + integración con Dashboard)

   Prototipo funcional de mensajería sin backend: usa localStorage para
   guardar los mensajes, y un pequeño motor de respuestas automáticas por
   palabras clave para simular la respuesta de un asesor. Los "asesores"
   son perfiles DEMOSTRATIVOS (no personas reales conectadas), y cada
   mensaje generado por este motor se etiqueta en la interfaz como
   "Respuesta automática demostrativa" para que quede claro.

   Los datos y funciones de esta sección son de módulo (no anidados dentro
   de initChatPage) porque initDashboardMessagesCard() —usada en
   dashboard.html— también los necesita para mostrar un resumen de
   conversaciones.
   ========================================================================== */

/** Clave de localStorage para los mensajes del Chat. Ver también sección 7
 *  (USERS_STORAGE_KEY, SESSION_STORAGE_KEY) y sección 9 (RESERVATIONS_STORAGE_KEY):
 *  ninguna de esas claves se reutiliza aquí; esta es nueva porque el Chat
 *  es un módulo de datos distinto. */
var MESSAGES_STORAGE_KEY = 'sapereaude_mensajes';

/**
 * Asesores DEMOSTRATIVOS del Chat. No son empleados reales de SAPERE AUDE:
 * son perfiles de ejemplo para simular la mensajería sin backend. El campo
 * "color" referencia una variante de .chat-avatar en css/styles.css.
 */
var CHAT_ADVISORS = [
  {
    id: 'asesor-academico',
    nombre: 'Valentina Ríos',
    especialidad: 'Asesoría académica',
    iniciales: 'VR',
    color: 'forest',
    estado: 'Disponible'
  },
  {
    id: 'asesor-idiomas',
    nombre: 'Camilo Duarte',
    especialidad: 'Idiomas y formación',
    iniciales: 'CD',
    color: 'bronze',
    estado: 'Disponible'
  },
  {
    id: 'asesor-consultoria',
    nombre: 'Marcela Ortiz',
    especialidad: 'Consultoría y proyectos',
    iniciales: 'MO',
    color: 'ink',
    estado: 'Disponible'
  }
];

/** Busca un asesor demostrativo por id. */
function getAsesorById(id) {
  for (var i = 0; i < CHAT_ADVISORS.length; i++) {
    if (CHAT_ADVISORS[i].id === id) return CHAT_ADVISORS[i];
  }
  return null;
}

/** Lee todos los mensajes (de todos los usuarios y asesores) desde localStorage. */
function getMensajes() {
  try {
    var raw = window.localStorage.getItem(MESSAGES_STORAGE_KEY);
    var mensajes = raw ? JSON.parse(raw) : [];
    return Array.isArray(mensajes) ? mensajes : [];
  } catch (error) {
    return [];
  }
}

/** Guarda la colección completa de mensajes en localStorage. */
function saveMensajes(mensajes) {
  try {
    window.localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(mensajes));
  } catch (error) {
    // Ver nota en saveUsers(): localStorage puede no estar disponible.
  }
}

/** Agrega un mensaje a la colección y lo persiste de inmediato. */
function addMensaje(mensaje) {
  var mensajes = getMensajes();
  mensajes.push(mensaje);
  saveMensajes(mensajes);
  return mensaje;
}

/**
 * Devuelve solo los mensajes de una conversación concreta (un usuario con
 * un asesor), en el orden en que se enviaron. Esta es la pieza clave que
 * mantiene las conversaciones separadas: Usuario A + Asesor 1 nunca
 * incluye mensajes de Usuario A + Asesor 2, ni de Usuario B con nadie.
 */
function getConversacion(userId, asesorId) {
  return getMensajes().filter(function (m) {
    return m.usuario === userId && m.asesor === asesorId;
  });
}

/** Último mensaje de una conversación concreta, o null si no hay ninguno. */
function getUltimoMensajeConversacion(userId, asesorId) {
  var conversacion = getConversacion(userId, asesorId);
  return conversacion.length ? conversacion[conversacion.length - 1] : null;
}

/** Recorta un texto largo para las vistas previas de la lista de asesores. */
function truncateChatText(text, max) {
  if (!text) return '';
  return text.length > max ? text.slice(0, max - 1) + '…' : text;
}

/** Formatea la fecha ISO de un mensaje como hora corta (HH:MM). */
function formatHoraMensaje(fechaISO) {
  try {
    return new Date(fechaISO).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  } catch (error) {
    return '';
  }
}

/**
 * Motor de respuestas automáticas DEMOSTRATIVAS por palabras clave. No hay
 * IA real ni conexión a un asesor humano: es una simulación simple para
 * que el prototipo de mensajería se sienta funcional. El chatbot con IA
 * real ("SAPERE BOT") es un módulo futuro, distinto de este.
 */
function generarRespuestaAutomatica(texto) {
  var t = (texto || '').toLowerCase();

  if (/\b(hola|buenas|hey|qué tal|que tal|saludos)\b/.test(t)) {
    return '¡Hola! 👋 Gracias por escribirnos. ¿En qué podemos ayudarte hoy?';
  }
  if (/reserva|agendar|cita|sesi[oó]n|cancelar|reprogramar/.test(t)) {
    return 'Para agendar, reprogramar o cancelar una asesoría, visita la sección "Mis reservas" desde el panel: allí puedes elegir servicio, área, modalidad, fecha y hora.';
  }
  if (/curso|formaci[oó]n|inscrib|m[oó]dulo/.test(t)) {
    return 'Puedes ver los cursos de idiomas e inscribirte desde "Cursos", y hacer seguimiento de tu progreso en "Mis cursos". Para otras áreas, lo que ofrecemos son asesorías: se agendan desde "Reservas".';
  }
  if (/recurso|gu[ií]a|plantilla|documento|descarga/.test(t)) {
    return 'En la sección "Recursos" encontrarás guías, plantillas y documentos descargables, además de la opción de guardarlos en tus favoritos.';
  }
  return 'Gracias por tu mensaje. Un/a asesor/a revisará tu solicitud pronto. Mientras tanto, puedes explorar Reservas, Cursos o Recursos desde el menú.';
}

/**
 * Página de Chat (chat.html). Controla la lista de asesores demostrativos,
 * la conversación activa, el envío/recepción de mensajes, la persistencia
 * en localStorage y el comportamiento responsive (lista vs. conversación
 * en móvil). No hace nada en las demás páginas.
 */
function initChatPage() {
  var page = document.getElementById('chat-page');
  if (!page) return; // Esta función solo aplica a chat.html

  // Refuerzo de sesión (chat.html también incluye el guardia en línea del
  // <head>, igual que dashboard.html y reservas.html — ver comentario allá).
  if (!isLoggedIn()) {
    window.location.replace('login.html');
    return;
  }

  var session = getSession();
  var userId = session.userId;

  var layoutEl = document.getElementById('chat-layout');
  var listEl = document.getElementById('chat-advisors-list');
  var headerAvatarEl = document.getElementById('chat-current-avatar');
  var headerNameEl = document.getElementById('chat-current-name');
  var headerSpecialtyEl = document.getElementById('chat-current-specialty');
  var headerStatusEl = document.getElementById('chat-current-status');
  var messagesEl = document.getElementById('chat-messages');
  var formEl = document.getElementById('chat-form');
  var inputEl = document.getElementById('chat-input');
  var sendBtn = document.getElementById('chat-send-btn');
  var backBtn = document.getElementById('chat-back-btn');
  var newMessageBtn = document.getElementById('chat-new-message');

  var currentAdvisorId = null;

  function scrollMessagesToBottom() {
    if (messagesEl) messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  /** Pinta la lista de asesores con su vista previa del último mensaje. */
  function renderAdvisorsList() {
    if (!listEl) return;

    var html = '';
    CHAT_ADVISORS.forEach(function (asesor) {
      var ultimo = getUltimoMensajeConversacion(userId, asesor.id);
      var preview = ultimo ? truncateChatText(ultimo.texto, 42) : 'Aún no hay mensajes';
      var activeClass = asesor.id === currentAdvisorId ? ' is-active' : '';

      html +=
        '<li class="chat-advisor' + activeClass + '">' +
          '<button type="button" class="chat-advisor__btn" data-asesor-id="' + asesor.id + '" aria-pressed="' + (asesor.id === currentAdvisorId) + '">' +
            '<span class="chat-avatar chat-avatar--' + asesor.color + '" aria-hidden="true">' + escapeHtml(asesor.iniciales) + '</span>' +
            '<span class="chat-advisor__info">' +
              '<span class="chat-advisor__name">' + escapeHtml(asesor.nombre) + '</span>' +
              '<span class="chat-advisor__specialty">' + escapeHtml(asesor.especialidad) + '</span>' +
              '<span class="chat-advisor__preview">' + escapeHtml(preview) + '</span>' +
            '</span>' +
          '</button>' +
        '</li>';
    });

    listEl.innerHTML = html;

    listEl.querySelectorAll('[data-asesor-id]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        selectAdvisor(btn.getAttribute('data-asesor-id'));
      });
    });
  }

  /** Pinta los mensajes de la conversación activa, o el estado vacío demostrativo. */
  function renderMessages(asesorId) {
    if (!messagesEl) return;
    var conversacion = getConversacion(userId, asesorId);

    if (!conversacion.length) {
      messagesEl.innerHTML = '<p class="chat-empty-state">Esta es una conversación de demostración. Envía un mensaje para comenzar.</p>';
      return;
    }

    var html = '';
    conversacion.forEach(function (m) {
      var hora = formatHoraMensaje(m.fecha);
      if (m.remitente === 'usuario') {
        html +=
          '<div class="chat-message chat-message--usuario">' +
            '<p class="chat-message__text">' + escapeHtml(m.texto) + '</p>' +
            '<span class="chat-message__time">' + hora + '</span>' +
          '</div>';
      } else {
        html +=
          '<div class="chat-message chat-message--asesor">' +
            '<span class="chat-message__badge">Respuesta automática demostrativa</span>' +
            '<p class="chat-message__text">' + escapeHtml(m.texto) + '</p>' +
            '<span class="chat-message__time">' + hora + '</span>' +
          '</div>';
      }
    });

    messagesEl.innerHTML = html;
    scrollMessagesToBottom();
  }

  /** Cambia de asesor: actualiza encabezado, mensajes, lista y vista móvil. */
  function selectAdvisor(asesorId) {
    var asesor = getAsesorById(asesorId);
    if (!asesor) return;

    currentAdvisorId = asesorId;

    if (headerAvatarEl) {
      headerAvatarEl.textContent = asesor.iniciales;
      headerAvatarEl.className = 'chat-avatar chat-avatar--' + asesor.color;
    }
    if (headerNameEl) headerNameEl.textContent = asesor.nombre;
    if (headerSpecialtyEl) headerSpecialtyEl.textContent = asesor.especialidad;
    if (headerStatusEl) {
      headerStatusEl.innerHTML = '<span class="chat-status__dot" aria-hidden="true"></span>' + escapeHtml(asesor.estado);
    }

    if (inputEl) inputEl.disabled = false;
    if (sendBtn) sendBtn.disabled = false;

    renderMessages(asesorId);
    renderAdvisorsList();

    // En móvil, seleccionar un asesor pasa de la lista a la conversación
    // a pantalla completa (ver CSS: .chat-layout.is-chatting).
    if (layoutEl) layoutEl.classList.add('is-chatting');
  }

  if (formEl && inputEl) {
    formEl.addEventListener('submit', function (event) {
      event.preventDefault();
      if (!currentAdvisorId) return;

      var texto = inputEl.value;
      if (!texto || !texto.trim()) return; // No se permiten mensajes vacíos ni solo espacios.

      // Validación de longitud en JavaScript (no solo el atributo maxlength
      // del HTML, ver auditoría de ciberseguridad): recorta cualquier texto
      // que supere el límite antes de guardarlo.
      var textoValidado = truncateToMax(texto, MAX_LENGTHS.mensajeChat);
      if (!textoValidado) return;

      var asesorId = currentAdvisorId;

      var mensajeUsuario = {
        id: generateLocalId(),
        usuario: userId,
        asesor: asesorId,
        texto: textoValidado,
        fecha: new Date().toISOString(),
        remitente: 'usuario'
      };
      addMensaje(mensajeUsuario);

      inputEl.value = '';
      renderMessages(asesorId);
      renderAdvisorsList();

      // Respuesta automática demostrativa, con un pequeño retraso visual
      // para simular que alguien está escribiendo (sin tiempo real ni
      // backend: es solo una espera fija antes de guardar la respuesta).
      window.setTimeout(function () {
        var mensajeAsesor = {
          id: generateLocalId(),
          usuario: userId,
          asesor: asesorId,
          texto: generarRespuestaAutomatica(mensajeUsuario.texto),
          fecha: new Date().toISOString(),
          remitente: 'asesor'
        };
        addMensaje(mensajeAsesor);

        // Solo repintamos la conversación si el usuario sigue en ese chat
        // (pudo haber cambiado de asesor mientras esperaba la respuesta).
        if (currentAdvisorId === asesorId) {
          renderMessages(asesorId);
        }
        renderAdvisorsList();
      }, 900);
    });

    // Enter envía el mensaje; Shift+Enter agrega un salto de línea.
    inputEl.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        if (typeof formEl.requestSubmit === 'function') {
          formEl.requestSubmit();
        } else {
          formEl.dispatchEvent(new Event('submit', { cancelable: true }));
        }
      }
    });
  }

  // Botón "Volver" (visible solo en móvil): regresa de la conversación a la lista.
  if (backBtn) {
    backBtn.addEventListener('click', function () {
      if (layoutEl) layoutEl.classList.remove('is-chatting');
    });
  }

  // "Nuevo mensaje": lleva a la lista de asesores para elegir con quién
  // hablar (relevante sobre todo en móvil, donde la lista y la conversación
  // no se ven al mismo tiempo) y enfoca el primero para accesibilidad.
  if (newMessageBtn) {
    newMessageBtn.addEventListener('click', function () {
      if (layoutEl) layoutEl.classList.remove('is-chatting');
      if (listEl) {
        listEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        var firstBtn = listEl.querySelector('.chat-advisor__btn');
        if (firstBtn) firstBtn.focus();
      }
    });
  }

  renderAdvisorsList();

  // Seleccionamos el primer asesor por defecto para que la conversación no
  // aparezca vacía en escritorio; en móvil, igualmente arrancamos mostrando
  // la lista (se quita la clase justo después de seleccionar).
  if (CHAT_ADVISORS.length) {
    selectAdvisor(CHAT_ADVISORS[0].id);
    if (layoutEl) layoutEl.classList.remove('is-chatting');
  }
}

/**
 * Tarjeta "Mensajes" del Dashboard (dashboard.html): muestra cuántas
 * conversaciones tiene el usuario y un resumen del último mensaje, con
 * acceso directo a chat.html. Si el usuario no tiene mensajes todavía, se
 * deja el estado vacío que ya viene escrito en el HTML. No hace nada en
 * las demás páginas.
 */
function initDashboardMessagesCard() {
  var container = document.getElementById('dashboard-messages-content');
  if (!container) return; // Esta función solo aplica a dashboard.html

  if (!isLoggedIn()) return;
  var session = getSession();

  var mensajesUsuario = getMensajes().filter(function (m) {
    return m.usuario === session.userId;
  });

  if (!mensajesUsuario.length) return; // Se conserva el estado vacío del HTML.

  var asesoresConMensajes = {};
  mensajesUsuario.forEach(function (m) { asesoresConMensajes[m.asesor] = true; });
  var totalConversaciones = Object.keys(asesoresConMensajes).length;

  var ultimo = mensajesUsuario[mensajesUsuario.length - 1];
  var asesor = getAsesorById(ultimo.asesor);
  var nombreAsesor = asesor ? asesor.nombre : 'un asesor';

  container.innerHTML =
    '<p class="dashboard-card__hint">' +
      totalConversaciones + ' conversación' + (totalConversaciones === 1 ? '' : 'es') +
      ' activa' + (totalConversaciones === 1 ? '' : 's') +
    '</p>' +
    '<p class="reserva-card__text">Último mensaje con ' + escapeHtml(nombreAsesor) + ': “' + escapeHtml(truncateChatText(ultimo.texto, 60)) + '”</p>' +
    '<a href="chat.html" class="btn btn--primary">Ir a mensajes</a>';
}


/* ==========================================================================
   13. SAPEREBOT — asistente virtual de orientación
   (visible en las 12 páginas del proyecto, ver initSaperebot() al final de
   esta sección y su llamada en el listener DOMContentLoaded de arriba)

   QUÉ ES: un widget de orientación (botón flotante + panel de conversación)
   que responde SOLO con un banco de respuestas fijas basado en contenido
   que ya existe en el resto del sitio (servicios.html, formacion.html,
   recursos.html, nosotros.html, contacto.html) y en los catálogos ya
   definidos más arriba en este archivo (COURSES_CATALOG, RESOURCES_CATALOG).
   No hay generación de texto libre, no hay IA real y no hay llamadas a
   ningún servicio externo: es el mismo principio de "banco de respuestas +
   palabras clave" que ya usa generarRespuestaAutomatica() en la sección 12.

   QUÉ NO ES / QUÉ NO HACE (a propósito):
   - No reemplaza al Chat con asesores (chat.html) ni al formulario de
     Contacto (contacto.html): cuando corresponde, SAPEREBOT enlaza hacia
     esos módulos ya existentes en vez de intentar resolver la conversación.
   - No crea un sistema de reservas, de login ni de mensajería paralelo:
     reutiliza getSession() / isLoggedIn() (sección 7) para decidir a qué
     página enviar al usuario, igual que ya hace initBookingLinks().
   - No inventa precios, horarios de atención en vivo, disponibilidad,
     nombres/perfiles de asesores o profesores, certificados, estadísticas
     ni políticas: para esos temas responde con el mensaje de transparencia
     y deriva a un asesor humano (Mensajes o Contacto).
   - El correo de contacto NO se usa aquí porque en contacto.html está
     marcado explícitamente como placeholder ("reemplazar con el correo
     real"); SAPEREBOT remite siempre al formulario de "Contacto" en su lugar.

   PERSISTENCIA: el historial de la conversación se guarda en localStorage
   bajo SAPEREBOT_STORAGE_KEY, una clave propia e independiente de
   USERS_STORAGE_KEY, SESSION_STORAGE_KEY, RESERVATIONS_STORAGE_KEY,
   COURSES_STORAGE_KEY, RESOURCES_STORAGE_KEY y MESSAGES_STORAGE_KEY (no se
   lee ni se escribe ninguna de esas claves desde aquí). El historial se
   separa por usuario (session.userId) o, si no hay sesión, bajo la clave
   "anon", ya que SAPEREBOT es de acceso público a diferencia del Chat.
   ========================================================================== */

/** Clave de localStorage para el historial de SAPEREBOT (independiente del resto del sitio). */
var SAPEREBOT_STORAGE_KEY = 'sapereaude_saperebot';

/** Lee el mapa completo { claveUsuario: [mensajes] } desde localStorage. */
function getSaperebotHistorialMap() {
  try {
    var raw = window.localStorage.getItem(SAPEREBOT_STORAGE_KEY);
    var data = raw ? JSON.parse(raw) : {};
    return (data && typeof data === 'object' && !Array.isArray(data)) ? data : {};
  } catch (error) {
    return {};
  }
}

/** Guarda el mapa completo de historiales de SAPEREBOT en localStorage. */
function saveSaperebotHistorialMap(map) {
  try {
    window.localStorage.setItem(SAPEREBOT_STORAGE_KEY, JSON.stringify(map));
  } catch (error) {
    // Ver nota en saveUsers(): localStorage puede no estar disponible.
  }
}

/** Clave de historial para el usuario actual: su userId si hay sesión, o "anon" si no. */
function getSaperebotClaveUsuario() {
  var session = getSession();
  return (session && session.userId) ? session.userId : 'anon';
}

/** Lee el historial de conversación de SAPEREBOT para el usuario actual. */
function getSaperebotHistorial() {
  var map = getSaperebotHistorialMap();
  var clave = getSaperebotClaveUsuario();
  return Array.isArray(map[clave]) ? map[clave] : [];
}

/** Agrega un mensaje al historial del usuario actual y lo persiste. */
function addSaperebotMensaje(rol, texto) {
  var map = getSaperebotHistorialMap();
  var clave = getSaperebotClaveUsuario();
  if (!Array.isArray(map[clave])) map[clave] = [];
  var mensaje = { rol: rol, texto: texto, fecha: new Date().toISOString() };
  map[clave].push(mensaje);
  saveSaperebotHistorialMap(map);
  return mensaje;
}

/** Destino real de "Agendar asesoría" según sesión (mismo criterio que initBookingLinks()). */
function saperebotDestinoReserva() {
  return isLoggedIn() ? 'reservas.html' : 'login.html';
}

/** Destino real de "Mensajes" (Chat con asesores) según sesión (mismo criterio que chat.html). */
function saperebotDestinoMensajes() {
  return isLoggedIn() ? 'chat.html' : 'login.html';
}

/**
 * Busca en COURSES_CATALOG (definido en la sección 10) un curso cuyo
 * nombre o categoría coincida con palabras del texto del usuario. Solo se
 * usa para citar cursos reales que ya existen en el catálogo — nunca para
 * inventar uno nuevo.
 */
function saperebotBuscarCurso(texto) {
  var t = texto.toLowerCase();
  for (var i = 0; i < COURSES_CATALOG.length; i++) {
    var curso = COURSES_CATALOG[i];
    var pistas = (curso.nombre + ' ' + curso.categoria).toLowerCase();
    var palabras = pistas.split(/[\s,–-]+/).filter(function (p) { return p.length > 3; });
    for (var j = 0; j < palabras.length; j++) {
      if (t.indexOf(palabras[j]) !== -1) return curso;
    }
  }
  // Coincidencias adicionales por idioma, sin inventar cursos nuevos: los
  // únicos cursos son los de idiomas. Cualquier otra área corresponde a una
  // asesoría o consultoría, no a un curso.
  if (/ingl[eé]s/.test(t)) return getCourseById('ingles-conversacional');
  if (/franc[eé]s/.test(t)) return getCourseById('frances-basico');
  return null;
}

/**
 * Busca en RESOURCES_CATALOG (definido en la sección 11) un recurso cuyo
 * título o categoría coincida con el texto del usuario. Igual que
 * saperebotBuscarCurso(), solo cita recursos reales del catálogo.
 */
function saperebotBuscarRecurso(texto) {
  var t = texto.toLowerCase();
  if (/vocabulario|ingl[eé]s/.test(t)) return getResourceById('guia-vocabulario-ingles');
  if (/t[eé]cnica|estudio/.test(t)) return getResourceById('guia-tecnicas-estudio');
  if (/plan de proyecto|plantilla.*proyecto/.test(t)) return getResourceById('plantilla-plan-proyecto');
  if (/glosario|administraci[oó]n/.test(t)) return getResourceById('glosario-administracion');
  if (/checklist|seguimiento/.test(t)) return getResourceById('checklist-seguimiento-proyectos');
  if (/desempe[nñ]o|evaluaci[oó]n/.test(t)) return getResourceById('plantilla-evaluacion-desempeno');
  return null;
}

/**
 * Banco de respuestas de SAPEREBOT. Cada entrada es una función que devuelve
 * { texto: [líneas], enlaces: [{ etiqueta, href }] }. Todo el contenido de
 * "texto" proviene de información ya presente en el sitio (ver comentario de
 * cabecera de esta sección); nada se genera libremente.
 *
 * El parámetro "mensaje" (texto crudo del usuario, puede ser undefined si la
 * categoría se abrió desde un chip) permite personalizar con datos reales del
 * catálogo (curso o recurso concreto) sin inventar nada nuevo.
 */
var SAPEREBOT_RESPUESTAS = {

  'que-es': function () {
    return {
      texto: [
        'SAPERE AUDE integra cursos de idiomas, asesoría académica y consultoría organizacional en una sola plataforma. Nació de clases de inglés y francés, y con el tiempo amplió su propuesta hacia la asesoría académica y la consultoría.',
        'Su misión es fortalecer las competencias analíticas de estudiantes y equipos de trabajo mediante metodologías pedagógicas estructuradas.'
      ],
      enlaces: [{ etiqueta: 'Conocer nuestra historia', href: 'nosotros.html' }]
    };
  },

  'servicios': function () {
    return {
      texto: [
        'Ofrecemos siete líneas de servicio: Asesorías académicas, Apoyo en actividades académicas, Formación virtual, Creación de contenido educativo, Consultoría, Capacitación organizacional y Diseño de estrategias y procesos formativos.'
      ],
      enlaces: [{ etiqueta: 'Ver todos los servicios', href: 'servicios.html' }]
    };
  },

  'asesorias-academicas': function () {
    return {
      texto: [
        'En asesorías académicas ofrecemos acompañamiento personalizado: clases individuales y grupales, preparación para exámenes, refuerzo académico y planes de estudio personalizados.'
      ],
      enlaces: [
        { etiqueta: 'Ver servicios', href: 'servicios.html' },
        { etiqueta: 'Agendar asesoría', href: saperebotDestinoReserva() }
      ]
    };
  },

  'consultoria': function () {
    return {
      texto: [
        'En consultoría apoyamos el ciclo de proyectos (formulación, ejecución, seguimiento y evaluación), y ofrecemos capacitación organizacional y diseño de estrategias y procesos formativos para equipos y organizaciones.'
      ],
      enlaces: [
        { etiqueta: 'Ver servicios', href: 'servicios.html' },
        { etiqueta: 'Ir a Contacto', href: 'contacto.html' }
      ]
    };
  },

  'formacion': function (mensaje) {
    var curso = mensaje ? saperebotBuscarCurso(mensaje) : null;
    var texto = [
      'Nuestros cursos son de idiomas: inglés y francés, con seguimiento de tu progreso dentro de la plataforma.',
      'Las demás áreas (matemáticas, ciencias sociales, administración, salud y desarrollo profesional) no se ofrecen como cursos: se acompañan mediante asesorías y consultorías, que puedes agendar desde Reservas.'
    ];
    if (curso) {
      texto.push('Por ejemplo, tenemos "' + curso.nombre + '" (' + curso.categoria + ', ' + curso.duracion + ').');
    }
    return { texto: texto, enlaces: [{ etiqueta: 'Ver cursos de idiomas', href: 'formacion.html' }, { etiqueta: 'Agendar asesoría', href: saperebotDestinoReserva() }] };
  },

  'recursos': function (mensaje) {
    var recurso = mensaje ? saperebotBuscarRecurso(mensaje) : null;
    var texto = [
      'En "Recursos" encontrarás guías, plantillas, documentos y herramientas de apoyo, filtrables por categoría, con opción de guardar tus favoritos si tienes una cuenta.'
    ];
    if (recurso) {
      texto.push('Por ejemplo, tenemos "' + recurso.titulo + '" (' + recurso.tipo + ').');
    }
    return { texto: texto, enlaces: [{ etiqueta: 'Ver recursos', href: 'recursos.html' }] };
  },

  'agenda': function () {
    if (isLoggedIn()) {
      return {
        texto: ['Para agendar una asesoría, ve a "Mis reservas" y elige servicio, área, modalidad, fecha y hora. Desde ahí también puedes reprogramar o cancelar tus reservas existentes.'],
        enlaces: [{ etiqueta: 'Ir a Mis reservas', href: 'reservas.html' }]
      };
    }
    return {
      texto: ['Para agendar necesitas iniciar sesión y luego ir a "Mis reservas". Si aún no tienes cuenta, primero debes registrarte.'],
      enlaces: [
        { etiqueta: 'Iniciar sesión', href: 'login.html' },
        { etiqueta: 'Crear cuenta', href: 'registro.html' }
      ]
    };
  },

  'faq-cuenta': function () {
    return {
      texto: [
        'Necesitas una cuenta para agendar y gestionar tus reservas, ver el progreso en "Mis cursos" y guardar recursos en favoritos.',
        'Puedes explorar Servicios, Formación y Recursos sin necesidad de cuenta.'
      ],
      enlaces: [
        { etiqueta: 'Crear cuenta', href: 'registro.html' },
        { etiqueta: 'Iniciar sesión', href: 'login.html' }
      ]
    };
  },

  'faq-plataforma': function () {
    var enlaces = [
      { etiqueta: 'Servicios', href: 'servicios.html' },
      { etiqueta: 'Formación', href: 'formacion.html' },
      { etiqueta: 'Recursos', href: 'recursos.html' },
      { etiqueta: 'Contacto', href: 'contacto.html' }
    ];
    if (isLoggedIn()) {
      enlaces.splice(3, 0, { etiqueta: 'Mis reservas', href: 'reservas.html' }, { etiqueta: 'Mensajes', href: 'chat.html' });
    }
    return {
      texto: ['Puedo llevarte a cualquiera de estas secciones de la plataforma:'],
      enlaces: enlaces
    };
  },

  'faq-contacto': function () {
    return {
      texto: [
        'Puedes escribirnos desde el formulario de "Contacto", o por Instagram (@sapere.aude.asesorias). El tiempo de respuesta habitual es de menos de 48 horas hábiles, de lunes a viernes en horario laboral.'
      ],
      enlaces: [
        { etiqueta: 'Ir a Contacto', href: 'contacto.html' },
        { etiqueta: 'Instagram', href: 'https://www.instagram.com/sapere.aude.asesorias' }
      ]
    };
  },

  'derivar': function () {
    var enlaces = [{ etiqueta: 'Ir a Contacto', href: 'contacto.html' }];
    enlaces.unshift({ etiqueta: 'Hablar con un asesor', href: saperebotDestinoMensajes() });
    return {
      texto: ['No tengo información suficiente para responder eso con seguridad. Te recomiendo contactar a un asesor de SAPERE AUDE para recibir orientación personalizada.'],
      enlaces: enlaces
    };
  },

  'sin-coincidencia': function () {
    return {
      texto: ['No tengo información suficiente sobre eso dentro de la plataforma SAPERE AUDE. Puedo ayudarte con Servicios, Formación, Recursos, agendar una asesoría o Contacto.'],
      enlaces: [],
      mostrarMenu: true
    };
  }
};

/**
 * Menú principal de chips (mensaje de bienvenida). El chip "Hablar con un
 * asesor" es una derivación explícita a propósito (sección 8 del diseño):
 * el usuario lo está pidiendo directamente.
 */
var SAPEREBOT_MENU_PRINCIPAL = [
  { etiqueta: '¿Qué es SAPERE AUDE?', categoria: 'que-es' },
  { etiqueta: 'Ver servicios', categoria: 'servicios' },
  { etiqueta: '¿Qué servicio necesito?', categoria: 'orientacion' },
  { etiqueta: 'Cursos de idiomas', categoria: 'formacion' },
  { etiqueta: 'Recursos', categoria: 'recursos' },
  { etiqueta: 'Agendar una asesoría', categoria: 'agenda' },
  { etiqueta: 'Preguntas frecuentes', categoria: 'faq' },
  { etiqueta: 'Hablar con un asesor', categoria: 'derivar' }
];

/** Submenú de "¿Qué servicio necesito?": selección guiada, no diagnóstico. */
var SAPEREBOT_MENU_ORIENTACION = [
  { etiqueta: 'Tengo una tarea o examen', categoria: 'asesorias-academicas' },
  { etiqueta: 'Mi empresa o equipo necesita apoyo', categoria: 'consultoria' },
  { etiqueta: 'Quiero aprender un idioma', categoria: 'formacion' },
  { etiqueta: 'Busco una guía o plantilla', categoria: 'recursos' },
  { etiqueta: '← Volver al menú principal', categoria: 'menu' }
];

/** Submenú de "Preguntas frecuentes". */
var SAPEREBOT_MENU_FAQ = [
  { etiqueta: '¿Necesito una cuenta?', categoria: 'faq-cuenta' },
  { etiqueta: 'Ayuda con la plataforma', categoria: 'faq-plataforma' },
  { etiqueta: 'Contacto', categoria: 'faq-contacto' },
  { etiqueta: '← Volver al menú principal', categoria: 'menu' }
];

/**
 * Reglas de derivación (sección 8 del diseño): temas que SAPEREBOT no debe
 * intentar responder con contenido genérico porque el proyecto no tiene esa
 * información confirmada (precios, disponibilidad real, profesores/asesores
 * concretos, certificados, estadísticas, políticas) o porque el usuario lo
 * pide explícitamente. Se revisan ANTES que las categorías de contenido.
 */
var SAPEREBOT_REGLAS_DERIVACION = [
  /precio|costo|tarifa|cu[aá]nto (cuesta|vale)|forma(s)? de pago|m[eé]todo(s)? de pago/,
  /disponibilidad de (cupos|asesores)|hay cupo|asesor(es)? (est[aá]n|hay) disponible/,
  /profesor(a)?(es)?|qui[eé]n(es)? (da|dan|imparte|es mi asesor)|nombre del asesor|credencial|experiencia del (profesor|asesor)/,
  /certificad|estad[ií]stica|cu[aá]ntos alumnos|resultados obtenidos|tasa de (aprobaci[oó]n|[eé]xito)/,
  /pol[ií]tica de (cancelaci[oó]n|reembolso|privacidad)|reembolso|raz[oó]n social|t[eé]rminos legales/,
  /me sirve para mi carrera|en mi universidad|mi caso espec[ií]fico/,
  /hablar con (alguien|una persona|un asesor)|quiero un asesor|esto no (me sirve|funciona)/
];

/** Categorías de contenido y sus palabras clave (sección 6 del diseño), en orden de prioridad. */
var SAPEREBOT_REGLAS_CATEGORIA = [
  { categoria: 'que-es', patron: /qu[eé] es sapere aude|qui[eé]nes son|de qu[eé] se trata/ },
  { categoria: 'consultoria', patron: /consultor[ií]a|empresa|organizaci[oó]n|equipo de trabajo/ },
  { categoria: 'asesorias-academicas', patron: /asesor[ií]a acad[eé]mica|tarea|clase particular|refuerzo|examen/ },
  { categoria: 'formacion', patron: /curso|formaci[oó]n|clases|idioma|ingl[eé]s|franc[eé]s|matem[aá]tica|bootcamp|microclase/ },
  { categoria: 'recursos', patron: /recurso|gu[ií]a|plantilla|documento|descargar|herramienta/ },
  { categoria: 'orientacion', patron: /no s[eé] qu[eé].*necesito|qu[eé] (servicio )?me recomiendas|ayuda para elegir|no s[eé] (qu[eé]|cu[aá]l)/ },
  { categoria: 'agenda', patron: /agendar|reservar|cita|sesi[oó]n|reprogramar|cancelar/ },
  { categoria: 'faq-contacto', patron: /contacto|correo|instagram|escribir/ },
  { categoria: 'faq-plataforma', patron: /d[oó]nde est[aá]|c[oó]mo entro|c[oó]mo me registro|no encuentro|mapa del sitio/ },
  { categoria: 'servicios', patron: /servicio|qu[eé] ofrecen|qu[eé] hacen/ },
  { categoria: 'faq-cuenta', patron: /necesito cuenta|es gratis crear cuenta/ }
];

/**
 * Motor de SAPEREBOT (sección 3.3 / 4 del diseño): dado el texto libre del
 * usuario, decide si corresponde derivar, responder con una categoría de
 * contenido, o mostrar el mensaje de "sin coincidencia". Nunca genera texto
 * libre: siempre devuelve una entrada de SAPEREBOT_RESPUESTAS.
 */
function saperebotResolver(mensaje) {
  var t = (mensaje || '').toLowerCase();

  for (var i = 0; i < SAPEREBOT_REGLAS_DERIVACION.length; i++) {
    if (SAPEREBOT_REGLAS_DERIVACION[i].test(t)) return 'derivar';
  }
  for (var j = 0; j < SAPEREBOT_REGLAS_CATEGORIA.length; j++) {
    if (SAPEREBOT_REGLAS_CATEGORIA[j].patron.test(t)) return SAPEREBOT_REGLAS_CATEGORIA[j].categoria;
  }
  return 'sin-coincidencia';
}

/** Construye el HTML de un mensaje del bot (texto + enlaces), escapando todo el contenido dinámico. */
function saperebotRenderRespuestaHtml(respuesta) {
  var html = respuesta.texto.map(function (linea) {
    return '<p class="saperebot-msg__text">' + escapeHtml(linea) + '</p>';
  }).join('');

  if (respuesta.enlaces && respuesta.enlaces.length) {
    html += '<div class="saperebot-msg__links">' + respuesta.enlaces.map(function (enlace) {
      var esExterno = /^https?:\/\//.test(enlace.href);
      var attrs = esExterno ? ' target="_blank" rel="noopener"' : '';
      return '<a href="' + escapeHtml(enlace.href) + '" class="saperebot-link"' + attrs + '>' + escapeHtml(enlace.etiqueta) + '</a>';
    }).join('') + '</div>';
  }

  return html;
}

/**
 * Añade un mensaje al panel visible (no al historial; eso lo hace quien
 * llama a esta función) y hace scroll hasta el final de la conversación.
 */
function saperebotPintarMensaje(rol, contenidoHtml) {
  var contenedor = document.getElementById('saperebot-messages');
  if (!contenedor) return;

  var burbuja = document.createElement('div');
  burbuja.className = rol === 'usuario' ? 'saperebot-msg saperebot-msg--usuario' : 'saperebot-msg saperebot-msg--bot';
  burbuja.innerHTML = contenidoHtml;
  contenedor.appendChild(burbuja);
  contenedor.scrollTop = contenedor.scrollHeight;
}

/** Dibuja los chips de opciones rápidas indicados (menú principal o un submenú). */
function saperebotPintarChips(opciones) {
  var contenedor = document.getElementById('saperebot-quick');
  if (!contenedor) return;
  contenedor.innerHTML = '';
  opciones.forEach(function (opcion) {
    var chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'saperebot-chip';
    chip.textContent = opcion.etiqueta;
    chip.addEventListener('click', function () {
      saperebotManejarSeleccion(opcion.etiqueta, opcion.categoria);
    });
    contenedor.appendChild(chip);
  });
}

/**
 * Procesa una categoría ya resuelta (por chip o por palabras clave): la
 * pinta, la guarda en el historial y decide qué chips mostrar después,
 * siguiendo siempre con un siguiente paso (regla de tono del diseño: nunca
 * dejar al usuario "sin salida").
 */
function saperebotResponderCategoria(categoria, mensajeOriginal) {
  if (categoria === 'menu') {
    saperebotPintarChips(SAPEREBOT_MENU_PRINCIPAL);
    return;
  }
  if (categoria === 'orientacion') {
    var introOrientacion = { texto: ['Cuéntame un poco más: ¿cuál de estas opciones se parece más a lo que necesitas?'], enlaces: [] };
    var htmlOrientacion = saperebotRenderRespuestaHtml(introOrientacion);
    saperebotPintarMensaje('bot', htmlOrientacion);
    addSaperebotMensaje('bot', introOrientacion.texto.join(' '));
    saperebotPintarChips(SAPEREBOT_MENU_ORIENTACION);
    return;
  }
  if (categoria === 'faq') {
    var introFaq = { texto: ['¿Sobre cuál de estos temas quieres saber más?'], enlaces: [] };
    var htmlFaq = saperebotRenderRespuestaHtml(introFaq);
    saperebotPintarMensaje('bot', htmlFaq);
    addSaperebotMensaje('bot', introFaq.texto.join(' '));
    saperebotPintarChips(SAPEREBOT_MENU_FAQ);
    return;
  }

  var generador = SAPEREBOT_RESPUESTAS[categoria] || SAPEREBOT_RESPUESTAS['sin-coincidencia'];
  var respuesta = generador(mensajeOriginal);
  var html = saperebotRenderRespuestaHtml(respuesta);
  saperebotPintarMensaje('bot', html);
  addSaperebotMensaje('bot', respuesta.texto.join(' '));

  // Regla de tono: siempre ofrecer un siguiente paso. Si la categoría no
  // definió sus propios chips (como orientacion/faq arriba), se muestra
  // siempre el acceso de vuelta al menú principal.
  saperebotPintarChips([{ etiqueta: '← Volver al menú principal', categoria: 'menu' }]);
}

/** Punto de entrada único para "el usuario eligió/escribió X": pinta su mensaje y responde. */
function saperebotManejarSeleccion(textoUsuarioVisible, categoriaForzada) {
  saperebotPintarMensaje('usuario', '<p class="saperebot-msg__text">' + escapeHtml(textoUsuarioVisible) + '</p>');
  addSaperebotMensaje('usuario', textoUsuarioVisible);

  var categoria = categoriaForzada || saperebotResolver(textoUsuarioVisible);
  saperebotResponderCategoria(categoria, textoUsuarioVisible);
}

/** Vuelve a pintar en el panel un historial ya guardado (al reabrir el widget). */
function saperebotRepintarHistorial(historial) {
  historial.forEach(function (m) {
    var html = '<p class="saperebot-msg__text">' + escapeHtml(m.texto) + '</p>';
    saperebotPintarMensaje(m.rol, html);
  });
}

/**
 * Construye el widget completo de SAPEREBOT (botón flotante + panel) por
 * JavaScript e inserta el HTML resultante al final de <body>. Se hace así,
 * en vez de repetir el marcado en las 12 páginas, para no tocar ningún
 * archivo .html existente y evitar cualquier duplicación entre páginas.
 */
/* ==========================================================================
   14. MI PERFIL (perfil.html)

   perfil.html reutiliza el mismo shell privado que dashboard.html,
   reservas.html y chat.html (el mismo elemento raíz #dashboard), así que
   initDashboardPage() ya se encarga de la sesión, el avatar, el nombre, el
   tipo de usuario y el sidebar — igual que en esas páginas. Esta sección
   SOLO precarga el formulario con los datos reales ya guardados por
   registro.html (nombre, apellido, correo, tipoUsuario) y guarda los
   cambios en la misma colección sapereaude_usuarios y la misma sesión
   sapereaude_sesion ya existentes (sección 7). No se crea ningún
   almacenamiento ni sistema de autenticación nuevo. El cambio de
   contraseña queda fuera de alcance (ver nota en perfil.html).
   ========================================================================== */
function initPerfilPage() {
  var page = document.getElementById('perfil-page');
  if (!page) return; // Esta función solo aplica a perfil.html

  // El guardia en línea de perfil.html y initDashboardPage() (mismo
  // elemento raíz #dashboard) ya redirigen a login.html si no hay sesión;
  // esta comprobación es solo un refuerzo antes de tocar el DOM.
  if (!isLoggedIn()) return;

  var session = getSession();
  var user = findUserById(session.userId);
  if (!user) return; // sesión válida pero usuario no encontrado en la colección

  var form = document.getElementById('perfil-form');
  if (!form) return;

  var nombreInput = document.getElementById('perfil-nombre');
  var nombreError = document.getElementById('perfil-nombre-error');
  var apellidoInput = document.getElementById('perfil-apellido');
  var apellidoError = document.getElementById('perfil-apellido-error');
  var correoInput = document.getElementById('perfil-correo');
  var correoError = document.getElementById('perfil-correo-error');
  var formErrorEl = document.getElementById('perfil-form-error');
  var formSuccessEl = document.getElementById('perfil-form-success');

  // Precarga con los datos reales ya guardados; ningún campo se inventa.
  nombreInput.value = user.nombre || '';
  apellidoInput.value = user.apellido || '';
  correoInput.value = user.correo || '';
  var tipoActual = user.tipoUsuario || 'estudiante';
  var tipoRadio = form.querySelector('input[name="tipo-usuario"][value="' + tipoActual + '"]');
  if (tipoRadio) tipoRadio.checked = true;

  form.addEventListener('submit', function (event) {
    event.preventDefault();

    hideFormMessage(formErrorEl);
    hideFormMessage(formSuccessEl);
    clearFieldError(nombreInput, nombreError);
    clearFieldError(apellidoInput, apellidoError);
    clearFieldError(correoInput, correoError);

    var isValid = true;

    if (!nombreInput.value.trim()) {
      showFieldError(nombreInput, nombreError, 'Por favor escribe tu nombre.');
      isValid = false;
    } else if (nombreInput.value.trim().length > MAX_LENGTHS.nombre) {
      showFieldError(nombreInput, nombreError, 'El nombre es demasiado largo.');
      isValid = false;
    }

    if (!apellidoInput.value.trim()) {
      showFieldError(apellidoInput, apellidoError, 'Por favor escribe tu apellido.');
      isValid = false;
    } else if (apellidoInput.value.trim().length > MAX_LENGTHS.apellido) {
      showFieldError(apellidoInput, apellidoError, 'El apellido es demasiado largo.');
      isValid = false;
    }

    var correo = correoInput.value.trim().toLowerCase();
    if (!correo) {
      showFieldError(correoInput, correoError, 'Por favor escribe tu correo electrónico.');
      isValid = false;
    } else if (!EMAIL_PATTERN.test(correo)) {
      showFieldError(correoInput, correoError, 'Escribe un correo electrónico válido.');
      isValid = false;
    } else if (correo.length > MAX_LENGTHS.correo) {
      showFieldError(correoInput, correoError, 'El correo es demasiado largo.');
      isValid = false;
    } else {
      var existente = findUserByEmail(correo);
      if (existente && existente.id !== user.id) {
        showFieldError(correoInput, correoError, 'Ese correo ya está en uso por otra cuenta.');
        isValid = false;
      }
    }

    if (!isValid) return;

    var tipoSeleccionado = form.querySelector('input[name="tipo-usuario"]:checked');

    // Actualiza al usuario dentro de la misma colección existente
    // (sapereaude_usuarios) en vez de crear otro almacenamiento paralelo.
    var users = getUsers();
    for (var i = 0; i < users.length; i++) {
      if (users[i].id === user.id) {
        users[i].nombre = truncateToMax(nombreInput.value, MAX_LENGTHS.nombre);
        users[i].apellido = truncateToMax(apellidoInput.value, MAX_LENGTHS.apellido);
        users[i].correo = correo;
        users[i].tipoUsuario = tipoSeleccionado ? tipoSeleccionado.value : users[i].tipoUsuario;
        user = users[i];
        break;
      }
    }
    saveUsers(users);

    // La sesión guarda una copia de nombre/tipoUsuario (ver createSession en
    // initLoginForm); la actualizamos también para que el saludo del header,
    // el avatar y el topbar del dashboard reflejen el cambio de inmediato,
    // sin pedir volver a iniciar sesión.
    createSession({
      userId: session.userId,
      nombre: user.nombre,
      tipoUsuario: user.tipoUsuario,
      loggedIn: true
    });
    session = getSession();

    // Refresca el topbar (avatar, nombre, tipo) con los mismos elementos que
    // ya rellena initDashboardPage(), sin duplicar esa lógica de sesión.
    var tipoLabel = USER_TYPE_LABELS[user.tipoUsuario] || 'Estudiante';
    var avatarEl = document.getElementById('dashboard-avatar');
    var nameEl = document.getElementById('dashboard-user-name');
    var typeEl = document.getElementById('dashboard-user-type');
    if (avatarEl) avatarEl.textContent = getInitials(user.nombre, user.apellido);
    if (nameEl) nameEl.textContent = user.nombre + ' ' + user.apellido;
    if (typeEl) typeEl.textContent = tipoLabel;

    showFormMessage(formSuccessEl, 'Tus datos se actualizaron correctamente.');
  });
}


/* ==========================================================================
   15. SEGUIMIENTO (seguimiento.html)

   Vista de SOLO LECTURA que reúne en un mismo lugar el estado real de los
   procesos del usuario autenticado. No introduce ningún dato nuevo: lee
   directamente de las mismas colecciones ya usadas por reservas.html
   (sapereaude_reservas, sección 9) y formacion.html
   (sapereaude_cursos_usuario, sección 10), con las mismas funciones
   (getReservasDeUsuario, getInscripcionesUsuario, getCourseById,
   calcularProgreso) y los mismos estados que ya existen en el resto del
   sitio ("Confirmada"/"Cancelada" para reservas, "En progreso"/"Completado"
   para cursos). No se crea ningún estado de demostración adicional: si el
   usuario no tiene reservas o cursos, la sección correspondiente muestra su
   estado vacío real, igual que en Mis reservas y Mis cursos.

   La gestión (agendar, reprogramar, cancelar, continuar un curso) sigue
   ocurriendo en reservas.html y formacion.html; Seguimiento solo consolida
   la vista de estado y enlaza hacia esos módulos existentes.
   ========================================================================== */
function initSeguimientoPage() {
  var page = document.getElementById('seguimiento-page');
  if (!page) return; // Esta función solo aplica a seguimiento.html

  // El guardia en línea de seguimiento.html ya redirige a login.html si no
  // hay sesión; esta comprobación es solo un refuerzo antes de tocar el DOM,
  // igual que en el resto de páginas privadas (ver sección 7).
  if (!isLoggedIn()) return;

  var session = getSession();

  var resumenEl = document.getElementById('seguimiento-resumen');
  var reservasListaEl = document.getElementById('seguimiento-reservas-lista');
  var reservasVaciaEl = document.getElementById('seguimiento-reservas-vacia');
  var cursosListaEl = document.getElementById('seguimiento-cursos-lista');
  var cursosVaciaEl = document.getElementById('seguimiento-cursos-vacia');
  var pagosListaEl = document.getElementById('seguimiento-pagos-lista');
  var pagosVaciaEl = document.getElementById('seguimiento-pagos-vacia');

  var reservas = getReservasDeUsuario(session.userId);
  var inscripciones = getInscripcionesUsuario(session.userId);
  var pagos = getPagosDeUsuario(session.userId);

  /** Resumen numérico: mismos cálculos ya usados en initDashboardCoursesProgress. */
  function renderResumen() {
    if (!resumenEl) return;

    var reservasConfirmadas = reservas.filter(function (r) { return r.estado === 'Confirmada'; }).length;
    var reservasCanceladas = reservas.filter(function (r) { return r.estado === 'Cancelada'; }).length;
    var cursosActivos = inscripciones.filter(function (i) { return i.estado === 'En progreso'; }).length;
    var cursosCompletados = inscripciones.filter(function (i) { return i.estado === 'Completado'; }).length;

    resumenEl.innerHTML =
      '<article class="dashboard-card">' +
        '<h2 class="dashboard-card__title">Asesorías</h2>' +
        '<div class="stat-grid">' +
          '<div class="stat"><span class="stat__value">' + reservasConfirmadas + '</span><span class="stat__label">Confirmadas</span></div>' +
          '<div class="stat"><span class="stat__value">' + reservasCanceladas + '</span><span class="stat__label">Canceladas</span></div>' +
        '</div>' +
      '</article>' +
      '<article class="dashboard-card">' +
        '<h2 class="dashboard-card__title">Formación</h2>' +
        '<div class="stat-grid">' +
          '<div class="stat"><span class="stat__value">' + cursosActivos + '</span><span class="stat__label">Cursos en progreso</span></div>' +
          '<div class="stat"><span class="stat__value">' + cursosCompletados + '</span><span class="stat__label">Cursos completados</span></div>' +
        '</div>' +
      '</article>' +
      '<article class="dashboard-card">' +
        '<h2 class="dashboard-card__title">Pagos</h2>' +
        '<div class="stat-grid">' +
          '<div class="stat"><span class="stat__value">' + pagos.length + '</span><span class="stat__label">Pagos registrados</span></div>' +
        '</div>' +
      '</article>';
  }

  /** Lista de pagos simulados: misma tarjeta visual que las demás listas de Seguimiento, sin acciones de gestión. */
  function renderPagos() {
    if (!pagosListaEl) return;

    if (!pagos.length) {
      pagosListaEl.innerHTML = '';
      pagosListaEl.hidden = true;
      if (pagosVaciaEl) pagosVaciaEl.hidden = false;
      return;
    }

    pagosListaEl.hidden = false;
    if (pagosVaciaEl) pagosVaciaEl.hidden = true;

    pagosListaEl.innerHTML = pagos.map(function (pago) {
      return (
        '<article class="reserva-card">' +
          '<div class="reserva-card__header">' +
            '<span class="tag tag--outline">' + escapeHtml(pago.metodo) + '</span>' +
            '<span class="tag tag--simulado">' + escapeHtml(pago.estado) + '</span>' +
          '</div>' +
          '<h3 class="reserva-card__title">' + escapeHtml(pago.descripcion) + '</h3>' +
          '<p class="reserva-card__text">' +
            'Valor: ' + escapeHtml(String(pago.valorDemostrativo)) + ' UD · ' +
            escapeHtml(new Date(pago.creadaEn).toLocaleString('es-ES')) +
          '</p>' +
        '</article>'
      );
    }).join('');
  }

  /** Lista de reservas: misma tarjeta visual que renderMisReservas() en reservas.html, sin acciones de gestión. */
  function renderReservas() {
    if (!reservasListaEl) return;

    if (!reservas.length) {
      reservasListaEl.innerHTML = '';
      reservasListaEl.hidden = true;
      if (reservasVaciaEl) reservasVaciaEl.hidden = false;
      return;
    }

    reservasListaEl.hidden = false;
    if (reservasVaciaEl) reservasVaciaEl.hidden = true;

    reservasListaEl.innerHTML = reservas.map(function (reserva) {
      var esCancelada = reserva.estado === 'Cancelada';
      var tagClass = esCancelada ? 'tag--cancelada' : 'tag--confirmada';
      return (
        '<article class="reserva-card">' +
          '<div class="reserva-card__header">' +
            '<span class="tag tag--outline">' + escapeHtml(reserva.servicio) + '</span>' +
            '<span class="tag ' + tagClass + '">' + escapeHtml(reserva.estado) + '</span>' +
          '</div>' +
          '<h3 class="reserva-card__title">' + escapeHtml(reserva.area) + '</h3>' +
          '<p class="reserva-card__text">' +
            escapeHtml(formatFechaLarga(reserva.fecha)) + ' · ' + escapeHtml(reserva.hora) +
            ' · ' + escapeHtml(reserva.modalidad) +
          '</p>' +
        '</article>'
      );
    }).join('');
  }

  /** Lista de cursos: misma tarjeta visual que renderMisCursos() en formacion.html, sin acciones de gestión. */
  function renderCursos() {
    if (!cursosListaEl) return;

    if (!inscripciones.length) {
      cursosListaEl.innerHTML = '';
      cursosListaEl.hidden = true;
      if (cursosVaciaEl) cursosVaciaEl.hidden = false;
      return;
    }

    cursosListaEl.hidden = false;
    if (cursosVaciaEl) cursosVaciaEl.hidden = true;

    cursosListaEl.innerHTML = inscripciones.map(function (insc) {
      var curso = getCourseById(insc.cursoId);
      if (!curso) return '';
      var progreso = calcularProgreso(insc, curso);
      var completado = insc.estado === 'Completado';
      return (
        '<article class="reserva-card">' +
          '<div class="reserva-card__header">' +
            '<span class="tag tag--outline">' + escapeHtml(curso.categoria) + '</span>' +
            '<span class="tag ' + (completado ? 'tag--completado' : 'tag--progreso') + '">' + escapeHtml(insc.estado) + '</span>' +
          '</div>' +
          '<h3 class="reserva-card__title">' + escapeHtml(curso.nombre) + '</h3>' +
          '<div class="progress-bar' + (completado ? ' progress-bar--complete' : '') + '"><div class="progress-bar__fill" style="width:' + progreso + '%"></div></div>' +
          '<p class="reserva-card__text">' +
            insc.modulosCompletados.length + ' de ' + curso.modulos.length + ' módulos · ' + progreso + '% · Inscrito el ' + escapeHtml(formatFechaLarga(insc.fechaInscripcion)) +
          '</p>' +
        '</article>'
      );
    }).join('');
  }

  renderResumen();
  renderReservas();
  renderCursos();
  renderPagos();
}


/* ==========================================================================
   16. SIMULACIÓN DE PAGOS (pagos.html + integración con Seguimiento)

   PROTOTIPO ACADÉMICO — ver el bloque de notas al inicio de este archivo.
   Igual que las secciones 9 y 10, las simulaciones se guardan solo en
   localStorage, bajo su propia clave (sapereaude_pagos), asociadas siempre a
   session.userId. Esta sección NUNCA lee ni escribe números de tarjeta,
   códigos de seguridad ni ningún otro dato financiero: esos campos, cuando
   se piden, se usan solo para una validación de formato en pantalla y se
   descartan de inmediato (ver initPagosPage more abajo).
   ========================================================================== */

var PAYMENTS_STORAGE_KEY = 'sapereaude_pagos';

/**
 * Valores demostrativos por tipo de proceso, en "Unidades Demostrativas"
 * (UD): una unidad ficticia inventada únicamente para esta simulación
 * académica. NO son precios reales ni oficiales de SAPERE AUDE — el
 * proyecto no documenta tarifas reales, así que no se inventan aquí
 * tampoco. Se usan solo para que la interfaz tenga un número que mostrar
 * durante la simulación del flujo de pago.
 */
var DEMO_VALOR_UD = {
  reserva: 120,
  curso: 180,
  general: 100
};

/** Lee todas las simulaciones de pago guardadas (de todos los usuarios) desde localStorage. */
function getPagos() {
  try {
    var raw = window.localStorage.getItem(PAYMENTS_STORAGE_KEY);
    var pagos = raw ? JSON.parse(raw) : [];
    return Array.isArray(pagos) ? pagos : [];
  } catch (error) {
    return [];
  }
}

/** Guarda la colección completa de simulaciones de pago en localStorage. */
function savePagos(pagos) {
  try {
    window.localStorage.setItem(PAYMENTS_STORAGE_KEY, JSON.stringify(pagos));
  } catch (error) {
    // Ver nota en saveUsers(): localStorage puede no estar disponible.
  }
}

/** Pagos del usuario autenticado, más recientes primero. */
function getPagosDeUsuario(userId) {
  return getPagos()
    .filter(function (p) { return p.usuarioId === userId; })
    .sort(function (a, b) { return new Date(b.creadaEn) - new Date(a.creadaEn); });
}

/**
 * Controlador principal de pagos.html. Reutiliza las funciones de sesión
 * (sección 7), de reservas (sección 9) y de cursos (sección 10) en vez de
 * duplicar esa lógica: esta sección solo arma el flujo de simulación sobre
 * los datos que ya existen.
 */
function initPagosPage() {
  var page = document.getElementById('pagos-page');
  if (!page) return; // Esta función solo aplica a pagos.html

  if (!isLoggedIn()) {
    window.location.replace('login.html');
    return;
  }

  var session = getSession();

  var form = document.getElementById('pago-form');
  var procesoInput = document.getElementById('pago-proceso');
  var procesoError = document.getElementById('pago-proceso-error');
  var resumenEl = document.getElementById('pago-resumen');
  var metodoError = document.getElementById('pago-metodo-error');
  var tarjetaCampos = document.getElementById('pago-tarjeta-campos');
  var formError = document.getElementById('pago-form-error');
  var confirmSection = document.getElementById('pago-confirmacion');

  var tarjetaNombre = document.getElementById('pago-tarjeta-nombre');
  var tarjetaNombreError = document.getElementById('pago-tarjeta-nombre-error');
  var tarjetaNumero = document.getElementById('pago-tarjeta-numero');
  var tarjetaNumeroError = document.getElementById('pago-tarjeta-numero-error');
  var tarjetaVencimiento = document.getElementById('pago-tarjeta-vencimiento');
  var tarjetaVencimientoError = document.getElementById('pago-tarjeta-vencimiento-error');
  var tarjetaCvv = document.getElementById('pago-tarjeta-cvv');
  var tarjetaCvvError = document.getElementById('pago-tarjeta-cvv-error');

  var listaEl = document.getElementById('mis-pagos-lista');
  var vaciaEl = document.getElementById('mis-pagos-vacia');

  var modalOverlay = document.getElementById('modal-overlay');
  var modalBody = document.getElementById('modal-body');
  var modalClose = document.getElementById('modal-close');

  // Procesos reales disponibles para simular un pago: reservas confirmadas
  // y cursos inscritos del usuario autenticado, tal como ya existen en
  // reservas.html y formacion.html. No se inventa ningún proceso adicional.
  var reservasUsuario = getReservasDeUsuario(session.userId).filter(function (r) {
    return r.estado === 'Confirmada';
  });
  var inscripcionesUsuario = getInscripcionesUsuario(session.userId);

  /** Arma las opciones de #pago-proceso a partir de reservas/cursos reales, más una opción general de demostración. */
  function poblarProcesos() {
    if (!procesoInput) return;
    var opciones = ['<option value="">Selecciona un proceso</option>'];

    if (reservasUsuario.length) {
      opciones.push('<optgroup label="Mis asesorías (reservas confirmadas)">');
      reservasUsuario.forEach(function (r) {
        var etiqueta = r.servicio + ' — ' + formatFechaLarga(r.fecha) + ' · ' + r.hora;
        opciones.push('<option value="reserva:' + r.id + '">' + escapeHtml(etiqueta) + '</option>');
      });
      opciones.push('</optgroup>');
    }

    if (inscripcionesUsuario.length) {
      opciones.push('<optgroup label="Mis cursos (inscripciones)">');
      inscripcionesUsuario.forEach(function (insc) {
        var curso = getCourseById(insc.cursoId);
        if (!curso) return;
        opciones.push('<option value="curso:' + insc.cursoId + '">' + escapeHtml(curso.nombre) + '</option>');
      });
      opciones.push('</optgroup>');
    }

    opciones.push('<optgroup label="Otro">');
    opciones.push('<option value="general:demo">Otro concepto (sin proceso asociado)</option>');
    opciones.push('</optgroup>');

    procesoInput.innerHTML = opciones.join('');
  }

  /** A partir del valor "tipo:id" de #pago-proceso, arma un objeto con la info a simular. */
  function resolverProceso(valor) {
    if (!valor) return null;
    var partes = valor.split(':');
    var tipo = partes[0];
    var id = partes.slice(1).join(':');

    if (tipo === 'reserva') {
      var reserva = reservasUsuario.filter(function (r) { return r.id === id; })[0];
      if (!reserva) return null;
      return {
        tipo: 'reserva',
        referenciaId: reserva.id,
        descripcion: reserva.servicio + ' (' + reserva.area + ')',
        detalle: formatFechaLarga(reserva.fecha) + ' · ' + reserva.hora + ' · ' + reserva.modalidad,
        valorDemostrativo: DEMO_VALOR_UD.reserva
      };
    }

    if (tipo === 'curso') {
      var curso = getCourseById(id);
      if (!curso) return null;
      return {
        tipo: 'curso',
        referenciaId: id,
        descripcion: curso.nombre,
        detalle: curso.categoria + ' · ' + curso.modalidad + ' · ' + curso.duracion,
        valorDemostrativo: DEMO_VALOR_UD.curso
      };
    }

    return {
      tipo: 'general',
      referenciaId: null,
      descripcion: 'Otro concepto',
      detalle: 'Sin una reserva o un curso asociado.',
      valorDemostrativo: DEMO_VALOR_UD.general
    };
  }

  /** Repinta el resumen del proceso elegido (Paso 2/3 del flujo: información + valor demostrativo). */
  function actualizarResumen() {
    if (!resumenEl) return;
    var proceso = resolverProceso(procesoInput ? procesoInput.value : '');

    if (!proceso) {
      resumenEl.innerHTML = '';
      resumenEl.hidden = true;
      return;
    }

    resumenEl.hidden = false;
    resumenEl.innerHTML =
      '<dl class="reserva-summary">' +
        '<div><dt>Proceso</dt><dd>' + escapeHtml(proceso.descripcion) + '</dd></div>' +
        '<div><dt>Detalle</dt><dd>' + escapeHtml(proceso.detalle) + '</dd></div>' +
        '<div><dt>Valor</dt><dd>' + proceso.valorDemostrativo + ' UD</dd></div>' +
      '</dl>';
  }

  if (procesoInput) {
    poblarProcesos();
    procesoInput.addEventListener('change', actualizarResumen);
    actualizarResumen();
  }

  /** Muestra/oculta los campos de tarjeta de prueba según el método elegido. */
  function actualizarCamposTarjeta() {
    if (!tarjetaCampos) return;
    var metodoEl = document.querySelector('input[name="metodo-pago"]:checked');
    var esTarjeta = !!(metodoEl && metodoEl.value.indexOf('Tarjeta') === 0);
    tarjetaCampos.hidden = !esTarjeta;
  }

  var metodoRadios = document.querySelectorAll('input[name="metodo-pago"]');
  metodoRadios.forEach(function (radio) {
    radio.addEventListener('change', actualizarCamposTarjeta);
  });

  /** Muestra la confirmación de una simulación recién creada y refresca la lista. */
  function mostrarConfirmacionPago(pago) {
    if (!confirmSection) return;
    confirmSection.innerHTML =
      '<h2 class="dashboard-card__title">Registro guardado</h2>' +
      '<p class="dashboard-card__hint">El pago quedó registrado en tu cuenta y aparece en Mis pagos y en Seguimiento.</p>' +
      '<dl class="reserva-summary">' +
        '<div><dt>Proceso</dt><dd>' + escapeHtml(pago.descripcion) + '</dd></div>' +
        '<div><dt>Método</dt><dd>' + escapeHtml(pago.metodo) + '</dd></div>' +
        '<div><dt>Valor</dt><dd>' + pago.valorDemostrativo + ' UD</dd></div>' +
        '<div><dt>Estado</dt><dd><span class="tag tag--simulado">' + escapeHtml(pago.estado) + '</span></dd></div>' +
      '</dl>' +
      '<div class="quick-actions">' +
        '<a href="#mis-pagos" class="btn btn--primary">Ver mis pagos</a>' +
        '<a href="seguimiento.html" class="btn btn--secondary">Ver en Seguimiento</a>' +
        '<a href="dashboard.html" class="btn btn--secondary">Volver al Dashboard</a>' +
      '</div>';
    confirmSection.hidden = false;
    confirmSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  if (form) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();

      clearFieldError(procesoInput, procesoError);
      if (metodoError) { metodoError.textContent = ''; metodoError.classList.remove('is-visible'); }
      clearFieldError(tarjetaNombre, tarjetaNombreError);
      clearFieldError(tarjetaNumero, tarjetaNumeroError);
      clearFieldError(tarjetaVencimiento, tarjetaVencimientoError);
      clearFieldError(tarjetaCvv, tarjetaCvvError);
      if (formError) hideFormMessage(formError);
      if (confirmSection) confirmSection.hidden = true;

      var isValid = true;

      var proceso = resolverProceso(procesoInput ? procesoInput.value : '');
      if (!proceso) {
        showFieldError(procesoInput, procesoError, 'Selecciona un proceso.');
        isValid = false;
      }

      var metodoEl = document.querySelector('input[name="metodo-pago"]:checked');
      if (!metodoEl) {
        if (metodoError) { metodoError.textContent = 'Selecciona un método de pago.'; metodoError.classList.add('is-visible'); }
        isValid = false;
      }

      // Validación de FORMATO únicamente (nunca se guarda lo escrito aquí,
      // ver el comentario al inicio de esta sección y la Parte 6/7 del
      // encargo): solo confirma que el dato de prueba tiene una forma
      // razonable antes de simular el pago.
      var esTarjeta = metodoEl && metodoEl.value.indexOf('Tarjeta') === 0;
      if (esTarjeta) {
        if (!tarjetaNombre.value.trim()) {
          showFieldError(tarjetaNombre, tarjetaNombreError, 'Escribe el nombre que aparece en la tarjeta.');
          isValid = false;
        }
        var numeroLimpio = tarjetaNumero.value.replace(/\s+/g, '');
        if (!/^\d{13,19}$/.test(numeroLimpio)) {
          showFieldError(tarjetaNumero, tarjetaNumeroError, 'El número debe tener entre 13 y 19 dígitos.');
          isValid = false;
        }
        if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(tarjetaVencimiento.value.trim())) {
          showFieldError(tarjetaVencimiento, tarjetaVencimientoError, 'Usa el formato MM/AA.');
          isValid = false;
        }
        if (!/^\d{3,4}$/.test(tarjetaCvv.value.trim())) {
          showFieldError(tarjetaCvv, tarjetaCvvError, 'Usa un código de 3 o 4 dígitos.');
          isValid = false;
        }
      }

      if (!isValid) return;

      var nuevoPago = {
        id: generateLocalId(),
        usuarioId: session.userId,
        tipo: proceso.tipo,
        referenciaId: proceso.referenciaId,
        descripcion: proceso.descripcion,
        detalle: proceso.detalle,
        valorDemostrativo: proceso.valorDemostrativo,
        metodo: metodoEl.value,
        estado: 'Registrado',
        creadaEn: new Date().toISOString()
      };
      // A propósito: nuevoPago NUNCA incluye tarjetaNumero, tarjetaCvv ni
      // tarjetaVencimiento. Esos valores solo existieron en el formulario
      // para la validación de arriba y se descartan aquí mismo.

      var pagos = getPagos();
      pagos.push(nuevoPago);
      savePagos(pagos);

      form.reset();
      actualizarResumen();
      actualizarCamposTarjeta();
      mostrarConfirmacionPago(nuevoPago);
      renderMisPagos();
    });
  }

  /** Cierra el modal de "Ver detalles" de una simulación. */
  function cerrarModal() {
    if (!modalOverlay) return;
    modalOverlay.classList.remove('is-visible');
    if (modalBody) modalBody.innerHTML = '';
  }

  function abrirModal() {
    if (!modalOverlay) return;
    modalOverlay.classList.add('is-visible');
  }

  if (modalClose) modalClose.addEventListener('click', cerrarModal);
  if (modalOverlay) {
    modalOverlay.addEventListener('click', function (event) {
      if (event.target === modalOverlay) cerrarModal();
    });
  }
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') cerrarModal();
  });

  /** Modal: "Ver detalles" de una simulación de pago puntual. */
  function abrirDetalles(pago) {
    if (!modalBody) return;
    modalBody.innerHTML =
      '<h2 class="dashboard-card__title">Detalle del pago</h2>' +
      '<dl class="reserva-summary">' +
        '<div><dt>Proceso</dt><dd>' + escapeHtml(pago.descripcion) + '</dd></div>' +
        '<div><dt>Detalle</dt><dd>' + escapeHtml(pago.detalle || '—') + '</dd></div>' +
        '<div><dt>Método</dt><dd>' + escapeHtml(pago.metodo) + '</dd></div>' +
        '<div><dt>Valor</dt><dd>' + pago.valorDemostrativo + ' UD</dd></div>' +
        '<div><dt>Estado</dt><dd><span class="tag tag--simulado">' + escapeHtml(pago.estado) + '</span></dd></div>' +
        '<div><dt>Creada el</dt><dd>' + escapeHtml(new Date(pago.creadaEn).toLocaleString('es-ES')) + '</dd></div>' +
      '</dl>' +
      '<div class="quick-actions"><button type="button" class="btn btn--secondary" id="modal-cerrar-pago">Cerrar</button></div>';

    var cerrarBtn = document.getElementById('modal-cerrar-pago');
    if (cerrarBtn) cerrarBtn.addEventListener('click', cerrarModal);
    abrirModal();
  }

  /** Dibuja "Mis simulaciones de pago" con las simulaciones del usuario autenticado. */
  function renderMisPagos() {
    if (!listaEl) return;
    var pagos = getPagosDeUsuario(session.userId);

    if (!pagos.length) {
      listaEl.innerHTML = '';
      listaEl.hidden = true;
      if (vaciaEl) vaciaEl.hidden = false;
      return;
    }

    listaEl.hidden = false;
    if (vaciaEl) vaciaEl.hidden = true;

    listaEl.innerHTML = pagos.map(function (pago) {
      return (
        '<article class="reserva-card" data-pago-id="' + pago.id + '">' +
          '<div class="reserva-card__header">' +
            '<span class="tag tag--outline">' + escapeHtml(pago.metodo) + '</span>' +
            '<span class="tag tag--simulado">' + escapeHtml(pago.estado) + '</span>' +
          '</div>' +
          '<h3 class="reserva-card__title">' + escapeHtml(pago.descripcion) + '</h3>' +
          '<p class="reserva-card__text">' +
            'Valor: ' + pago.valorDemostrativo + ' UD · ' + escapeHtml(new Date(pago.creadaEn).toLocaleString('es-ES')) +
          '</p>' +
          '<div class="reserva-card__footer">' +
            '<button type="button" class="btn btn--secondary" data-action="detalles">Ver detalles</button>' +
          '</div>' +
        '</article>'
      );
    }).join('');

    var cards = listaEl.querySelectorAll('.reserva-card');
    cards.forEach(function (card) {
      var id = card.getAttribute('data-pago-id');
      var pago = pagos.filter(function (p) { return p.id === id; })[0];
      if (!pago) return;
      var detallesBtn = card.querySelector('[data-action="detalles"]');
      if (detallesBtn) detallesBtn.addEventListener('click', function () { abrirDetalles(pago); });
    });
  }

  renderMisPagos();
}

function initSaperebot() {
  if (document.getElementById('saperebot-widget')) return; // Ya inicializado.

  var widget = document.createElement('div');
  widget.className = 'saperebot-widget';
  widget.id = 'saperebot-widget';
  widget.innerHTML =
    '<button type="button" class="saperebot-launcher" id="saperebot-launcher" aria-expanded="false" aria-controls="saperebot-panel">' +
      '<span class="saperebot-launcher__mark" aria-hidden="true">SA</span>' +
      '<span class="sr-only">Abrir SAPEREBOT, asistente virtual</span>' +
    '</button>' +
    '<section class="saperebot-panel" id="saperebot-panel" hidden aria-label="SAPEREBOT, asistente virtual">' +
      '<header class="saperebot-panel__header">' +
        '<span class="saperebot-avatar" aria-hidden="true">SA</span>' +
        '<span class="saperebot-panel__info">' +
          '<span class="saperebot-panel__name">SAPEREBOT</span>' +
          '<span class="saperebot-panel__status"><span class="saperebot-panel__dot" aria-hidden="true"></span>Asistente de orientación</span>' +
        '</span>' +
        '<button type="button" class="saperebot-panel__close" id="saperebot-close" aria-label="Cerrar SAPEREBOT">&times;</button>' +
      '</header>' +
      '<div class="saperebot-messages" id="saperebot-messages" aria-live="polite"></div>' +
      '<div class="saperebot-quick" id="saperebot-quick"></div>' +
      '<form class="saperebot-form" id="saperebot-form">' +
        '<label for="saperebot-input" class="sr-only">Escribe tu pregunta</label>' +
        '<input type="text" id="saperebot-input" class="saperebot-input" placeholder="Escribe tu pregunta..." autocomplete="off">' +
        '<button type="submit" class="saperebot-send" id="saperebot-send" aria-label="Enviar">➤</button>' +
      '</form>' +
    '</section>';
  document.body.appendChild(widget);

  var launcher = document.getElementById('saperebot-launcher');
  var panel = document.getElementById('saperebot-panel');
  var closeBtn = document.getElementById('saperebot-close');
  var form = document.getElementById('saperebot-form');
  var input = document.getElementById('saperebot-input');
  var yaAbrioAlgunaVez = false;

  function abrirPanel() {
    panel.hidden = false;
    launcher.setAttribute('aria-expanded', 'true');

    if (!yaAbrioAlgunaVez) {
      yaAbrioAlgunaVez = true;
      var historial = getSaperebotHistorial();
      if (historial.length) {
        saperebotRepintarHistorial(historial);
        saperebotPintarChips([{ etiqueta: '← Volver al menú principal', categoria: 'menu' }]);
      } else {
        var session = getSession();
        var saludo = (isLoggedIn() && session && session.nombre)
          ? '¡Hola, ' + session.nombre + '! Soy SAPEREBOT, el asistente virtual de SAPERE AUDE.'
          : '¡Hola! Soy SAPEREBOT, el asistente virtual de SAPERE AUDE.';
        var bienvenida = saludo + ' Puedo ayudarte a orientarte dentro de la plataforma con información ya confirmada del sitio. ¿Qué te gustaría hacer?';
        saperebotPintarMensaje('bot', '<p class="saperebot-msg__text">' + escapeHtml(bienvenida) + '</p>');
        addSaperebotMensaje('bot', bienvenida);
        saperebotPintarChips(SAPEREBOT_MENU_PRINCIPAL);
      }
    }

    input.focus();
  }

  function cerrarPanel() {
    panel.hidden = true;
    launcher.setAttribute('aria-expanded', 'false');
    launcher.focus();
  }

  launcher.addEventListener('click', function () {
    if (panel.hidden) abrirPanel(); else cerrarPanel();
  });
  closeBtn.addEventListener('click', cerrarPanel);

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var texto = input.value.trim();
    if (!texto) return;
    input.value = '';
    saperebotManejarSeleccion(texto, null);
  });
}

/**
 * Protección adicional para el caso en que el navegador restaura
 * dashboard.html, reservas.html o chat.html desde la caché de
 * "atrás/adelante" (bfcache) después de haber cerrado sesión, sin volver a
 * ejecutar todo el flujo de carga.
 */
window.addEventListener('pageshow', function (event) {
  var esPaginaPrivada = document.getElementById('dashboard') || document.getElementById('reservas-page') || document.getElementById('chat-page');
  if (event.persisted && esPaginaPrivada && !isLoggedIn()) {
    window.location.replace('login.html');
  }
});


/* ==========================================================================
   17. ROLES Y DATOS DE DEMOSTRACIÓN (sembrado único por navegador)

   Este prototipo académico no tiene backend ni base de datos, así que no
   existe un lugar "central" donde crear de antemano una cuenta
   administradora: se siembra una vez, en el propio navegador de quien abre
   el sitio, la primera vez que carga cualquier página. NUNCA se muestra en
   ninguna página del sitio: sus credenciales de demostración se documentan
   solo aquí, en el código, para quien necesite presentarlo.

   El sembrado es idempotente (una bandera en localStorage evita repetirlo
   en cada carga) y todos los registros de ejemplo llevan "demo: true" para
   poder identificarlos y eliminarlos con un clic desde el Panel de
   Administración (ver eliminarDatosDemo más abajo), tal como pide el punto
   12 del encargo: nunca se presentan como usuarios, reservas o solicitudes
   reales.
   ========================================================================== */
var DEMO_SEED_FLAG_KEY = 'sapereaude_demo_semilla_v1';

/**
 * Credenciales de la cuenta administradora de DEMOSTRACIÓN, usadas
 * únicamente por initSeedDemoData() para crear la cuenta la primera vez.
 * No se imprimen en ningún elemento visible de la interfaz.
 */
var DEMO_ADMIN_ACCOUNT = {
  correo: 'admin.demo@sapereaude.local',
  password: 'SapereAdmin#2026'
};

/** Siembra (una sola vez por navegador) la cuenta administradora y un pequeño conjunto de datos DEMO. */
function initSeedDemoData() {
  try {
    if (window.localStorage.getItem(DEMO_SEED_FLAG_KEY)) return;
  } catch (error) {
    return; // Sin localStorage disponible no hay nada que sembrar.
  }

  var users = getUsers();
  var yaExisteAdmin = users.some(function (u) { return u.rol === 'administrador'; });

  var tareas = [];

  if (!yaExisteAdmin && !findUserByEmail(DEMO_ADMIN_ACCOUNT.correo)) {
    var saltAdmin = generateSaltHex();
    tareas.push(
      hashPassword(DEMO_ADMIN_ACCOUNT.password, saltAdmin).then(function (hash) {
        var users2 = getUsers();
        users2.push({
          id: generateLocalId(),
          nombre: 'Administración',
          apellido: 'SAPERE AUDE',
          correo: DEMO_ADMIN_ACCOUNT.correo,
          passwordHash: hash,
          passwordSalt: saltAdmin,
          tipoUsuario: 'empresa',
          rol: 'administrador',
          estado: 'Activo',
          creadaEn: new Date().toISOString(),
          demo: true
        });
        saveUsers(users2);
      })
    );
  }

  var demo1Id = generateLocalId();
  var demo2Id = generateLocalId();

  if (!findUserByEmail('usuario.demo1@sapereaude.local')) {
    var salt1 = generateSaltHex();
    tareas.push(
      hashPassword('DemoUsuario#1', salt1).then(function (hash) {
        var users3 = getUsers();
        users3.push({
          id: demo1Id,
          nombre: 'Usuario',
          apellido: 'Demo 1',
          correo: 'usuario.demo1@sapereaude.local',
          passwordHash: hash,
          passwordSalt: salt1,
          tipoUsuario: 'estudiante',
          rol: 'usuario',
          estado: 'Activo',
          creadaEn: new Date().toISOString(),
          demo: true
        });
        saveUsers(users3);

        // Reserva DEMO asociada al Usuario Demo 1, para que el Panel de
        // Administración tenga algo real que mostrar en "Reservas" desde
        // la primera carga, sin inventar datos de otros usuarios.
        var reservas = getReservas();
        reservas.push({
          id: generateLocalId(),
          usuarioId: demo1Id,
          usuarioEmail: 'usuario.demo1@sapereaude.local',
          usuarioNombre: 'Usuario Demo 1',
          servicio: 'Asesorías académicas',
          area: 'Administración',
          modalidad: 'Virtual',
          fecha: getTodayISO(),
          hora: '10:00',
          motivo: 'Reserva de demostración para presentar el Panel de Administración.',
          estado: 'Confirmada',
          creadaEn: new Date().toISOString(),
          demo: true
        });
        saveReservas(reservas);

        // Solicitud de servicio DEMO (equivalente a un envío del formulario
        // de contacto), para poblar la vista "Servicios" del panel.
        addSolicitud({
          id: generateLocalId(),
          usuarioId: demo1Id,
          nombre: 'Usuario Demo 1',
          correo: 'usuario.demo1@sapereaude.local',
          tipoUsuario: 'estudiante',
          motivo: 'consultoria',
          mensaje: 'Solicitud de demostración para presentar el Panel de Administración.',
          estado: 'Pendiente',
          creadaEn: new Date().toISOString(),
          demo: true
        });
      })
    );
  }

  if (!findUserByEmail('usuario.demo2@sapereaude.local')) {
    var salt2 = generateSaltHex();
    tareas.push(
      hashPassword('DemoUsuario#2', salt2).then(function (hash) {
        var users4 = getUsers();
        users4.push({
          id: demo2Id,
          nombre: 'Usuario',
          apellido: 'Demo 2',
          correo: 'usuario.demo2@sapereaude.local',
          passwordHash: hash,
          passwordSalt: salt2,
          tipoUsuario: 'profesional',
          rol: 'usuario',
          estado: 'Activo',
          creadaEn: new Date().toISOString(),
          demo: true
        });
        saveUsers(users4);
      })
    );
  }

  Promise.all(tareas).then(function () {
    try {
      window.localStorage.setItem(DEMO_SEED_FLAG_KEY, '1');
    } catch (error) {
      // Ver nota en saveUsers().
    }
  });
}

/**
 * Elimina todos los registros marcados "demo: true" (usuarios, reservas y
 * solicitudes de servicio creados por initSeedDemoData). No borra ninguna
 * cuenta, reserva, inscripción o pago real creado por una persona usando el
 * sitio. Usado desde el botón "Eliminar datos de prueba" del Panel de
 * Administración (ver initAdminPage, sección 18).
 */
function eliminarDatosDemo() {
  var users = getUsers().filter(function (u) { return !u.demo; });
  saveUsers(users);

  var reservas = getReservas().filter(function (r) { return !r.demo; });
  saveReservas(reservas);

  var solicitudes = getSolicitudes().filter(function (s) { return !s.demo; });
  saveSolicitudes(solicitudes);

  try {
    window.localStorage.removeItem(DEMO_SEED_FLAG_KEY);
  } catch (error) {
    // Ver nota en saveUsers().
  }
}


/* ==========================================================================
   18. PANEL DE ADMINISTRACIÓN (admin.html)

   Dashboard independiente del Dashboard de usuario (sección 8), reutilizando
   el mismo shell visual (.dashboard, sidebar, topbar — ver css/styles.css,
   sección 20) para mantener la identidad visual de SAPERE AUDE. El guardia
   de acceso real vive en el <script> del <head> de admin.html (igual patrón
   que las demás páginas privadas); initAdminPage() es un refuerzo adicional
   que además pinta el contenido a partir de datos reales ya guardados por
   el resto del sitio (sección 7, 9, 10, 12, 16 y 5.0). No inventa ninguna
   estadística ni ningún registro nuevo.
   ========================================================================== */

/** Vistas disponibles dentro del Panel de Administración (una visible a la vez). */
var ADMIN_VIEWS = ['resumen', 'usuarios', 'servicios', 'reservas', 'formacion', 'consultas', 'pagos'];

/** Construye una tabla HTML simple a partir de columnas y filas ya escapadas. */
function buildAdminTable(headers, rows) {
  if (!rows.length) {
    return '<p class="admin-empty">Todavía no hay datos reales para mostrar aquí.</p>';
  }
  var thead = '<thead><tr>' + headers.map(function (h) { return '<th>' + h + '</th>'; }).join('') + '</tr></thead>';
  var tbody = '<tbody>' + rows.map(function (row) {
    return '<tr>' + row.map(function (cell) { return '<td>' + cell + '</td>'; }).join('') + '</tr>';
  }).join('') + '</tbody>';
  return '<div class="admin-table-wrap"><table class="admin-table">' + thead + tbody + '</table></div>';
}

/** Devuelve un pequeño rótulo "DEMO" para filas sembradas por initSeedDemoData(). */
function demoTagIfNeeded(registro) {
  return registro.demo ? '<span class="admin-demo-tag">DEMO</span>' : '';
}

/** Devuelve la clase .tag--* adecuada para un estado de reserva/curso/pago/solicitud. */
function estadoTagClass(estado) {
  var mapa = {
    'Confirmada': 'tag--confirmada',
    'Confirmado': 'tag--atendido',
    'Cancelada': 'tag--cancelada',
    'Cancelado': 'tag--cancelada',
    'En progreso': 'tag--progreso',
    'Completado': 'tag--completado',
    'Simulado': 'tag--simulado',
    'Registrado': 'tag--simulado',
    'Pendiente': 'tag--pendiente',
    'Atendido': 'tag--atendido'
  };
  return mapa[estado] || 'tag--outline';
}

function initAdminPage() {
  var page = document.getElementById('admin-page');
  if (!page) return; // Esta función solo aplica a admin.html

  // Refuerzo del guardia del <head>: si por algún motivo se llega hasta
  // aquí sin sesión de administrador válida, se redirige de inmediato.
  if (!isLoggedIn()) {
    window.location.replace('login.html');
    return;
  }
  if (!isAdmin()) {
    window.location.replace('dashboard.html');
    return;
  }

  var session = getSession();

  // La topbar reutiliza los mismos elementos que initDashboardPage() ya
  // rellenó (avatar, nombre); aquí solo se ajusta la etiqueta de tipo para
  // mostrar el rol en vez del tipo de usuario, y se agrega el badge de rol.
  var typeEl = document.getElementById('dashboard-user-type');
  if (typeEl) typeEl.textContent = 'Administrador';

  var roleBadge = document.getElementById('admin-role-badge');
  if (roleBadge) roleBadge.textContent = 'Administrador · SAPERE AUDE';

  // ---- Navegación por pestañas (una sola página, varias vistas) ----
  var navButtons = document.querySelectorAll('[data-admin-view]');
  var views = {};
  ADMIN_VIEWS.forEach(function (id) {
    views[id] = document.getElementById('admin-view-' + id);
  });

  function mostrarVista(id) {
    ADMIN_VIEWS.forEach(function (viewId) {
      if (views[viewId]) views[viewId].hidden = (viewId !== id);
    });
    navButtons.forEach(function (btn) {
      btn.classList.toggle('is-active', btn.getAttribute('data-admin-view') === id);
    });
  }

  navButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      mostrarVista(btn.getAttribute('data-admin-view'));
      var sidebar = document.getElementById('dashboard-sidebar');
      var overlay = document.getElementById('dashboard-overlay');
      if (sidebar) sidebar.classList.remove('is-open');
      if (overlay) overlay.classList.remove('is-visible');
    });
  });

  mostrarVista('resumen');

  // ---- Datos reales (sin inventar nada) ----
  var todosUsuarios = getUsers();
  var todasReservas = getReservas();
  var todasInscripciones = getInscripciones();
  var todasSolicitudes = getSolicitudes();
  var todosPagos = getPagos();
  var todosMensajes = getMensajes();

  function nombreUsuario(userId) {
    var u = findUserById(userId);
    return u ? (u.nombre + ' ' + (u.apellido || '')).trim() : '—';
  }

  /* ---- Resumen ---- */
  function renderResumen() {
    var resumenEl = document.getElementById('admin-resumen-grid');
    if (!resumenEl) return;

    var conversaciones = {};
    todosMensajes.forEach(function (m) { conversaciones[m.usuario + '__' + m.asesor] = true; });

    var tarjetas = [
      { icono: '👥', label: 'Usuarios registrados', valor: todosUsuarios.length },
      { icono: '📅', label: 'Reservas', valor: todasReservas.length },
      { icono: '📋', label: 'Solicitudes de servicios', valor: todasSolicitudes.length },
      { icono: '🎓', label: 'Inscripciones a formación', valor: todasInscripciones.length },
      { icono: '💬', label: 'Conversaciones de chat', valor: Object.keys(conversaciones).length },
      { icono: '💳', label: 'Pagos registrados', valor: todosPagos.length }
    ];

    resumenEl.innerHTML = tarjetas.map(function (t) {
      return (
        '<article class="dashboard-card">' +
          '<h2 class="dashboard-card__title">' + t.icono + ' ' + t.label + '</h2>' +
          '<p class="admin-stat__value">' + t.valor + '</p>' +
          '<p class="admin-stat__label">Calculado a partir de los datos reales guardados en este navegador.</p>' +
        '</article>'
      );
    }).join('');
  }

  var eliminarDemoBtn = document.getElementById('admin-eliminar-demo');
  if (eliminarDemoBtn) {
    eliminarDemoBtn.addEventListener('click', function () {
      var confirmado = window.confirm('¿Eliminar todos los datos de prueba (DEMO)? Esta acción no se puede deshacer.');
      if (!confirmado) return;
      eliminarDatosDemo();
      window.location.reload();
    });
  }

  /* ---- Usuarios ---- */
  function renderUsuarios() {
    var el = document.getElementById('admin-usuarios-tabla');
    if (!el) return;
    var rows = todosUsuarios.map(function (u) {
      var fecha = u.creadaEn ? new Date(u.creadaEn).toLocaleDateString('es-ES') : '—';
      return [
        escapeHtml((u.nombre || '') + ' ' + (u.apellido || '')) + demoTagIfNeeded(u),
        escapeHtml(u.correo || ''),
        escapeHtml(fecha),
        '<span class="tag ' + (u.rol === 'administrador' ? 'tag--bronze' : 'tag--outline') + '">' + escapeHtml(ROLE_LABELS[u.rol] || 'Usuario') + '</span>',
        escapeHtml(u.estado || 'Activo')
      ];
    });
    // Nunca se incluyen passwordHash ni passwordSalt en esta tabla.
    el.innerHTML = buildAdminTable(['Nombre', 'Correo', 'Fecha de registro', 'Rol', 'Estado'], rows);
  }

  /* ---- Servicios (solicitudes) ---- */
  function renderServicios() {
    var el = document.getElementById('admin-servicios-tabla');
    if (!el) return;
    var solicitudesOrdenadas = todasSolicitudes.slice().sort(function (a, b) {
      return new Date(b.creadaEn) - new Date(a.creadaEn);
    });
    var rows = solicitudesOrdenadas.map(function (s) {
      var usuario = s.usuarioId ? nombreUsuario(s.usuarioId) : s.nombre;
      var fecha = s.creadaEn ? new Date(s.creadaEn).toLocaleDateString('es-ES') : '—';
      var selectId = 'solicitud-estado-' + s.id;
      var opciones = REQUEST_STATES.map(function (estado) {
        return '<option value="' + estado + '"' + (estado === s.estado ? ' selected' : '') + '>' + estado + '</option>';
      }).join('');
      return [
        escapeHtml(usuario) + demoTagIfNeeded(s),
        escapeHtml(REQUEST_REASON_LABELS[s.motivo] || s.motivo || 'Otro'),
        escapeHtml(fecha),
        '<select class="form-select" id="' + selectId + '" data-solicitud-id="' + s.id + '">' + opciones + '</select>'
      ];
    });
    el.innerHTML = buildAdminTable(['Usuario', 'Servicio solicitado', 'Fecha', 'Estado'], rows);

    el.querySelectorAll('select[data-solicitud-id]').forEach(function (select) {
      select.addEventListener('change', function () {
        updateSolicitudEstado(select.getAttribute('data-solicitud-id'), select.value);
        todasSolicitudes = getSolicitudes();
        // Se actualiza también el resumen, ya que no cambia el conteo pero
        // puede afectar a otras vistas abiertas en la misma sesión.
      });
    });
  }

  /* ---- Reservas ---- */
  function renderReservasAdmin() {
    var el = document.getElementById('admin-reservas-tabla');
    if (!el) return;
    var reservasOrdenadas = todasReservas.slice().sort(function (a, b) {
      return new Date(b.creadaEn) - new Date(a.creadaEn);
    });
    var rows = reservasOrdenadas.map(function (r) {
      return [
        escapeHtml(r.usuarioNombre || nombreUsuario(r.usuarioId)) + demoTagIfNeeded(r),
        escapeHtml(r.servicio || ''),
        escapeHtml(formatFechaLarga ? formatFechaLarga(r.fecha) : r.fecha),
        escapeHtml(r.hora || ''),
        '<span class="tag ' + estadoTagClass(r.estado) + '">' + escapeHtml(r.estado) + '</span>'
      ];
    });
    el.innerHTML = buildAdminTable(['Usuario', 'Servicio', 'Fecha', 'Hora', 'Estado'], rows);
  }

  /* ---- Formación / inscripciones ---- */
  function renderFormacionAdmin() {
    var el = document.getElementById('admin-formacion-tabla');
    if (!el) return;
    var rows = todasInscripciones.map(function (i) {
      return [
        escapeHtml(nombreUsuario(i.usuarioId)),
        escapeHtml(i.cursoNombre || i.cursoId),
        escapeHtml(i.fechaInscripcion ? new Date(i.fechaInscripcion).toLocaleDateString('es-ES') : '—'),
        '<span class="tag ' + estadoTagClass(i.estado) + '">' + escapeHtml(i.estado) + '</span>'
      ];
    });
    el.innerHTML = buildAdminTable(['Usuario', 'Curso / programa', 'Fecha de inscripción', 'Estado'], rows);
  }

  /* ---- Consultas (conversaciones del Chat demostrativo) ---- */
  function renderConsultasAdmin() {
    var el = document.getElementById('admin-consultas-tabla');
    if (!el) return;

    // Agrupa los mensajes reales por conversación (usuario + asesor): no se
    // inventa ninguna consulta, solo se resume lo que ya existe en
    // sapereaude_mensajes (ver sección 12).
    var conversaciones = {};
    todosMensajes.forEach(function (m) {
      var clave = m.usuario + '__' + m.asesor;
      if (!conversaciones[clave]) {
        conversaciones[clave] = { usuarioId: m.usuario, asesorId: m.asesor, cantidad: 0, ultima: m.fecha };
      }
      conversaciones[clave].cantidad += 1;
      if (new Date(m.fecha) > new Date(conversaciones[clave].ultima)) {
        conversaciones[clave].ultima = m.fecha;
      }
    });

    var lista = Object.keys(conversaciones).map(function (k) { return conversaciones[k]; });
    lista.sort(function (a, b) { return new Date(b.ultima) - new Date(a.ultima); });

    var rows = lista.map(function (c) {
      var asesor = getAsesorById(c.asesorId);
      return [
        escapeHtml(nombreUsuario(c.usuarioId)),
        escapeHtml(asesor ? asesor.nombre : c.asesorId),
        String(c.cantidad),
        escapeHtml(new Date(c.ultima).toLocaleString('es-ES'))
      ];
    });
    el.innerHTML = buildAdminTable(['Usuario', 'Asesor de demostración', 'Mensajes', 'Último mensaje'], rows);
  }

  /* ---- Pagos ---- */
  function renderPagosAdmin() {
    var el = document.getElementById('admin-pagos-tabla');
    if (!el) return;
    var pagosOrdenados = todosPagos.slice().sort(function (a, b) {
      return new Date(b.creadaEn) - new Date(a.creadaEn);
    });
    var rows = pagosOrdenados.map(function (p) {
      return [
        escapeHtml(nombreUsuario(p.usuarioId)),
        escapeHtml(p.descripcion || ''),
        escapeHtml(p.metodo || ''),
        p.valorDemostrativo + ' UD',
        '<span class="tag ' + estadoTagClass(p.estado) + '">' + escapeHtml(p.estado) + '</span>'
      ];
    });
    el.innerHTML = buildAdminTable(['Usuario', 'Proceso', 'Método', 'Valor', 'Estado'], rows);
  }

  renderResumen();
  renderUsuarios();
  renderServicios();
  renderReservasAdmin();
  renderFormacionAdmin();
  renderConsultasAdmin();
  renderPagosAdmin();

  // El botón "Cerrar sesión" y el sidebar deslizante en móvil ya quedan
  // conectados por initDashboardPage() (sección 8), que también se ejecuta
  // en admin.html porque comparte el mismo elemento raíz #dashboard: no se
  // repite aquí para no registrar los mismos listeners dos veces.
}
