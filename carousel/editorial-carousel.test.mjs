import test from 'node:test';
import assert from 'node:assert/strict';
import { getEditorialSlideLabel, normalizeCarouselSlide } from './slide-model.js';
import { getCarouselExportEligibility, getSlideLabel } from './ui.js';
import * as carouselUI from './ui.js';
import { getCarouselLayout } from './core/layout.js';
import { fitText } from './core/text.js';
import { resolveCarouselTheme } from './core/theme.js';
import { renderSlideToCanvas } from './canvas-renderer.js';
import { renderCarousel } from './renderer.js';
import * as canvasRenderer from './canvas-renderer.js';
import { getProject, setProject } from './state.js';
import { buildCarouselPrompt } from './prompts.js';
import { normalizeCarouselPlan } from './parser.js';
import * as carouselEngine from './carousel-engine.js';
import { resolveSupportImage } from './image-provenance.js';

test('mapea los tipos editoriales a etiquetas visibles y conserva cover/legacy', () => {
  assert.deepEqual(
    ['clave', 'contexto', 'dato', 'cita', 'imagen', 'end'].map(getEditorialSlideLabel),
    ['Clave', 'Contexto', 'Dato', 'Cita', 'Imagen', 'Cierre']
  );
  assert.equal(getEditorialSlideLabel('cover'), 'cover');
  assert.equal(getEditorialSlideLabel('text'), 'text');
  assert.equal(getEditorialSlideLabel('unknown'), 'unknown');
  assert.equal(getSlideLabel({ slide: { type: 'dato', content: { title: 'No es el label' } } }, 0), 'Dato');
  assert.equal(getSlideLabel({ slide: { type: 'cover', content: { title: 'Portada' } } }, 0), 'Portada');
  assert.equal(getSlideLabel({ slide: { template: 'text' } }, 0), 'text');
});

test('bloquea la exportación y nombra el bloque cuando el canvas editorial tiene desborde', () => {
  const overflow = getCarouselExportEligibility([
    {
      item: { index: 1, slide: { type: 'contexto', content: { title: 'Antecedentes' } } },
      index: 1,
      canvas: { renderState: { overflow: true } },
    },
  ]);
  const clear = getCarouselExportEligibility([
    {
      item: { index: 0, slide: { type: 'cover', content: { title: 'Portada' } } },
      index: 0,
      canvas: { editorialOverflow: false, renderState: { overflow: false } },
    },
  ]);

  assert.equal(overflow.allowed, false);
  assert.match(overflow.warning, /Contexto/);
  assert.match(overflow.warning, /Acortá el texto/);
  assert.equal(clear.allowed, true);
  assert.equal(clear.warning, '');
});

function installCanvasHarness(options = {}) {
  const canvases = [];
  const downloads = [];
  const status = { textContent: '' };
  const ImageClass = options.ImageClass || class {
    constructor() {
      this.width = 1200;
      this.height = 800;
      this.onload = null;
    }

    set src(value) {
      this.source = value;
      if (this.onload) this.onload();
    }
  };
  globalThis.Image = ImageClass;

  globalThis.document = {
    createElement(tag) {
      if (tag === 'a') {
        return {
          href: '',
          download: '',
          click() { downloads.push(this.download); },
          remove() {},
        };
      }
      assert.equal(tag, 'canvas');
      const calls = { text: [], images: [], imageDraws: [], measurements: [], fills: [] };
      let currentRoundRect = null;
      const ctx = new Proxy({
        measureText(value) {
          const width = options.measureWidth
            ? options.measureWidth(String(value), this.font || '')
            : String(value).length * 24;
          calls.measurements.push({ value: String(value), font: this.font || '', width });
          return { width };
        },
        createLinearGradient() {
          return { addColorStop() {} };
        },
        beginPath() {
          currentRoundRect = null;
        },
        roundRect(x, y, width, height, radius) {
          currentRoundRect = { x, y, width, height, radius };
        },
        fill() {
          if (currentRoundRect) calls.fills.push({ ...currentRoundRect, color: this.fillStyle });
        },
        fillText(value, x, y) {
          calls.text.push({
            value: String(value),
            x,
            y,
            baseline: this.textBaseline,
            font: this.font,
            lineHeight: this.__carouselLineHeight || 0,
          });
        },
        drawImage(image, ...args) {
          calls.images.push(image.source || '');
          calls.imageDraws.push({ source: image.source || '', args });
        },
      }, {
        get(target, key) {
          if (key in target) return target[key];
          if (key === '__carouselLineHeight') return undefined;
          return () => {};
        },
        set(target, key, value) {
          target[key] = value;
          return true;
        },
      });

      const canvas = {
        width: 0,
        height: 0,
        calls,
        toBlob(callback) {
          const blob = options.blobForCanvas
            ? options.blobForCanvas(calls)
            : new Blob(['png'], { type: 'image/png' });
          callback(blob);
        },
        getContext() {
          return ctx;
        },
      };
      canvases.push(canvas);
      return canvas;
    },
    getElementById(id) {
      return id === 'previewContent' ? status : null;
    },
    body: {
      appendChild() {},
    },
  };

  return { canvases, downloads, status };
}

function textValues(canvas) {
  return canvas.calls.text.map((entry) => entry.value);
}

function assertContentBaselinesBeforeFooter(canvas, kind) {
  const footerY = getCarouselLayout(kind, 1080, 1350).safeZones.footer.y;
  const contentText = canvas.calls.text.filter((entry) => !/^\d+ \/ \d+$/.test(entry.value));
  assert.ok(contentText.length > 0);
  assert.ok(contentText.every((entry) => entry.y + entry.lineHeight <= footerY), `content line crossed footer: ${JSON.stringify(contentText)}`);
}

function renderEditorialSlide(source, project = {}, harnessOptions = {}) {
  installCanvasHarness(harnessOptions);
  const slide = normalizeCarouselSlide(source, 1, 4);
  return renderSlideToCanvas(slide, { ...project, slides: [slide] });
}

test('renderiza clave como una tarjeta editorial destacada y no como contexto', () => {
  const keySlide = normalizeCarouselSlide({
    type: 'clave',
    content: { title: 'La clave', text: 'Una conclusion prioritaria.' },
  }, 0, 1);
  const contextSlide = normalizeCarouselSlide({
    type: 'contexto',
    content: { title: 'El contexto', text: 'Un antecedente explicativo.' },
  }, 0, 1);

  installCanvasHarness();
  const keyCanvas = renderSlideToCanvas(keySlide, { slides: [keySlide] });
  const contextCanvas = renderSlideToCanvas(contextSlide, { slides: [contextSlide] });

  assert.equal(keySlide.template, 'key');
  assert.equal(contextSlide.template, 'text');
  assert.ok(keyCanvas.calls.fills.some((fill) => fill.width <= 20 && fill.height > 200));
  assert.equal(contextCanvas.calls.fills.some((fill) => fill.color === '#edf6ce' && fill.width > 800 && fill.height > 200), false);
});

test('mide los titulos con el mismo peso bold que usa al dibujarlos', () => {
  const canvas = renderEditorialSlide({
    type: 'contexto',
    content: { title: 'PESO EDITORIAL', text: 'Cuerpo breve.' },
  }, {}, {
    measureWidth(value, font) {
      return value.length * (font.startsWith('700 ') ? 30 : 18);
    },
  });
  const titleMeasurements = canvas.calls.measurements.filter((entry) => entry.value.includes('PESO'));

  assert.ok(titleMeasurements.length > 0);
  assert.ok(titleMeasurements.every((entry) => entry.font.startsWith('700 ')), JSON.stringify(titleMeasurements));
});

test('acota etiquetas largas y registra el rol semantico del desborde', () => {
  const label = `SECCION-${'MUYLARGA'.repeat(40)}`;
  const canvas = renderEditorialSlide({
    type: 'contexto',
    content: { eyebrow: label, title: 'Titulo', text: 'Cuerpo breve.' },
  });
  const rightEdge = getCarouselLayout('text', 1080, 1350).content.x + getCarouselLayout('text', 1080, 1350).content.width;
  const labelLines = canvas.calls.text.filter((entry) => label.includes(entry.value));
  const eyebrowBlock = canvas.renderState.blocks.find((block) => block.role === 'eyebrow');

  assert.ok(labelLines.length > 0);
  assert.ok(labelLines.every((entry) => entry.x + entry.value.length * 24 <= rightEdge), JSON.stringify(labelLines));
  assert.ok(eyebrowBlock);
  assert.equal(eyebrowBlock.overflow, true);
  assert.ok(canvas.renderState.blocks.every((block) => typeof block.role === 'string' && block.role.length > 0));
  const eligibility = getCarouselExportEligibility([{ item: { slide: { type: 'contexto' } }, canvas }]);
  assert.equal(eligibility.allowed, false);
  assert.match(eligibility.warning, /bloque eyebrow/);
});

