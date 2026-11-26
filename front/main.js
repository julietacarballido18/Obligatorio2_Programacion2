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
  renderizarOtrasColecciones
} from "./render.js";
import { crearColeccion, obtenerColecciones, agregarObraAColeccion, obtenerColeccion, cargarColecciones, vaciarColecciones, editarColeccion, borrarColeccion, editarComentario, quitarObra, cargarColeccionesDeOtros, obtenerColeccionDeOtro } from "./colecciones.js";
import { login, registrar, estaLogueado, cerrarSesion } from "./auth.js";


// ---------- PAGINACIÓN ----------
let paginaActual = 1;   /* qué página de la API ya cargamos */
let totalPaginas = 1;   /* cuántas páginas hay en total (lo dice la API en "pagination") */

// ---------- AZAR ----------
const MAX_PAGINAS_AZAR = 1000;      /* hasta qué página sorteamos (1000 páginas de 10 = 10.000 obras) */
const paginasVistas = new Set();    /* páginas que ya salieron (un Set no admite repetidos) */

// ELIGE UNA PAGINA AL AZAR QUE TODAVIA NO HAYA SALIDO
const paginaAlAzarNueva = () => {
  const tope = Math.min(MAX_PAGINAS_AZAR, totalPaginas > 1 ? totalPaginas : MAX_PAGINAS_AZAR);
  let pagina;
  do {
    pagina = Math.floor(Math.random() * tope) + 1;    /* un número entre 1 y el tope */
  } while (paginasVistas.has(pagina) && paginasVistas.size < tope);   /* si ya salió, sortea de nuevo */
  paginasVistas.add(pagina);
  return pagina;
};

// MEZCLA UNA LISTA (algoritmo de Fisher-Yates)
const mezclar = (lista) => {
  const copia = [...lista];                           /* copia, para no tocar la original */
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));    /* una posición al azar entre 0 e i */
    [copia[i], copia[j]] = [copia[j], copia[i]];      /* intercambia los dos elementos */
  }
  return copia;
};

let filtroActivo = null; //variable que "recuerda" qué filtro se eligió. null significa que no hay ninguno.
let busquedaActiva = null;
let obraActual = null;   //variable que recuerda que obra esta abierta/selaccionada

// DEJA SOLO LAS OBRAS QUE TIENEN IMAGEN (para la galería de inicio)
const conImagen = (obras) => obras.filter((obra) => obra.image_id);

