#!/usr/bin/env python3
"""Generate static, accessible help pages and a same-origin search index."""
import argparse
import html
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / 'site'
BASE = 'https://skylit.sachasayan.com'
REPO = 'https://github.com/sachasayan/skylit'

def esc(value):
    return html.escape(str(value), quote=True)

def render():
    articles = json.loads((SITE / 'docs/content.json').read_text())['articles']
    groups = list(dict.fromkeys(a['category'] for a in articles))
    def link(a, active=None):
        current = ' aria-current="page"' if a['slug'] == active else ''
        return f'<a href="/docs/{a["slug"]}/"{current}>{esc(a["title"])}</a>'
    def nav(active):
        return '<a class="all-guides" href="/docs/">All guides</a>' + ''.join(
            f'<div class="nav-group"><h2>{esc(g)}</h2>' + ''.join(link(a, active) for a in articles if a['category'] == g) + '</div>' for g in groups)
    def search():
        return '<div class="docs-search"><label for="guide-search">Search the guides</label><input id="guide-search" type="search" placeholder="Try “resize”, “calendar” or “photos”" autocomplete="off" aria-controls="search-results"><p id="search-status" class="sr" role="status"></p><div id="search-results" hidden></div></div>'
    def shell(title, description, path, body, active=None, contents=''):
        return f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{esc(title)} · Skylit</title><meta name="description" content="{esc(description)}">
<link rel="canonical" href="{BASE}{path}"><meta property="og:title" content="{esc(title)} · Skylit"><meta property="og:description" content="{esc(description)}"><meta property="og:url" content="{BASE}{path}"><meta property="og:type" content="website"><meta property="og:image" content="{BASE}/og-image.jpg"><meta name="theme-color" content="#eee8dd">
<link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="/css/site.css"><link rel="stylesheet" href="/css/docs.css"><script src="/js/docs.js" defer></script></head>
<body class="docs"><a class="skip" href="#main">Skip to content</a>
<header class="docs-header"><a class="brand" href="/"><img src="/favicon.svg" width="36" height="36" alt="">Skylit</a><a class="docs-label" href="/docs/">Docs</a><a class="docs-download" href="{REPO}/releases/latest">Get Skylit <span aria-hidden="true">↗</span></a></header>
<div class="docs-layout"><aside class="docs-sidebar"><nav aria-label="Guides">{nav(active)}</nav></aside>
<main id="main"><details class="mobile-guides"><summary>Browse guides</summary><nav aria-label="Mobile guides">{nav(active)}</nav></details>{body}</main>
{contents}</div><footer class="docs-footer"><a href="/">Skylit · A little life on your wall.</a><div><a href="{REPO}/issues">Get help on GitHub</a><a href="{REPO}/tree/main/docs">Developer documentation</a></div></footer></body></html>'''
    cards = ''.join(f'<a class="guide-card" href="/docs/{a["slug"]}/"><span>{esc(a["category"])}</span><h3>{esc(a["title"])}</h3><p>{esc(a["description"])}</p><b aria-hidden="true">↗</b></a>' for a in articles if a['slug'] in ('first-setup','dashboard','receiving-photos','calendars'))
    grouped = ''.join(f'<section class="guide-group"><h3>{esc(g)}</h3><ul>' + ''.join(f'<li>{link(a)}<p>{esc(a["description"])}</p></li>' for a in articles if a['category'] == g) + '</ul></section>' for g in groups)
    home = f'<div class="docs-intro"><p class="eyebrow">THE SKYLIT GUIDES</p><h1>Make yourself at home.</h1><p>From your first picture to a dashboard that feels like yours. Find a little help for your frame.</p></div>{search()}<section class="popular"><h2>A good place to start</h2><div class="guide-cards">{cards}</div></section><section class="all-articles"><h2>All guides</h2>{grouped}</section>'
    outputs = {SITE / 'docs/index.html': shell('Guides & help', 'Set up your Skylit frame, arrange your dashboard, connect photos and calendars, and keep everything running.', '/docs/', home)}
    for i, a in enumerate(articles):
        sections = ''
        for s in a['sections']:
            sections += f'<section id="{s["id"]}" class="article-section"><h2>{esc(s["title"])}</h2>'
            sections += ''.join(f'<p>{esc(p)}</p>' for p in s.get('paragraphs', []))
            if s.get('steps'):
                sections += '<ol>' + ''.join(f'<li>{esc(p)}</li>' for p in s['steps']) + '</ol>'
            if s.get('note'):
                sections += f'<aside class="guide-note"><p>{esc(s["note"])}</p></aside>'
            sections += '</section>'
        figure = f'<figure class="guide-image"><img src="/img/{a["image"]}" alt="{esc(a["title"])} in Skylit" loading="lazy"><figcaption>Skylit preview · Sample data</figcaption></figure>' if a.get('image') else ''
        adjacent = ''.join(f'<a href="/docs/{articles[j]["slug"]}/"><span>{label}</span>{esc(articles[j]["title"])}</a>' for j, label in [(i-1,'Previous guide'),(i+1,'Next guide')] if 0 <= j < len(articles))
        body = f'{search()}<article><nav class="breadcrumb" aria-label="Breadcrumb"><a href="/docs/">Guides</a><span aria-hidden="true">/</span><span>{esc(a["category"])}</span></nav><h1>{esc(a["title"])}</h1><p class="article-description">{esc(a["description"])}</p>{figure}{sections}</article><nav class="adjacent-guides" aria-label="More guides">{adjacent}</nav><p class="guide-help">Still need a hand? <a href="{REPO}/issues">Report a problem on GitHub</a>. Please keep household information and credentials private.</p>'
        toc = '<aside class="docs-toc"><nav aria-label="On this page"><p>On this page</p>' + ''.join(f'<a href="#{s["id"]}">{esc(s["title"])}</a>' for s in a['sections']) + '</nav></aside>'
        outputs[SITE / f'docs/{a["slug"]}/index.html'] = shell(a['title'], a['description'], f'/docs/{a["slug"]}/', body, a['slug'], toc)
    index = [{'url': f'/docs/{a["slug"]}/', 'title': a['title'], 'category': a['category'], 'description': a['description'], 'text': ' '.join(' '.join(s.get('paragraphs', []) + s.get('steps', []) + [s['title'], s.get('note', '')]) for s in a['sections'])} for a in articles]
    outputs[SITE / 'docs/search.json'] = json.dumps(index, ensure_ascii=False, indent=2) + '\n'
    urls = ['/', '/docs/'] + [f'/docs/{a["slug"]}/' for a in articles]
    outputs[SITE / 'sitemap.xml'] = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + ''.join(f'  <url><loc>{BASE}{url}</loc></url>\n' for url in urls) + '</urlset>\n'
    return outputs

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    stale = []
    for path, content in render().items():
        if args.check:
            if not path.exists() or path.read_text() != content:
                stale.append(str(path.relative_to(ROOT)))
        else:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(content)
    if stale:
        parser.exit(1, 'Regenerate docs with python3 scripts/site_docs.py: ' + ', '.join(stale) + '\n')
    print('Docs are up to date.' if args.check else 'Generated 12 docs pages, search index and sitemap.')

if __name__ == '__main__':
    main()
