
import { listarColecciones,
         crearColeccion, 
         editarColeccion, 
         borrarColeccion,
         agregarObra, 
         editarComentario, 
         quitarObra,
        listarColeccionesDeOtros } from "../services/colecciones.service.js"

// GET /colecciones - LISTAR MIS COLECCIONES
export async function listar(req, res) {
    try {
        const colecciones = await listarColecciones(req.usuario.id)
        res.json(colecciones)
    } catch (error) {
        res.status(error.status || 500).json({ mensaje: error.message })
    }
}

// POST /colecciones - CREAR UNA COLECCION
export async function crear(req, res) {
    try {
        const nueva = await crearColeccion(req.body, req.usuario.id)
        res.status(201).json(nueva)
    } catch (error) {
        res.status(error.status || 500).json({ mensaje: error.message })
    }
}

// PUT /colecciones/:id - EDITAR UNA COLECCION
export async function editar(req, res) {
    try {
        const editada = await editarColeccion(req.params.id, req.body, req.usuario.id)
        res.json(editada)
    } catch (error) {
        res.status(error.status || 500).json({ mensaje: error.message })
    }
}

// DELETE /colecciones/:id - ELIMINAR UNA COLECCION
export async function borrar(req, res) {
    try {
        await borrarColeccion(req.params.id, req.usuario.id)
        res.json({ mensaje: "Colección eliminada" })
    } catch (error) {
        res.status(error.status || 500).json({ mensaje: error.message })
    }
}

// AGREGAR OBRA
export async function agregar(req, res) {
    try {
        const coleccion = await agregarObra(req.usuario.id, req.params.id, req.body)
        res.status(201).json(coleccion)
    } catch (error) {
        res.status(error.status || 500).json({ mensaje: error.message })
    }
}

// EDITAR COMENTARIO
export async function comentar(req, res) {
    try {
        const coleccion = await editarComentario(req.usuario.id, req.params.id, req.params.idObra, req.body)
        res.json(coleccion)
    } catch (error) {
        res.status(error.status || 500).json({ mensaje: error.message })
    }
}

// QUITAR OBRA
export async function quitar(req, res) {
    try {
        const coleccion = await quitarObra(req.usuario.id, req.params.id, req.params.idObra)
        res.json(coleccion)
    } catch (error) {
        res.status(error.status || 500).json({ mensaje: error.message })
    }
}

// LISTAR COLECCIONES DE OTROS
export async function listarOtras(req, res) {
    try {
        const colecciones = await listarColeccionesDeOtros(req.usuario.id)
        res.json(colecciones)
    } catch (error) {
        res.status(error.status || 500).json({ mensaje: error.message })
    }
}