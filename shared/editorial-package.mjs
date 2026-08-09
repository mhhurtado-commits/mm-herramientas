export const EDITORIAL_PACKAGE_VERSION = 2;

export function normalizeEditorialPackage(input = {}) {
  const source = isObject(input) ? input : {};
  const errors = [];
  const fuenteSource = isObject(source.fuente) ? source.fuente : {};
  const editorialSource = isObject(source.editorial) ? source.editorial : null;

  if (source.tipo !== 'noticia_editorial') errors.push('tipo inválido');
  if (Number(source.version) !== EDITORIAL_PACKAGE_VERSION) errors.push('version inválida');

  const fuente = {
    url: clean(fuenteSource.url),
    titulo_original: clean(fuenteSource.titulo_original || fuenteSource.title),
    categoria: clean(fuenteSource.categoria || fuenteSource.category),
    cuerpo: clean(fuenteSource.cuerpo || fuenteSource.texto || fuenteSource.content || fuenteSource.body),
    imagen: clean(fuenteSource.imagen || fuenteSource.image),
    imagenes: uniqueStrings([fuenteSource.imagenes, fuenteSource.images]).slice(0, 12),
  };

  if (!fuente.url) errors.push('fuente.url faltante');
  if (!fuente.titulo_original) errors.push('fuente.titulo_original faltante');
  if (!editorialSource) errors.push('editorial faltante');

  const editorial = normalizeEditorial(editorialSource || {}, fuente);
  const normalized = {
    tipo: 'noticia_editorial',
    version: EDITORIAL_PACKAGE_VERSION,
    fuente,
    editorial,
    salidas: normalizeOutputs(source.salidas),
    redes: normalizeSocial(source.redes),
  };

  return { ok: errors.length === 0, package: normalized, errors };
}

export function packageFromPlate(plate = {}) {
  const source = isObject(plate) ? plate : {};
  const fuenteSource = isObject(source.fuente) ? source.fuente : {};
  const images = uniqueStrings([fuenteSource.imagenes, fuenteSource.images]);
  const primaryImage = clean(fuenteSource.imagen || fuenteSource.image || images[0]);
  const normalizedImages = primaryImage && !images.includes(primaryImage) ? [primaryImage, ...images] : images;

  return {
    tipo: 'noticia_editorial',
    version: EDITORIAL_PACKAGE_VERSION,
    fuente: {
      url: clean(fuenteSource.url || source.url),
      titulo_original: clean(fuenteSource.titulo_original || fuenteSource.title || source.titulo),
      categoria: clean(fuenteSource.categoria || fuenteSource.category || source.etiqueta),
      cuerpo: clean(fuenteSource.cuerpo || fuenteSource.texto || fuenteSource.content || fuenteSource.body || source.cuerpo),
      imagen: primaryImage,
      imagenes: normalizedImages.slice(0, 12),
    },
    editorial: {
      seccion: clean(fuenteSource.categoria || fuenteSource.category || source.etiqueta),
      familia: clean(source.template_sugerido) || 'general',
      tipo_noticia: clean(source.tipo_noticia) || 'noticia',
      complejidad: clean(source.complejidad) || 'medium',
      tono: clean(source.tono) || 'informative',
      titulo: clean(source.titulo || source.title),
      bajada: clean(source.bajada || source.description),
      contexto: clean(source.contexto || source.context),
      datos_clave: normalizeStrings(source.datos_clave),
      textual: normalizeStringsOrObjects(source.textual),
      personas: normalizeObjects(source.personas),
    },
    salidas: { placas: [source], carrusel: null, reel: null },
    redes: normalizeSocial(source.redes),
  };
}

export function packageFromCarouselArticle(article = {}, diagnosis = {}, plan = null) {
  const source = isObject(article) ? article : {};
  const normalizedPlan = isObject(plan) ? plan : {};
  const normalizedDiagnosis = isObject(diagnosis) ? diagnosis : {};
  const images = uniqueStrings([source.images]);
  const primaryImage = clean(source.image || images[0]);

  return {
    tipo: 'noticia_editorial',
    version: EDITORIAL_PACKAGE_VERSION,
    fuente: {
      url: clean(source.url),
      titulo_original: clean(source.title),
      categoria: clean(source.category),
      cuerpo: clean(source.content),
      imagen: primaryImage,
      imagenes: primaryImage && !images.includes(primaryImage) ? [primaryImage, ...images].slice(0, 12) : images.slice(0, 12),
    },
    editorial: {
      seccion: clean(normalizedDiagnosis.vertical || source.category),
      familia: clean(normalizedDiagnosis.template) || 'general',
      tipo_noticia: clean(normalizedDiagnosis.news_type) || 'evergreen',
      complejidad: clean(normalizedDiagnosis.complexity) || 'medium',
      tono: clean(normalizedDiagnosis.tone) || 'informative',
      titulo: clean(normalizedPlan.cover?.title || source.title),
      bajada: clean(normalizedPlan.cover?.subtitle || source.summary),
      contexto: clean(normalizedPlan.slides?.find(slide => slide?.type === 'context')?.text),
      datos_clave: normalizeStrings(normalizedPlan.slides?.filter(slide => slide?.type === 'facts').flatMap(slide => slide.items || [])),
      textual: [],
      personas: [],
    },
    salidas: { placas: [], carrusel: normalizedPlan, reel: null },
    redes: normalizeSocial({}),
  };
}

