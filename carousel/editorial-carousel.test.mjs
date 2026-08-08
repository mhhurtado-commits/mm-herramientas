import test from 'node:test';
import assert from 'node:assert/strict';
import { getEditorialSlideLabel, normalizeCarouselSlide } from './slide-model.js';
import { getCarouselExportEligibility, getSlideLabel } from './ui.js';
import { getCarouselLayout } from './core/layout.js';
import { fitText } from './core/text.js';
import { resolveCarouselTheme } from './core/theme.js';
import { renderSlideToCanvas } from './canvas-renderer.js';

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

function installCanvasHarness() {
  globalThis.Image = class {
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

  globalThis.document = {
    createElement(tag) {
      assert.equal(tag, 'canvas');
      const calls = { text: [], images: [] };
      const ctx = new Proxy({
        measureText(value) {
          return { width: String(value).length * 24 };
        },
        createLinearGradient() {
          return { addColorStop() {} };
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
        drawImage(image) {
          calls.images.push(image.source || '');
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

      return {
        width: 0,
        height: 0,
        calls,
        getContext() {
          return ctx;
        },
      };
    },
  };
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

function renderEditorialSlide(source, project = {}) {
  installCanvasHarness();
  const slide = normalizeCarouselSlide(source, 1, 4);
  return renderSlideToCanvas(slide, { ...project, slides: [slide] });
}

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
      text: 'La cita literal permanece completa.',
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
    content: { text: longCopy, author: 'Autora de referencia', role: 'Especialista' },
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
    renderEditorialSlide(source);
    const canvas = renderEditorialSlide(source);
    const expected = source.content.supportImage.split('/').pop();
    assert.ok(canvas.calls.images.some((src) => src.includes(encodeURIComponent(expected))), source.template);
  }
});

test('no dibuja una línea cuando un bloque tiene espacio vertical cero', () => {
  const canvas = renderEditorialSlide({
    type: 'cita',
    content: {
      text: Array(80).fill('cita larga comprobable').join(' '),
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
    ...contexts.map((text, index) => ({
      type: 'contexto',
      content: {
        title: `Contexto ${index + 1}`,
        text,
        ...(index === 2 ? { supportImage: 'https://example.com/support-context.jpg' } : {}),
      },
    })),
    { type: 'dato', content: { title: 'La cifra principal', items: ['47%', 'Dato comprobable.'] } },
    { type: 'cita', content: { text: 'La cita permanece literal.', author: 'Ana Pérez', role: 'Investigadora' } },
    { type: 'imagen', content: { title: 'Imagen de apoyo', text: 'Epígrafe comprobable.', image: 'https://example.com/photo.jpg' } },
    { type: 'end', content: { source: 'Media Mendoza', text: 'Seguí leyendo.' } },
  ];
  const slides = sources.map((source, index) => normalizeCarouselSlide(source, index, sources.length));
  const project = { article: { category: 'Actualidad' }, slides };

  installCanvasHarness();
  slides.map((slide) => renderSlideToCanvas(slide, project));
  const canvases = slides.map((slide) => renderSlideToCanvas(slide, project));

  assert.deepEqual(new Set(slides.map((slide) => slide.template)), new Set(['cover', 'text', 'stats', 'quote', 'image', 'end']));
  for (const [index, canvas] of canvases.entries()) {
    const layout = getCarouselLayout(slides[index].template, canvas.width, canvas.height);
    assert.ok(layout.content.width > 0 && layout.content.height > 0, slides[index].template);
    assert.equal(canvas.renderState.overflow, false, slides[index].template);
    assertContentBaselinesBeforeFooter(canvas, slides[index].template);
  }

  const contextBlocks = canvases.slice(1, 4).map((canvas, index) =>
    canvas.renderState.blocks.find((block) => block.fullText === contexts[index])
  );
  assert.deepEqual(contextBlocks.map((block) => block.renderedLines), [1, 2, 3]);
  assert.ok(canvases[3].calls.images.some((src) => src.includes('support-context.jpg')));
  assert.ok(textValues(canvases[4]).includes('47%'));
  assert.ok(textValues(canvases[5]).includes('La cita permanece literal.'));
  assert.ok(canvases[6].calls.images.some((src) => src.includes('photo.jpg')));

  const oversized = renderEditorialSlide({
    type: 'contexto',
    content: { title: 'Contexto extendido', text: `${Array(80).fill('texto comprobable').join(' ')} TAIL_OVERSIZED` },
  });
  const zeroSpace = renderEditorialSlide({
    type: 'cita',
    content: {
      text: Array(80).fill('cita comprobable').join(' '),
      author: Array(70).fill('autoría comprobable').join(' '),
      role: 'TAIL_ZERO_SPACE',
    },
  });

  assert.equal(oversized.editorialOverflow, true);
  assert.ok(oversized.renderState.blocks.some((block) => block.fullText.includes('TAIL_OVERSIZED') && block.overflow));
  assert.equal(zeroSpace.editorialOverflow, true);
  assert.ok(zeroSpace.renderState.blocks.some((block) => block.fullText === 'TAIL_ZERO_SPACE' && block.renderedLines === 0 && block.overflow));
});
