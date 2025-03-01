const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/usersDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const partidaSchema = new mongoose.Schema({
  hora: Date,
  respuestasCorrectas: Number
});

const usuarioSchema = new mongoose.Schema({
  nombreUsuario: String,
  nombreReal: String,
  apellido: String,
  contraseña: String,
  partidas: [partidaSchema]
});

const Usuario = mongoose.model('Usuario', usuarioSchema);

async function crearUsuariosDePrueba() {
  await Usuario.deleteMany({});
  await Usuario.insertMany([
    {
      nombreUsuario: 'user0',
      nombreReal: 'Ignacio',
      apellido: 'Fernández',
      contraseña: 'pass123',
      partidas: [
        { hora: new Date(), respuestasCorrectas: 5 },
        { hora: new Date(), respuestasCorrectas: 8 }
      ]
    },
    {
      nombreUsuario: 'user2',
      nombreReal: 'Nacho',
      apellido: 'Fernández',
      contraseña: 'securePass',
      partidas: [
        { hora: new Date(), respuestasCorrectas: 7 }
      ]
    }
  ]);
  console.log('Usuarios de prueba creados');
  mongoose.connection.close();
}

crearUsuariosDePrueba();