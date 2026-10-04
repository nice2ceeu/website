import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';
const here=path.dirname(fileURLToPath(import.meta.url));
const require=createRequire('C:/Users/kristoffer/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const { chromium }=require('playwright');
const out=path.resolve(here,'../manual-assets/screenshots');mkdirSync(out,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const page=await browser.newPage({viewport:{width:1280,height:800},deviceScaleFactor:1.5});
page.on('pageerror',e=>console.error(e.message));
async function open(screen){await page.goto('http://127.0.0.1:4317/?screen='+screen);await page.locator('h1').waitFor();await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(400);}
async function shot(name,locator=null){
 if(locator) await locator.screenshot({path:path.join(out,name+'.png')});
 else await page.screenshot({path:path.join(out,name+'.png')});
 console.log('Captured '+name);
}
try {
 await open('login');await shot('login');
 await open('overview');await shot('overview');
 await open('orders');await shot('orders');
 await page.getByRole('button',{name:'Details'}).first().click();await shot('order-details');
 await shot('shipping-adjustment',page.locator('.order-panel > section'));
 await shot('order-status',page.locator('.order-panel'));
 const statusBox=await page.locator('.order-panel > label').boundingBox();
 await page.locator('.order-panel > label').scrollIntoViewIfNeeded();
 const statusTop=await page.locator('.order-panel > label').boundingBox();
 const statusNote=await page.locator('.order-panel > .form-note').boundingBox();
 await page.screenshot({path:path.join(out,'order-actions.png'),clip:{x:statusTop.x-10,y:statusTop.y-12,width:Math.max(statusTop.width,statusNote.width)+20,height:statusNote.y+statusNote.height-statusTop.y+24}});
 await open('products');await shot('products');
 await page.getByRole('button',{name:'Edit',exact:true}).first().click();await shot('product-editor');
 await shot('product-form',page.locator('.product-editor'));
 await page.getByText('Available sizes',{exact:true}).scrollIntoViewIfNeeded();await shot('product-image-visibility');
 await shot('product-lower-form',page.locator('.product-editor > fieldset'));
 const productSizes=await page.locator('.product-editor > fieldset').boundingBox();
 const productSave=await page.getByRole('button',{name:'Save product',exact:true}).boundingBox();
 await page.screenshot({path:path.join(out,'product-save-controls.png'),clip:{x:productSizes.x-10,y:productSizes.y-10,width:productSizes.width+20,height:productSave.y+productSave.height-productSizes.y+20}});
 await open('products');await page.getByRole('button',{name:'Delete',exact:true}).first().click();await shot('product-delete',page.locator('dialog'));
 await open('content');await shot('landing-hero');
 await page.getByText('Horizontal image crop:',{exact:false}).scrollIntoViewIfNeeded();await shot('hero-controls');
 await shot('hero-form',page.locator('details').filter({has:page.locator('summary').filter({hasText:'Hero image, heading & button'})}).locator('.form-grid'));
 await page.getByRole('button',{name:'Shopping help',exact:true}).click();await shot('shopping-help');
 await page.locator('summary').filter({hasText:'Size measurements (cm)'}).click();await shot('size-measurements',page.locator('details').filter({has:page.locator('summary').filter({hasText:'Size measurements (cm)'})}));
 await page.locator('summary').filter({hasText:'FAQ questions & answers'}).click();await shot('faqs',page.locator('details').filter({has:page.locator('summary').filter({hasText:'FAQ questions & answers'})}));
 await shot('faq-entry',page.locator('details').filter({has:page.locator('summary').filter({hasText:'FAQ questions & answers'})}).locator('.cms-item').first());
 await page.getByRole('button',{name:'Contact & socials',exact:true}).click();await shot('contact-socials');
 await shot('contact-form',page.locator('details').filter({has:page.locator('summary').filter({hasText:'Contact & social links'})}));
 await page.getByRole('button',{name:'Settings',exact:true}).click();await shot('landing-settings');
 await page.setViewportSize({width:1280,height:1500});
 await open('payments');await shot('payments');await shot('payments-form',page.locator('.payment-settings-form'));
 await open('shipping');await shot('shipping');await shot('shipping-form',page.locator('.payment-settings-form'));
 await page.setViewportSize({width:1280,height:800});
 await open('settings');await shot('settings');
} finally {await browser.close();}
