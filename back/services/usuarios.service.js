import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { buscarPorEmail, guardar } from "../repositories/usuarios.repository.js"

// ---------- AYUDANTES (no se exportan) ----------

function errorCon(status, mensaje) {
    const error = new Error(mensaje)
    error.status = status
    return error
}

function validar(datos) {
    const nombre = (datos.nombre || "").trim()
    const email = (datos.email || "").trim().toLowerCase()
    const password = datos.password || ""

    if (!nombre || !email || !password) {
        throw errorCon(400, "Completá nombre, email y contraseña")
    }
    if (!email.includes("@")) {
        throw errorCon(400, "El email no es válido")
    }
    if (password.length < 8) {
        throw errorCon(400, "La contraseña tiene que tener al menos 8 caracteres")
    }
    return { nombre: nombre, email: email, password: password }
}

async function chequearEmailLibre(email) { /* verifica si el email está en uso */
    const existente = await buscarPorEmail(email)
    if (existente) {
        throw errorCon(409, "Ya existe una cuenta con ese email")
    }
}

function sinPassword(usuario) { /* arma un objeto nuevo pero sin el hash para que no salga del servidor */
    return {
        _id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        fechaDeCreacion: usuario.fechaDeCreacion
    }
}

// ---------- LO QUE USA EL CONTROLLER ----------

export async function registrarUsuario(datos) {
    const limpios = validar(datos)                          // 1) mirar
    await chequearEmailLibre(limpios.email)                 // 2) preguntar a la base
    const hash = await bcrypt.hash(limpios.password, 10)    // 3) la contraseña → hash
    const guardado = await guardar({                        // 4) guardar
        nombre: limpios.nombre,
        email: limpios.email,
        password: hash /* nunca guarda la contraseña real */
    })
    return sinPassword(guardado) /* devuelve el usuario creado, sin el hash */
}

export async function loginUsuario(datos) {
    const email = (datos.email || "").trim().toLowerCase()
    const password = datos.password || ""

    const usuario = await buscarPorEmail(email)
    if (!usuario) {
        throw errorCon(401, "Email o contraseña incorrectos")
    }

    const coincide = await bcrypt.compare(password, usuario.password)
    if (!coincide) {
        throw errorCon(401, "Email o contraseña incorrectos")
    }

    const token = jwt.sign( /* arma el token con el id del usuario */
        { id: usuario._id },
        process.env.JWT_SECRET,
        { expiresIn: "2h" }
    )
    return { token: token, usuario: sinPassword(usuario) }
}