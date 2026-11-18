// Punto de entrada de la app: carga la galería, abre/cierra el detalle, y conecta filtros y buscador.

import { renderizarMenuFiltros, desplegarFiltros } from "./filtros.js";
import { obtenerListadoObras, obtenerDetalleObra, filtrarObras, buscarObras } from "./artic.js";
import {
  renderizarGaleria,
  renderizarDetalle,
  mostrarCargando,
  mostrarError,
  renderizarColecciones,
  renderizarElegirColeccion,
  renderizarVerColeccion,
} from "./render.js";
import { crearColeccion, obtenerColecciones, agregarObraAColeccion, obtenerColeccion } from "./colecciones.js";
import { login, registrar, estaLogueado, cerrarSesion } from "./auth.js";


// ---------- PAGINACIÓN ----------
let paginaActual = 1;   /* qué página de la API ya cargamos */
let totalPaginas = 1;   /* cuántas páginas hay en total (lo dice la API en "pagination") */

let filtroActivo = null; //variable que "recuerda" qué filtro se eligió. null significa que no hay ninguno.
let busquedaActiva = null;
let obraActual = null;   //variable que recuerda que obra esta abierta/selaccionada

// ---------- CARGAR INICIAL DE GALERÍA ----------
const cargarGaleriaInicial = async () => {
  mostrarCargando();

  const paginaAlAzar = Math.floor(Math.random() * 100) + 1; /* página al azar entre 1 y 100, así cada recarga muestra obras distintas */

  try {
    const respuesta = await obtenerListadoObras(paginaAlAzar);
    renderizarGaleria(respuesta.data);
    paginaActual = paginaAlAzar; /* arrancamos desde la página al azar, el scroll sigue cargando desde acá */
    totalPaginas = respuesta.pagination.total_pages; /* la API nos dice cuántas páginas existen */
    await llenarGaleria(); /* si las obras no llenan el ancho de la pantalla, pedimos más */
  } catch (error) {
    mostrarError("No se pudo cargar el listado inicial de obras.");
    console.error(error);
  }
};

// ---------- CARGAR MÁS OBRAS ----------
let cargando = false; /* "candado": evita pedir la misma página dos veces mientras una carga está en curso */

const cargarMasObras = async () => {
  if (cargando || paginaActual >= totalPaginas) return; /* ya está cargando o no quedan páginas */
  cargando = true;

  try {
    let respuesta;
    if (filtroActivo) {                                   /* hay filtro: siguiente página filtrada */
      respuesta = await filtrarObras(filtroActivo.campo, filtroActivo.valor, paginaActual + 1);
    } else if (busquedaActiva) {                          /* hay búsqueda: siguiente página de la búsqueda */
      respuesta = await buscarObras(busquedaActiva, paginaActual + 1);
    } else {                                              /* ninguno: listado general */
      respuesta = await obtenerListadoObras(paginaActual + 1);
    }
    renderizarGaleria(respuesta.data, false); /* false = NO borrar las anteriores, agregarlas al final */
    paginaActual++;                          /* recién acá avanzamos, cuando la carga salió bien */
  } catch (error) {
    mostrarError("No se pudieron cargar más obras.");
    console.error(error);
  } finally {                                /* finally se ejecuta siempre, haya error o no */
    cargando = false;
  }
};


//funcion para filtrar obras select
const aplicarFiltro = async (campo, valor) => {
  filtroActivo = { campo, valor }; //guardo los dos datos juntos en un objeto, para que cargarMasObras los pueda usar después.
  busquedaActiva = null;        /* filtrar apaga la búsqueda */
  campoBusqueda.value = "";
  mostrarCargando();
      
  try {
    const respuesta = await filtrarObras(campo, valor, 1);
    renderizarGaleria(respuesta.data);
    paginaActual = 1;
    totalPaginas = respuesta.pagination.total_pages;
    galeria.scrollLeft = 0;
    await llenarGaleria(); //si las obras filtradas no llenan el ancho de la pantalla, pide más páginas; await espera a que termine
  } catch (error) {
    mostrarError("No se pudieron filtrar las obras.");
    console.error(error);
  }
};

//funcion filtro de busqueda
const buscar = async (texto) => {
  busquedaActiva = texto;
  filtroActivo = null;          //filtro de busqueda desactiva el filtro tipo select
  mostrarCargando();

  try {
    const respuesta = await buscarObras(texto, 1);
    renderizarGaleria(respuesta.data);
    paginaActual = 1;
    totalPaginas = respuesta.pagination.total_pages;
    galeria.scrollLeft = 0;
    await llenarGaleria();
  } catch (error) {
    mostrarError("No se pudo realizar la búsqueda.");
    console.error(error);
  }
};