test('precarga imagenes en cache fria antes de renderizar el PNG', async () => {
  const pendingImages = [];
  class DeferredImage {
    constructor() {
      this.width = 1200;
      this.height = 800;
      this.onload = null;
      this.onerror = null;
    }

    set src(value) {
      this.source = value;
      pendingImages.push(this);
    }
  }
  installCanvasHarness({ ImageClass: DeferredImage });
  const slide = normalizeCarouselSlide({
    type: 'imagen',
    content: { image: 'https://example.com/cold-cache-asset.jpg', title: 'Imagen fria' },
  }, 0, 1);

  assert.equal(typeof canvasRenderer.preloadCarouselAssets, 'function');
  let settled = false;
  const preload = canvasRenderer.preloadCarouselAssets([slide], { slides: [slide] }).then(() => { settled = true; });
  await Promise.resolve();
  assert.equal(settled, false);
  for (const image of pendingImages) image.onload();
  await preload;
  const canvas = renderSlideToCanvas(slide, { slides: [slide] });

  assert.ok(canvas.calls.images.some((src) => src.includes('cold-cache-asset.jpg')));
});

test('degrada imagenes principales y de apoyo fallidas sin interrumpir la exportacion', async () => {
  const previousProject = getProject();
  class FailingImage {
    constructor() {
      this.width = 1200;
      this.height = 800;
      this.onload = null;
      this.onerror = null;
    }

    set src(value) {
      this.source = value;
      if (this.onerror) this.onerror();
    }
  }
  const harness = installCanvasHarness({ ImageClass: FailingImage });
  const imageSlide = normalizeCarouselSlide({
    type: 'imagen',
    content: { title: 'Imagen principal', image: 'https://example.com/missing-main.jpg' },
  }, 0, 2);
  const supportSlide = normalizeCarouselSlide({
    type: 'contexto',
    content: { title: 'Con apoyo', text: 'El carrusel mantiene el contenido.', supportImage: 'https://example.com/missing-support.jpg' },
  }, 1, 2);
  const project = { article: { images: ['https://example.com/missing-support.jpg'] }, slides: [imageSlide, supportSlide] };
  setProject(project);

  try {
    await canvasRenderer.preloadCarouselAssets(project.slides, project);
    const imageCanvas = renderSlideToCanvas(imageSlide, project);
    const supportCanvas = renderSlideToCanvas(supportSlide, project);
    const exported = await carouselUI.downloadAllSlides();

    assert.ok(textValues(imageCanvas).includes('Imagen no disponible'));
    assert.ok(textValues(supportCanvas).join(' ').includes('Sin imagen'));
    assert.equal(exported, 2);
    assert.equal(harness.downloads.length, 2);
    assert.equal(harness.status.textContent, '2 slides descargados');
  } finally {
    setProject(previousProject);
  }
});

test('rechaza copiar PNG con desborde y conserva la copia normal', async () => {
  const harness = installCanvasHarness();
  const writes = [];
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: { clipboard: { async write(items) { writes.push(items); } } },
  });
  globalThis.ClipboardItem = class {
    constructor(value) { this.value = value; }
  };
  const overflowItem = {
    index: 0,
    slide: normalizeCarouselSlide({
      type: 'contexto',
      content: { title: 'Contexto', text: Array(100).fill('texto desbordado').join(' ') },
    }, 0, 1),
  };
  const clearItem = {
    index: 1,
    slide: normalizeCarouselSlide({
      type: 'contexto',
      content: { title: 'Contexto', text: 'Texto breve.' },
    }, 1, 2),
  };

  assert.equal(typeof carouselUI.copySlideImage, 'function');
  const rejected = await carouselUI.copySlideImage(overflowItem, { slides: [overflowItem.slide] });
  assert.equal(rejected, false);
  assert.equal(writes.length, 0);
  assert.match(harness.status.textContent, /desbordado/);

  const copied = await carouselUI.copySlideImage(clearItem, { slides: [clearItem.slide] });
  assert.equal(copied, true);
  assert.equal(writes.length, 1);
  assert.equal(harness.status.textContent, 'Slide copiado');
});

test('informa solo los slides efectivamente descargados en lote', async () => {
  const harness = installCanvasHarness({
    blobForCanvas(calls) {
      return calls.text.some((entry) => entry.value === 'FALLA')
        ? null
        : new Blob(['png'], { type: 'image/png' });
    },
  });
  const project = {
    article: {},
    slides: [
      { type: 'contexto', content: { title: 'OK', text: 'Descarga.' } },
      { type: 'contexto', content: { title: 'FALLA', text: 'No descarga.' } },
    ],
  };
  setProject(project);

  assert.equal(typeof carouselUI.downloadAllSlides, 'function');
  const exported = await carouselUI.downloadAllSlides();

  assert.equal(exported, 1);
  assert.equal(harness.downloads.length, 1);
  assert.equal(harness.status.textContent, '1 slides descargados');
});

test('normaliza un slide dato al template stats y completa su contenido', () => {
  const slide = normalizeCarouselSlide({
    type: 'dato',
    content: { title: 'Cifras', items: ['12', '34'] },
  }, 1, 4);

  assert.equal(slide.type, 'dato');
  assert.equal(slide.template, 'stats');
  assert.deepEqual(slide.content, {
    title: 'Cifras',
    subtitle: '',
    text: '',
    items: ['12', '34'],
    image: '',
  });
  assert.deepEqual(slide.style, {
    theme: 'mm_editorial',
    background: 'paper',
    accent: '',
  });
});

test('degrada un slide legacy text a contexto', () => {
  const slide = normalizeCarouselSlide({
    template: 'text',
    content: { title: 'Contexto', text: 'La informacion.' },
  }, 0, 1);

  assert.equal(slide.type, 'contexto');
  assert.equal(slide.template, 'text');
  assert.equal(slide.content.text, 'La informacion.');
});

test('preserva el orden y el total de la secuencia editorial', () => {
  const first = normalizeCarouselSlide({ type: 'cover' }, 0, 3);
  const last = normalizeCarouselSlide({ type: 'end' }, 2, 3);

  assert.equal(first.order, 0);
  assert.equal(first.total, 3);
  assert.equal(last.order, 2);
  assert.equal(last.total, 3);
});

test('resuelve el tema editorial con tinta, acento y zonas seguras de Media Mendoza', () => {
  const theme = resolveCarouselTheme({ theme: 'mm_editorial' }, { type: 'contexto' });

  assert.equal(theme.name, 'mm_editorial');
  assert.equal(theme.colors.textPrimary, '#111111');
  assert.equal(theme.colors.accent, '#a6ce39');
  assert.equal(theme.colors.panel, '#ffffff');
  assert.ok(theme.safe.logoInset > 0);
  assert.ok(theme.safe.footerHeight > 0);
});

test('ajusta un contexto a dos líneas sin truncarlo', () => {
  const ctx = {
    font: '',
    measureText(value) {
      return { width: value.length * 10 };
    },
  };

  const result = fitText(ctx, 'Uno dos tres cuatro', {
    fontSize: 20,
    minFontSize: 16,
    maxWidth: 110,
    maxLines: 2,
    lineHeight: 24,
  });

  assert.deepEqual(result, {
    lines: ['Uno dos', 'tres cuatro'],
    fontSize: 20,
    height: 48,
    truncated: false,
  });
});

test('declara desborde cuando el texto no cabe, sin agregar elipsis', () => {
  const ctx = {
    font: '',
    measureText(value) {
      return { width: value.length * 10 };
    },
  };

  const result = fitText(ctx, 'Uno dos tres cuatro cinco', {
    fontSize: 20,
    minFontSize: 20,
    maxWidth: 110,
    maxLines: 2,
    lineHeight: 24,
  });

  assert.equal(result.truncated, true);
  assert.deepEqual(result.lines, ['Uno dos', 'tres cuatro', 'cinco']);
  assert.equal(result.lines.join(' ').includes('…'), false);
});

test('parte una palabra larga para respetar el ancho máximo', () => {
  const ctx = {
    font: '',
    measureText(value) {
      return { width: value.length * 10 };
    },
  };

  const result = fitText(ctx, 'larguisima', {
    fontSize: 20,
    minFontSize: 20,
    maxWidth: 40,
    maxLines: 3,
    lineHeight: 24,
  });

  assert.deepEqual(result.lines, ['larg', 'uisi', 'ma']);
  assert.equal(result.truncated, false);
});

test('parte una palabra larga que sigue a una línea ya ajustada', () => {
  const ctx = {
    font: '',
    measureText(value) {
      return { width: value.length * 10 };
    },
  };

  const result = fitText(ctx, 'uno herramientalarga', {
    fontSize: 20,
    minFontSize: 20,
    maxWidth: 40,
    maxLines: 5,
    lineHeight: 24,
  });

  assert.deepEqual(result.lines, ['uno', 'herr', 'amie', 'ntal', 'arga']);
  assert.equal(result.truncated, false);
});

for (const kind of ['cover', 'internal', 'stats', 'quote', 'image', 'end']) {
  test(`mantiene el contenido de ${kind} antes del pie seguro`, () => {
    const layout = getCarouselLayout(kind, 1080, 1350);

    assert.equal(layout.kind, kind);
    assert.ok(layout.safeZones.logo.x > 0);
    assert.ok(layout.safeZones.footer.height > 0);
    assert.equal(layout.content.y + layout.content.height <= layout.safeZones.footer.y, true);
  });
}

