import mongoose from "mongoose"

// Molde de una obra guardada adentro de una colección.
//cada colección guarda sus obras adentro de manera que al borrar la colección se borran sus obras.
const obraSchema = new mongoose.Schema({   
    id: { type: Number, required: true },
    title: String,
    artist_display: String,
    date_display: String,
    image_id: String,
    thumbnail: {
        width: Number,
        height: Number,
        lqip: String
    },
    comentario: { type: String, default: "" }
}, { _id: false, id: false })

//  molde de una coleccion
const coleccionSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    descripcion: { type: String, default: "" },
    obras: [obraSchema],
    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Usuario",
        required: true
    },
    fechaDeCreacion: { type: Date, default: Date.now }
})


//crea el modelo y lo exporta en una variable "Coleccion"
export const Coleccion = mongoose.model("Coleccion", coleccionSchema)