// ---------- MODAL / POP UP DE DETALLE ----------
const modal = document.getElementById("modal-detalle"); /* buscamos en el html */

const abrirDetalle = async (id) => {
  try {
    const obra = await obtenerDetalleObra(id); /* pide el detalle de la obra del id */
    obraActual = obra; //guardamos la info de qué obra esta abierta en este momento
    renderizarDetalle(obra); /* le pide a render.js que arme el HTML del popup con esos datos, y lo mete adentro de #contenido-detalle */
    modal.hidden = false;
  } catch (error) {
    console.error(error);
  }
};

const cerrarModal = () => { /* oculta el pop up */
  modal.hidden = true;
};


// POP UP NUEVA COLECCIÓN 
const modalNuevaColeccion = document.getElementById("modal-nueva-coleccion");
const campoNombreColeccion = document.getElementById("campo-nombre-coleccion");
const campoDescripcionColeccion = document.getElementById("campo-descripcion-coleccion");
const errorNuevaColeccion = document.getElementById("error-nueva-coleccion");

const abrirNuevaColeccion = () => {
  campoNombreColeccion.value = "";          
  campoDescripcionColeccion.value = "";
  errorNuevaColeccion.hidden = true;        
  modalNuevaColeccion.hidden = false;       
};

const cerrarNuevaColeccion = () => {
  modalNuevaColeccion.hidden = true;
  agregarAlCrear = false;      // la próxima vez arranca sin agregar nada
};


const botonAbrirNuevaColeccion = document.getElementById("boton-abrir-nueva-coleccion"); /* "Crear colección" del nav */
const botonMasColeccion = document.getElementById("boton-agregar-coleccion");             /* el "+" de Mis colecciones */
const botonCerrarNuevaColeccion = document.getElementById("boton-cerrar-nueva-coleccion"); /* la ✕ */

botonAbrirNuevaColeccion.addEventListener("click", abrirNuevaColeccion);
botonMasColeccion.addEventListener("click", abrirNuevaColeccion);
botonCerrarNuevaColeccion.addEventListener("click", cerrarNuevaColeccion);

modalNuevaColeccion.addEventListener("click", (evento) => {
  if (evento.target === modalNuevaColeccion) cerrarNuevaColeccion(); 
});

//ONBOARDING: al tocar "Entrar al museo" se desliza hacia arriba y después se oculta
const onboarding = document.getElementById("onboarding");
const botonEntrar = document.getElementById("boton-entrar");

botonEntrar.addEventListener("click", () => {
  if (!estaLogueado()) {                   // ¿Ya tiene sesión iniciada? Si no → login
    mostrarLogin();                        // queda detrás del onboarding, y se ve cuando este sube
  }
  onboarding.classList.add("saliendo");    //arranca la animación de salida (CSS)
  setTimeout(() => {
    onboarding.hidden = true;              //cuando termina (600ms), lo sacamos del todo
  }, 600);
});

//LOGO: vuelve a abrir el onboarding sin recargar
const botonLogo = document.getElementById("boton-logo");

botonLogo.addEventListener("click", () => {
  onboarding.classList.remove("saliendo"); //saca la animación de salida (si no, queda congelado fuera de pantalla)
  onboarding.hidden = false;               //lo vuelve a mostrar y sus animaciones de entrada se repiten
});

// ---------- ACCESO: LOGIN, REGISTRO Y CERRAR SESIÓN ----------
const pantallaAcceso = document.getElementById("acceso");
const formularioLogin = document.getElementById("formulario-login");
const formularioRegistro = document.getElementById("formulario-registro");
const errorLogin = document.getElementById("error-login");
const errorRegistro = document.getElementById("error-registro");

// MUESTRA UN ERROR DEBAJO DEL FORMULARIO
const mostrarErrorAcceso = (parrafo, texto) => {
  parrafo.textContent = texto;
  parrafo.hidden = false;
};

// MUESTRA LA PANTALLA DE LOGIN
const mostrarLogin = () => {
  formularioRegistro.hidden = true;
  formularioLogin.hidden = false;
  errorLogin.hidden = true;
  pantallaAcceso.hidden = false;
};

// MUESTRA LA PANTALLA DE REGISTRO
const mostrarRegistro = () => {
  formularioLogin.hidden = true;
  formularioRegistro.hidden = false;
  errorRegistro.hidden = true;
};

