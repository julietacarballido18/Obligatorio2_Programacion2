import { BACK_URL } from "./config.js"

// ---------- EL TOKEN SE GUARDA EN localStorage ----------
// (sobrevive a F5, a una pestaña nueva y a cerrar el navegador)

// GUARDA EL TOKEN
function guardarToken(t) {
    localStorage.setItem("token", t)
}

// LEE EL TOKEN (si no hay, devuelve "")
function leerToken() {
    return localStorage.getItem("token") || ""
}

// BORRA EL TOKEN
function borrarToken() {
    localStorage.removeItem("token")
}

// DEVUELVE EL TOKEN ACTUAL
export function getToken() {
    return leerToken()
}

// ¿HAY ALGUIEN CON LA SESION INICIADA?
export function estaLogueado() {
    return leerToken() !== ""
}

// REGISTRO: crea la cuenta en el back
export async function registrar(nombre, email, password) {
    const respuesta = await fetch(`${BACK_URL}/usuarios/registro`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: nombre, email: email, password: password })
    })
    const datos = await respuesta.json()
    if (!respuesta.ok) {
        throw new Error(datos.mensaje)
    }
    return datos
}

// LOGIN: entra con email y contraseña y guarda el token
export async function login(email, password) {
    const respuesta = await fetch(`${BACK_URL}/usuarios/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email, password: password })
    })
    const datos = await respuesta.json()
    if (!respuesta.ok) {
        throw new Error(datos.mensaje)
    }
    guardarToken(datos.token)
    return datos
}

// CERRAR SESION: borra el token
export function cerrarSesion() {
    borrarToken()
}