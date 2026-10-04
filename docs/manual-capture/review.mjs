import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync, writeFileSync } from 'node:fs';
const here=path.dirname(fileURLToPath(import.meta.url));
const require=createRequire('C:/Users/kristoffer/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const {chromium}=require('playwright');
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try {
 const page=await browser.newPage({viewport:{width:1000,height:1300},deviceScaleFactor:1.5});
 page.on('pageerror',e=>console.error(e.message));
 await page.goto('http://127.0.0.1:4317/review');await page.waitForFunction(()=>window.reviewReady);
 const pages=page.locator('section.docx');
 const count=await pages.count();
 const out=path.resolve(here,'../manual-review/browser-render');mkdirSync(out,{recursive:true});
 const report=[];
 for(let i=0;i<count;i++){
  const element=pages.nth(i);
  report.push(await element.evaluate(e=>({height:e.clientHeight,scrollHeight:e.scrollHeight,title:e.innerText.split('\n')[0],articleHeight:e.querySelector('article')?.getBoundingClientRect().height,images:e.querySelectorAll('img').length})));
  await element.screenshot({path:path.join(out,`page-${i+1}.png`)});
 }
 writeFileSync(path.join(out,'layout.json'),JSON.stringify({method:'DOCX HTML preview in Chromium. This is not Microsoft Word pagination.',count,pages:report},null,2));
 console.log(JSON.stringify({count,pages:report},null,2));
} finally {await browser.close();}
