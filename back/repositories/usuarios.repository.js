import { Usuario } from "../models/usuario.js"

export async function buscarPorEmail(email) {
    return await Usuario.findOne({ email: email }) /* busca si el email ya se utilizó */
}

export async function guardar(datos) { /* arma el usuario */
    const nuevo = new Usuario(datos)
    return await nuevo.save()
}