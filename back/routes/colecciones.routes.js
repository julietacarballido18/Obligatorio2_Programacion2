import express from "express"
import { listar, crear, editar, borrar, agregar, comentar, quitar, listarOtras } from "../controllers/colecciones.controller.js"

const router = express.Router()

router.get("/", listar)          // GET    /colecciones
router.get("/otras", listarOtras)// GET    /colecciones/otras
router.post("/", crear)          // POST   /colecciones
router.put("/:id", editar)       // PUT    /colecciones/:id
router.delete("/:id", borrar)    // DELETE /colecciones/:id

export default router

router.post("/:id/obras", agregar)
router.put("/:id/obras/:idObra", comentar)
router.delete("/:id/obras/:idObra", quitar)