test('renderiza un dato normalizado como stats a través del canvas editorial', () => {
  const canvas = renderEditorialSlide({
    type: 'dato',
    content: {
      title: 'La cifra central',
      items: ['47%', 'Explicación secundaria del dato.'],
    },
  });

  assert.equal(canvas.width, 1080);
  assert.equal(canvas.height, 1350);
  assert.ok(textValues(canvas).includes('47%'));
  assertContentBaselinesBeforeFooter(canvas, 'stats');
});

test('renderiza una cita normalizada con autora y rol', () => {
  const canvas = renderEditorialSlide({
    type: 'cita',
    content: {
      quote: 'La cita literal permanece completa.',
      validation: 'validated',
      author: 'Ana Pérez',
      role: 'Investigadora',
    },
  });

  assert.ok(textValues(canvas).includes('La cita literal permanece completa.'));
  assert.ok(textValues(canvas).includes('Ana Pérez'));
  assert.ok(textValues(canvas).includes('Investigadora'));
  const authorLines = canvas.calls.text.filter((entry) => entry.value.includes('Ana Pérez'));
  const roleLine = canvas.calls.text.find((entry) => entry.value.includes('Investigadora'));
  assert.ok(Math.max(...authorLines.map((entry) => entry.y + entry.lineHeight)) <= roleLine.y);
});

test('preserva los límites de párrafo al renderizar una cita', () => {
  const canvas = renderEditorialSlide({
    type: 'cita',
    content: {
      quote: 'Primera línea\n\nSegunda línea',
      validation: 'validated',
    },
  });

  const firstLine = canvas.calls.text.find((entry) => entry.value === 'Primera línea');
  const secondLine = canvas.calls.text.find((entry) => entry.value === 'Segunda línea');

  assert.ok(firstLine);
  assert.ok(secondLine);
  assert.ok(secondLine.y > firstLine.y);
  assert.equal(textValues(canvas).includes('Primera línea Segunda línea'), false);
});

test('renderiza una imagen normalizada usando la imagen del slide', () => {
  const source = {
    type: 'imagen',
    content: {
      title: 'Una imagen con contexto',
      text: 'Epígrafe breve y verificable.',
      image: 'https://example.com/photo.jpg',
    },
  };

  renderEditorialSlide(source);
  const canvas = renderEditorialSlide(source);

  assert.ok(canvas.calls.images.some((src) => src.includes('example.com%2Fphoto.jpg')));
  assert.ok(textValues(canvas).includes('Epígrafe breve y verificable.'));
  assertContentBaselinesBeforeFooter(canvas, 'image');
});

test('mantiene la imagen de portada editorial entre 55 y 60 por ciento sin invadir el pie', () => {
  const canvas = renderEditorialSlide({
    type: 'cover',
    content: {
      title: 'Portada editorial',
      subtitle: 'Bajada breve.',
      image: 'https://example.com/cover-editorial-55.jpg',
    },
  });
  const imageDraw = canvas.calls.imageDraws.find((draw) => draw.source.includes('cover-editorial-55.jpg'));
  const footerY = getCarouselLayout('cover', canvas.width, canvas.height).safeZones.footer.y;

  assert.ok(imageDraw);
  assert.ok(imageDraw.args[3] / canvas.height >= 0.55);
  assert.ok(imageDraw.args[3] / canvas.height <= 0.60);
  assert.ok(imageDraw.args[1] + imageDraw.args[3] <= footerY);
  assertContentBaselinesBeforeFooter(canvas, 'cover');
});

test('renderiza una secuencia completa de cover, texto y cierre por el mismo camino canvas', () => {
  installCanvasHarness();
  const slides = [
    normalizeCarouselSlide({ type: 'cover', content: { title: 'Título de portada', subtitle: 'Bajada breve.' } }, 0, 3),
    normalizeCarouselSlide({ type: 'contexto', content: { title: 'Contexto', text: 'Cuerpo legible.' } }, 1, 3),
    normalizeCarouselSlide({ type: 'end', content: { title: 'Fuente: Media Mendoza', text: 'Seguí leyendo.' } }, 2, 3),
  ];
  const project = { article: { title: 'Título de portada', category: 'Actualidad' }, slides };

  const canvases = slides.map((slide) => renderSlideToCanvas(slide, project));

  assert.deepEqual(canvases.map((canvas) => [canvas.width, canvas.height]), [
    [1080, 1350],
    [1080, 1350],
    [1080, 1350],
  ]);
  assert.ok(textValues(canvases[0]).includes('Título de portada'));
  assert.ok(textValues(canvases[1]).includes('Contexto'));
  assert.ok(textValues(canvases[1]).includes('Cuerpo legible.'));
  assert.ok(textValues(canvases[2]).includes('Fuente: Media Mendoza'));
  assert.ok(textValues(canvases[2]).includes('Seguí leyendo.'));
  assertContentBaselinesBeforeFooter(canvases[0], 'cover');
  assertContentBaselinesBeforeFooter(canvases[1], 'text');
  assertContentBaselinesBeforeFooter(canvases[2], 'end');
});

test('mantiene citas y contexto largos dentro de la zona segura del pie', () => {
  const tailMarker = 'TAIL_MARKER_TASK3';
  const longCopy = `${Array(80).fill('palabra editorial comprobable').join(' ')} ${tailMarker}`;
  const quote = renderEditorialSlide({
    type: 'cita',
    content: { quote: longCopy, validation: 'validated', author: 'Autora de referencia', role: 'Especialista' },
  });
  const context = renderEditorialSlide({
    type: 'contexto',
    content: { title: 'Contexto extenso', text: longCopy },
  });

  assertContentBaselinesBeforeFooter(quote, 'quote');
  assertContentBaselinesBeforeFooter(context, 'text');
  assert.ok(textValues(quote).some((value) => value.includes('palabra')));
  assert.ok(textValues(context).some((value) => value.includes('palabra')));
  for (const canvas of [quote, context]) {
    const block = canvas.renderState.blocks.find((entry) => entry.fullText.includes(tailMarker));
    assert.ok(block);
    assert.ok(textValues(canvas).join(' ').includes(tailMarker) || canvas.renderState.overflow === true);
    assert.equal(canvas.editorialOverflow, canvas.renderState.overflow);
    assert.equal(block.fullText.includes(tailMarker), true);
  }
});

test('preserva supportImage en los renderers legacy de texto y stats', () => {
  const sources = [
    { template: 'text', content: { title: 'Contexto', text: 'Cuerpo', supportImage: 'https://example.com/support-text.jpg' } },
    { template: 'stats', content: { title: 'Datos', items: ['12'], supportImage: 'https://example.com/support-stats.jpg' } },
  ];

  for (const source of sources) {
    const project = { article: { images: [source.content.supportImage] } };
    renderEditorialSlide(source, project);
    const canvas = renderEditorialSlide(source, project);
    const expected = source.content.supportImage.split('/').pop();
    assert.ok(canvas.calls.images.some((src) => src.includes(encodeURIComponent(expected))), source.template);
  }
});

test('no dibuja una línea cuando un bloque tiene espacio vertical cero', () => {
  const canvas = renderEditorialSlide({
    type: 'cita',
    content: {
      quote: Array(80).fill('cita larga comprobable').join(' '),
      validation: 'validated',
      author: Array(70).fill('autoría extensa comprobable').join(' '),
      role: 'TAIL_MARKER_ZERO_SPACE',
    },
  });
  const roleBlock = canvas.renderState.blocks.find((entry) => entry.fullText === 'TAIL_MARKER_ZERO_SPACE');

  assert.ok(roleBlock);
  assert.equal(roleBlock.renderedLines, 0);
  assert.equal(roleBlock.overflow, true);
  assert.equal(textValues(canvas).includes('TAIL_MARKER_ZERO_SPACE'), false);
  assert.equal(canvas.editorialOverflow, true);
});

