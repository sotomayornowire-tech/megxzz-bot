const fs = require('fs');
const path = require('path');

function leer(archivo) {
  const ruta = path.join(__dirname, '../data', archivo);
  if (!fs.existsSync(ruta)) fs.writeFileSync(ruta, '{}');
  return JSON.parse(fs.readFileSync(ruta, 'utf8'));
}

function guardar(archivo, datos) {
  const ruta = path.join(__dirname, '../data', archivo);
  fs.writeFileSync(ruta, JSON.stringify(datos, null, 2));
}

module.exports = { leer, guardar };