// OCULTA LA PANTALLA DE ACCESO Y LIMPIA LOS CAMPOS (se entra a la galería)
const entrarAlMuseo = () => {
  formularioLogin.reset();
  formularioRegistro.reset();
  pantallaAcceso.hidden = true;
  // (acá Cande va a cargar las colecciones del usuario)
};

document.getElementById("ir-a-registro").addEventListener("click", mostrarRegistro);
document.getElementById("ir-a-login").addEventListener("click", mostrarLogin);

// LOGIN
formularioLogin.addEventListener("submit", async (evento) => {
  evento.preventDefault();                                   // que no se recargue la página
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;

  if (email === "" || password === "") {
    mostrarErrorAcceso(errorLogin, "Completá email y contraseña.");
    return;
  }

  try {
    await login(email, password);                            // si sale bien, auth.js guarda el token
    entrarAlMuseo();
  } catch (error) {
    mostrarErrorAcceso(errorLogin, error.message);           // ej: "Email o contraseña incorrectos"
  }
});

// REGISTRO (y después login automático)
formularioRegistro.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  const nombre = document.getElementById("registro-nombre").value.trim();
  const email = document.getElementById("registro-email").value.trim();
  const password = document.getElementById("registro-password").value;

  try {
    await registrar(nombre, email, password);                // crea la cuenta
    await login(email, password);                            // y entra con los mismos datos
    entrarAlMuseo();
  } catch (error) {
    mostrarErrorAcceso(errorRegistro, error.message);        // ej: "Ya existe una cuenta con ese email"
  }
});

// MENÚ DE INICIO: al tocar "Inicio" se despliega o se pliega
const menuInicio = document.getElementById("menu-inicio");
document.getElementById("boton-inicio").addEventListener("click", () => {
  menuInicio.hidden = !menuInicio.hidden;                    // si estaba oculto lo muestra, y al revés
});

// CERRAR SESIÓN → vuelve al login
document.getElementById("boton-cerrar-sesion").addEventListener("click", () => {
  menuInicio.hidden = true;                                  // cierra el menú
  cerrarSesion();                                            // borra el token
  mostrarLogin();
  // (acá Cande va a vaciar las colecciones de la pantalla)
});

//CREAR NUEVA COLECCION
const formularioNuevaColeccion = document.getElementById("formulario-nueva-coleccion");

formularioNuevaColeccion.addEventListener("submit", (evento) => {
  evento.preventDefault();                                   //evita que se recargue la pagina al hacer click

  const nombre = campoNombreColeccion.value.trim();          //saca los espacios sobrantes 
  const descripcion = campoDescripcionColeccion.value.trim();

  if (nombre === "") {                                      
    errorNuevaColeccion.textContent = "Ponele un nombre a tu colección."; //nombre es obligatorio
    errorNuevaColeccion.hidden = false;
    return;
  }

  const seCreo = crearColeccion(nombre, descripcion);        

  if (seCreo === false) {
    errorNuevaColeccion.textContent = "Ya existe una colección con ese nombre.";  //si ya existe una coleccion con ese nombre
    errorNuevaColeccion.hidden = false;
    return;
  }
  console.log("colección creada:", nombre);

    if (agregarAlCrear === true) {                              // se abrió desde "Agregar a colección"
    renderizarElegirColeccion(obtenerColecciones());          // redibujamos las carpetitas, ahora con la nueva
    const carpetas = document.querySelectorAll(".carpeta-elegir");
    elegirColeccion(carpetas[carpetas.length - 1]);           // dejamos seleccionada la nueva (es la última)
  }

  renderizarColecciones(obtenerColecciones());
  cerrarNuevaColeccion();

});

////////////////////////////////
///LISTENERS
/* para no poner un click en cada obra */

//listener de clicks de toda la página: carpetas del cajón, obras de una colección, agregar a colección, carpetitas, opciones de filtro, tarjetas y cerrar modal. Estos elementos los crea el JS después de cargar la página, por eso van acá  no con su propio addEventListener): el repartidor escucha todo el document, así detecta clicks en elementos creados en cualquier momento.

