import mongoose from "mongoose" /* trae la libreria que traduce */

const usuarioSchema = new mongoose.Schema({ /* para definir los campos que va a tener cada usuario */
    nombre: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    fechaDeCreacion: { type: Date, default: Date.now }
})

export const Usuario = mongoose.model("Usuario", usuarioSchema)