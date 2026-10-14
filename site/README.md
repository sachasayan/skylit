# Skylit website

Static, framework-free product site for Skylit. Screens on the page are real captures of the app,
not mock-ups. It is published from `site/` and reuses
the app's own Momo, palettes and typography so the site cannot drift from the product.

## Preview

```sh
python3 scripts/website.py serve        # http://127.0.0.1:8780/
```

`serve` reads `site/` live. Requests under `/app/` map only to the allow-listed files in
`SHARED` in `scripts/website.py` (`momo.js`, `momo-routine.js`, `appearance.js`, the Lora and
Jost fonts and their licences). Household configuration is never served.

## Structure

| Path | Purpose |
| --- | --- |
| `index.html` | Homepage, metadata and JSON-LD (SoftwareApplication, WebSite, FAQPage) |
| `css/site.css` | Linen tokens mirrored from `web/appearance.js`, layout and motion |
| `js/site.js` | Word reveals, scroll-linked depth, pointer tilt, screen carousel, story steps, palette viewer, FAQ |
| `img/` | WebP captures of the real app from the synthetic preview (screens, every palette, clocks, Momo, phone app) |
| `icons/`, `og-image.jpg` | Rendered from `favicon.svg` and site imagery |
| `robots.txt`, `sitemap.xml`, `site.webmanifest`, `404.html` | Crawling, install and error pages |

## Regenerating imagery

All public imagery comes from the synthetic preview, never from a frame or household data.

```sh
python3 scripts/preview.py --port 8791 &
node scripts/capture_site.cjs --port 8791          # site/img/*.webp
node scripts/render_site_meta.cjs                  # icons and og-image.jpg
```

Set `SKYLIT_CHROME` to a local Chrome if Playwright's bundled browser is not installed.

## Publishing

Netlify builds the site from `main` using `netlify.toml` at the repository root: it runs
`python3 scripts/website.py stage _site` and publishes `_site/` to
`https://skylit.sachasayan.com/` (DNS: a `skylit` CNAME on Cloudflare pointing at the Netlify
project). Every push to `main` redeploys. If the domain changes, update the absolute URLs in
`index.html`, `robots.txt`, `sitemap.xml` and `BASE` in `tests/site.test.cjs`.

Run `node --test tests/site.test.cjs` and `python3 -m unittest tests.test_site` after edits.
Copy must stay factual: features shipped in the app, labelled sample data, and no claims of
verified service sign-in.
