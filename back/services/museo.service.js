import { traerDelMuseo } from "../repositories/museo.repository.js"

const API = "https://api.artic.edu"          // datos:    /api/v1/...
const IMAGENES = "https://www.artic.edu"     // imágenes: /iiif/2/...

// CREA UN ERROR CON CODIGO
function errorCon(status, mensaje) {
    const error = new Error(mensaje)
    error.status = status
    return error
}

// DECIDE A QUE DIRECCION DEL MUSEO IR Y PIDE LOS DATOS
export async function obtenerDelMuseo(ruta) { /* recibe lo que pidió el front */
    let destino = null
    if (ruta.startsWith("/api/v1/")) {
        destino = API + ruta
    }
    if (ruta.startsWith("/iiif/2/")) {
        destino = IMAGENES + ruta
    }
    if (!destino) {
        throw errorCon(404, "Esa ruta no existe en el museo")
    }

    try {
        return await traerDelMuseo(destino)
    } catch (error) {
        throw errorCon(502, "No se pudo conectar con el museo")
    }
} /* Este decide a donde ir y qué rechazar */