exports.handler = function(event, context, callback) {
  var headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return callback(null, { statusCode: 200, headers: headers, body: '' });
  }

  var msg = 'hola';
  var historial = [];
  try {
    var b = JSON.parse(event.body || '{}');
    if (b && b.mensaje) { msg = b.mensaje; }
    if (b && b.historial) { historial = b.historial; }
  } catch(e) {}

  var turno = historial.length / 2 + 1;
  var respuesta = '[MOCK — turno ' + turno + '] Recibí: "' + msg + '". El historial tiene ' + historial.length + ' mensajes previos. Todo funciona correctamente.';

  callback(null, {
    statusCode: 200,
    headers: headers,
    body: JSON.stringify({ respuesta: respuesta })
  });
};
