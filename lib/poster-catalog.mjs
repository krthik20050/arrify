import {readFileSync,statSync,existsSync} from 'node:fs';
let cache,stamp;
export function posterCatalog(){
 const base=new URL('../data/posters/',import.meta.url),manifestUrl=new URL('manifest.json',base);
 const mtime=statSync(manifestUrl).mtimeMs;if(cache&&stamp===mtime)return cache;
 const read=name=>JSON.parse(readFileSync(new URL(name,base),'utf8'));
 const raw=read('catalog.json'),images=read('images.json'),manifest=read('manifest.json');
 const products=raw.products.map(p=>({id:`posterized-${p.id}`,sourceId:p.id,title:p.title,handle:p.handle,type:p.product_type||'Catalog item',tags:p.tags||[],url:`https://www.posterized.in/products/${encodeURIComponent(p.handle)}`,images:(p.images||[]).map(i=>images[i.src]).filter(Boolean),variants:p.variants.map(v=>({id:String(v.id),title:v.title,price:Number(v.price),available:Boolean(v.available)}))})).filter(p=>p.images.length);
 for(const product of products){const image=product.images[0],thumb=image.replace(/\.[^.]+$/,'.webp').replace('/poster-assets/','/poster-assets/thumbs/');product.thumbnail=existsSync(new URL('../public'+thumb,import.meta.url))?thumb:image;}
 const ids=new Set(products.map(p=>p.sourceId));
 cache={source:raw.source,capturedAt:manifest.capturedAt,manifest:{productCount:manifest.productCount,imageCount:manifest.imageCount,downloadedImageCount:manifest.downloadedImageCount,failedImages:manifest.failures.length},products,collections:read('collections.json').collections.map(c=>({handle:c.handle,title:c.title,productIds:c.product_ids.filter(id=>ids.has(id)).map(id=>`posterized-${id}`)}))};stamp=mtime;return cache;
}
