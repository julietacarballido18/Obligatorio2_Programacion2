// Filtros preestablecidos del menú "Filtros".
// Cada categoría filtra por UN campo de la API; cada opción es un valor exacto de ese campo.

export const CATEGORIAS_FILTRO = [ //array de objetos. Cada objeto es una categoría del menú.
  {
    nombre: "Tipo de obra",
    campo: "artwork_type_title.keyword",  //campo de la API por el que filtra esa categoría. Va en la categoría y no en cada opción porque todas las opciones de una categoría filtran por el mismo campo.
    opciones: [
      { texto: "Pinturas", valor: "Painting" }, //valor es lo que se manda a la API, en inglés y escrito exacto.
      { texto: "Esculturas", valor: "Sculpture" },
      { texto: "Grabados", valor: "Print" },
      { texto: "Fotografías", valor: "Photograph" },
    ],
  },
  {
    nombre: "Área artística",
    campo: "department_title.keyword",
    opciones: [
      { texto: "Arte europeo", valor: "Painting and Sculpture of Europe" },
      { texto: "Arte contemporáneo", valor: "Contemporary Art" },
      { texto: "Arte asiático", valor: "Arts of Asia" },
      { texto: "Arte americano", valor: "Arts of the Americas" },
      { texto: "Arte africano", valor: "Arts of Africa" },
      { texto: "Arte antiguo mediterráneo y bizantino", valor: "Arts of Greece, Rome, and Byzantium" },
    ],
  },
  {
    nombre: "Movimiento",
    campo: "style_title.keyword",
    opciones: [
      { texto: "Impresionismo", valor: "Impressionism" },
      { texto: "Cubismo", valor: "Cubism" },
      { texto: "Barroco", valor: "Baroque" },
      { texto: "Egipto antiguo", valor: "Egypt", campo: "place_of_origin.keyword" },
      { texto: "Renacimiento", valor: "Renaissance" },
      { texto: "Surrealismo", valor: "Surrealism" },
      { texto: "Posimpresionismo", valor: "Post-Impressionism" },
      { texto: "Rococó", valor: "Rococo" },
      { texto: "Art Nouveau", valor: "Art Nouveau" },
    ],
  },
];

//identificar elementos del HTML
const btnFiltros = document.getElementById("boton-alternar-filtros");
const menuFiltros = document.getElementById("menu-filtros");
const listaCategorias = document.getElementById("lista-categorias");
const listaOpciones = document.getElementById("lista-opciones");

//funcion renderizar menu con categorias iniciales
export const renderizarMenuFiltros = () => {
  CATEGORIAS_FILTRO.forEach((categoria) => {
    const item = document.createElement("li");
    const btn = document.createElement("button");
    btn.textContent = categoria.nombre;
    btn.className = "boton-categoria";

    item.appendChild(btn);
    listaCategorias.appendChild(item);

    btn.addEventListener("click", () => {
      mostrarOpciones(categoria);
    });
  });

  btnFiltros.addEventListener("click", desplegarFiltros);
};

//funcion mostrar filtros 
export const desplegarFiltros = () => {
  if (menuFiltros.hidden === true) {
    menuFiltros.hidden = false;
  } else {
    menuFiltros.hidden = true;
    listaOpciones.innerHTML = "";
  }
};

//funcion renderizar filtros con categorias secundarias
const mostrarOpciones = (categoria) => {
  listaOpciones.innerHTML = "";

  categoria.opciones.forEach((opcion) => {
    const item = document.createElement("li");
    const btn = document.createElement("button");
    btn.textContent = opcion.texto;
    btn.className = "boton-opcion";
    btn.dataset.campo = opcion.campo ?? categoria.campo;
    btn.dataset.valor = opcion.valor;

    item.appendChild(btn);
    listaOpciones.appendChild(item);
  });
};