// Funciones que transforman datos (obras) en HTML. 

import { construirUrlImagen } from "./artic.js";

const galeria = document.getElementById("galeria-obras");
const estadoGaleria = document.getElementById("estado-galeria");

const idsMostrados = new Set(); /* guarda los id de las obras que ya están en la galería (un Set no admite repetidos) */

/* Arma el recuadro que se ve cuando una obra no tiene imagen:
   lo pinta con el color representativo de la obra (si la API lo trae) */
const crearSinImagen = (obra, texto) => {
  const vacio = document.createElement("div");
  vacio.className = "sin-imagen";
  vacio.textContent = texto;
  if (obra.color) {
    vacio.style.background = `hsl(${obra.color.h}, ${obra.color.s}%, ${obra.color.l}%)`; /* el color de la obra */
    vacio.style.color = obra.color.l < 50 ? "#fff" : "#000";                              /* texto claro sobre fondo oscuro, y al revés */
  }
  return vacio;
};

const crearImagenObra = (obra, clase = "") => { /* Crea la imagen de una obra. Si la real falla, usa la miniatura borrosa de la API. */
  const urlImagen = construirUrlImagen(obra.image_id, obra.thumbnail?.width); /* por nuestro back */
  const respaldo = obra.thumbnail?.lqip; /* miniatura borrosa de respaldo */

  if (!urlImagen && !respaldo) { /* sin imagen ni miniatura: recuadro con el color de la obra */
    return crearSinImagen(obra, "Sin imagen");
  }

  const img = document.createElement("img");
  img.loading = "lazy";               // pide la imagen recién cuando está cerca de verse
  img.alt = obra.title ?? "Obra sin título";
  if (clase) img.className = clase;
  img.src = urlImagen ?? respaldo;

  img.addEventListener("error", () => { /* Si la imagen no carga, probamos con la miniatura y si no, el color */
    if (respaldo && img.src !== respaldo) {
      img.src = respaldo;
    } else {
      img.replaceWith(crearSinImagen(obra, "Imagen no disponible"));
    }
  });

  return img;
};

/* Elige cuántas celdas del mosaico ocupa la obra, según la forma de su imagen. */
const elegirTamano = (obra, indice) => {
  const ancho = obra.thumbnail?.width;
  const alto = obra.thumbnail?.height;

  if (indice % 7 === 0) return "grande";   // cada 7 obras, una grande (2x2) para dar variedad
  if (!ancho || !alto) return "";

  const proporcion = ancho / alto;         // > 1 es horizontal, < 1 es vertical
  if (proporcion > 1.4) return "ancha";    // muy horizontal: 2 celdas de ancho
  if (proporcion < 0.7) return "alta";     // muy vertical: 2 celdas de alto
  return "";                               // más o menos cuadrada: 1 celda
};

const crearTarjetaObra = (obra, indice) => {
  const tarjeta = document.createElement("article");
  tarjeta.className = `tarjeta-obra ${elegirTamano(obra, indice)}`;
  tarjeta.dataset.id = obra.id;

  /* Título de la obra, que se superpone abajo a la izquierda de la imagen */
  const titulo = document.createElement("p");
  titulo.className = "titulo-tarjeta";
  titulo.textContent = obra.title ?? "Sin título"; /* textContent: el texto de la API no se interpreta como HTML */

  tarjeta.append(crearImagenObra(obra), titulo); // append -> agrega imagen y título como hijos de la tarjeta
  return tarjeta;
};

export const renderizarGaleria = (obras, reemplazar = true) => { /* obras -> array de obras que llega de la API */
  if (reemplazar) {
    galeria.innerHTML = ""; /* Por si hacemos una busqueda, que se borre lo anterior */
    idsMostrados.clear();   /* galería nueva: olvidamos las obras que se mostraron antes */
  }

  if (obras.length === 0 && reemplazar) { /* Por si la API devuelve un array vacio y estamos en una busqueda mandamos mensaje */
    estadoGaleria.textContent = "No se encontraron obras con esos criterios.";
    return;
  }

  estadoGaleria.textContent = "";

  /* Igual que en el ejemplo de la PokeAPI, por cada elemento del array, creamos su tarjeta y la agregamos directo al contenedor real de la página. */
  const obrasNuevas = obras.filter((obra) => !idsMostrados.has(obra.id)); /* nos quedamos solo con las que NO se mostraron todavía */

  obrasNuevas.forEach((obra, indice) => { /* indice = posición de la obra en el array (0, 1, 2...) */
    idsMostrados.add(obra.id); /* la anotamos como mostrada, así no se repite en la próxima página */
    const tarjeta = crearTarjetaObra(obra, indice);
    galeria.appendChild(tarjeta);
  });
};

export const mostrarCargando = () => {
  estadoGaleria.textContent = "Cargando obras...";
};

