import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {products} from '../lib/catalog.mjs';
import {prepareArtwork} from '../lib/ar-artwork.mjs';
const target=new URL('../public/assets/ar-artwork/',import.meta.url);await mkdir(target,{recursive:true});
const handles=process.argv.slice(2),eligible=products.filter(p=>/^(Stickers|Bumper Sticker|Holographic stickers|Glitter Stickers|Infinity Stickers)$/.test(p.product_type)&&p.images.length&&(!handles.length||handles.includes(p.handle)));
let old={};try{old=JSON.parse(await readFile(new URL('manifest.json',target)));}catch{}
const manifest={...old};let failed=0;
for(const p of eligible){try{const result=await prepareArtwork(p);await writeFile(new URL(`${p.handle}.png`,target),result.png);manifest[p.handle]={url:`/assets/ar-artwork/${p.handle}.png`,width:result.width,height:result.height,source:result.source,cleanup:result.cleanup,version:result.version,review:'automated-not-human-approved'};}catch(error){failed++;manifest[p.handle]={error:error.message,review:'needs-review'};console.error(`${p.handle}: ${error.message}`);}await writeFile(new URL('manifest.json',target),JSON.stringify(manifest,null,2));}
console.log(JSON.stringify({processed:eligible.length,failed,manifest:new URL('manifest.json',target).pathname}));