test('valida la secuencia editorial modular con contexto, apoyo visual y desborde explícito', () => {
  const contexts = [
    'Una línea clara.',
    'Este contexto reúne suficiente información para ocupar dos líneas.',
    'Este contexto reúne suficiente información para ocupar exactamente tres líneas en la lectura.',
  ];
  const sources = [
    { type: 'cover', content: { title: 'Portada editorial', subtitle: 'Resumen verificable.' } },
    { type: 'clave', content: { title: 'La clave editorial', text: 'Una conclusion prioritaria y verificable.' } },
    ...contexts.map((text, index) => ({
      type: 'contexto',
      content: {
        title: `Contexto ${index + 1}`,
        text,
        ...(index === 2 ? { supportImage: 'https://example.com/support-context.jpg' } : {}),
      },
    })),
    { type: 'dato', content: { title: 'La cifra principal', items: ['47%', 'Dato comprobable.'] } },
    { type: 'cita', content: { quote: 'La cita permanece literal.', validation: 'validated', author: 'Ana Pérez', role: 'Investigadora' } },
    { type: 'imagen', content: { title: 'Imagen de apoyo', text: 'Epígrafe comprobable.', image: 'https://example.com/photo.jpg' } },
    { type: 'end', content: { source: 'Media Mendoza', text: 'Seguí leyendo.' } },
  ];
  const slides = sources.map((source, index) => normalizeCarouselSlide(source, index, sources.length));
  const project = { article: { category: 'Actualidad', images: ['https://example.com/support-context.jpg'] }, slides };

  installCanvasHarness();
  slides.map((slide) => renderSlideToCanvas(slide, project));
  const canvases = slides.map((slide) => renderSlideToCanvas(slide, project));

  assert.deepEqual(new Set(slides.map((slide) => slide.template)), new Set(['cover', 'key', 'text', 'stats', 'quote', 'image', 'end']));
  for (const [index, canvas] of canvases.entries()) {
    const layout = getCarouselLayout(slides[index].template, canvas.width, canvas.height);
    assert.ok(layout.content.width > 0 && layout.content.height > 0, slides[index].template);
    assert.equal(canvas.renderState.overflow, false, slides[index].template);
    assertContentBaselinesBeforeFooter(canvas, slides[index].template);
  }

  const contextBlocks = canvases.slice(2, 5).map((canvas, index) =>
    canvas.renderState.blocks.find((block) => block.fullText === contexts[index])
  );
  assert.deepEqual(contextBlocks.map((block) => block.renderedLines), [1, 2, 3]);
  assert.ok(canvases[1].calls.fills.some((fill) => fill.width <= 20 && fill.height > 200));
  assert.ok(canvases[4].calls.images.some((src) => src.includes('support-context.jpg')));
  assert.ok(textValues(canvases[5]).includes('47%'));
  assert.ok(textValues(canvases[6]).includes('La cita permanece literal.'));
  assert.ok(canvases[7].calls.images.some((src) => src.includes('photo.jpg')));

  const oversized = renderEditorialSlide({
    type: 'contexto',
    content: { title: 'Contexto extendido', text: `${Array(80).fill('texto comprobable').join(' ')} TAIL_OVERSIZED` },
  });
  const zeroSpace = renderEditorialSlide({
    type: 'cita',
    content: {
      quote: Array(80).fill('cita comprobable').join(' '),
      validation: 'validated',
      author: Array(70).fill('autoría comprobable').join(' '),
      role: 'TAIL_ZERO_SPACE',
    },
  });

  assert.equal(oversized.editorialOverflow, true);
  assert.ok(oversized.renderState.blocks.some((block) => block.fullText.includes('TAIL_OVERSIZED') && block.overflow));
  assert.equal(zeroSpace.editorialOverflow, true);
  assert.ok(zeroSpace.renderState.blocks.some((block) => block.fullText === 'TAIL_ZERO_SPACE' && block.renderedLines === 0 && block.overflow));
});

test('el prompt habilita las familias editoriales y sus campos de contenido', () => {
  const prompt = buildCarouselPrompt({
    title: 'Una noticia verificable',
    summary: 'Resumen editorial.',
  });

  for (const type of ['clave', 'contexto', 'dato', 'cita', 'imagen', 'end']) {
    assert.match(prompt, new RegExp(`\\b${type}\\b`), type);
  }
  for (const field of ['quote', 'author', 'role', 'image', 'supportImage', 'items', 'source', 'cta']) {
    assert.match(prompt, new RegExp(`"${field}"`), field);
  }
  assert.match(prompt, /"carousel_type":"summary"[\s\S]*"slide_count":(?:4|5)/);
});

test('conserva el plan anterior cuando la respuesta editorial no supera la normalizacion', async () => {
  const previousProject = getProject();
  const previousPlan = { diagnosis: { carousel_type: 'summary' }, cover: { title: 'Plan anterior' }, slides: [] };
  const project = {
    article: { title: 'Noticia de prueba', summary: 'Resumen.' },
    editorialPlan: previousPlan,
    editorialPackage: { existing: true },
    socialCopy: { caption: '', hashtags: [] },
    slides: [{ id: 'existing-slide' }],
    settings: {},
  };
  const previousFetch = globalThis.fetch;
  setProject(project);
  globalThis.fetch = async () => ({
    json: async () => ({ ok: true, result: createTypedRangePlan('summary', 6) }),
  });

  try {
    const result = await carouselEngine.generatePlan();

    assert.equal(result.ok, false);
    assert.equal(getProject(), project);
    assert.equal(project.editorialPlan, previousPlan);
    assert.deepEqual(project.slides, [{ id: 'existing-slide' }]);
    assert.deepEqual(project.editorialPackage, { existing: true });
  } finally {
    globalThis.fetch = previousFetch;
    setProject(previousProject);
  }
});

test('prioriza el título editorial normalizado y mantiene source y cta fuera de FUENTE', () => {
  installCanvasHarness();
  const cover = normalizeCarouselSlide({
    type: 'cover',
    content: { title: 'Titular editorial normalizado', subtitle: 'Bajada.' },
  }, 0, 4);
  const coverCanvas = renderSlideToCanvas(cover, {
    article: { title: 'Titular original de la nota' },
    slides: [cover],
  });
  const article = { title: 'Cierre editorial', summary: 'Resumen.' };
  const parsed = normalizeCarouselPlan({
    diagnosis: {
      news_type: 'evergreen',
      vertical: 'general',
      complexity: 'brief',
      tone: 'informative',
      carousel_type: 'summary',
      template: 'mm_classic',
      reason: 'Contrato de cierre.',
    },
    cover: { title: 'Portada', subtitle: 'Bajada.' },
    slides: [
      { type: 'contexto', title: 'Contexto', text: 'Antecedente.' },
      { type: 'dato', title: 'Dato', items: ['47%'] },
      { type: 'end', source: 'Fuente: Media Mendoza', cta: 'Leé la nota completa' },
    ],
  }, article);
  const slides = carouselEngine.convertirPlanASlides(parsed.plan, article, {});
  const endSlide = slides.at(-1);
  const endCanvas = renderSlideToCanvas(endSlide, { article, slides });
  const ctaBlock = endCanvas.renderState.blocks.find((block) => block.role === 'cta');
  const ctaInBody = endCanvas.renderState.blocks.find((block) => block.role === 'body' && block.fullText === 'Leé la nota completa');

  assert.ok(textValues(coverCanvas).includes('Titular editorial normalizado'));
  assert.equal(textValues(coverCanvas).includes('Titular original de la nota'), false);
  assert.equal(parsed.plan.slides.at(-1).source, 'Fuente: Media Mendoza');
  assert.equal(parsed.plan.slides.at(-1).cta, 'Leé la nota completa');
  assert.equal(endSlide.content.source, 'Fuente: Media Mendoza');
  assert.equal(endSlide.content.cta, 'Leé la nota completa');
  assert.equal(endSlide.content.text, '');
  assert.ok(textValues(endCanvas).includes('Fuente: Media Mendoza'));
  assert.ok(ctaBlock && ctaBlock.fullText === 'Leé la nota completa');
  assert.equal(ctaInBody, undefined);
});

test('incluye las URLs de imagen disponibles en el prompt editorial', () => {
  const prompt = buildCarouselPrompt({
    title: 'Noticia con imágenes',
    image: 'https://example.com/cover.jpg',
    images: ['https://example.com/cover.jpg', 'https://example.com/support.jpg'],
  });

  assert.match(prompt, /https:\/\/example\.com\/cover\.jpg/);
  assert.match(prompt, /https:\/\/example\.com\/support\.jpg/);
  assert.match(prompt, /article\.images\[1\]/);
});

test('resuelve imágenes editoriales desde article.images y degrada las que no tienen fuente', () => {
  const article = {
    title: 'Imágenes verificables',
    summary: 'Resumen.',
    image: 'https://example.com/cover.jpg',
    images: ['https://example.com/cover.jpg', 'https://example.com/support.jpg'],
  };
  const plan = normalizeCarouselPlan({
    diagnosis: {
      news_type: 'evergreen',
      vertical: 'general',
      complexity: 'brief',
      tone: 'informative',
      carousel_type: 'summary',
      template: 'mm_classic',
      reason: 'Incluye una imagen disponible.',
    },
    cover: { title: 'Portada', subtitle: 'Bajada.' },
    slides: [
      { type: 'contexto', title: 'Contexto', text: 'Antecedente.' },
      { type: 'imagen', title: 'Imagen', text: 'Epígrafe.', image: 'article.images[1]' },
      { type: 'end', title: 'Media Mendoza', text: 'Seguí leyendo.' },
    ],
  }, article).plan;
  const unresolvedPlan = {
    ...plan,
    slides: plan.slides.map((slide) => slide.type === 'imagen'
      ? { ...slide, image: '' }
      : slide),
  };

  const resolved = carouselEngine.convertirPlanASlides(plan, article, { useSecondaryImages: false });
  const fallback = carouselEngine.convertirPlanASlides(unresolvedPlan, article, { useSecondaryImages: false });

  assert.equal(resolved[2].type, 'imagen');
  assert.equal(resolved[2].template, 'image');
  assert.equal(resolved[2].content.image, 'https://example.com/support.jpg');
  assert.equal(fallback[2].type, 'contexto');
  assert.equal(fallback[2].template, 'text');
  assert.equal(fallback[2].content.image, '');
  assert.equal(fallback[2].content.text, 'Epígrafe.');
});

