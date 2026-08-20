export const IMAGE_GENERATION_SIZE = { width: 1200, height: 630 };

export function buildFluxKlein4bInput(prompt, seed) {
  const form = new FormData();
  const values = { prompt, width: IMAGE_GENERATION_SIZE.width, height: IMAGE_GENERATION_SIZE.height, seed };

  for (const [key, value] of Object.entries(values)) {
    form.append(key, String(value));
  }

  const serialized = new Response(form);
  return {
    model: '@cf/black-forest-labs/flux-2-klein-4b',
    multipart: {
      body: serialized.body,
      contentType: serialized.headers.get('content-type'),
    },
  };
}

export function getLocalImageFallbacks() {
  return [
    '@cf/black-forest-labs/flux-1-schnell',
    '@cf/lykon/dreamshaper-8',
    '@cf/stabilityai/stable-diffusion-xl-base-1.0',
  ];
}
