# Production illustration provenance

Built-in OpenAI image generation, not the fallback CLI. Both calls referenced the approved concept contact sheet and requested a transparent background. Outputs were copied unchanged with genuine RGBA alpha; no background removal, raster recoloring, retouching or image-derived time is used.

- Flip: `web/clock-flip-plant.png`, 1223×1286. Exact prompt: `flip-prompt.txt`.
- Botanical: `web/clock-botanical-branch.png`, 1357×1159. Exact prompt: `botanical-prompt.txt`.
- Both have alpha range 0–255. Clock time, plates, hands and hills remain live HTML/SVG/CSS.
- Reference: `docs/reviews/2026-10-12-warm-clocks/approved-concepts.png`.

Botanical uses locally bundled, unmodified Lora from Google Fonts commit `186331d77cc99caaa9c3b52391fd2b519c9e1ee8`, under SIL OFL 1.1. See `docs/credits.md`, bundled notice and pinned build checksum. Landscape retains Cormorant Garamond; Flip retains Jost. No runtime external font/art request.
