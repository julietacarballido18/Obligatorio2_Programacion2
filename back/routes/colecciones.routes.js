import express from "express"
import { listar, crear, editar, borrar } from "../controllers/colecciones.controller.js"

const router = express.Router()

router.get("/", listar)          // GET    /colecciones
router.post("/", crear)          // POST   /colecciones
router.put("/:id", editar)       // PUT    /colecciones/:id
router.delete("/:id", borrar)    // DELETE /colecciones/:id

export default router