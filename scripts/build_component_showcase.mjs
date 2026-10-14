import {build} from 'esbuild';
await build({entryPoints:['src/components/showcase.tsx'],outfile:'docs/reviews/2026-10-13-component-system/showcase.js',bundle:true,minify:true,target:['chrome95'],format:'iife',legalComments:'linked',define:{'process.env.NODE_ENV':'"production"'}});
