import { BACK_URL } from "./config.js"

// ARMA LOS HEADERS CON EL TOKEN (uso interno, no se exporta)
function headers(token) {
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    }
}

// LISTAR LAS COLECCIONES DEL USUARIO
export async function obtenerColecciones(token) {
    const respuesta = await fetch(`${BACK_URL}/colecciones`, {
        headers: headers(token)
    })
    const datos = await respuesta.json()
    if (!respuesta.ok) {
        throw new Error(datos.mensaje)
    }
    return datos
}

// cande sumá acá las demás: crear, editar y eliminar colección,  agregar obra, editar comentario y quitar obra