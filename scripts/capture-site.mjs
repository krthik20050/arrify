import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {load} from 'cheerio';
const run=promisify(execFile), origin='https://www.stickitup.xyz';
for(const d of ['reference/pages','reference/theme','public/assets']) await fs.mkdir(d,{recursive:true});
const routes={}, assets={}, scripts={}, failures=[];
const absolute=u=>new URL(u,origin).href;
const filename=u=>crypto.createHash('sha256').update(u).digest('hex').slice(0,12)+'-'+path.basename(new URL(u).pathname).replace(/[^a-zA-Z0-9._-]/g,'_');
async function download(url,file){try {await run('curl.exe',['--noproxy','*','-L','--fail','--silent','--show-error','--max-time','90','--retry','2',url,'-o',file],{maxBuffer:1024*1024});return true;}catch(e){failures.push({url,error:e.message.slice(0,240)});return false;}}
async function batch(items,fn){let n=0;await Promise.all(Array.from({length:3},async()=>{while(n<items.length){const item=items[n++];await fn(item);}}));}
const home=await fs.readFile('homepage.html','utf8'), $=load(home);
const paths=[...new Set($('a[href]').map((i,e)=>$(e).attr('href')).get().map(u=>{try{return new URL(u,origin);}catch{return null;}}).filter(u=>u?.origin===origin&&/^\/(pages|policies|blogs)\//.test(u.pathname)).map(u=>u.pathname))];
paths.push('/products/wasted-sticker','/products/secret-invasion-t-shirt','/collections/buy-vinyl-stickers-online-india','/collections/t-shirt','/cart');
await fs.writeFile('reference/pages/home.html',home);routes['/']='reference/pages/home.html';
await batch(paths,async p=>{const file='reference/pages/'+encodeURIComponent(p)+'.html';if(await download(origin+p,file)){routes[p]=file;console.log('Page',p);}});
await fs.writeFile('reference/routes.json',JSON.stringify(routes,null,2));
const css=new Set(),js=new Set(),images=new Set();
for(const [p,file] of Object.entries(routes)){
 const c=load(await fs.readFile(file,'utf8'));
 c('link[href]').each((i,e)=>{const u=c(e).attr('href');if(/\.css(?:\?|$)/.test(u))css.add(absolute(u));});
 c('script[src]').each((i,e)=>{const u=absolute(c(e).attr('src'));if(u.includes('/cdn/shop/t/'))js.add(u);});
 if(p==='/')c('img[src]').each((i,e)=>{const u=c(e).attr('src');if(i<7||/banner|logo|payment|icon|custom/i.test(u))images.add(absolute(u));});
}
await batch([...css],async u=>{const file='public/assets/'+filename(u);if(await download(u,file)){assets[u]='/assets/'+filename(u);let content=await fs.readFile(file,'utf8');content=content.replace(/url\(\s*(['"]?)([^)'"\s]+)\1\s*\)/g,(all,q,value)=>/^(data:|#)/.test(value)?all:`url("${new URL(value,u).href}")`);await fs.writeFile(file,content);console.log('CSS',path.basename(file));}});
await batch([...images],async u=>{const file='public/assets/'+filename(u);if(await download(u,file))assets[u]='/assets/'+filename(u);});
await batch([...js],async u=>{const file='reference/theme/'+filename(u);if(await download(u,file))scripts[u]=file;});
await fs.writeFile('reference/assets.json',JSON.stringify(assets,null,2));
await fs.writeFile('reference/theme-scripts.json',JSON.stringify(scripts,null,2));
await fs.writeFile('reference/capture-report.json',JSON.stringify({capturedAt:new Date().toISOString(),routeCount:Object.keys(routes).length,assetCount:Object.keys(assets).length,themeScriptCount:Object.keys(scripts).length,failures},null,2));
console.log(JSON.stringify({routes:Object.keys(routes),assets:Object.keys(assets).length,scripts:Object.keys(scripts).length,failures},null,2));
