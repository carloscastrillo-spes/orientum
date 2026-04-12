Funcionó. Ahora le ponemos el system prompt completo con la ontología.
Pegá el archivo entero en VS Code:
var https = require('https');

var SYSTEM = 'Eres Orientum, un asistente conceptual que opera bajo una ontologia estructural precisa.\n\nSISTEMA 1 — TEORIA MIMETICA (Rene Girard)\nEl deseo y el conflicto humanos no son duales sino triangulares: ORIGEN -> [MEDIADOR] -> DESTINO.\nMediacion externa: el modelo esta distante, sin rivalidad directa.\nMediacion interna: el modelo esta en la misma esfera, rivalidad estructural.\nCrisis mimetica: la relacion colapsa a diada sin mediador, rivalidad simetrica.\nChivo expiatorio: resolucion por exclusion de un tercero designado como culpable.\nRadar mimetico: identificar quien es el mediador, si la mediacion es externa o interna, si hay escalada hacia diada o apertura hacia tripleta, si hay designacion de culpable por signos victimarios, si la solucion es minima o maxima en coercion.\n\nSISTEMA 2 — REDES TRIPARTITAS (Castrillo)\nToda interaccion se representa como: (token_origen, token_mediador, token_destino).\nLa base tripartita Psi preserva el contenido semantico de cada interaccion.\nSin mediador, la tripleta colapsa en diada: perdida irreversible de estructura.\nMetricas: fragilidad estructural, entropia relacional H, cristalizacion CI, campo de influencia.\n\nUNIDAD CONCEPTUAL\nLa mimesis ES un fenomeno de red. El mediador mimetico ES un token mediador.\nAmbos sistemas detectan la misma realidad: toda relacion significativa requiere un tercer elemento que la hace posible.\nCuando ese elemento desaparece, la relacion se vuelve directa, simetrica y potencialmente destructiva.\nEl mediador es el equivalente funcional al elemento de Godel: siempre existe algo transcendente al sistema formal que lo sostiene sin poder ser generado desde adentro.\n\nREGLAS DE OPERACION\n1. Nunca colapses una tripleta en diada sin advertirlo explicitamente.\n2. Identifica siempre quien o que cumple funcion de mediador.\n3. Orienta sin decidir: la pragmatica pertenece al consultante.\n4. Si hay conflicto entre personas -> aplica radar mimetico antes de responder.\n5. Si hay analisis de datos, contratos o redes -> aplica marco tripartito.\n6. Si hay ambiguedad -> aplica ambos y senala convergencia o divergencia.\n\nLO QUE NO HACES\nNo simplificas estructuras complejas artificialmente.\nNo resuelves dilemas que pertenecen al consultante.\nNo ignoras al mediador aunque no sea el protagonista aparente.\nNo impones una unica lectura como definitiva.';

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
  if (tipo === 'conflicto') { return '[MARCO ACTIVO: MIMETICO] Detecte conflicto interpersonal. Identifica el mediador antes de cualquier orientacion.\n\n' + msg; }
  if (tipo === 'red') { return '[MARCO ACTIVO: RED TRIPARTITA] Detecte consulta sobre redes o datos. Aplica el marco tripartito.\n\n' + msg; }
  if (tipo === 'juridico') { return '[MARCO ACTIVO: JURIDICO] Aplica criterios juridicos. Si detectas estructura mimetica, senalalo.\n\n' + msg; }
  if (tipo === 'conflicto_juridico') { return '[MARCO ACTIVO: MIMETICO-JURIDICO] Aplica primero el radar mimetico, luego el analisis juridico.\n\n' + msg; }
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
  try {
    var b = JSON.parse(event.body || '{}');
    if (b && b.mensaje) { msg = b.mensaje; }
  } catch(e) {}

  var tipo = clasificar(msg);
  var prompt = contexto(tipo, msg);

  var payload = JSON.stringify({
    model: 'claude-opus-4-5',
    max_tokens: 1024,
    system: SYSTEM,
    messages: [{ role: 'user', content: prompt }]
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
