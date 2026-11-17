import express from "express"
import { pedirAlMuseo } from "../controllers/museo.controller.js"

const router = express.Router() /* crea el "mini sevidor" que solo sabe de rutas */

router.get("/*ruta", pedirAlMuseo)   // GET /museo/lo-que-sea -> el * significa “cualquier cosa, aunque tenga varias barras”. Con esto, cualquier GET que llegue a /museo/... va al controller.

export default router /* exporta para que index pueda montar */

/* Es el "mapa", conecta una dirección con una función */