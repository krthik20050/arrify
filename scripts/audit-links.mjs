import{readFileSync,writeFileSync}from'node:fs';import{load}from'cheerio';import{byHandle,collections}from'../lib/catalog.mjs';import{cleanDocument}from'../lib/html.mjs';
const routes=JSON.parse(readFileSync('reference/routes.json')),known=new Set(Object.keys(routes)),collectionHandles=new Set(collections().map(c=>c.handle));
const missing=new Map();
for(const [source,file]of Object.entries(routes)){
 const $=cleanDocument(readFileSync(file,'utf8'));$('a[href]').each((i,e)=>{const href=$(e).attr('href');if(!href?.startsWith('/')||href.startsWith('//'))return;const url=new URL(href,'http://localhost'),p=url.pathname;
 if(known.has(p)||['/','/search','/collections','/cart','/checkout'].includes(p)||p.startsWith('/account')||p==='/pages/track-your-order'||p.startsWith('/cdn/'))return;
 if(p.includes('/products/')&&byHandle.has(p.split('/products/').pop()))return;
 if(p.startsWith('/collections/')&&(collectionHandles.has(p.split('/')[2])||p==='/collections/all'))return;
 missing.set(p,[...(missing.get(p)||[]),source]);
 });
}
writeFileSync('reference/link-audit.json',JSON.stringify({checkedRoutes:known.size,missing:Object.fromEntries(missing)},null,2));console.log(JSON.stringify({checkedRoutes:known.size,missing:Object.fromEntries(missing)},null,2));
