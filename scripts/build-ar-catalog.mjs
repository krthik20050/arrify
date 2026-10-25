import sharp from 'sharp';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';

import {products} from '../lib/catalog.mjs';
import {arEligible,makeStickerGlb} from '../lib/ar.mjs';
import {prepareArtwork,ARTWORK_VERSION} from '../lib/ar-artwork.mjs';
import {makeStickerUsdz} from '../lib/ar-usdz.mjs';
const version=`${ARTWORK_VERSION}-native-v3-fit-box`,manifestFile=new URL('../data/ar-catalog.json',import.meta.url),logFile=new URL('../artifacts/ar-catalog-progress.json',import.meta.url);
await mkdir(new URL('../artifacts/',import.meta.url),{recursive:true});
let manifest={};try{manifest=JSON.parse(await readFile(manifestFile,'utf8'));}catch{}
const args=process.argv.slice(2),wanted=args.filter(v=>!v.startsWith('--')),limit=Number(args.find(v=>v.startsWith('--limit='))?.split('=')[1])||Infinity;
const output=new URL('../public/ar-prepared/',import.meta.url);await mkdir(output,{recursive:true});
const cache=new URL('../artifacts/ar-catalog-source/',import.meta.url);await mkdir(cache,{recursive:true});
let previous={};try{previous=JSON.parse(await readFile(new URL('metadata.json',cache),'utf8'));}catch{}
const priority=['compass-sticker-1','compass-sticker','limited-edition-sticker-1','wasted-sticker'];
function publishedFitBox(p){
 const text=(p.body_html||'').replace(/<[^>]*>/g,' ').replace(/&times;|&#215;/gi,'×').replace(/&nbsp;/gi,' ');
 const match=text.match(/(?:fits\s+within\s+(?:a\s+)?)?(\d+(?:\.\d+)?)\s*(?:x|×)\s*(\d+(?:\.\d+)?)\s*(?:inches|inch|in\b|\")/i);
 if(match)return {widthMm:Number(match[1])*25.4,heightMm:Number(match[2])*25.4,source:'product-description'};
 if(p.product_type==='Bumper Sticker')return {widthMm:203.2,heightMm:203.2,source:'official-bumper-category-listing'};
 // Standard, glitter, holographic, and infinity pages use the standard sticker fit box.
 return {widthMm:76.2,heightMm:76.2,source:'official-standard-sticker-listing'};
}
const queue=products.filter(arEligible).filter(p=>!wanted.length||wanted.includes(p.handle)).sort((a,b)=>(priority.includes(b.handle)?1:0)-(priority.includes(a.handle)?1:0)).slice(0,limit);
let done=0,failed=0,saving=Promise.resolve();const failures=[],started=Date.now();
function save(){const snapshot=JSON.stringify(manifest),progress=JSON.stringify({version,total,done,failed,seconds:Math.round((Date.now()-started)/1000),failures},null,2);saving=saving.then(async()=>{await writeFile(manifestFile,snapshot);await writeFile(logFile,progress);});return saving;}
async function worker(){for(;;){const p=queue.shift();if(!p)return;if(manifest[p.handle]?.version===version){done++;continue;}
 try{let artwork;try{const raw=await readFile(new URL(`${p.handle}.png`,cache)),meta=await sharp(raw).metadata();artwork={png:raw,width:meta.width,height:meta.height,source:{index:previous[p.handle]?.source??0},cleanup:previous[p.handle]?.cleanup??{reason:'Retained prepared source'}};}catch{artwork=await prepareArtwork(p,{maxDimension:640});await writeFile(new URL(`${p.handle}.png`,cache),artwork.png);}
  let optimized;for(const size of [512,448,384,320,256,192]){optimized=await sharp(artwork.png).resize({width:size,height:size,fit:'inside',withoutEnlargement:true}).png({palette:true,colours:128,dither:0,quality:65,effort:4}).toBuffer();if(optimized.length<=64000)break;}
  if(optimized.length>64000)throw new Error('Artwork cannot meet the cache budget.');artwork.png=optimized;
  const fitBox=publishedFitBox(p),scale=Math.min(fitBox.widthMm/artwork.width,fitBox.heightMm/artwork.height),widthMm=artwork.width*scale,heightMm=artwork.height*scale;
  const digest=createHash('sha256').update(artwork.png).update(version).digest('hex').slice(0,16),base=`${p.id}-${digest}`;
  const glb=makeStickerGlb(artwork.png,widthMm,heightMm).bytes,usdz=makeStickerUsdz(artwork.png,widthMm,heightMm);
  await Promise.all([writeFile(new URL(`${base}.glb`,output),glb),writeFile(new URL(`${base}.usdz`,output),usdz),writeFile(new URL(`${base}.png`,output),artwork.png)]);
  manifest[p.handle]={glb:`/ar-prepared/${base}.glb`,usdz:`/ar-prepared/${base}.usdz`,texture:`/ar-prepared/${base}.png`,widthMm,heightMm,fitBoxMm:{width:fitBox.widthMm,height:fitBox.heightMm},sizeSource:fitBox.source,sizeStatus:'fit-box-preview-estimate',version,source:artwork.source.index,cleanup:artwork.cleanup,quality:'automated-cutout-not-print-master'};
  done++;
 }catch(error){failed++;failures.push({handle:p.handle,error:error.message});}
 if((done+failed)%10===0){await save();console.log(JSON.stringify({done,failed,remaining:queue.length}));}
}}
const total=queue.length;await Promise.all(Array.from({length:32},worker));await save();console.log(JSON.stringify({total,done,failed}));
