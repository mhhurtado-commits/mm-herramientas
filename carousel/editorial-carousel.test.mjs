import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeCarouselSlide } from './slide-model.js';
import { getCarouselLayout } from './core/layout.js';
import { fitText } from './core/text.js';
import { resolveCarouselTheme } from './core/theme.js';

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

for (const kind of ['cover', 'internal', 'stats', 'quote', 'image', 'end']) {
  test(`mantiene el contenido de ${kind} antes del pie seguro`, () => {
    const layout = getCarouselLayout(kind, 1080, 1350);

    assert.equal(layout.kind, kind);
    assert.ok(layout.safeZones.logo.x > 0);
    assert.ok(layout.safeZones.footer.height > 0);
    assert.equal(layout.content.y + layout.content.height <= layout.safeZones.footer.y, true);
  });
}
