const colecciones = [];
//ejemplo de objeto: { nombre: "Van Gogh", descripcion: "Mis favoritas", obras: [] }

export const obtenerColecciones = () => colecciones; // arrow con retorno implicito, devuelve el array de colecciones para importarlo en los otros js


//funcion CREAR COLECCION
export const crearColeccion = (nombre, descripcion) => {
    const existe = colecciones.some((coleccion) => coleccion.nombre === nombre); //busca si ya hay una coleccion con ese nombre

    if (existe === true) {
        return false;                                   //si ya existe no se crea otra igual
    } else {
        colecciones.push({ nombre, descripcion, obras: [] }); //si no existe la crea y devuelve true
        return true;
    }
};


//funcion AGREGAR OBRA A COLECCION
export const agregarObraAColeccion = (nombreColeccion, obra) => {
    const coleccion = colecciones.find((c) => c.nombre === nombreColeccion); //busco la coleccion por su nombre

    const yaEsta = coleccion.obras.some((o) => o.id === obra.id); //busco por ID porque hay varias obras con el mismo nombre (untitled)

    if (yaEsta === true) {
        return false;                //si la obra ya esta guardada aca devuelve false
    } else {
        coleccion.obras.push(obra);   //si no esta la agrega al array con push y devuelve true
        return true;                 
    }
};

//función para buscar una colección por su nombre
export const obtenerColeccion = (nombre) => colecciones.find((c) => c.nombre === nombre); /* devuelve la colección con ese nombre */