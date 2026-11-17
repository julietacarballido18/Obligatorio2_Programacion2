// Todo pasa por el proxy local (servidor-proxy.js), no directo al museo.
import { BACK_URL } from "./config.js";
const PROXY_LOCAL = `${BACK_URL}/museo`;

const BASE_URL = `${PROXY_LOCAL}/api/v1`;

const LIST_FIELDS = "id,title,date_display,artist_display,image_id,thumbnail,color"; /* Campos que pedimos siempre en el listado, para no traer de más. */

// ---------- CAMPOS DETALLE DE OBRA ----------
const DETAIL_FIELDS =
  "id,title,date_display,artist_display,image_id,thumbnail,color,medium_display," +
  "dimensions,department_title,short_description";

// ---------- SERVIDOR DE IMÁGENES ----------
/* El servidor de imágenes del museo tiene un filtro anti-bots que a veces rechaza las imágenes (403).
   Las pedimos a través de nuestro proxy (Cloudflare Worker), que agrega la cabecera AIC-User-Agent.
   Si PROXY_IMAGENES queda vacío, se piden directo al museo. */
const PROXY_IMAGENES = PROXY_LOCAL;
const IMAGENES_URL = PROXY_IMAGENES || "https://www.artic.edu";

// ---------- PEDIDO A LA API ----------
/* Sin Referer y con la cabecera con la que AIC pide identificarse.
   Si la consola muestra un error de CORS, sacar el objeto headers y dejar solo referrerPolicy. */
const pedir = (url) => fetch(url, {
  referrerPolicy: "no-referrer"
});

// ---------- ARMAR URL IMAGEN A PARTIR DEL ID ----------
export const construirUrlImagen = (imageId, anchoOriginal) => {
  if (!imageId) return null; /* Si la obra no tiene image_id, devuelve null. */
  /* El servidor no agranda imágenes: si la original mide menos de 843px y pedimos 843, responde 403.
     Por eso pedimos 843 o el ancho original, el que sea más chico. */
  const ancho = anchoOriginal ? Math.min(843, anchoOriginal) : 843;
  return `${IMAGENES_URL}/iiif/2/${imageId}/full/${ancho},/0/default.jpg`;
};

// ---------- LISTADO GENERAL DE OBRAS ----------
export const obtenerListadoObras = async (page = 1) => {
  const url = `${BASE_URL}/artworks?page=${page}&limit=10&fields=${LIST_FIELDS}`; /* limit=10: 10 obras por página */
  const respuesta = await pedir(url);

  if (!respuesta.ok) {
    throw new Error(`Error al obtener el listado de obras (${respuesta.status})`);
  }

  return respuesta.json(); // { data: [...], pagination: {...} }
};

// ---------- DETALLE COMPLETO DE OBRA POR ID ----------
export const obtenerDetalleObra = async (id) => {
  const url = `${BASE_URL}/artworks/${id}?fields=${DETAIL_FIELDS}`;
  const respuesta = await pedir(url);

  if (!respuesta.ok) {
    throw new Error(`Error al obtener el detalle de la obra ${id} (${respuesta.status})`);
  }

  const json = await respuesta.json();
  return json.data;
};

// ---------- BÚSQUEDA POR TEXTO ----------
export const buscarObras = async (texto, page = 1) => {
  const textoSeguro = encodeURIComponent(texto); /* pasa espacios, tildes y símbolos a un formato seguro para la URL */
  const url = `${BASE_URL}/artworks/search?q=${textoSeguro}&page=${page}&fields=${LIST_FIELDS}`;
  const respuesta = await pedir(url);

  if (!respuesta.ok) {
    throw new Error(`Error al buscar "${texto}" (${respuesta.status})`);
  }

  return respuesta.json(); // { data: [...], pagination: {...} }, igual que el listado
};

// ---------- FILTRO PREESTABLECIDO ----------
export const filtrarObras = async (campo, valor, page = 1) => {
  const valorSeguro = encodeURIComponent(valor); // encodeURI convierte un texto a un formato que se puede poner dentro de una URL sin romperla
  const url = `${BASE_URL}/artworks/search?query[term][${campo}]=${valorSeguro}&page=${page}&limit=10&fields=${LIST_FIELDS}`;
  const respuesta = await pedir(url);

  if (!respuesta.ok) {
    throw new Error(`Error al filtrar por ${campo} = ${valor} (${respuesta.status})`);
  }

  return respuesta.json();
};