export function palabras(texto = '') {
  return String(texto || '').trim().split(/\s+/).filter(Boolean).length;
}

export function contarAsteriscos(texto = '') {
  return (String(texto || '').match(/\*\*[^*\n]+\*\*/g) || []).length;
}

function normalizarParaComparar(texto = '') {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function coincidenciasLargas(original = '', salida = '', n = 8) {
  const a = normalizarParaComparar(original).split(' ').filter(Boolean);
  const b = normalizarParaComparar(salida).split(' ').filter(Boolean);
  if (a.length < n || b.length < n) return [];
  const vistos = new Set();
  const encontradas = [];
  for (let i = 0; i + n <= b.length; i++) {
    const ventana = b.slice(i, i + n).join(' ');
    if (vistos.has(ventana)) continue;
    vistos.add(ventana);
    for (let j = 0; j + n <= a.length; j++) {
      if (a.slice(j, j + n).join(' ') === ventana) {
        encontradas.push(ventana);
        break;
      }
    }
  }
  return encontradas;
}
