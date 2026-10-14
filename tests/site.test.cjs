const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const ROOT=path.resolve(__dirname,'..'),SITE=path.join(ROOT,'site'),BASE='https://skylit.sachasayan.com/';
const html=fs.readFileSync(path.join(SITE,'index.html'),'utf8');
const shared=fs.readFileSync(path.join(ROOT,'scripts/website.py'),'utf8').match(/SHARED = \(([\s\S]*?)\)/)[1].match(/'([^']+)'/g).map(s=>s.slice(1,-1));
const meta=(attr,name)=>{const m=html.match(new RegExp(`<meta ${attr}="${name}" content="([^"]*)"`));return m&&m[1];};

test('homepage has complete search and social metadata',()=>{
 const title=html.match(/<title>([^<]+)<\/title>/)[1];
 assert.ok(title.length>=30&&title.length<=65,'title length '+title.length);
 const description=meta('name','description');
 assert.ok(description.length>=110&&description.length<=170,'description length '+description.length);
 assert.match(html,/<html lang="en"/);
 assert.match(html,new RegExp(`<link rel="canonical" href="${BASE}">`));
 for(const key of ['og:title','og:description','og:url','og:image','og:image:alt','og:type'])assert.ok(meta('property',key),key);
 for(const key of ['twitter:card','twitter:title','twitter:image'])assert.ok(meta('name',key),key);
 assert.equal(meta('property','og:url'),BASE);
 assert.ok(meta('property','og:image').startsWith(BASE));
 assert.equal((html.match(/<h1[\s>]/g)||[]).length,1,'exactly one h1');
});

test('structured data parses and agrees with the visible FAQ',()=>{
 const blocks=[...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m=>JSON.parse(m[1]));
 const graph=blocks.flatMap(b=>b['@graph']||[b]),types=graph.map(n=>n['@type']);
 for(const type of ['WebSite','SoftwareApplication','FAQPage'])assert.ok(types.includes(type),type);
 const app=graph.find(n=>n['@type']==='SoftwareApplication');
 assert.equal(app.offers.price,'0');assert.equal(app.operatingSystem,'Android');
 const faq=graph.find(n=>n['@type']==='FAQPage').mainEntity.map(q=>q.name);
 const visible=[...html.matchAll(/<summary>([^<]+)<i/g)].map(m=>m[1].replace(/&amp;/g,'&'));
 assert.deepEqual(faq,visible);
});

