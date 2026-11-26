import { traerDelMuseo } from "../repositories/museo.repository.js"

const API = "https://api.artic.edu"          // datos:    /api/v1/...
const IMAGENES = "https://www.artic.edu"     // imágenes: /iiif/2/...

// CREA UN ERROR CON CODIGO
function errorCon(status, mensaje) {
    const error = new Error(mensaje)
    error.status = status
    return error
}

// ---------- CACHÉ: lo que ya le pedimos al museo, guardado un rato ----------
let cache = {}                              // dirección → { respuesta, hora }
const DURACION_CACHE = 10 * 60 * 1000       // 10 minutos, en milisegundos
const MAX_CACHE = 300                       // cuántas respuestas guardamos como máximo

// DECIDE A QUE DIRECCION DEL MUSEO IR Y PIDE LOS DATOS (o los toma de la caché)
export async function obtenerDelMuseo(ruta) {
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

    // ¿Ya lo pedimos hace poco? Devolvemos lo guardado, sin molestar al museo
    const guardado = cache[destino]
    if (guardado && Date.now() - guardado.hora < DURACION_CACHE) {
        return guardado.respuesta
    }

    let respuesta
    try {
        respuesta = await traerDelMuseo(destino)
    } catch (error) {
        throw errorCon(502, "No se pudo conectar con el museo")
    }

    // Solo guardamos las respuestas buenas (200)
    if (respuesta.status === 200) {
        if (Object.keys(cache).length >= MAX_CACHE) {
            cache = {}                      // si se llenó, la vaciamos y empieza de nuevo
        }
        cache[destino] = { respuesta: respuesta, hora: Date.now() }
    }
    return respuesta
}