// ---------- CARGAR INICIAL DE GALERÍA ----------
const cargarGaleriaInicial = async () => {
  mostrarCargando();

  try {
    const respuesta = await obtenerListadoObras(paginaAlAzarNueva()); /* una página al azar */
    renderizarGaleria(mezclar(conImagen(respuesta.data)));            /* sus obras, sin las que no tienen imagen, mezcladas */
    paginaActual = 1;                                                 /* cuántas páginas cargamos */
    totalPaginas = respuesta.pagination.total_pages;                  /* la API nos dice cuántas existen */
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
    } else {                                              /* ninguno: listado general, página al azar */
      respuesta = await obtenerListadoObras(paginaAlAzarNueva());
    }
    let obras = respuesta.data;
    if (!filtroActivo && !busquedaActiva) {   /* solo en la galería de inicio */
      obras = conImagen(obras);
    }
    renderizarGaleria(mezclar(obras), false);
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


// POP UP NUEVA COLECCIÓN (también se usa para EDITAR)
const modalNuevaColeccion = document.getElementById("modal-nueva-coleccion");
const campoNombreColeccion = document.getElementById("campo-nombre-coleccion");
const campoDescripcionColeccion = document.getElementById("campo-descripcion-coleccion");
const errorNuevaColeccion = document.getElementById("error-nueva-coleccion");
const tituloNuevaColeccion = document.getElementById("titulo-nueva-coleccion");
const botonGuardarColeccion = document.getElementById("boton-guardar-coleccion");

let idEditando = null;   // null = está creando una nueva; si tiene un id = está editando esa colección

const abrirNuevaColeccion = () => {
  idEditando = null;
  tituloNuevaColeccion.textContent = "Nueva colección";
  botonGuardarColeccion.textContent = "Crear colección";
  campoNombreColeccion.value = "";
  campoDescripcionColeccion.value = "";
  errorNuevaColeccion.hidden = true;
  modalNuevaColeccion.hidden = false;
};

const cerrarNuevaColeccion = () => {
  modalNuevaColeccion.hidden = true;
  agregarAlCrear = false;      // la próxima vez arranca sin agregar nada
  idEditando = null;           // y sin editar nada
};

const botonAbrirNuevaColeccion = document.getElementById("boton-abrir-nueva-coleccion"); /* "Crear colección" del nav */
const botonMasColeccion = document.getElementById("boton-agregar-coleccion");             /* el "+" de Mis colecciones */
const botonCerrarNuevaColeccion = document.getElementById("boton-cerrar-nueva-coleccion"); /* la ✕ */

botonAbrirNuevaColeccion.addEventListener("click", abrirNuevaColeccion);
botonMasColeccion.addEventListener("click", abrirNuevaColeccion);
botonCerrarNuevaColeccion.addEventListener("click", cerrarNuevaColeccion);

modalNuevaColeccion.addEventListener("click", (evento) => {
  if (evento.target === modalNuevaColeccion) cerrarNuevaColeccion();   //click en el fondo cierra
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
  mostrarMisColecciones();     // trae del back las colecciones de este usuario y las dibuja
};

// PIDE AL BACK LAS COLECCIONES DEL USUARIO Y LAS DIBUJA
const mostrarMisColecciones = async () => {
  try {
    await cargarColecciones();
  } catch (error) {
    manejarErrorColecciones(error);
  }
  renderizarColecciones(obtenerColecciones());
};

// SI EL TOKEN VENCIÓ (401): cierra sesión y vuelve al login. Si es otro error, lo muestra.
const manejarErrorColecciones = (error, parrafo) => {
  if (error.status === 401) {
    cerrarSesion();
    vaciarColecciones();
    renderizarColecciones([]);
    mostrarLogin();
    return;
  }
  if (parrafo) {
    parrafo.textContent = error.message;
    parrafo.hidden = false;
  } else {
    console.error(error);
  }
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

// MOSTRAR / OCULTAR CONTRASEÑA (el ojito)
document.querySelectorAll(".ver-password").forEach((boton) => {
  boton.addEventListener("click", () => {
    const input = boton.previousElementSibling;          // el input que está justo antes del botón
    const estabaOculta = input.type === "password";
    input.type = estabaOculta ? "text" : "password";     // "text" la muestra, "password" la tapa
    boton.classList.toggle("visible", estabaOculta);     // pone o saca la raya del ojo
    boton.setAttribute("aria-label", estabaOculta ? "Ocultar contraseña" : "Mostrar contraseña");
  });
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
  vaciarColecciones();                                       // borra la copia de las colecciones
  renderizarColecciones([]);                                 // y las saca de la pantalla
  mostrarLogin();
});

//CREAR O EDITAR COLECCION (el mismo formulario sirve para las dos cosas)
const formularioNuevaColeccion = document.getElementById("formulario-nueva-coleccion");

formularioNuevaColeccion.addEventListener("submit", async (evento) => {
  evento.preventDefault();                                   //evita que se recargue la pagina al hacer click

  const nombre = campoNombreColeccion.value.trim();          //saca los espacios sobrantes 
  const descripcion = campoDescripcionColeccion.value.trim();

  if (nombre === "") {
    errorNuevaColeccion.textContent = "Ponele un nombre a tu colección."; //nombre es obligatorio
    errorNuevaColeccion.hidden = false;
    return;
  }

  const estabaEditando = idEditando !== null;                // lo guardamos antes de cerrar (cerrar lo pone en null)

  try {
    if (estabaEditando) {
      await editarColeccion(idEditando, { nombre, descripcion }); // PUT /colecciones/:id
    } else {
      await crearColeccion(nombre, descripcion);                  // POST /colecciones
    }
  } catch (error) {
    manejarErrorColecciones(error, errorNuevaColeccion);     // ej: 409, ya existe una con ese nombre
    return;
  }

  if (agregarAlCrear === true) {                              // se abrió desde "Agregar a colección"
    renderizarElegirColeccion(obtenerColecciones());          // redibujamos las carpetitas, ahora con la nueva
    const carpetas = document.querySelectorAll(".carpeta-elegir");
    elegirColeccion(carpetas[carpetas.length - 1]);           // dejamos seleccionada la nueva (es la última)
  }

  if (estabaEditando) {
    redibujarColeccionAbierta();                              // la carpeta abierta muestra el nombre nuevo
  }

  renderizarColecciones(obtenerColecciones());
  cerrarNuevaColeccion();
});
////////////////////////////////
///LISTENERS
/* para no poner un click en cada obra */

//listener de clicks de toda la página: carpetas del cajón, obras de una colección, agregar a colección, carpetitas, opciones de filtro, tarjetas y cerrar modal. Estos elementos los crea el JS después de cargar la página, por eso van acá  no con su propio addEventListener): el repartidor escucha todo el document, así detecta clicks en elementos creados en cualquier momento.

document.addEventListener("click", (evento) => {
  const carpetaOtra = evento.target.closest(".carpeta-otra");
  if (carpetaOtra) {
    abrirColeccionDeOtro(carpetaOtra.dataset.id, carpetaOtra.dataset.color);
    return;
  }

  const carpetaColeccion = evento.target.closest(".carpeta-coleccion");  //carpeta del cajón
  if (carpetaColeccion) {
    abrirVerColeccion(carpetaColeccion.dataset.id, carpetaColeccion.dataset.color);
    return;

  }



  const botonQuitarObra = evento.target.closest(".quitar-obra");                //quitar una obra de la colección
  if (botonQuitarObra) {
    pedirQuitarObra(botonQuitarObra);
    return;
  }

  const abrirObra = evento.target.closest(".abrir-obra");                       //imagen o título de una obra guardada
  if (abrirObra) {
    abrirDetalle(abrirObra.closest(".obra-coleccion").dataset.id);
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

  coleccionElegida = carpeta.dataset.id;                                    // guardamos el id (lo necesita el back)
  botonConfirmarAgregar.disabled = false;
  botonConfirmarAgregar.textContent = `Agregar a ${carpeta.textContent}`;   // el nombre lo sacamos del texto de la carpetita
  errorAgregarColeccion.hidden = true;
};

botonCerrarAgregarColeccion.addEventListener("click", cerrarAgregarColeccion);

modalAgregarColeccion.addEventListener("click", (evento) => {
  if (evento.target === modalAgregarColeccion) cerrarAgregarColeccion(); //click en el fondo cierra el pop up
});

// Confirmar: agrega la obra abierta a la colección elegida.
// Si ya estaba, muestra el error y no cierra el pop up.
botonConfirmarAgregar.addEventListener("click", async () => {
  try {
    await agregarObraAColeccion(coleccionElegida, obraActual);
  } catch (error) {
    manejarErrorColecciones(error, errorAgregarColeccion);
    return;
  }
  renderizarColecciones(obtenerColecciones());
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

let coleccionAbierta = null;   // { id, color } de la colección que está abierta en el pop up

const abrirVerColeccion = (id, color) => {
  coleccionAbierta = { id, color };                       // la recordamos para editar, borrar, comentar y quitar
  renderizarVerColeccion(obtenerColeccion(id), color);   // busca la colección por su id y la dibuja
  reiniciarBorrar();                                      // el botón de borrar arranca sin confirmar
  errorVerColeccion.hidden = true;                        // sin errores viejos
  accionesVerColeccion.hidden = false;                    // en tus colecciones se ven Editar y Borrar
  modalVerColeccion.hidden = false;
};

const cerrarVerColeccion = () => {
  modalVerColeccion.hidden = true;
};

botonCerrarVerColeccion.addEventListener("click", cerrarVerColeccion);

modalVerColeccion.addEventListener("click", (evento) => {
  if (evento.target === modalVerColeccion) cerrarVerColeccion(); //click en el fondo cierra
});

// ---------- ACCIONES DENTRO DE UNA COLECCIÓN ----------
const errorVerColeccion = document.getElementById("error-ver-coleccion");
const botonEditarColeccion = document.getElementById("boton-editar-coleccion");
const botonBorrarColeccion = document.getElementById("boton-borrar-coleccion");

// VUELVE A DIBUJAR LA COLECCIÓN ABIERTA Y "MIS COLECCIONES" (después de un cambio)
const redibujarColeccionAbierta = () => {
  renderizarVerColeccion(obtenerColeccion(coleccionAbierta.id), coleccionAbierta.color);
  renderizarColecciones(obtenerColecciones());
};

// EDITAR: abre el pop up de nueva colección con los datos cargados
botonEditarColeccion.addEventListener("click", () => {
  const coleccion = obtenerColeccion(coleccionAbierta.id);
  abrirNuevaColeccion();                                  // abre el formulario (en modo crear)...
  idEditando = coleccion._id;                             // ...y lo pasamos a modo editar
  campoNombreColeccion.value = coleccion.nombre;          // con los datos actuales ya escritos
  campoDescripcionColeccion.value = coleccion.descripcion;
  tituloNuevaColeccion.textContent = "Editar colección";
  botonGuardarColeccion.textContent = "Guardar cambios";
});

// BORRAR: el primer click pide confirmación, el segundo borra
const reiniciarBorrar = () => {
  botonBorrarColeccion.classList.remove("confirmar");
  botonBorrarColeccion.textContent = "Borrar colección";
};

botonBorrarColeccion.addEventListener("click", async () => {
  if (!botonBorrarColeccion.classList.contains("confirmar")) {   // primer click: todavía no confirmó
    botonBorrarColeccion.classList.add("confirmar");
    botonBorrarColeccion.textContent = "¿Seguro? Tocá de nuevo";
    return;
  }
  try {
    await borrarColeccion(coleccionAbierta.id);               // DELETE /colecciones/:id
  } catch (error) {
    manejarErrorColecciones(error, errorVerColeccion);
    return;
  }
  cerrarVerColeccion();
  renderizarColecciones(obtenerColecciones());
});

// COMENTAR: se guarda solo cuando terminás de escribir y hacés click afuera del cuadro
document.addEventListener("change", async (evento) => {
  if (!evento.target.classList.contains("comentario-obra")) return;   // solo los comentarios
  const tarjeta = evento.target.closest(".obra-coleccion");
  const estado = tarjeta.querySelector(".estado-comentario");
  try {
    await editarComentario(coleccionAbierta.id, tarjeta.dataset.id, evento.target.value);  // PUT .../obras/:idObra
  } catch (error) {
    manejarErrorColecciones(error, errorVerColeccion);
    return;
  }
  estado.textContent = "Comentario guardado ✓";
  setTimeout(() => { estado.textContent = ""; }, 2000);
});

// QUITAR: la ✕ abre un pop up para confirmar
const modalConfirmar = document.getElementById("modal-confirmar");
const textoConfirmar = document.getElementById("texto-confirmar");
let obraAQuitar = null;   // id de la obra que se quiere quitar, mientras el pop up está abierto

const pedirQuitarObra = (boton) => {
  const tarjeta = boton.closest(".obra-coleccion");
  obraAQuitar = tarjeta.dataset.id;
  const titulo = tarjeta.querySelector(".abrir-obra p").textContent;
  textoConfirmar.textContent = `¿Querés quitar "${titulo}" de esta colección?`;
  modalConfirmar.hidden = false;
};

const cerrarConfirmar = () => {
  modalConfirmar.hidden = true;
  obraAQuitar = null;
};

document.getElementById("boton-cancelar-confirmar").addEventListener("click", cerrarConfirmar);
modalConfirmar.addEventListener("click", (evento) => {
  if (evento.target === modalConfirmar) cerrarConfirmar();   // click en el fondo cancela
});

document.getElementById("boton-aceptar-confirmar").addEventListener("click", async () => {
  try {
    await quitarObra(coleccionAbierta.id, obraAQuitar);      // DELETE .../obras/:idObra
  } catch (error) {
    cerrarConfirmar();
    manejarErrorColecciones(error, errorVerColeccion);
    return;
  }
  cerrarConfirmar();
  redibujarColeccionAbierta();                                // la tarjeta desaparece
});

// ---------- VER COLECCIONES DE OTROS USUARIOS ----------
const accionesVerColeccion = document.querySelector(".acciones-ver-coleccion");
const modalOtrasColecciones = document.getElementById("modal-otras-colecciones");
const errorOtrasColecciones = document.getElementById("error-otras-colecciones");

// ABRE EL POP UP Y PIDE AL BACK LAS COLECCIONES DE LOS DEMÁS
document.getElementById("boton-ver-colecciones").addEventListener("click", async () => {
  errorOtrasColecciones.hidden = true;
  modalOtrasColecciones.hidden = false;                   // se abre enseguida y se llena cuando llegan los datos
  try {
    renderizarOtrasColecciones(await cargarColeccionesDeOtros());
  } catch (error) {
    renderizarOtrasColecciones([]);
    manejarErrorColecciones(error, errorOtrasColecciones); // ej: 401 → vuelve al login
  }
});

const cerrarOtrasColecciones = () => {
  modalOtrasColecciones.hidden = true;
};

document.getElementById("boton-cerrar-otras-colecciones").addEventListener("click", cerrarOtrasColecciones);
modalOtrasColecciones.addEventListener("click", (evento) => {
  if (evento.target === modalOtrasColecciones) cerrarOtrasColecciones();   //click en el fondo cierra
});

// ABRE UNA COLECCIÓN DE OTRO, SOLO PARA MIRAR
const abrirColeccionDeOtro = (id, color) => {
  coleccionAbierta = null;                                // no es tuya: no se puede editar
  renderizarVerColeccion(obtenerColeccionDeOtro(id), color, true);   // true = solo lectura
  accionesVerColeccion.hidden = true;                     // sin Editar ni Borrar
  errorVerColeccion.hidden = true;
  modalVerColeccion.hidden = false;
};

// ---------- VOLVER AL INICIO: galería nueva, sin búsqueda ni filtro ----------
const volverAlInicio = () => {
  filtroActivo = null;           // apaga el filtro, si había
  busquedaActiva = null;         // apaga la búsqueda, si había
  campoBusqueda.value = "";      // vacía el buscador
  galeria.scrollLeft = 0;        // la galería vuelve al principio (a la izquierda)
  cargarGaleriaInicial();        // pide una tanda nueva de obras al azar
};

// ---------- NAV: INICIO Y MIS COLECCIONES ----------
/* Los dos botones del nav con data-vista mueven la página hasta su sección. */
const botonesVista = document.querySelectorAll(".boton-nav[data-vista]"); /* solo Inicio y Mis colecciones tienen data-vista */
const seccionColecciones = document.querySelector(".seccion-colecciones");

botonesVista.forEach((boton) => {
  boton.addEventListener("click", () => {
    if (boton.dataset.vista === "explorar") {
      window.scrollTo({ top: 0, behavior: "smooth" }); /* sube hasta arriba de todo, con animación suave */
      volverAlInicio();                                /* y recarga la galería con obras nuevas */
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

// LUPA: en celular la barra arranca cerrada y se despliega al tocar la lupa
const lupa = formularioBusqueda.querySelector(".icono-busqueda");

lupa.addEventListener("click", () => {
  if (!formularioBusqueda.classList.contains("abierta")) {   // estaba cerrada → la abre
    formularioBusqueda.classList.add("abierta");
    campoBusqueda.focus();                                    // lista para escribir
  } else if (campoBusqueda.value.trim() !== "") {            // abierta y con texto → busca
    formularioBusqueda.requestSubmit();
  } else {                                                    // abierta y vacía → la cierra
    formularioBusqueda.classList.remove("abierta");
  }
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

if (estaLogueado()) {
  mostrarMisColecciones();     // si ya había sesión (por ejemplo, después de un F5), trae sus colecciones del back
} else {
  renderizarColecciones([]);   // si no, "Mis colecciones" arranca vacío
}