import {
    listarColecciones,
    crearColeccion,
    editarColeccion,
    borrarColeccion
} from "../services/colecciones.service.js"

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