test('limita supportImage a imagenes de la nota o fuentes manuales explicitas', async () => {
  const foreign = 'https://foreign.example/unsupported.jpg';
  const articleImage = 'https://example.com/article-support.jpg';
  const manualImage = 'data:image/png;base64,bWFudWFsLXN1cHBvcnQ=';
  const article = {
    title: 'Imagenes con provenance',
    summary: 'Solo se usan fuentes verificables.',
    image: 'https://example.com/cover.jpg',
    images: ['https://example.com/cover.jpg', articleImage],
  };
  const parsed = normalizeCarouselPlan({
    diagnosis: {
      news_type: 'evergreen',
      vertical: 'general',
      complexity: 'medium',
      tone: 'informative',
      carousel_type: 'summary',
      template: 'mm_classic',
      reason: 'Prueba de provenance para imagenes de apoyo.',
    },
    cover: { title: 'Portada', subtitle: 'Bajada.' },
    slides: [
      { type: 'contexto', title: 'Sin fuente', text: 'El apoyo ajeno debe quitarse.', supportImage: foreign },
      { type: 'contexto', title: 'Fuente nota', text: 'El apoyo de la nota se conserva.', supportImage: 'article.images[1]' },
      { type: 'dato', title: 'Fuente manual', items: ['47%'], supportImage: manualImage },
      { type: 'end', source: 'Media Mendoza', cta: 'Segui leyendo.' },
    ],
  }, article);

  assert.equal(parsed.ok, true, parsed.errors.join('\n'));
  assert.equal(parsed.plan.slides[0].supportImage, undefined);
  assert.equal(parsed.plan.slides[1].supportImage, articleImage);
  assert.equal(parsed.plan.slides[2].supportImage, manualImage);

  const slides = carouselEngine.convertirPlanASlides(parsed.plan, article, { useSecondaryImages: false });
  assert.equal(slides[1].content.supportImage, '');
  assert.equal(slides[2].content.supportImage, articleImage);
  assert.equal(slides[3].content.supportImage, manualImage);

  installCanvasHarness();
  const unsafeSlide = normalizeCarouselSlide({
    type: 'contexto',
    content: { title: 'Sin fuente', text: 'No debe cargar una URL ajena.', supportImage: foreign },
  }, 1, 4);
  const canvas = renderSlideToCanvas(unsafeSlide, { article, slides: [unsafeSlide] });
  assert.equal(canvas.calls.images.some((source) => source.includes('unsupported.jpg')), false);

  const rendererProject = { article, slides: [unsafeSlide] };
  renderCarousel(rendererProject);
  assert.equal(rendererProject.slides[0].content.supportImage, '');

  const verifiedSlide = normalizeCarouselSlide({
    type: 'contexto',
    content: { title: 'Fuente nota', text: 'La fuente verificable debe permanecer.', supportImage: articleImage },
  }, 1, 4);
  const verifiedProject = { article, slides: [verifiedSlide] };
  const rendered = renderCarousel(verifiedProject);
  assert.equal(verifiedProject.slides[0].content.supportImage, articleImage);
  assert.ok(rendered[0].canvas.calls.images.some((source) => source.includes('article-support.jpg')));

  const coverSlide = normalizeCarouselSlide({
    type: 'cover',
    content: { title: 'Portada con imagen de la nota' },
  }, 0, 1);
  const coverProject = { article, slides: [coverSlide] };
  const covered = renderCarousel(coverProject);
  assert.ok(covered[0].canvas.calls.images.some((source) => source.includes('cover.jpg')));

  const preloadedSources = [];
  class TrackingImage {
    constructor() {
      this.width = 1200;
      this.height = 800;
      this.onload = null;
    }

    set src(value) {
      this.source = value;
      preloadedSources.push(value);
      if (this.onload) this.onload();
    }
  }
  installCanvasHarness({ ImageClass: TrackingImage });
  const preloadForeign = 'https://foreign.example/preload-unsupported.jpg';
  const preloadSlide = normalizeCarouselSlide({
    type: 'contexto',
    content: { title: 'Sin precarga', text: 'La URL ajena no debe cargarse.', supportImage: preloadForeign },
  }, 1, 4);
  await canvasRenderer.preloadCarouselAssets([preloadSlide], { article, slides: [preloadSlide] });
  assert.equal(preloadedSources.some((source) => source.includes('preload-unsupported.jpg')), false);
});

test('conserva una imagen de la nota guardada con el proxy conocido y rechaza proxies ajenos', () => {
  const worker = 'https://mm-herramientas-worker.mhhurtado.workers.dev';
  const articleImage = 'https://example.com/article-support.jpg?width=1200&format=webp';
  const article = {
    image: 'https://example.com/cover.jpg',
    images: ['https://example.com/cover.jpg', articleImage],
  };
  const persistedProxy = `${worker}?image=${encodeURIComponent(articleImage)}`;
  const foreignProxy = `${worker}?image=${encodeURIComponent('https://foreign.example/unsupported.jpg')}`;

  assert.equal(resolveSupportImage(persistedProxy, article), articleImage);
  assert.equal(resolveSupportImage(foreignProxy, article), '');
});

test('normaliza una imagen sin fuente como slide textual segura', () => {
  const slide = normalizeCarouselSlide({
    type: 'imagen',
    content: { title: 'Imagen sin fuente', text: 'Epígrafe disponible.' },
  }, 1, 4);

  assert.equal(slide.type, 'contexto');
  assert.equal(slide.template, 'text');
  assert.equal(slide.content.image, '');
  assert.equal(slide.content.text, 'Epígrafe disponible.');
});

test('normaliza, convierte y renderiza las siete familias en el orden del plan', () => {
  const article = {
    url: 'https://mediamendoza.com/actualidad/familias',
    title: 'Las familias editoriales',
    category: 'Actualidad',
    summary: 'Un resumen comprobable para la portada.',
    content: 'La cita permanece literal.',
    image: 'https://example.com/cover.jpg',
    images: [
      'https://example.com/cover.jpg',
      'https://example.com/editorial-photo.jpg',
      'https://example.com/key-support.jpg',
      'https://example.com/context-support.jpg',
      'https://example.com/data-support.jpg',
    ],
  };
  const parsed = normalizeCarouselPlan({
    diagnosis: {
      news_type: 'evergreen',
      vertical: 'general',
      complexity: 'deep',
      tone: 'explainer',
      carousel_type: 'explainer',
      template: 'mm_briefing',
      reason: 'La nota necesita todas las familias.',
    },
    cover: {
      title: 'Portada editorial',
      subtitle: 'Siete familias en una secuencia.',
    },
    slides: [
      {
        type: 'clave',
        title: 'La clave',
        text: 'La conclusion principal.',
        supportImage: 'https://example.com/key-support.jpg',
      },
      {
        type: 'contexto',
        title: 'El contexto',
        text: 'El antecedente necesario.',
        supportImage: 'https://example.com/context-support.jpg',
      },
      {
        type: 'dato',
        title: 'El dato',
        items: ['47%', 'Una cifra comprobable.'],
        supportImage: 'https://example.com/data-support.jpg',
      },
      {
        type: 'cita',
        quote: 'La cita permanece literal.',
        author: 'Ana Perez',
        role: 'Investigadora',
      },
      {
        type: 'imagen',
        title: 'La imagen',
        text: 'Un epigrafe comprobable.',
        image: 'https://example.com/editorial-photo.jpg',
      },
      {
        type: 'end',
        title: 'Media Mendoza',
        text: 'Segui leyendo.',
      },
    ],
  }, article);

  assert.equal(parsed.ok, true, parsed.errors.join('\n'));
  assert.deepEqual(parsed.plan.slides.map((slide) => slide.type), [
    'clave',
    'contexto',
    'dato',
    'cita',
    'imagen',
    'end',
  ]);
  assert.equal(parsed.plan.diagnosis.slide_count, 7);
  assert.equal(parsed.plan.slides[0].supportImage, 'https://example.com/key-support.jpg');
  assert.deepEqual(parsed.plan.slides[2].items, ['47%', 'Una cifra comprobable.']);
  assert.deepEqual(
    {
      quote: parsed.plan.slides[3].quote,
      author: parsed.plan.slides[3].author,
      role: parsed.plan.slides[3].role,
    },
    {
      quote: 'La cita permanece literal.',
      author: 'Ana Perez',
      role: 'Investigadora',
    }
  );
  assert.equal(parsed.plan.slides[4].image, 'https://example.com/editorial-photo.jpg');

  assert.equal(typeof carouselEngine.convertirPlanASlides, 'function');
  const slides = carouselEngine.convertirPlanASlides(parsed.plan, article, { useSecondaryImages: false });
  assert.deepEqual(slides.map((slide) => slide.type), [
    'cover',
    'clave',
    'contexto',
    'dato',
    'cita',
    'imagen',
    'end',
  ]);
  assert.deepEqual(slides.map((slide) => slide.template), [
    'cover',
    'key',
    'text',
    'stats',
    'quote',
    'image',
    'end',
  ]);
  assert.deepEqual(slides.map((slide) => slide.order), [0, 1, 2, 3, 4, 5, 6]);
  assert.equal(slides[1].content.supportImage, 'https://example.com/key-support.jpg');
  assert.deepEqual(slides[3].content.items, ['47%', 'Una cifra comprobable.']);
  assert.equal(slides[4].content.quote, 'La cita permanece literal.');
  assert.equal(slides[4].content.author, 'Ana Perez');
  assert.equal(slides[4].content.role, 'Investigadora');
  assert.equal(slides[5].content.image, 'https://example.com/editorial-photo.jpg');

  installCanvasHarness();
  slides.map((slide) => renderSlideToCanvas(slide, { article, slides }));
  const canvases = slides.map((slide) => renderSlideToCanvas(slide, { article, slides }));
  assert.deepEqual(canvases.map((canvas) => [canvas.width, canvas.height]), Array(7).fill([1080, 1350]));
});

