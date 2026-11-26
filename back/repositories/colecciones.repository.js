import mongoose from "mongoose"
import { Coleccion } from "../models/coleccion.js"

// valida que el id de una coleccion tenga forma de id de mongo (24 caracteres)
function idValido(id) {
    return mongoose.isValidObjectId(id)
}

// BUSCAR TODAS LAS COLECCIONES DE UN USUARIO
export async function buscarDelUsuario(usuarioId) {
    return await Coleccion.find({ usuario: usuarioId })
}

// BUSCAR UNA COLECCION POR SU ID
export async function buscarPorId(id) {
    if (!idValido(id)) {
        return null
    }
    return await Coleccion.findById(id)
}

// BUSCAR UNA COLECCION POR NOMBRE (solo entre las de ese usuario)
export async function buscarPorNombre(nombre, usuarioId) {
    return await Coleccion.findOne({ nombre: nombre, usuario: usuarioId })
}

// GUARDAR UNA COLECCION NUEVA
export async function guardar(datos) {
    const nueva = new Coleccion(datos)
    return await nueva.save()
}

// EDITAR UNA COLECCION (devuelve la version nueva)
export async function actualizar(id, datos) {
    if (!idValido(id)) {
        return null
    }
    return await Coleccion.findByIdAndUpdate(id, datos, { new: true })
}

// ELIMINAR UNA COLECCION (y sus obras, que viven adentro)
export async function eliminar(id) {
    if (!idValido(id)) {
        return null
    }
    return await Coleccion.findByIdAndDelete(id)
}

// GUARDAR CAMBIOS EN LAS OBRAS (agregar, editar comentario o quitar)
export async function guardarCambios(coleccion) {
    return await coleccion.save()
}

// BUSCA TODAS LAS COLECCIONES (de todos los usuarios)
export async function buscarTodas() {
    return await Coleccion.find()
}