document.addEventListener("click", (evento) => {
  const carpetaColeccion = evento.target.closest(".carpeta-coleccion");  //carpeta del cajón
  if (carpetaColeccion) {
    abrirVerColeccion(carpetaColeccion.dataset.nombre, carpetaColeccion.dataset.color);
    return;
  }

  const obraColeccion = evento.target.closest(".obra-coleccion");       //obra adentro de la carpeta abierta
  if (obraColeccion) {
    abrirDetalle(obraColeccion.dataset.id);
    return;
  }

  if (evento.target.id === "boton-agregar-a-coleccion") {
    abrirAgregarColeccion();
    return;
  }

  const carpetaElegir = evento.target.closest(".carpeta-elegir");
  if (carpetaElegir) {
    elegirColeccion(carpetaElegir);
    return;
  }

  const opcion = evento.target.closest(".boton-opcion"); //desde donde se hizo click, busca el botón de opción más cercano (o null si no fue en una opción)
  if (opcion) {
    aplicarFiltro(opcion.dataset.campo, opcion.dataset.valor);
    desplegarFiltros();
    return;
  }

  const tarjeta = evento.target.closest(".tarjeta-obra"); /* ve donde se hizo el click y sube hasta encontrar el padre con ese .tarjeta-obra */
  if (tarjeta) {
    abrirDetalle(tarjeta.dataset.id);
    return;
  }

  if (evento.target.id === "boton-cerrar-modal") {
    cerrarModal();
  }
});

modal.addEventListener("click", (evento) => {
  if (evento.target === modal) cerrarModal(); /* click afuera del contenido cierra */
});

//POP UP PARA AGREGAR A COLECCION
const modalAgregarColeccion = document.getElementById("modal-agregar-coleccion");
const botonConfirmarAgregar = document.getElementById("boton-confirmar-agregar");
const errorAgregarColeccion = document.getElementById("error-agregar-coleccion");
const botonCerrarAgregarColeccion = document.getElementById("boton-cerrar-agregar-coleccion");

let coleccionElegida = null;   //carpeta seleccionada, arranca en null

const abrirAgregarColeccion = () => {
  coleccionElegida = null;    //inicio del pop up: boton de seleccionar desactivado y ninguna carpeta seleccionada 
  botonConfirmarAgregar.disabled = true;                
  botonConfirmarAgregar.textContent = "Elegí una colección";
  errorAgregarColeccion.hidden = true;
  renderizarElegirColeccion(obtenerColecciones());      
  modalAgregarColeccion.hidden = false;
};

const cerrarAgregarColeccion = () => {
  modalAgregarColeccion.hidden = true;
};

// ElegirColeccion se ejecuta al hacer click en una carpetita del pop up.
// Desmarca todas y marca solo la tocada, guarda su nombre en coleccionElegida,
// activa el botón de confirmar con el texto "agregar a [nombre]" y oculta el error si habia uno.
const elegirColeccion = (carpeta) => {
  document.querySelectorAll(".carpeta-elegir").forEach((c) => c.classList.remove("seleccionada"));
  carpeta.classList.add("seleccionada");

  coleccionElegida = carpeta.dataset.nombre;
  botonConfirmarAgregar.disabled = false;                               
  botonConfirmarAgregar.textContent = `Agregar a ${coleccionElegida}`;  
  errorAgregarColeccion.hidden = true;
};

botonCerrarAgregarColeccion.addEventListener("click", cerrarAgregarColeccion);

modalAgregarColeccion.addEventListener("click", (evento) => {
  if (evento.target === modalAgregarColeccion) cerrarAgregarColeccion(); //click en el fondo cierra el pop up
});

// Confirmar: agrega la obra abierta a la colección elegida.
// Si ya estaba, muestra el error y no cierra el pop up.
botonConfirmarAgregar.addEventListener("click", () => {
  const seAgrego = agregarObraAColeccion(coleccionElegida, obraActual); 

  if (seAgrego === false) {
    errorAgregarColeccion.textContent = `Esta obra ya está en ${coleccionElegida}.`;
    errorAgregarColeccion.hidden = false;
    return;
  }

  renderizarColecciones(obtenerColecciones()); // redibujamos Mis colecciones
  cerrarAgregarColeccion();
});

// "Crear nueva colección" desde este pop up: abre el formulario y deja marcado
// que al crearla hay que agregarle la obra abierta.
let agregarAlCrear = false;   // true solo cuando el formulario se abrió desde "Agregar a colección"

const botonNuevaDesdeAgregar = document.getElementById("boton-nueva-desde-agregar");

botonNuevaDesdeAgregar.addEventListener("click", () => {
  abrirNuevaColeccion();
  agregarAlCrear = true;
});


//POP UP VER COLECCIÓN: abre la carpeta con las obras guardadas
const modalVerColeccion = document.getElementById("modal-ver-coleccion");
const botonCerrarVerColeccion = document.getElementById("boton-cerrar-ver-coleccion");