test('preserva los saltos de línea en citas textuales', () => {
  const quote = 'Primera linea\n\nSegunda linea';
  const article = {
    title: 'Cita textual',
    summary: 'Resumen editorial.',
    content: quote,
  };
  const parsed = normalizeCarouselPlan({
    diagnosis: {
      news_type: 'evergreen',
      vertical: 'general',
      complexity: 'brief',
      tone: 'informative',
      carousel_type: 'summary',
      template: 'mm_classic',
      reason: 'Incluye una cita textual.',
    },
    cover: { title: 'Portada', subtitle: 'Bajada.' },
    slides: [{ type: 'cita', quote, author: 'Ana Perez', role: 'Investigadora' }],
  }, article);

  assert.equal(parsed.plan.slides[0].quote, quote);

  const slides = carouselEngine.convertirPlanASlides(parsed.plan, article, {});
  assert.equal(slides[1].content.quote, quote);
});

test('normaliza aliases legacy y conserva su renderizado', () => {
  const article = {
    url: 'https://mediamendoza.com/actualidad/legacy',
    title: 'Plan legacy',
    summary: 'Contenido heredado.',
  };
  const parsed = normalizeCarouselPlan({
    diagnosis: {
      news_type: 'evergreen',
      vertical: 'general',
      complexity: 'medium',
      tone: 'informative',
      carousel_type: 'summary',
      template: 'mm_classic',
      reason: 'Compatibilidad.',
    },
    cover: { title: 'Portada legacy', subtitle: 'Bajada heredada.' },
    slides: [
      { type: 'context', title: 'Contexto legacy', text: 'Antecedente.' },
      { type: 'facts', title: 'Datos legacy', items: ['12', '34'] },
      { type: 'impact', title: 'Impacto legacy', text: 'Consecuencia.' },
      { type: 'cta', title: 'Cierre legacy', text: 'Segui leyendo.' },
    ],
  }, article);

  assert.equal(parsed.ok, true, parsed.errors.join('\n'));
  assert.deepEqual(parsed.plan.slides.map((slide) => slide.type), ['contexto', 'dato', 'impact', 'end']);
  assert.equal(typeof carouselEngine.convertirPlanASlides, 'function');
  const slides = carouselEngine.convertirPlanASlides(parsed.plan, article, {});
  assert.deepEqual(slides.map((slide) => slide.template), ['cover', 'text', 'stats', 'text', 'end']);

  installCanvasHarness();
  const canvases = slides.map((slide) => renderSlideToCanvas(slide, { article, slides }));
  assert.equal(canvases.length, 5);
  assert.ok(canvases.every((canvas) => canvas.width === 1080 && canvas.height === 1350));
});

test('rechaza planes editoriales incompletos o con el cierre fuera de secuencia', () => {
  const diagnosis = {
    news_type: 'evergreen',
    vertical: 'general',
    complexity: 'brief',
    tone: 'informative',
    carousel_type: 'summary',
    template: 'mm_classic',
    reason: 'Contrato de secuencia.',
  };
  const article = { title: 'Contrato editorial', summary: 'Resumen verificable.' };
  const incomplete = normalizeCarouselPlan({
    diagnosis,
    cover: { title: 'Portada', subtitle: 'Bajada.' },
    slides: [
      { type: 'contexto', title: 'Contexto', text: 'Antecedente.' },
      { type: 'end', source: 'Media Mendoza', cta: 'Leé la nota completa.' },
    ],
  }, article);
  const misplacedEnd = normalizeCarouselPlan({
    diagnosis,
    cover: { title: 'Portada', subtitle: 'Bajada.' },
    slides: [
      { type: 'end', source: 'Media Mendoza', cta: 'Leé la nota completa.' },
      { type: 'contexto', title: 'Contexto', text: 'Antecedente.' },
      { type: 'dato', title: 'Dato', items: ['47%'] },
    ],
  }, article);
  const missingCover = normalizeCarouselPlan({
    diagnosis,
    slides: [
      { type: 'contexto', title: 'Contexto', text: 'Antecedente.' },
      { type: 'dato', title: 'Dato', items: ['47%'] },
      { type: 'end', source: 'Media Mendoza', cta: 'Leé la nota completa.' },
    ],
  }, article);

  assert.equal(incomplete.ok, false);
  assert.ok(incomplete.errors.some((error) => /4 y 7/.test(error)));
  assert.equal(misplacedEnd.ok, false);
  assert.ok(misplacedEnd.errors.some((error) => /ultima.*end/i.test(error)));
  assert.equal(missingCover.ok, false);
  assert.ok(missingCover.errors.some((error) => /primera.*cover/i.test(error)));
});

test('acepta una secuencia legacy completa y la convierte de cover a end', () => {
  const parsed = normalizeCarouselPlan({
    diagnosis: {
      news_type: 'evergreen',
      vertical: 'general',
      complexity: 'brief',
      tone: 'informative',
      carousel_type: 'summary',
      template: 'mm_classic',
      reason: 'Compatibilidad legacy.',
    },
    cover: { title: 'Portada legacy', subtitle: 'Bajada.' },
    slides: [
      { type: 'context', title: 'Contexto', text: 'Antecedente.' },
      { type: 'facts', title: 'Dato', items: ['47%'] },
      { type: 'cta', title: 'Media Mendoza', text: 'Seguí leyendo.' },
    ],
  }, { title: 'Plan legacy', summary: 'Contenido heredado.' });

  assert.equal(parsed.ok, true, parsed.errors.join('\n'));
  const slides = carouselEngine.convertirPlanASlides(parsed.plan, parsed.plan.article, {});
  assert.equal(slides.length, 4);
  assert.equal(slides[0].type, 'cover');
  assert.equal(slides.at(-1).type, 'end');
});

test('acepta un summary legacy de seis slides con aliases', () => {
  const parsed = normalizeCarouselPlan({
    diagnosis: {
      news_type: 'evergreen',
      vertical: 'general',
      complexity: 'medium',
      tone: 'informative',
      carousel_type: 'summary',
      template: 'mm_classic',
      reason: 'Compatibilidad legacy de seis slides.',
    },
    cover: { title: 'Portada legacy', subtitle: 'Bajada.' },
    slides: [
      { type: 'context', title: 'Contexto', text: 'Antecedente.' },
      { type: 'facts', title: 'Dato', items: ['47%'] },
      { type: 'impact', title: 'Impacto', text: 'Consecuencia.' },
      { type: 'impact', title: 'Alcance', text: 'Consecuencia adicional.' },
      { type: 'cta', title: 'Media Mendoza', text: 'Seguí leyendo.' },
    ],
  }, { title: 'Plan legacy de seis slides', summary: 'Contenido heredado.' });

  assert.equal(parsed.ok, true, parsed.errors.join('\n'));
});

test('rechaza un carrusel summary de seis slides', () => {
  const parsed = normalizeCarouselPlan(createTypedRangePlan('summary', 6), {
    title: 'Resumen fuera de rango',
    summary: 'El resumen no puede tener seis slides.',
  });

  assert.equal(parsed.ok, false);
  assert.ok(parsed.errors.some((error) => /summary.*4 y 5/i.test(error)));
});

test('rechaza un carrusel explainer de cuatro slides', () => {
  const parsed = normalizeCarouselPlan(createTypedRangePlan('explainer', 4), {
    title: 'Explicador fuera de rango',
    summary: 'El explicador no puede tener cuatro slides.',
  });

  assert.equal(parsed.ok, false);
  assert.ok(parsed.errors.some((error) => /explainer.*6 y 7/i.test(error)));
});

test('acepta un carrusel summary dentro de su rango', () => {
  const parsed = normalizeCarouselPlan(createTypedRangePlan('summary', 4), {
    title: 'Resumen en rango',
    summary: 'El resumen puede tener cuatro slides.',
  });

  assert.equal(parsed.ok, true, parsed.errors.join('\n'));
});

