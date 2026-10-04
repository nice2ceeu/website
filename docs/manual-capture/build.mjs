import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'../..');
const require=createRequire(path.join(root,'package.json'));
const { build }=require('esbuild');
await build({entryPoints:[path.join(here,'entry.tsx')],outfile:path.join(here,'app.js'),bundle:true,platform:'browser',jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'},plugins:[{
  name:'isolated-manual-ui',setup(build){
    build.onResolve({filter:/^next\/(router|link|head)$/},args=>({path:path.join(here,args.path.split('/')[1]+'.tsx')}));
    build.onLoad({filter:/pages[\\/]admin[\\/].*\.tsx$/},args=>({contents:readFileSync(args.path,'utf8').split('export const getServerSideProps')[0],loader:'tsx'}));
  }
}]});
console.log('Compiled current admin UI for isolated capture.');
