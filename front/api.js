import { BACK_URL } from "./config.js"

// ARMA LOS HEADERS CON EL TOKEN (uso interno, no se exporta)
function headers(token) {
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    }
}

// HACE UN PEDIDO AL BACK Y DEVUELVE LOS DATOS (uso interno, no se exporta)
async function pedirAlBack(metodo, ruta, token, cuerpo) {
    const opciones = { method: metodo, headers: headers(token) }
    if (cuerpo) {
        opciones.body = JSON.stringify(cuerpo)
    }
    const respuesta = await fetch(`${BACK_URL}${ruta}`, opciones)
    const datos = await respuesta.json()
    if (!respuesta.ok) {
        const error = new Error(datos.mensaje)
        error.status = respuesta.status        // guardamos el código (ej. 401) para decidir qué hacer
        throw error
    }
    return datos
}

// COLECCIONES
export function obtenerColecciones(token) { return pedirAlBack("GET", "/colecciones", token) }
export function crearColeccion(token, datos) { return pedirAlBack("POST", "/colecciones", token, datos) }
export function editarColeccion(token, id, datos) { return pedirAlBack("PUT", `/colecciones/${id}`, token, datos) }
export function borrarColeccion(token, id) { return pedirAlBack("DELETE", `/colecciones/${id}`, token) }

// OBRAS DENTRO DE UNA COLECCIÓN
export function agregarObra(token, id, obra) { return pedirAlBack("POST", `/colecciones/${id}/obras`, token, obra) }
export function editarComentario(token, id, idObra, comentario) { return pedirAlBack("PUT", `/colecciones/${id}/obras/${idObra}`, token, { comentario }) }
export function quitarObra(token, id, idObra) { return pedirAlBack("DELETE", `/colecciones/${id}/obras/${idObra}`, token) }

// COLECCIONES DE OTROS USUARIOS
export function obtenerColeccionesDeOtros(token) { return pedirAlBack("GET", "/colecciones/otras", token) }