test('acepta un carrusel explainer dentro de su rango', () => {
  const parsed = normalizeCarouselPlan(createTypedRangePlan('explainer', 6), {
    title: 'Explicador en rango',
    summary: 'El explicador puede tener seis slides.',
  });

  assert.equal(parsed.ok, true, parsed.errors.join('\n'));
});

test('aplica rangos documentados a timeline, data_points y service', () => {
  const article = {
    title: 'Rangos editoriales',
    summary: 'Los tipos tipados deben respetar sus limites.',
  };
  const ranges = [
    { type: 'timeline', min: 6, max: 7 },
    { type: 'data_points', min: 5, max: 6 },
    { type: 'service', min: 4, max: 5 },
  ];

  for (const range of ranges) {
    for (const total of [range.min, range.max]) {
      const parsed = normalizeCarouselPlan(createTypedRangePlan(range.type, total), article);
      assert.equal(parsed.ok, true, `${range.type} ${total}: ${parsed.errors.join('\n')}`);
    }
    for (const total of [range.min - 1, range.max + 1]) {
      const parsed = normalizeCarouselPlan(createTypedRangePlan(range.type, total), article);
      assert.equal(parsed.ok, false, `${range.type} ${total}`);
      assert.ok(parsed.errors.some((error) => new RegExp(`${range.type}.*${range.min} y ${range.max}`, 'i').test(error)), parsed.errors.join('\n'));
    }
  }
});

function createTypedRangePlan(carouselType, totalSlides) {
  const intermediateSlides = totalSlides - 1;
  return {
    diagnosis: {
      news_type: 'evergreen',
      vertical: 'general',
      complexity: 'medium',
      tone: 'informative',
      carousel_type: carouselType,
      template: 'mm_classic',
      reason: 'Prueba de rango por tipo.',
    },
    cover: { title: 'Portada', subtitle: 'Bajada.' },
    slides: [
      ...Array.from({ length: intermediateSlides - 1 }, (_, index) => ({
        type: 'contexto',
        title: `Contexto ${index + 1}`,
        text: 'Antecedente.',
      })),
      { type: 'end', source: 'Media Mendoza', cta: 'Seguí leyendo.' },
    ],
  };
}

function createQuotePlan(quote) {
  return {
    diagnosis: {
      news_type: 'evergreen',
      vertical: 'general',
      complexity: 'brief',
      tone: 'informative',
      carousel_type: 'summary',
      template: 'mm_classic',
      reason: 'Incluye una cita textual.',
    },
    cover: { title: 'Portada', subtitle: 'Bajada.' },
    slides: [
      { type: 'contexto', title: 'Contexto', text: 'Antecedente verificable.' },
      { type: 'dato', title: 'Dato', items: ['47%'] },
      { type: 'cita', quote, author: 'Ana Perez', role: 'Investigadora' },
      { type: 'cta', title: 'Media Mendoza', text: 'Seguí leyendo.' },
    ],
  };
}

test('solo normaliza como cita las textuales validadas y degrada las demas a texto seguro', () => {
  const literal = 'La comunidad recibira nuevos turnos desde el lunes.';
  const accepted = normalizeCarouselPlan(createQuotePlan(`  ${literal}  `), {
    title: 'Cita textual',
    summary: 'Resumen editorial.',
    content: `La vocera confirmo: ${literal} El servicio se ampliara.`,
  });
  const rejected = normalizeCarouselPlan(createQuotePlan('Esta cita fue inventada.'), {
    title: 'Cita textual',
    summary: 'Resumen editorial.',
    content: `La vocera confirmo: ${literal} El servicio se ampliara.`,
  });
  const unverified = normalizeCarouselPlan(createQuotePlan(literal), {
    title: 'Cita textual',
    summary: 'Resumen editorial.',
  });

  assert.equal(accepted.ok, true, accepted.errors.join('\n'));
  assert.deepEqual(accepted.plan.slides[2], {
    type: 'cita',
    title: '',
    text: '',
    quote: literal,
    author: 'Ana Perez',
    role: 'Investigadora',
    quoteValidation: 'validated',
    validation: 'validated',
  });
  assert.equal(rejected.ok, false);
  assert.equal(rejected.plan.slides[2].type, 'contexto');
  assert.equal(rejected.plan.slides[2].quote, undefined);
  assert.equal(rejected.plan.slides[2].quoteValidation, 'rejected');
  assert.equal(rejected.plan.slides[2].validation, 'rejected');
  assert.ok(rejected.errors.some((error) => /cita.*no coincide/.test(error)));
  assert.equal(unverified.ok, true, unverified.errors.join('\n'));
  assert.equal(unverified.plan.slides[2].type, 'contexto');
  assert.equal(unverified.plan.slides[2].quote, undefined);
  assert.equal(unverified.plan.slides[2].quoteValidation, 'unverified');
  assert.equal(unverified.plan.slides[2].validation, 'unverified');

  const unsafeSlide = normalizeCarouselSlide({
    type: 'cita',
    content: { quote: literal, validation: 'unverified', author: 'Ana Perez' },
  }, 1, 4);
  const canvas = renderSlideToCanvas(unsafeSlide, { slides: [unsafeSlide] });
  assert.equal(unsafeSlide.type, 'contexto');
  assert.equal(unsafeSlide.template, 'text');
  assert.equal(textValues(canvas).includes('“'), false);
  assert.ok(textValues(canvas).join(' ').includes(literal));
});

test('el renderer Canvas no dibuja como cita un input sin validación', () => {
  installCanvasHarness();
  const canvas = renderSlideToCanvas({
    type: 'cita',
    template: 'quote',
    content: { quote: 'Texto sin validar.', validation: 'unverified' },
  }, {});

  assert.equal(textValues(canvas).includes('“'), false);
  assert.ok(textValues(canvas).join(' ').includes('Texto sin validar.'));
});

test('rechaza una cita vacia aunque llegue marcada como validada y la renderiza como texto seguro', () => {
  const parsed = normalizeCarouselPlan(createQuotePlan(' \n\t '), {
    title: 'Cita vacia',
    summary: 'Resumen editorial.',
    content: 'La nota tiene contenido para validar citas.',
  });

  assert.equal(parsed.ok, false);
  assert.equal(parsed.plan.slides[2].type, 'contexto');
  assert.equal(parsed.plan.slides[2].quoteValidation, 'rejected');
  assert.equal(parsed.plan.slides[2].validation, 'rejected');
  assert.ok(parsed.errors.some((error) => /cita vacia/i.test(error)));

  const slide = normalizeCarouselSlide({
    type: 'cita',
    content: { quote: '   ', validation: 'validated' },
  }, 1, 4);
  const canvas = renderSlideToCanvas(slide, { slides: [slide] });

  assert.equal(slide.type, 'contexto');
  assert.equal(slide.template, 'text');
  assert.equal(slide.content.validation, 'rejected');
  assert.equal(canvas.renderState.blocks.some((block) => block.role === 'quote'), false);
});

test('no convierte el texto de respaldo en una cita validada cuando falta quote', () => {
  const slide = normalizeCarouselSlide({
    type: 'cita',
    quote: '',
    text: 'Este texto conserva el contexto, pero no es una cita.',
    validation: 'validated',
  }, 1, 4);
  const canvas = renderSlideToCanvas(slide, { slides: [slide] });

  assert.equal(slide.type, 'contexto');
  assert.equal(slide.template, 'text');
  assert.equal(slide.content.quote, undefined);
  assert.equal(slide.content.validation, 'rejected');
  assert.equal(slide.content.text, 'Este texto conserva el contexto, pero no es una cita.');
  assert.equal(canvas.renderState.blocks.some((block) => block.role === 'quote'), false);
});

test('renderiza datos estructurados sin convertirlos en objetos de texto', () => {
  const canvas = renderEditorialSlide({
    type: 'dato',
    content: {
      title: 'Datos del informe',
      items: [{ value: '47%', label: 'Aumento interanual confirmado.' }],
    },
  });

  assert.ok(textValues(canvas).includes('47%'));
  assert.ok(textValues(canvas).includes('Aumento interanual confirmado.'));
  assert.equal(textValues(canvas).includes('[object Object]'), false);
});

test('renderiza todos los pares value-label de un dato dentro de la zona segura', () => {
  const canvas = renderEditorialSlide({
    type: 'dato',
    content: {
      title: 'Datos del informe',
      items: [
        { value: '47%', label: 'Aumento interanual confirmado.' },
        { value: '12', label: 'Municipios alcanzados por la medida.' },
        { value: '2026', label: 'Actualización más reciente del informe.' },
      ],
    },
  });

  const renderedText = textValues(canvas).join(' ');
  for (const value of ['47%', 'Aumento interanual confirmado.', '12', 'Municipios alcanzados por la medida.', '2026', 'Actualización más reciente del informe.']) {
    assert.ok(renderedText.includes(value), value + ': ' + renderedText);
  }
  assert.equal(canvas.editorialOverflow, false);
  assertContentBaselinesBeforeFooter(canvas, 'stats');
});

