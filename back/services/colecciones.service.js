import {
    buscarDelUsuario,
    buscarPorId,
    buscarPorNombre,
    guardar,
    actualizar,
    eliminar,
    guardarCambios
} from "../repositories/colecciones.repository.js"


// HELPERS (no exportar)

// CREAR UN ERROR CON CODIGO (400, 403, 404, 409)
function errorCon(status, mensaje) {
    const error = new Error(mensaje)
    error.status = status
    return error
}

// VALIDAR LOS DATOS DE UNA COLECCION
function validar(datos) {
    const nombre = (datos.nombre || "").trim()
    const descripcion = (datos.descripcion || "").trim()

    if (!nombre) {
        throw errorCon(400, "Ponele un nombre a tu colección")
    }
    return { nombre: nombre, descripcion: descripcion }
}

// REVISAR QUE EL USUARIO NO TENGA OTRA COLECCION CON ESE NOMBRE 
async function chequearNombreLibre(nombre, usuarioId, idQueEstoyEditando) {
    const existente = await buscarPorNombre(nombre, usuarioId)

    if (!existente) {
        return
    }
    if (idQueEstoyEditando && existente._id.toString() === idQueEstoyEditando) {
        return
    }
    throw errorCon(409, "Ya existe una colección con ese nombre")
}

// BUSCAR UNA COLECCION Y REVISAR QUE SEA DEL USUARIO QUE PIDE
async function buscarTuya(id, usuarioId) {
    const coleccion = await buscarPorId(id)

    if (!coleccion) {
        throw errorCon(404, "Esa colección no existe")
    }
    if (coleccion.usuario.toString() !== usuarioId) {
        throw errorCon(403, "Esa colección no es tuya")
    }
    return coleccion
}

//COLECCIONES

// LISTAR LAS COLECCIONES DEL USUARIO
export async function listarColecciones(usuarioId) {
    return await buscarDelUsuario(usuarioId)
}

// CREAR UNA COLECCION
export async function crearColeccion(datos, usuarioId) {
    const limpios = validar(datos)                          
    await chequearNombreLibre(limpios.nombre, usuarioId)    
    limpios.usuario = usuarioId                            
    return await guardar(limpios)                         
}

// EDITAR NOMBRE Y DESCRIPCION DE UNA COLECCION
export async function editarColeccion(id, datos, usuarioId) {
    await buscarTuya(id, usuarioId)
    const limpios = validar(datos)  
    await chequearNombreLibre(limpios.nombre, usuarioId, id)
    return await actualizar(id, limpios)
}

// ELIMINAR UNA COLECCION (con sus obras)
export async function borrarColeccion(id, usuarioId) {
    await buscarTuya(id, usuarioId)
    return await eliminar(id)
}

// ---------- OBRAS DENTRO DE UNA COLECCIÓN ----------

// AGREGAR UNA OBRA A UNA COLECCIÓN
export async function agregarObra(usuarioId, id, datos) {
    const coleccion = await buscarTuya(id, usuarioId)

    if (!datos.id || typeof datos.id !== "number") {
        throw errorCon(400, "La obra necesita un id numérico")
    }
    const yaEsta = coleccion.obras.some((obra) => obra.id === datos.id)
    if (yaEsta) {
        throw errorCon(409, "Esa obra ya está en la colección")
    }

    coleccion.obras.push(datos)
    return await guardarCambios(coleccion)
}

// EDITAR EL COMENTARIO DE UNA OBRA
export async function editarComentario(usuarioId, id, idObra, datos) {
    const coleccion = await buscarTuya(id, usuarioId)

    const obra = coleccion.obras.find((obra) => obra.id === Number(idObra))
    if (!obra) {
        throw errorCon(404, "Esa obra no está en la colección")
    }

    obra.comentario = (datos.comentario ?? "").trim()
    return await guardarCambios(coleccion)
}

// QUITAR UNA OBRA DE UNA COLECCIÓN
export async function quitarObra(usuarioId, id, idObra) {
    const coleccion = await buscarTuya(id, usuarioId)

    const yaEsta = coleccion.obras.some((obra) => obra.id === Number(idObra))
    if (!yaEsta) {
        throw errorCon(404, "Esa obra no está en la colección")
    }

    coleccion.obras = coleccion.obras.filter((obra) => obra.id !== Number(idObra))
    return await guardarCambios(coleccion)
}