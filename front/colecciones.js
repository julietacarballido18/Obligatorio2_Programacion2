// Guarda en memoria las colecciones DEL USUARIO, tal como las devuelve el back.
// Cada cambio se manda primero al back (Atlas) y después se actualiza esta copia.
import * as api from "./api.js";
import { getToken } from "./auth.js";

let colecciones = [];

export const obtenerColecciones = () => colecciones;
export const obtenerColeccion = (id) => colecciones.find((c) => c._id === id);

// PIDE AL BACK LAS COLECCIONES DEL USUARIO
export const cargarColecciones = async () => {
  colecciones = await api.obtenerColecciones(getToken());
};

// VACÍA LA COPIA (al cerrar sesión)
export const vaciarColecciones = () => {
  colecciones = [];
};

// CAMBIA UNA COLECCIÓN DE LA COPIA POR LA VERSIÓN ACTUALIZADA QUE DEVOLVIÓ EL BACK
const reemplazar = (actualizada) => {
  colecciones = colecciones.map((c) => (c._id === actualizada._id ? actualizada : c));
  return actualizada;
};

export const crearColeccion = async (nombre, descripcion) => {
  const nueva = await api.crearColeccion(getToken(), { nombre, descripcion });
  colecciones.push(nueva);
  return nueva;
};

export const editarColeccion = async (id, datos) => reemplazar(await api.editarColeccion(getToken(), id, datos));

export const borrarColeccion = async (id) => {
  await api.borrarColeccion(getToken(), id);
  colecciones = colecciones.filter((c) => c._id !== id);
};

export const agregarObraAColeccion = async (id, obra) => reemplazar(await api.agregarObra(getToken(), id, obra));
export const editarComentario = async (id, idObra, comentario) => reemplazar(await api.editarComentario(getToken(), id, idObra, comentario));
export const quitarObra = async (id, idObra) => reemplazar(await api.quitarObra(getToken(), id, idObra));