# Reel Visual And Motion Design

## Goal

Improve the generated Reel so it feels like a professional editorial piece on Instagram and Facebook while preserving the Media Mendoza visual identity and the existing Reel JSON contract.

## Visual Direction

- Keep the vertical 1080x1920 format.
- Preserve the Media Mendoza palette, logo treatment, rounded cards, green accent bars and centered footer language.
- Use distinct visual families instead of rendering every scene as the same card:
  - Cover: image-led hook with logo placement and readable title panel.
  - Information: editorial text card with balanced spacing and restrained numbering.
  - List/contact: structured rows for items, addresses, phone numbers or steps.
  - CTA: light green outer field, white central card, logo, `SEGUIR INFORMADO`, explanatory copy and `mediamendoza.com` band.
- Avoid decorative elements that compete with the news content.

## Motion Direction

- Use subtle fade and short vertical movement between scenes.
- Animate text as blocks, never word-by-word.
- Keep the cover transition slightly more energetic than internal scenes.
- Use a slower, calmer transition for the CTA so it reads as the conclusion.
- Do not use aggressive zooms, bouncing effects or fast parallax.

## Rendering And Export

- Continue rendering each scene through the existing Canvas renderer.
- Keep the current ReelPlan/editorial contract; motion metadata is optional and must have safe defaults.
- Make scene duration responsive to text density, with a minimum readable duration.
- Preserve the current browser video export fallback and vertical dimensions.
- Ensure the final video has no editor-only labels, scene counters or internal layout names.

## Compatibility

- The design is optimized for Instagram and Facebook vertical publishing.
- Text must remain inside safe margins suitable for mobile interfaces.
- Missing images must fall back to the correct text-card family instead of using an image layout with an empty area.

## Verification

- Import the Reel modules without errors.
- Render cover, information, list/contact and CTA scenes.
- Confirm the video export still uses the same scene sequence and durations.
- Run `git diff --check` before implementation handoff.
