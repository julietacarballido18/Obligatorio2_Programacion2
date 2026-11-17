import express from "express"
import { registrar, login } from "../controllers/usuarios.controller.js"

const router = express.Router() /* crea un "mini sevidor" que solo sabe de rutas */

router.post("/registro", registrar) /* cuando llega un POST a /registro ejecuta registrar */
router.post("/login", login)

export default router