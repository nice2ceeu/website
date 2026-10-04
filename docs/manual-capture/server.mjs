import http from 'node:http';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'../..');
const types={'.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.js':'text/javascript','.css':'text/css','.woff2':'font/woff2','.docx':'application/vnd.openxmlformats-officedocument.wordprocessingml.document'};
http.createServer((req,res)=>{
 const url=new URL(req.url,'http://127.0.0.1');
 if(url.pathname.startsWith('/api/')){res.writeHead(405);res.end('Manual capture is read only');return;}
 if(url.pathname==='/manual.docx'){res.end(readFileSync(path.join(root,'docs/Lightmare_PH_Admin_Visual_Manual.docx')));return;}
 if(url.pathname==='/review'){
  res.setHeader('Content-Type','text/html; charset=utf-8');
  res.end('<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0"><div id="preview"></div><script type="module" src="/capture/review.js"></script></body></html>');return;
 }
 if(url.pathname==='/'){
  res.setHeader('Content-Type','text/html; charset=utf-8');
  res.end('<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="/styles/globals.css"></head><body><div id="root"></div><script src="/capture/app.js"></script></body></html>');return;
 }
 const filepath=url.pathname.startsWith('/capture/')?path.join(here,url.pathname.slice(9)):url.pathname.startsWith('/styles/')?path.join(root,url.pathname):path.join(root,'public',url.pathname);
 if(!path.resolve(filepath).startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
 try{res.setHeader('Content-Type',types[path.extname(filepath)]||'application/octet-stream');res.end(readFileSync(filepath));}catch{res.writeHead(404);res.end();}
}).listen(4317,'127.0.0.1',()=>console.log('Isolated capture preview listening on http://127.0.0.1:4317'));