test('every local reference resolves to a site file or an allow-listed app file',()=>{
 const pages=['index.html','404.html'];
 for(const page of pages){
  const source=fs.readFileSync(path.join(SITE,page),'utf8');
  const refs=[...source.matchAll(/(?:src|href|poster)="([^"#]+)"/g)].map(m=>m[1]).filter(r=>!/^(https?:|mailto:|data:)/.test(r));
  for(const ref of refs){
   const clean=ref.replace(/^\//,'');
   if(clean==='')continue;
   if(clean.startsWith('app/')){assert.ok(shared.includes(clean.slice(4)),page+' references unshared '+ref);continue;}
   assert.ok(fs.existsSync(path.join(SITE,clean)),page+' missing '+ref);
  }
 }
 for(const file of ['robots.txt','sitemap.xml','site.webmanifest','favicon.svg','og-image.jpg','../netlify.toml'])assert.ok(fs.existsSync(path.join(SITE,file)),file);
 const manifest=JSON.parse(fs.readFileSync(path.join(SITE,'site.webmanifest'),'utf8'));
 for(const icon of manifest.icons)assert.ok(fs.existsSync(path.join(SITE,icon.src)),icon.src);
 assert.match(fs.readFileSync(path.join(SITE,'robots.txt'),'utf8'),new RegExp(`Sitemap: ${BASE}sitemap.xml`));
 const sitemap=fs.readFileSync(path.join(SITE,'sitemap.xml'),'utf8');
 assert.match(sitemap,new RegExp(`<loc>${BASE}</loc>`));
 for(const m of sitemap.matchAll(/<image:loc>([^<]+)<\/image:loc>/g))assert.ok(fs.existsSync(path.join(SITE,m[1].replace(BASE,''))),m[1]);
 // Palette screenshots are chosen at runtime; every combination must exist.
 for(const theme of ['linen','sage','stone','ocean','plum','contrast'])for(const mode of ['light','dark'])assert.ok(fs.existsSync(path.join(SITE,`img/palette-${theme}-${mode}.webp`)),theme+mode);
});

test('the website loads no third-party code and never household configuration',()=>{
 const sources=['index.html','404.html','js/site.js','css/site.css'].map(f=>fs.readFileSync(path.join(SITE,f),'utf8')).join('\n');
 assert.doesNotMatch(sources,/<script[^>]+src="https?:/);
 assert.doesNotMatch(sources,/<link[^>]+rel="stylesheet"[^>]+href="https?:/);
 assert.doesNotMatch(sources,/@import|fetch\(|XMLHttpRequest|local-config|demo-photos\.js/);
 assert.ok(!shared.some(name=>/local-config|demo|photos/.test(name)));
 for(const img of html.matchAll(/<img\b[^>]*>/g))assert.match(img[0],/\balt="/,'img without alt: '+img[0]);
});

test('Netlify CSP allows exactly the inline scripts the page runs',()=>{
 const crypto=require('node:crypto'),toml=fs.readFileSync(path.join(ROOT,'netlify.toml'),'utf8');
 const csp=toml.match(/Content-Security-Policy = "([^"]+)"/)[1];
 const inline=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>"'sha256-"+crypto.createHash('sha256').update(m[1]).digest('base64')+"'");
 for(const hash of inline)assert.ok(csp.includes(hash),'CSP is missing '+hash);
 assert.doesNotMatch(csp,/script-src[^;]*'unsafe-inline'/);
 assert.match(toml,/command = "python3 scripts\/website.py stage _site"/);
});


test('generated help pages, links, sections and local search stay consistent',()=>{
 const {execFileSync}=require('node:child_process');
 execFileSync('python3',['scripts/site_docs.py','--check'],{cwd:ROOT});
 const articles=JSON.parse(fs.readFileSync(path.join(SITE,'docs/content.json'),'utf8')).articles;
 const index=JSON.parse(fs.readFileSync(path.join(SITE,'docs/search.json'),'utf8'));
 assert.equal(index.length,articles.length);
 for(const slug of ['',...articles.map(a=>a.slug+'/')]){
  const source=fs.readFileSync(path.join(SITE,'docs',slug,'index.html'),'utf8');
  assert.equal((source.match(/<h1[ >]/g)||[]).length,1);
  assert.match(source,/<link rel="canonical" href="https:\/\/skylit.sachasayan.com\/docs\//);
  assert.doesNotMatch(source,/<script[^>]+src="https?:|<script>|local-config|demo-photos/);
  const ids=[...source.matchAll(/ id="([^"]+)"/g)].map(m=>m[1]);
  assert.equal(new Set(ids).size,ids.length,'unique section anchors');
  for(const [,ref] of source.matchAll(/(?:href|src)="([^"]+)"/g)){
   if(ref.startsWith('https:'))continue;
   if(ref.startsWith('#')){assert.ok(ids.includes(ref.slice(1)),ref);continue;}
   assert.ok(ref.startsWith('/'),'root-relative doc links');
   assert.ok(fs.existsSync(path.join(SITE,ref)),ref);
  }
 }
 for(const entry of index){assert.ok(entry.url.startsWith('/docs/'));assert.ok(fs.existsSync(path.join(SITE,entry.url,'index.html')));assert.ok(entry.text.length>100);}
 const script=fs.readFileSync(path.join(SITE,'js/docs.js'),'utf8');
 assert.deepEqual([...script.matchAll(/fetch\(([^)]+)\)/g)].map(m=>m[1]),["'/docs/search.json'"]);
 assert.doesNotMatch(script,/innerHTML|localStorage|https?:/);
});