export function packageToCarouselArticle(editorialPackage = {}) {
  const source = isObject(editorialPackage.fuente) ? editorialPackage.fuente : {};
  const editorial = isObject(editorialPackage.editorial) ? editorialPackage.editorial : {};
  const images = uniqueStrings([source.imagenes]);
  const image = clean(source.imagen || images[0]);
  return {
    url: clean(source.url),
    title: clean(source.titulo_original || editorial.titulo),
    category: clean(source.categoria || editorial.seccion),
    summary: clean(editorial.bajada),
    image,
    images: image && !images.includes(image) ? [image, ...images].slice(0, 12) : images.slice(0, 12),
    content: clean(source.cuerpo),
  };
}

export function packageToPlateInput(editorialPackage = {}) {
  const source = isObject(editorialPackage.fuente) ? editorialPackage.fuente : {};
  const editorial = isObject(editorialPackage.editorial) ? editorialPackage.editorial : {};
  const plate = Array.isArray(editorialPackage.salidas?.placas) ? editorialPackage.salidas.placas[0] : {};
  return {
    ...plate,
    url: clean(source.url),
    titulo: clean(editorial.titulo || source.titulo_original),
    bajada: clean(editorial.bajada),
    contexto: clean(editorial.contexto),
    cuerpo: clean(source.cuerpo),
    category: clean(editorial.seccion || source.categoria),
    template_sugerido: clean(editorial.familia) || 'general',
    image: clean(source.imagen),
    images: uniqueStrings([source.imagenes]),
    textual: editorial.textual,
    personas: editorial.personas,
  };
}

function normalizeEditorial(source, fuente) {
  return {
    seccion: clean(source.seccion || fuente.categoria),
    category_options: normalizeCategoryOptions(source.category_options),
    familia: clean(source.familia) || 'general',
    tipo_noticia: clean(source.tipo_noticia) || 'noticia',
    complejidad: clean(source.complejidad) || 'medium',
    tono: clean(source.tono) || 'informative',
    titulo: clean(source.titulo || fuente.titulo_original),
    bajada: clean(source.bajada),
    contexto: clean(source.contexto),
    datos_clave: normalizeStrings(source.datos_clave),
    textual: normalizeStringsOrObjects(source.textual),
    personas: normalizeObjects(source.personas),
  };
}

function normalizeCategoryOptions(values) {
  if (!Array.isArray(values)) return [];
  return values.map((value, index) => ({
    id: clean(value?.id) || `categoria-${index + 1}`,
    label: clean(value?.label || value?.nombre || value?.seccion),
    vertical: clean(value?.vertical),
    recommended: Boolean(value?.recommended || value?.sugerida),
    color: clean(value?.color),
  })).filter(value => value.label).slice(0, 6);
}

function normalizeOutputs(outputs) {
  const source = isObject(outputs) ? outputs : {};
  return {
    placas: Array.isArray(source.placas) ? source.placas : [],
    carrusel: source.carrusel || null,
    reel: source.reel || null,
  };
}

function normalizeSocial(social) {
  const source = isObject(social) ? social : {};
  return { instagram: clean(source.instagram || source.caption), facebook: clean(source.facebook) };
}

function normalizeStrings(values) {
  return Array.isArray(values) ? values.map(clean).filter(Boolean).slice(0, 12) : [];
}

function normalizeStringsOrObjects(values) {
  if (Array.isArray(values)) return values.map(value => (isObject(value) ? { ...value } : clean(value))).filter(value => (isObject(value) ? Object.keys(value).length : Boolean(value))).slice(0, 12);
  if (isObject(values)) return [{ ...values }];
  return [];
}

function normalizeObjects(values) {
  return Array.isArray(values) ? values.filter(isObject).map(value => ({ ...value })).slice(0, 12) : [];
}

function uniqueStrings(groups) {
  return [...new Set(groups.flatMap(group => Array.isArray(group) ? group : [group]).map(clean).filter(Boolean))];
}

function clean(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
