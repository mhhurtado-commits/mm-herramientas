const clean = value => String(value ?? '').replace(/\s+/g, ' ').trim();

export function buildEfemeridesSocialPrompt(items, date) {
  const facts = (Array.isArray(items) ? items : []).slice(0, 3).map((item, index) => [
    `${index + 1}. ${clean(item.año || item.anio)} · ${clean(item.titulo)}`,
    `Resumen: ${clean(item.resumen)}`,
    `Ampliación: ${clean(item.texto_ampliado)}`,
  ].join('\n')).join('\n');
  return {
    systemPrompt: 'Sos editor de redes de Media Mendoza. Generá copys en español argentino, claros y atractivos, sin inventar datos. Usá únicamente las tres efemérides confirmadas. Devolvé SOLO JSON válido con esta forma exacta: {"placa":{"instagram":"","facebook":""},"carrusel":{"instagram":"","facebook":""}}. El copy de placa debe presentar la selección del día en pocas líneas. El copy de carrusel debe invitar a deslizar y anticipar que cada efeméride tiene una slide. Instagram puede incluir hasta 5 hashtags relevantes; Facebook no debe depender de hashtags. No repitas todo el texto de las placas.',
    userMsg: `Fecha: ${clean(date)}\nTres efemérides confirmadas:\n${facts}`,
  };
}

export function normalizeEfemeridesSocialCopies(value) {
  let parsed = value;
  if (typeof parsed === 'string') {
    try { parsed = JSON.parse(parsed); } catch { parsed = {}; }
  }
  const read = key => ({
    instagram: clean(parsed?.[key]?.instagram),
    facebook: clean(parsed?.[key]?.facebook),
  });
  return { placa: read('placa'), carrusel: read('carrusel') };
}
