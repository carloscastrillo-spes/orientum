var https = require('https');

var SYSTEM = 'Eres Orientum, un consejero sabio y cercano. Usas lenguaje simple que cualquier persona entiende sin formacion academica. Respondes en maximo tres parrafos, de forma concreta y util.\n\nTu marco interno (no lo muestres explicitamente): toda relacion significativa tiene tres elementos: quien desea, lo que desea, y quien o que esta en el medio haciendo posible ese deseo. Cuando ese elemento del medio desaparece, el conflicto se vuelve directo y simetrico. Tu tarea es identificar ese elemento del medio y orientar desde ahi.\n\nREGLAS\n1. Nunca uses terminos como tripleta, diada, mimetico, token, mediador, Girard, tripartita en tus respuestas.\n2. Si hay un conflicto entre personas, identifica internamente quien o que esta en el medio, y nombra eso en terminos concretos y cotidianos.\n3. Si hay una consulta sobre datos o relaciones entre empresas, analiza que elemento conecta las partes y cuanto depende el sistema de ese elemento.\n4. Orienta sin decidir. La decision pertenece al consultante.\n5. Cuando necesitas hacer una pregunta, haz exactamente una. Concreta. Corta.\n6. Hablas como un amigo inteligente, no como un profesor.\n7. Recuerdas todo lo que se dijo antes en la conversacion y lo usas para orientar mejor.';

var CONFLICTO = ['pelea','conflicto','disputa','demanda','juicio','denuncia','mi jefe','mi ex','mi pareja','vecino','amenaza','violencia','acoso','injusticia','me dijo','me hizo','nos peleamos','discutimos','me culpa'];
var RED = ['red','datos','contratos','empresa','proveedor','cliente','analisis','sistema','nodos','conexiones','flujo','interacciones','transacciones','correos','patrones','estructura'];
var JURIDICO = ['ley','derecho','articulo','codigo','juez','abogado','contrato','clausula','obligacion','responsabilidad','dano','pena','sancion','sentencia','fallo','norma','delito','querella'];

function clasificar(texto) {
  var t = texto.toLowerCase();
  var sc = 0; var sr = 0; var sj = 0;
  for (var i = 0; i < CONFLICTO.length; i++) { if (t.indexOf(CONFLICTO[i]) >= 0) { sc++; } }
  for (var i = 0; i < RED.length; i++) { if (t.indexOf(RED[i]) >= 0) { sr++; } }
  for (var i = 0; i < JURIDICO.length; i++) { if (t.indexOf(JURIDICO[i]) >= 0) { sj++; } }
  if (sc === 0 && sr === 0 && sj === 0) { return 'general'; }
  if (sc > 0 && sj > 0) { return 'conflicto_juridico'; }
  if (sc >= sr && sc >= sj) { return 'conflicto'; }
  if (sr >= sc && sr >= sj) { return 'red'; }
  return 'juridico';
}

function contexto(tipo, msg) {
  if (tipo === 'conflicto') { return 'Hay un conflicto interpersonal. Identifica internamente quien o que esta en el medio antes de responder.\n\n' + msg; }
  if (tipo === 'red') { return 'Hay una consulta sobre relaciones o datos. Identifica que elemento conecta las partes.\n\n' + msg; }
  if (tipo === 'juridico') { return 'Hay una consulta juridica. Responde con claridad y orientacion practica.\n\n' + msg; }
  if (tipo === 'conflicto_juridico') { return 'Hay un conflicto con dimension juridica. Orienta el conflicto primero, luego lo juridico.\n\n' + msg; }
  return msg;
}

exports.handler = function(event, context, callback) {

  var headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  function responder(texto) {
    callback(null, {
      statusCode: 200,
      headers: headers,
      body: JSON.stringify({ respuesta: texto })
    });
  }

  if (event.httpMethod === 'OPTIONS') {
    return callback(null, { statusCode: 200, headers: headers, body: '' });
  }

  var key = process.env.ANTHROPIC_API_KEY;
  if (!key) { return responder('ERROR: sin API key'); }

  var msg = 'hola';
  var historial = [];

  try {
    var b = JSON.parse(event.body || '{}');
    if (b && b.mensaje) { msg = b.mensaje; }
    if (b && b.historial && Array.isArray(b.historial)) { historial = b.historial; }
  } catch(e) {}

  var tipo = clasificar(msg);
  var mensajeActual = contexto(tipo, msg);

  var mensajes = historial.concat([{ role: 'user', content: mensajeActual }]);

  var payload = JSON.stringify({
    model: 'claude-opus-4-5',
    max_tokens: 1024,
    system: SYSTEM,
    messages: mensajes
  });

  var options = {
    hostname: 'api.anthropic.com',
    port: 443,
    path: '/v1/messages',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
      'x-api-key': key,
      'anthropic-version': '2023-06-01'
    }
  };

  var req = https.request(options, function(res) {
    var data = '';
    res.on('data', function(chunk) { data = data + chunk; });
    res.on('end', function() {
      var r;
      try { r = JSON.parse(data); } catch(e) {
        return responder('ERROR PARSE: ' + data.substring(0, 300));
      }
      if (r.error) {
        return responder('ERROR API: ' + r.error.type + ' - ' + r.error.message);
      }
      if (!r.content || r.content.length === 0) {
        return responder('ERROR: sin content');
      }
      var texto = '';
      for (var i = 0; i < r.content.length; i++) {
        if (r.content[i] && r.content[i].text) {
          texto = texto + r.content[i].text;
        }
      }
      if (!texto) { return responder('ERROR: texto vacio'); }
      return responder(texto);
    });
  });

  req.on('error', function(e) { responder('ERROR RED: ' + e.message); });
  req.write(payload);
  req.end();
};
