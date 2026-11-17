import { obtenerDelMuseo } from "../services/museo.service.js"

// GET /museo/... → REENVIA LA RESPUESTA DEL MUSEO TAL CUAL
export async function pedirAlMuseo(req, res) {
    try {
        const respuesta = await obtenerDelMuseo(req.url) /* lo que pidió el fron pero sin el /museo */
        res.status(respuesta.status) /* responde con el mismo código */
        res.set("Content-Type", respuesta.tipo) /* le avisa al navegador si lo que manda es un JSON o una imagen */
        res.send(respuesta.cuerpo)
    } catch (error) {
        res.status(error.status || 500).json({ mensaje: error.message })
    }
} /* Es el "mozo", recibe el pedido se lo pasa al sevice y devuelve lo que llega. */