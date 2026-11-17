import { registrarUsuario, loginUsuario } from "../services/usuarios.service.js"

// POST /usuarios/registro
export async function registrar(req, res) {
    try {
        const usuario = await registrarUsuario(req.body) /* pasa al service lo que viene del body, nombre, email, password.  */
        res.status(201).json(usuario)
    } catch (error) { /* "atrapa el error" y usa el codigo que le pegó el service, pero si el error no trae código responde con 500, algo inesperado */
        res.status(error.status || 500).json({ mensaje: error.message }) /* manda el mensaje del error correspondiente para que se vea en pantalla */
    }
}

// POST /usuarios/login
export async function login(req, res) {
    try {
        const resultado = await loginUsuario(req.body)
        res.json(resultado)
    } catch (error) {
        res.status(error.status || 500).json({ mensaje: error.message })
    }
}