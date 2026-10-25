// Capture a public Shopify catalog separately from the sticker dataset.
// Usage: node scripts/sync-posters.mjs --source https://www.example.com
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {mkdir,writeFile,readFile,rename,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
const exec=promisify(execFile);
const sourceArg=process.argv.indexOf('--source');
if(sourceArg<0||!process.argv[sourceArg+1])throw new Error('Pass the confirmed storefront with --source https://store.example');
const sourceUrl=new URL(process.argv[sourceArg+1]);
if(sourceUrl.protocol!=='https:'||sourceUrl.username||sourceUrl.password||sourceUrl.pathname!=='/'||sourceUrl.search||sourceUrl.hash)throw new Error('Source must be a plain HTTPS storefront origin.');
const source=sourceUrl.origin,root=path.resolve(import.meta.dirname,'..'),output=path.join(root,'data','posters'),assets=path.join(root,'public','poster-assets');
await mkdir(output,{recursive:true});await mkdir(assets,{recursive:true});
const checkpointRoot=path.join(root,'artifacts','poster-import-cache');await mkdir(checkpointRoot,{recursive:true});
const observations=[];
async function fetchJSON(url){
 const {stdout}=await exec('curl.exe',['--location','--fail','--silent','--show-error','--retry','2','--max-time','60',url],{maxBuffer:64*1024*1024,windowsHide:true});
 return JSON.parse(stdout);
}
async function paginate(endpoint,key){
 const checkpoint=path.join(checkpointRoot,'endpoint-'+createHash('sha256').update(source+endpoint).digest('hex').slice(0,20)+'.json');
 try{if(process.argv.includes('--fresh'))throw new Error('Fresh capture requested');const cached=JSON.parse(await readFile(checkpoint,'utf8'));observations.push(cached.observation);return cached.values;}catch{}
 const values=[],seen=new Set(),pageCounts=[];
 for(let page=1;page<=1000;page++){
  const url=`${source}${endpoint}?limit=250&page=${page}`,data=await fetchJSON(url),batch=data[key];
  if(!Array.isArray(batch))throw new Error(`Missing ${key} at ${url}`);
  pageCounts.push(batch.length);
  for(const item of batch){if(seen.has(item.id))throw new Error(`Repeated ID on ${url}`);seen.add(item.id);values.push(item);}
  if(batch.length===0){const observation={endpoint,count:values.length,pageCounts,terminalEmptyPage:true};observations.push(observation);await writeFile(checkpoint,JSON.stringify({observation,values}));console.log(`${endpoint}: ${values.length}`);return values;}
  await new Promise(resolve=>setTimeout(resolve,150));
 }
 throw new Error(`Pagination limit reached for ${endpoint}`);
}
const imageMap={},failures=[];
async function downloadImages(urls){
let cursor=0;
await Promise.all(Array.from({length:24},async()=>{
 while(cursor<urls.length){
  const url=urls[cursor++];if(cursor%100===0)console.log(`Images: ${cursor}/${urls.length}`);
  try{
   const parsed=new URL(url);if(parsed.protocol!=='https:'||parsed.hostname!=='cdn.shopify.com')throw new Error('Unrecognized image host');
   const ext=path.extname(parsed.pathname).toLowerCase();if(!['.jpg','.jpeg','.png','.webp','.gif','.avif'].includes(ext))throw new Error('Unsupported image format');
   const name=createHash('sha256').update(url).digest('hex').slice(0,24)+ext,file=path.join(assets,name);
   const existing=await stat(file).catch(()=>null);
   if(!existing?.size){let lastError;for(let attempt=0;attempt<3;attempt++){try{const response=await fetch(url,{headers:{Accept:ext==='.webp'?'image/webp':'image/*'},signal:AbortSignal.timeout(180000)});if(!response.ok)throw new Error(`Image HTTP ${response.status}`);if(!response.headers.get('content-type')?.startsWith('image/'))throw new Error('Image response has invalid content type');const bytes=Buffer.from(await response.arrayBuffer());if(!bytes.length)throw new Error('Empty image response');await writeFile(file+'.partial',bytes);await rename(file+'.partial',file);lastError=null;break;}catch(error){lastError=error;await new Promise(resolve=>setTimeout(resolve,500*(attempt+1)));}}if(lastError)throw lastError;}
   imageMap[url]='/poster-assets/'+name;
  }catch(error){failures.push({url,error:error.message.slice(0,200)});}
 }
}));
}
const products=await paginate('/products.json','products');
const rootImages=downloadImages([...new Set(products.flatMap(p=>(p.images||[]).map(i=>i.src)))]);
const collections=await paginate('/collections.json','collections');
const byId=new Map(products.map(p=>[p.id,p]));
let collectionCursor=0;
await Promise.all(Array.from({length:5},async()=>{while(collectionCursor<collections.length){const collection=collections[collectionCursor++];
 const members=await paginate(`/collections/${encodeURIComponent(collection.handle)}/products.json`,'products');
 collection.product_ids=members.map(p=>p.id);
 for(const p of members)if(!byId.has(p.id))byId.set(p.id,p);
}}));
const catalog=[...byId.values()];
// Save the source snapshot before downloading assets so interrupted downloads are resumable.
await writeFile(path.join(output,'catalog.json'),JSON.stringify({source,products:catalog}));
await writeFile(path.join(output,'collections.json'),JSON.stringify({source,collections}));
const urls=[...new Set(catalog.flatMap(p=>(p.images||[]).map(i=>i.src)))];
await rootImages;
await downloadImages(urls.filter(url=>!imageMap[url]));
await writeFile(path.join(output,'images.json'),JSON.stringify(imageMap));
const unresolved=failures.filter(failure=>!imageMap[failure.url]);
const manifest={source,capturedAt:new Date().toISOString(),productCount:catalog.length,collectionCount:collections.length,imageCount:urls.length,downloadedImageCount:Object.keys(imageMap).length,failures:unresolved,observations,limitations:['Public storefront snapshot only.','Prices and stock may change.','Product photos may include room scenes or multiple panels; they are not necessarily print-ready artwork.']};
await writeFile(path.join(output,'manifest.json'),JSON.stringify(manifest,null,2));
console.log(JSON.stringify({products:catalog.length,collections:collections.length,images:urls.length,downloaded:Object.keys(imageMap).length,failed:unresolved.length}));
if(unresolved.length)process.exitCode=1;