const abrirVerColeccion = (nombre, color) => {
  renderizarVerColeccion(obtenerColeccion(nombre), color);
  modalVerColeccion.hidden = false;
};

const cerrarVerColeccion = () => {
  modalVerColeccion.hidden = true;
};

botonCerrarVerColeccion.addEventListener("click", cerrarVerColeccion);

modalVerColeccion.addEventListener("click", (evento) => {
  if (evento.target === modalVerColeccion) cerrarVerColeccion(); //click en el fondo cierra
});


// ---------- NAV: INICIO Y MIS COLECCIONES ----------
/* Los dos botones del nav con data-vista mueven la página hasta su sección. */
const botonesVista = document.querySelectorAll(".boton-nav[data-vista]"); /* solo Inicio y Mis colecciones tienen data-vista */
const seccionColecciones = document.querySelector(".seccion-colecciones");

botonesVista.forEach((boton) => {
  boton.addEventListener("click", () => {
    if (boton.dataset.vista === "explorar") {
      window.scrollTo({ top: 0, behavior: "smooth" }); /* sube hasta arriba de todo, con animación suave */
    } else if (boton.dataset.vista === "colecciones") {
      seccionColecciones.scrollIntoView({ behavior: "smooth", block: "start" }); /* baja hasta que la sección quede arriba de la pantalla */
    }

    botonesVista.forEach((b) => b.classList.remove("activo")); /* sacamos el negro a todos... */
    boton.classList.add("activo");                             /* ...y se lo ponemos al que se apretó */
  });
});

// ---------- BUSCADOR ----------
const formularioBusqueda = document.getElementById("formulario-busqueda");
const campoBusqueda = document.getElementById("campo-busqueda");

formularioBusqueda.addEventListener("submit", (evento) => {
  evento.preventDefault();                        /* evita que la página se recargue */
  const texto = campoBusqueda.value.trim();       /* lo que escribió el usuario, sin espacios sobrantes */
  if (texto === "") return;                       /* si no escribió nada, no hace nada */
  buscar(texto);
});

// ---------- SCROLL HORIZONTAL CON LA RUEDA DEL MOUSE ----------
/* La rueda del mouse scrollea hacia abajo por defecto. Acá la "traducimos" a scroll hacia los costados. */
const galeria = document.getElementById("galeria-obras");

galeria.addEventListener("wheel", (evento) => {
  /* El mouse manda movimiento vertical (deltaY). El trackpad puede mandar vertical
     u horizontal (deltaX). Usamos el que sea más grande. */
  const delta = Math.abs(evento.deltaX) > Math.abs(evento.deltaY) ? evento.deltaX : evento.deltaY;
  if (delta === 0) return;

  const alInicio = galeria.scrollLeft === 0;
  const alFinal = galeria.scrollLeft + galeria.clientWidth >= galeria.scrollWidth - 1;

  // Si ya llegamos a un borde, dejamos que la página scrollee normal (para llegar a "Mis colecciones")
  if ((delta > 0 && alFinal) || (delta < 0 && alInicio)) return;

  evento.preventDefault(); // cancela el scroll por defecto
  galeria.scrollLeft += delta; // y mueve la galería hacia el costado
}, { passive: false });

// ---------- CARGA AUTOMÁTICA AL ACERCARSE AL FINAL ----------
/* Cuando falta menos de una pantalla para llegar al final de la galería, pedimos más obras.
   Así se cargan ANTES de que llegues al borde y nunca ves el espacio vacío del final. */
galeria.addEventListener("scroll", () => {
  const faltaParaElFinal = galeria.scrollWidth - (galeria.scrollLeft + galeria.clientWidth);
  if (faltaParaElFinal < galeria.clientWidth) cargarMasObras();
});

// ---------- LLENAR LA PANTALLA ----------
/* Si las obras no alcanzan a llenar el ancho, no hay scroll y la carga automática nunca se dispara.
   Pedimos páginas hasta que la galería sea más ancha que la pantalla. */
const llenarGaleria = async () => {
  while (galeria.scrollWidth <= galeria.clientWidth && paginaActual < totalPaginas) {
    const paginaAntes = paginaActual;
    await cargarMasObras();
    if (paginaActual === paginaAntes) break; /* si la carga falló, cortamos para no repetir para siempre */
  }
};

// ---------- Arranque ----------
cargarGaleriaInicial();
renderizarMenuFiltros();
renderizarColecciones(obtenerColecciones());