// Cotejo: cruza hechos de TyC contra el pool Wikipedia verificado (es∩en) y
// contra el JSON de curadas. No hay red acá: quien orquesta inyecta los datos.

// Alcance: idéntica a RE_KW_AR_EF de worker/worker.js (~línea 9035). Si allá
// cambia, cambiar acá. No se sobrematiza con más keywords: la señal AR debe ser
// la misma que usa la placa en producción.
const RE_AR = /argent|mendoza|patria|obligado|malvin|sarmiento|belgrano|guemes|san mart|tucum|rosas|urquiza|moreno/i;

// Tokens de stopword (ES+EN) para el cotejo local. Criterio igual al del
// verificador del worker: ≥4 letras, sin stopwords.
const STOP = new Set([
  'para', 'como', 'entre', 'desde', 'sobre', 'este', 'esta', 'esto', 'otro', 'otra',
  'tras', 'ante', 'bajo', 'contra', 'hasta', 'segun', 'según', 'todo', 'toda',
  'todos', 'todas', 'cada', 'mismo', 'misma', 'dentro', 'fuera', 'donde', 'cuando',
  'the', 'and', 'with', 'from', 'that', 'this', 'were', 'was', 'has', 'have', 'into',
  'their', 'after', 'before', 'during', 'about', 'than', 'then', 'also', 'which',
  'nacion', 'nación', 'pais', 'país', 'estado', 'provincia', 'república', 'republica',
  'ciudad', 'america', 'americano', 'americana', 'estadounidense', 'argentino',
  'argentina', 'española', 'espanol', 'ingles', 'inglesa', 'alemana',
  'francesa', 'italiano', 'italiana', 'brasileño', 'brasileno', 'latinoamericano',
  'latina', 'mundial', 'actor', 'actriz', 'escritor', 'escritora', 'piloto', 'atleta',
  'deportista', 'jinete', 'persona', 'presidente', 'gobernador',
]);

// Normalización estricta: minúsculas, sin acentos/diacríticos, sin puntuación.
function normalizarTyc(texto) {
  return String(texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ');
}

export function tokensTyc(texto) {
  return normalizarTyc(texto)
    .split(' ')
    .filter(t => t.length >= 4 && /^[a-z]+$/.test(t) && !STOP.has(t));
}

// ¿Comparten al menos un token distintivo (longitud ≥4, no stopword)?
function tokensCompartidos(a, b) {
  const ta = new Set(tokensTyc(a));
  return tokensTyc(b).some(t => ta.has(t));
}

export function alcanceTyc(texto) {
  return RE_AR.test(String(texto || '')) ? 'nacional' : 'internacional';
}

// Recibe items [{ año, titulo, texto }] (sin estado) y devuelve una copia con
// estado/alcance/fuenteEs (link al hecho en Wikipedia, si el pool lo tiene).
// Estados: 'cruzado' (pool es∩en coincide en año+token), 'en-banco' (curada
// del mismo MM-DD con año y token compartido), 'candidato' (requiere
// verificación humana).
export function cotejarItemsTyc(items, pool = [], curadasDelDia = []) {
  return items.map(item => {
    const alcance = alcanceTyc(item.texto);
    const enPool = pool.find(p => String(p.año) === String(item.año)
      && tokensCompartidos(item.texto, p.texto));
    const enBanco = curadasDelDia.find(c => String(c.año) === String(item.año)
      && tokensCompartidos(item.titulo + ' ' + item.texto, String(c.titulo || '')));
    const estado = enPool ? 'cruzado' : (enBanco ? 'en-banco' : 'candidato');
    const fuenteEs = enPool?.fuenteEs || null;
    return { ...item, alcance, estado, fuenteEs };
  });
}