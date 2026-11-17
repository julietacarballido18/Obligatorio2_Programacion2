import jwt from "jsonwebtoken"

export function pedirToken(req, res, next) {
    const cabecera = req.headers.authorization
    const token = cabecera && cabecera.split(" ")[1]

    if (!token) {
        return res.status(401).json({ mensaje: "No mandaste el token" })
    }

    try {
        const datos = jwt.verify(token, process.env.JWT_SECRET) /* chequea queno este vencido el token */
        req.usuario = datos
        next() /* si esta beien deja pasar el pedio a la ruta */
    } catch (error) { /* si el token es falso o vencio, responde con 401 */
        res.status(401).json({ mensaje: "El token no es válido o venció" })
    }
}