export const mostrarError = (mensaje) => {
  estadoGaleria.textContent = mensaje; /* esa es la funcion que llamamos a dentro de un catch por si salta error */
};

export const renderizarDetalle = (obra) => { /* arma el modal de las obras -> MODAL = POP UP */
  const contenedor = document.getElementById("contenido-detalle");

  /* .detalle-layout = contenedor de dos columnas
     .detalle-imagen = columna izquierda (la imagen se agrega abajo con JS)
     .detalle-info   = columna derecha (título, autor, metadatos, botón) */
  contenedor.innerHTML = /* insertamos html */ ` 
    <button class="cerrar-modal" id="boton-cerrar-modal">✕</button>

    <div class="detalle-layout">
      <div class="detalle-imagen"></div>

      <div class="detalle-info">
        <h2>${obra.title ?? "Sin título"}</h2>
        <p class="subtitulo-tarjeta">${obra.artist_display ?? "Autor desconocido"}</p>

        <dl class="metadatos-detalle">
          <dt>Fecha</dt>
          <dd>${obra.date_display ?? "—"}</dd>

          <dt>Técnica / material</dt>
          <dd>${obra.medium_display ?? "—"}</dd>

          <dt>Dimensiones</dt>
          <dd>${obra.dimensions ?? "—"}</dd>

          <dt>Departamento</dt>
          <dd>${obra.department_title ?? "—"}</dd>
        </dl>

        ${obra.short_description ? `<p class="descripcion-detalle">${obra.short_description}</p>` : ""}

        <button id="boton-agregar-a-coleccion" data-id="${obra.id}">
          Agregar a una colección
        </button>
      </div>
    </div>
  `;

  /* agrega la imagen (o su respaldo) dentro de la columna izquierda */
  contenedor.querySelector(".detalle-imagen").append(crearImagenObra(obra, "imagen-detalle"));
};


//renderizar MIS COLECCIONES
const pilaColecciones = document.getElementById("pila-colecciones");

export const renderizarColecciones = (colecciones) => {
  pilaColecciones.innerHTML = "";

 if (colecciones.length === 0) {
  const mensaje = document.createElement("p");
  mensaje.className = "mensaje-sin-colecciones";
  mensaje.textContent = "Aún no tenés colecciones creadas.";
  pilaColecciones.appendChild(mensaje);
  return;
}

  //por cada coleccion crear una carpeta y una pestaña
  colecciones.forEach((coleccion, indice) => {
    const carpeta = document.createElement("article");
    //Para cuestiones de estilo: 4 posibles posiciones para la parte de la pestaña de la carpeta, para que no queden todas iguales
    carpeta.className = `carpeta-coleccion posicion-${indice % 4} color-${indice % 6}`;

    carpeta.dataset.id = coleccion._id;   //para saber que colección abrir al hacer click

    carpeta.dataset.color = indice % 6;            //para que la carpeta abierta tenga el mismo color

    //para cuestiones de estilo y css
    const profundidad = colecciones.length - 1 - indice;            /* 0 = la de adelante, cuanto más grande, más atrás */
    carpeta.style.width = `calc(100% - ${profundidad * 14}px)`;     /* cada una 14px más angosta que la de adelante */
  //------------------------

    const pestana = document.createElement("p");
    pestana.className = "pestana-carpeta";
    pestana.textContent = `♥ ${coleccion.nombre}`;

    carpeta.appendChild(pestana);
    pilaColecciones.appendChild(carpeta);
  });
};

//POP UP AGREGAR OBRA A COLECCION
const grillaElegirColeccion = document.getElementById("grilla-elegir-coleccion");

export const renderizarElegirColeccion = (colecciones) => {
  grillaElegirColeccion.innerHTML = "";              

  if (colecciones.length === 0) {                    
    const mensaje = document.createElement("p");
    mensaje.className = "mensaje-sin-colecciones";
    mensaje.textContent = "Aún no tenés colecciones creadas.";
    grillaElegirColeccion.appendChild(mensaje);
    return;
  }

  colecciones.forEach((coleccion) => {               //por cada coleccion creo un boton / carpetita
    const carpeta = document.createElement("button");
    carpeta.type = "button";
    carpeta.className = "carpeta-elegir";
    carpeta.textContent = coleccion.nombre;
    carpeta.dataset.id = coleccion._id;      //carga dinamica del nombre de las colecciones
    grillaElegirColeccion.appendChild(carpeta);
  });
};

//POP UP VER COLECCION: llena la carpeta abierta con los datos y las obras de la colección
const carpetaAbierta = document.getElementById("carpeta-abierta");
const pestanaAbierta = document.getElementById("pestana-abierta");
const tituloVerColeccion = document.getElementById("titulo-ver-coleccion");
const descripcionVerColeccion = document.getElementById("descripcion-ver-coleccion");
const grillaObrasColeccion = document.getElementById("grilla-obras-coleccion");

