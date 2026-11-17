// =====================================================================
//  MUSEO PERSONAL — EL SERVIDOR (back)
//  Obligatorio 2 · Programación 2
//
//  Cómo prenderlo (en la terminal, parados en la carpeta back/):
//      npm install     -> SOLO la primera vez
//      (copiar .env.ejemplo a .env y completar la dirección de la base)
//      npm run dev     -> prende el servidor con nodemon
//  Para apagarlo: Ctrl + C.
// =====================================================================

import express from "express"
import cors from "cors"

// Lee el archivo .env y mete lo que encuentra adentro de process.env.
// Tiene que ir ANTES de cualquier línea que use process.env.
import dotenv from "dotenv"
dotenv.config()

// La conexión a la base
import { conectarBase } from "./config/db.js"

// ===== LOS ROUTERS =====
// Descomentar cada línea cuando ese archivo de rutas esté completo
// (con su "export default"). Si se importa un archivo vacío, el
// servidor no arranca.
import usuariosRouter from "./routes/usuarios.routes.js"
import coleccionesRouter from "./routes/colecciones.routes.js"
import museoRouter from "./routes/museo.routes.js"
import { pedirToken } from "./middlewares/autorizacion.middleware.js"

// Primero la base, después el servidor.
// Si la base no conecta, conectarBase corta el programa.
await conectarBase()

const app = express()

// El puerto sale del .env. El "|| 3000" es el plan B.
const PORT = process.env.PORT || 3000


// =====================================================================
//  1) LOS MIDDLEWARES
// =====================================================================

// El "portero": deja pasar pedidos que vienen desde el front.
app.use(cors())

// El "traductor": convierte el body en JSON a un objeto (req.body).
app.use(express.json())

// El "anotador": muestra en la terminal cada pedido que llega.
app.use((req, res, next) => {
    console.log(req.method + " " + req.url)
    next()
})


// =====================================================================
//  2) LAS RUTAS
// =====================================================================

app.get("/", (req, res) => {
    res.send("Bienvenidos al Museo Personal")
})

// Descomentar a medida que cada router esté listo:
app.use("/usuarios", usuariosRouter)
app.use("/colecciones", pedirToken, coleccionesRouter)
app.use("/museo", museoRouter)


// =====================================================================
//  3) AL FINAL DE TODO: los dos middlewares "de emergencia"
// =====================================================================

// El 404 general: si un pedido llegó hasta acá, ninguna ruta coincidió.
app.use((req, res) => {
    res.status(404).json({ mensaje: "Esa ruta no existe en el museo" })
})

// El middleware de ERRORES: recibe CUATRO parámetros, el primero es el error.
app.use((err, req, res, next) => {
    console.error(err)
    const codigo = err.status || 500
    res.status(codigo).json({
        mensaje: "Algo salió mal en el servidor (error " + codigo + ")"
    })
})


app.listen(PORT, (error) => {
    if (error) {
        console.log("No se pudo abrir el puerto " + PORT)
        console.log("¿Ya tenés el servidor prendido en otra terminal?")
        return
    }
    console.log("Museo abierto en http://localhost:" + PORT)
})
