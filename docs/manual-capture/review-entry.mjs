import { renderAsync } from '../.docx-tools/node_modules/docx-preview/dist/docx-preview.mjs';
await renderAsync(await (await fetch('/manual.docx')).arrayBuffer(),document.getElementById('preview'),null,{breakPages:true,ignoreLastRenderedPageBreak:true,useBase64URL:true});
await document.fonts.ready;
await Promise.all([...document.images].map(img=>img.decode().catch(()=>{})));
window.reviewReady=true;