export const renderizarVerColeccion = (coleccion, color, soloLectura = false) => {
  carpetaAbierta.className = `carpeta-abierta color-${color}`;   //mismo color que en el cajón
    pestanaAbierta.textContent = soloLectura
    ? `♥ ${coleccion.nombre} · de ${coleccion.usuario?.nombre ?? "otro usuario"}`   //de otro: dice de quién es
    : `♥ ${coleccion.nombre}`;
  tituloVerColeccion.textContent = coleccion.nombre;
  descripcionVerColeccion.textContent = coleccion.descripcion;   //si quedó vacía, no se ve nada
  grillaObrasColeccion.innerHTML = "";

  if (coleccion.obras.length === 0) {
    const mensaje = document.createElement("p");
    mensaje.className = "mensaje-sin-colecciones";
    mensaje.textContent = "Todavía no hay obras en esta colección.";
    grillaObrasColeccion.appendChild(mensaje);
    return;
  }

  coleccion.obras.forEach((obra, indice) => {        //una tarjetita por obra guardada
    const tarjeta = document.createElement("article");
    tarjeta.className = "obra-coleccion";
    tarjeta.dataset.id = obra.id;                    //id de la obra (para el detalle, comentar y quitar)
    tarjeta.style.setProperty("--orden", indice);    //para que aparezcan una después de la otra (CSS)

    // cruz para quitar la obra (arriba a la derecha)
    const quitar = document.createElement("button");
    quitar.type = "button";
    quitar.className = "quitar-obra";
    quitar.setAttribute("aria-label", "Quitar obra de la colección");
    quitar.textContent = "✕";

    // imagen + título: al tocarlos se abre el detalle
    const abrir = document.createElement("div");
    abrir.className = "abrir-obra";
    const titulo = document.createElement("p");
    titulo.textContent = obra.title ?? "Sin título";
    abrir.append(crearImagenObra(obra), titulo);

    // autor y año
    const datos = document.createElement("p");
    datos.className = "datos-obra";
    datos.textContent = [obra.artist_display, obra.date_display].filter(Boolean).join(" · ");

    // comentario: se guarda solo al salir del cuadro de texto
    const comentario = document.createElement("textarea");
    comentario.className = "comentario-obra";
    comentario.placeholder = "Agregá un comentario…";
    comentario.value = obra.comentario ?? "";

    // aviso de "guardado" (vacío hasta que se guarda)
    const estado = document.createElement("p");
    estado.className = "estado-comentario";

       if (soloLectura) {                               //colección de otro: sin ✕ ni cuadro para escribir
      tarjeta.append(abrir, datos);
      if (obra.comentario) {                         //si el dueño dejó comentario, se muestra como texto
        const nota = document.createElement("p");
        nota.className = "comentario-lectura";
        nota.textContent = `“${obra.comentario}”`;
        tarjeta.append(nota);
      }
    } else {
      tarjeta.append(quitar, abrir, datos, comentario, estado);
    }
    grillaObrasColeccion.appendChild(tarjeta);
  });
};

//POP UP COLECCIONES DE OTROS USUARIOS
const grillaOtrasColecciones = document.getElementById("grilla-otras-colecciones");

export const renderizarOtrasColecciones = (colecciones) => {
  grillaOtrasColecciones.innerHTML = "";                 //vacía la grilla antes de dibujar

  if (colecciones.length === 0) {                       //nadie más tiene colecciones con obras
    const mensaje = document.createElement("p");
    mensaje.className = "mensaje-sin-colecciones";
    mensaje.textContent = "Todavía no hay colecciones de otros usuarios.";
    grillaOtrasColecciones.appendChild(mensaje);
    return;
  }

  colecciones.forEach((coleccion, indice) => {
    const carpeta = document.createElement("button");
    carpeta.type = "button";
    carpeta.className = "carpeta-elegir carpeta-otra";   //mismo estilo que las carpetitas de "Agregar a colección"
    carpeta.dataset.id = coleccion._id;                  //para saber cuál abrir al tocarla
    carpeta.dataset.color = indice % 6;                  //un color de la paleta (hay 6)

    const nombre = document.createElement("span");
    nombre.textContent = coleccion.nombre;

    const detalle = document.createElement("small");
    const dueno = coleccion.usuario?.nombre ?? "otro usuario";
    const cantidad = coleccion.obras.length;
    detalle.textContent = `de ${dueno} · ${cantidad} ${cantidad === 1 ? "obra" : "obras"}`;

    carpeta.append(nombre, detalle);
    grillaOtrasColecciones.appendChild(carpeta);
  });
};