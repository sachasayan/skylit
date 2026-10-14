import {readFile,writeFile,readdir} from 'node:fs/promises';
import {build} from 'esbuild';
const common={bundle:true,minify:true,target:['chrome95'],format:'iife',platform:'browser',legalComments:'linked',define:{'process.env.NODE_ENV':'"production"'},logLevel:'info'};
await build({...common,entryPoints:['src/main.tsx'],outfile:'web/react-ui.js'});
await build({...common,entryPoints:['src/pages/phone.tsx'],outfile:'web/manage-react.js'});
// PhoneManagement intentionally serves only a bounded local bundle.
if((await readFile('web/manage-react.js')).byteLength>262144)throw Error('Phone bundle exceeds its native 256 KiB read bound');
// Build outputs are ordinary allowlisted local assets. No runtime CDN or server.

const lock=JSON.parse(await readFile('package-lock.json','utf8')),notices=[];
for(const [folder,entry] of Object.entries(lock.packages)){
 if(!folder||entry.dev)continue;
 const info=JSON.parse(await readFile(folder+'/package.json','utf8'));
 const file=(await readdir(folder)).find(name=>/^license/i.test(name));
 const fallback=info.name.startsWith('@radix-ui/')?'src/licenses/radix-LICENSE.txt':null;
 if(!file&&!fallback)throw Error('Missing dependency license: '+info.name);
 notices.push(info.name+' '+info.version+'\n'+await readFile(file?folder+'/'+file:fallback,'utf8'));
}
await writeFile('web/frontend-LICENSES.txt',notices.join('\n\n'));