test('preserva el contrato value-label al normalizar datos del plan', () => {
  const parsed = normalizeCarouselPlan({
    diagnosis: {
      news_type: 'evergreen',
      vertical: 'general',
      complexity: 'brief',
      tone: 'informative',
      carousel_type: 'summary',
      template: 'mm_classic',
      reason: 'Incluye un dato estructurado.',
    },
    cover: { title: 'Portada', subtitle: 'Bajada.' },
    slides: [{
      type: 'dato',
      title: 'Datos del informe',
      items: [{ value: '47%', label: 'Aumento interanual confirmado.' }],
    }],
  }, { title: 'Dato estructurado', summary: 'Resumen editorial.' });

  assert.deepEqual(parsed.plan.slides[0].items, [{ value: '47%', label: 'Aumento interanual confirmado.' }]);
});

test('preserva todos los pares de datos que superan cinco líneas y bloquea la exportación incompleta', () => {
  const items = [
    { value: '01', label: 'Primer indicador detallado para la cobertura.' },
    { value: '02', label: 'Segundo indicador detallado para la cobertura.' },
    { value: '03', label: 'Tercer indicador detallado para la cobertura.' },
    { value: '04', label: 'Cuarto indicador detallado para la cobertura.' },
    { value: '05', label: 'Quinto indicador detallado para la cobertura.' },
    { value: '06', label: 'Sexto indicador detallado para la cobertura.' },
  ];
  const parsed = normalizeCarouselPlan({
    diagnosis: {
      news_type: 'evergreen',
      vertical: 'general',
      complexity: 'brief',
      tone: 'informative',
      carousel_type: 'summary',
      template: 'mm_classic',
      reason: 'Incluye datos estructurados completos.',
    },
    cover: { title: 'Portada', subtitle: 'Bajada.' },
    slides: [{ type: 'dato', title: 'Datos completos', items }],
  }, { title: 'Datos completos', summary: 'Resumen editorial.' });

  assert.deepEqual(parsed.plan.slides[0].items, items);

  const slide = normalizeCarouselSlide({
    type: 'dato',
    content: { title: 'Datos completos', items: parsed.plan.slides[0].items },
  }, 1, 4);
  const canvas = renderSlideToCanvas(slide, { slides: [slide] });
  const body = canvas.renderState.blocks.find((block) => block.role === 'body');
  const renderedContent = canvas.renderState.blocks.map((block) => block.fullText).join(' ');

  assert.ok(body);
  for (const item of items) {
    assert.ok(renderedContent.includes(item.value), renderedContent);
    assert.ok(renderedContent.includes(item.label), renderedContent);
  }
  assert.equal(body.overflow, true);
  assert.equal(getCarouselExportEligibility([{ item: { slide }, canvas }]).allowed, false);
});

test('combina texto, subtitle y todos los items de stats, conservando el desborde', () => {
  const items = Array.from({ length: 4 }, (_, index) => ({
    value: `VALOR-${index + 1}`,
    label: `Detalle posterior ${index + 1}: ${Array(12).fill('informacion comprobable').join(' ')}`,
  }));
  const slide = normalizeCarouselSlide({
    type: 'dato',
    content: {
      title: 'Datos completos',
      text: 'Texto editorial que debe conservarse.',
      subtitle: 'Bajada editorial que tambien debe conservarse.',
      items,
    },
  }, 1, 4);
  installCanvasHarness();
  const canvas = renderSlideToCanvas(slide, { slides: [slide] });
  const body = canvas.renderState.blocks.find((block) => block.role === 'body');
  const renderedContent = canvas.renderState.blocks.map((block) => block.fullText).join(' ');

  assert.ok(body);
  assert.match(renderedContent, /Texto editorial que debe conservarse/);
  assert.match(renderedContent, /Bajada editorial que tambien debe conservarse/);
  for (const item of items) {
    assert.ok(renderedContent.includes(item.value), item.value);
    assert.ok(renderedContent.includes(item.label), item.label);
  }
  assert.equal(body.overflow, true);
  assert.equal(getCarouselExportEligibility([{ item: { slide }, canvas }]).allowed, false);
});

test('ubica el logo de portada segun la opcion elegida en el editor', () => {
  const positions = ['right', 'center', 'image-footer'].map((coverLogoPosition) => {
    const canvas = renderEditorialSlide({
      type: 'cover',
      content: { title: 'Portada editorial', subtitle: 'Bajada breve.' },
    }, {
      article: { title: 'Portada editorial' },
      settings: { coverLogoPosition },
    });
    const logo = canvas.calls.imageDraws.find((draw) => draw.source === '/assets/logo.png');
    assert.ok(logo, coverLogoPosition);
    return logo.args.slice(0, 2).join(':');
  });

  assert.equal(new Set(positions).size, 3);
});

test('limita los titulos internos a dos lineas sin cambiar la portada', () => {
  const title = Array(11).fill('titulo').join(' ');
  const internal = renderEditorialSlide({
    type: 'contexto',
    content: { title, text: 'Cuerpo breve.' },
  });
  const cover = renderEditorialSlide({
    type: 'cover',
    content: { title, subtitle: 'Bajada breve.' },
  }, { article: { title } });
  const internalTitle = internal.renderState.blocks.find((block) => block.role === 'title' && block.fullText === title);
  const coverTitle = cover.renderState.blocks.find((block) => block.role === 'title' && block.fullText === title);

  assert.equal(internalTitle.renderedLines, 2);
  assert.equal(internalTitle.overflow, true);
  assert.equal(coverTitle.renderedLines, 3);
  assert.equal(coverTitle.overflow, false);
});

test('normaliza el foco de una imagen y desplaza el recorte desde el centro', () => {
  const source = 'https://example.com/focus-image.jpg';
  const centered = renderEditorialSlide({
    type: 'imagen',
    content: { title: 'Imagen', image: source },
  });
  const focusedSlide = normalizeCarouselSlide({
    type: 'imagen',
    content: { title: 'Imagen', image: source, focalPosition: 'left' },
  }, 1, 4);
  const focused = renderSlideToCanvas(focusedSlide, { slides: [focusedSlide] });
  const centeredDraw = centered.calls.imageDraws.find((draw) => draw.source.includes('focus-image.jpg'));
  const focusedDraw = focused.calls.imageDraws.find((draw) => draw.source.includes('focus-image.jpg'));

  assert.deepEqual(focusedSlide.content.focalPosition, { x: 0, y: 0.5 });
  assert.ok(centeredDraw);
  assert.ok(focusedDraw);
  assert.notEqual(centeredDraw.args[0], focusedDraw.args[0]);
});

test('aplica focalPosition a imagenes de apoyo en slides de contexto', () => {
  const source = 'https://example.com/focus-context-support.jpg';
  const project = { article: { images: [source] } };
  const centered = renderEditorialSlide({
    type: 'contexto',
    content: { title: 'Contexto', text: 'Cuerpo breve.', supportImage: source },
  }, project);
  const focused = renderEditorialSlide({
    type: 'contexto',
    content: { title: 'Contexto', text: 'Cuerpo breve.', supportImage: source, focalPosition: 'bottom-right' },
  }, project);
  const centeredDraw = centered.calls.imageDraws.find((draw) => draw.source.includes('focus-context-support.jpg'));
  const focusedDraw = focused.calls.imageDraws.find((draw) => draw.source.includes('focus-context-support.jpg'));

  assert.ok(centeredDraw);
  assert.ok(focusedDraw);
  assert.notEqual(centeredDraw.args[1], focusedDraw.args[1]);
});

test('aplica el foco normalizado a las imagenes de apoyo', () => {
  const source = 'https://example.com/focus-support.jpg';
  const project = { article: { images: [source] } };
  const centered = renderEditorialSlide({
    type: 'dato',
    content: { title: 'Dato', items: ['47%'], supportImage: source },
  }, project);
  const focused = renderEditorialSlide({
    type: 'dato',
    content: { title: 'Dato', items: ['47%'], supportImage: source, focalPosition: 'right' },
  }, project);
  const centeredDraw = centered.calls.imageDraws.find((draw) => draw.source.includes('focus-support.jpg'));
  const focusedDraw = focused.calls.imageDraws.find((draw) => draw.source.includes('focus-support.jpg'));

  assert.ok(centeredDraw);
  assert.ok(focusedDraw);
  assert.notEqual(centeredDraw.args[0], focusedDraw.args[0]);
});

test('actualiza focalX y focalY en el estado del slide de imagen activo', () => {
  const slide = normalizeCarouselSlide({
    id: 'imagen-1',
    type: 'imagen',
    content: { title: 'Imagen', image: 'https://example.com/focal.jpg' },
  }, 1, 4);
  const project = { slides: [slide] };

  assert.equal(typeof carouselUI.updateSlideFocalPosition, 'function');
  const updated = carouselUI.updateSlideFocalPosition(project, 'imagen-1', { x: 1.4, y: -0.2 });

  assert.equal(updated, project);
  assert.equal(getProject(), project);
  assert.deepEqual(project.slides[0].content.focalPosition, { x: 1, y: 0 });
  assert.equal(project.slides[0].content.focalX, 1);
  assert.equal(project.slides[0].content.focalY, 0);
});
