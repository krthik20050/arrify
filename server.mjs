import {posterCatalog} from './lib/poster-catalog.mjs';
import {posterPage} from './lib/posters.mjs';
import {readyModel,arAssetOrigin} from './lib/ar-ready.mjs';
import QRCode from 'qrcode';
import {prepareArtwork} from './lib/ar-artwork.mjs';
import {prepareStored,modelStored,nativeStored,createStoredHandoff,handoffStored,qrStored} from './lib/ar-storage.mjs';
import {createHandoff,getHandoff,handoffQr,phonePreviewOrigin,validPhoneOrigin} from './lib/ar-handoff.mjs';
import {arProduct,registerModel,getModel} from './lib/ar.mjs';
import http from 'node:http';
import {discover} from './lib/taste.mjs';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {products,byHandle,collections,selectProducts,quote} from './lib/catalog.mjs';
import {homePage,collectionPage,productPage,capturedPage,collectionIndex,localPage,notFound,hasCaptured,card,image,studioPage,discoveryPage,arPage} from './lib/render.mjs';
const root=path.dirname(fileURLToPath(import.meta.url));
const mime={'.css':'text/css','.js':'text/javascript','.json':'application/json','.txt':'text/plain; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.jpg':'image/jpeg','.png':'image/png','.jpeg':'image/jpeg','.gif':'image/gif','.avif':'image/avif','.woff2':'font/woff2','.woff':'font/woff','.glb':'model/gltf-binary','.usdz':'model/vnd.usdz+zip'};
const security={
 'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer',
 'Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https:; img-src 'self' https: data:; font-src 'self' https: data:; connect-src 'self'; form-action 'self'; frame-src 'none'; base-uri 'self'; object-src 'none'"
};
// model-viewer decodes textures from blob URLs and initializes a bundled WASM helper.
// Permit these only on the AR page; JavaScript string evaluation remains blocked.
const arSecurity={...security,'Content-Security-Policy':security['Content-Security-Policy'].replace("script-src 'self'", "script-src 'self' 'wasm-unsafe-eval'").replace("img-src 'self' https: data:","img-src 'self' https: data: blob:").replace("connect-src 'self'", "connect-src 'self' blob: data: https://*.public.blob.vercel-storage.com"+(arAssetOrigin?" "+arAssetOrigin:""))};
const studioSecurity={...security,'Content-Security-Policy':security['Content-Security-Policy'].replace("connect-src 'self'","connect-src 'self'"+(arAssetOrigin?" "+arAssetOrigin:""))};
async function body(req,limit=64000){
 if(req.body!==undefined){const raw=typeof req.body==='string'?req.body:Buffer.isBuffer(req.body)?req.body.toString('utf8'):JSON.stringify(req.body);if(Buffer.byteLength(raw)>limit)throw new Error('Request is too large.');return JSON.parse(raw||'{}');}
 let raw='';for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>limit)throw new Error('Request is too large.');}return JSON.parse(raw||'{}');
}
export function requestHandler(options={}){return async(req,res)=>{
 const send=(status,data,type='text/html; charset=utf-8')=>{const page=req.url.split('?')[0];res.writeHead(status,{...(page==='/pages/try-live'?arSecurity:page==='/pages/sticker-studio'?studioSecurity:security),'Content-Type':type});res.end(data);};
 const json=(status,data)=>send(status,JSON.stringify(data),'application/json; charset=utf-8');
 try{
   const url=new URL(req.url,'http://localhost');
   const route=decodeURIComponent(url.pathname);
   if((req.method==='GET'||req.method==='HEAD')&&arAssetOrigin&&route.startsWith('/ar-prepared/')){
     res.writeHead(302,{...security,Location:arAssetOrigin+route,'Cache-Control':'public, max-age=300'});return res.end();
   }
   if(req.method==='GET'&&/^\/api\/ar\/(ready-link|ready-qr)\/[^/]+$/.test(route)){
     const handle=route.split('/').pop();if(!readyModel(handle))return json(404,{error:'This sticker preview is not ready.'});
     const origin=validPhoneOrigin(options.phoneOrigin===undefined?`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL||process.env.VERCEL_URL||'stickitup-ar-demo.vercel.app'}`:options.phoneOrigin);
     if(!origin)return json(409,{error:'An HTTPS phone preview is required.'});
     const link=`${origin}/pages/try-live?product=${encodeURIComponent(handle)}`;
     if(route.includes('/ready-qr/'))return send(200,await QRCode.toBuffer(link,{type:'png',width:320,margin:4,errorCorrectionLevel:'M'}),'image/png');
     return json(200,{url:link,qr:`/api/ar/ready-qr/${encodeURIComponent(handle)}`,expiresAt:null,requiresLaptop:false});
   }
   if(req.method==='GET'&&route==='/api/ar/handoff-config'){
     const origin=options.phoneOrigin===undefined?(process.env.VERCEL?validPhoneOrigin(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL||process.env.VERCEL_URL}`):await phonePreviewOrigin()):validPhoneOrigin(options.phoneOrigin);return json(200,{enabled:Boolean(origin),origin});
   }
   if(req.method==='POST'&&route==='/api/ar/handoffs'){
     const origin=options.phoneOrigin===undefined?(process.env.VERCEL?validPhoneOrigin(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL||process.env.VERCEL_URL}`):await phonePreviewOrigin()):validPhoneOrigin(options.phoneOrigin);
     if(!origin)return json(409,{error:'Phone preview is not configured. Start the HTTPS phone preview, then retry.'});
     try{return json(200,await createStoredHandoff(await body(req),origin));}catch(error){return json(422,{error:error.message});}
   }
   if(req.method==='GET'&&/^\/api\/ar\/handoffs\/[a-f0-9]{32}(\/qr\.png)?$/.test(route)){
     const token=route.split('/')[4];res.setHeader('Cache-Control','no-store');
     if(route.endsWith('/qr.png')){const png=await qrStored(token);return png?send(200,png,'image/png'):json(410,{error:'This QR expired. Create a new one on your laptop.'});}
     const scene=await handoffStored(token);return json(scene?200:410,scene||{error:'This preview expired. Create a new QR on your laptop.'});
   }
   if(req.method==='POST'&&route==='/api/ar/prepare'){
     try{return json(200,await prepareStored(await body(req,4_100_000)));}catch(error){return json(422,{error:error.message});}
   }
   if(req.method==='GET'&&route.startsWith('/api/ar/ready/')){const ready=readyModel(route.split('/').pop());return json(ready?200:404,ready||{error:'This preview is not prepared yet.'});}
   if(req.method==='GET'&&route.startsWith('/api/ar/products/')){const p=arProduct(route.split('/').pop());return json(p?200:404,p||{error:'This product is not supported for sticker AR.'});}
   if(req.method==='GET'&&/^\/api\/ar\/models\/[a-f0-9]{64}\.usdz$/.test(route)){const model=await nativeStored(route.split('/').pop().slice(0,-5));return model?send(200,model,'model/vnd.usdz+zip'):json(410,{error:'Preview expired. Prepare it again.'});}
   if(req.method==='GET'&&/^\/api\/ar\/models\/[a-f0-9]{64}\.glb$/.test(route)){const model=await modelStored(route.split('/').pop().slice(0,-4));return model?send(200,model,'model/gltf-binary'):json(410,{error:'Preview expired. Prepare it again.'});}
   if(req.method==='GET'&&route.startsWith('/api/ar/image/')){
     const p=byHandle.get(route.split('/').pop());if(!arProduct(p?.handle))return json(404,{error:'Sticker not found.'});
     const ready=readyModel(p.handle);
     if(ready?.texture&&!url.searchParams.has('canvas')){res.writeHead(302,{...security,Location:ready.texture,'Cache-Control':'public, max-age=3600'});return res.end();}
     if(ready?.texture){
       // Canvas consumers need same-origin bytes, including after a CDN migration.
       let png;
       if(ready.texture.startsWith('/'))png=await readFile(path.join(root,'public',ready.texture));
       else{const response=await fetch(ready.texture,{signal:AbortSignal.timeout(15000)});if(!response.ok)return json(502,{error:'Sticker artwork temporarily unavailable.'});png=Buffer.from(await response.arrayBuffer());}
       res.setHeader('Cache-Control','public, max-age=3600');return send(200,png,'image/png');
     }
     try{const artwork=await prepareArtwork(p);res.setHeader('Cache-Control','public, max-age=3600');return send(200,artwork.png,'image/png');}catch{return json(502,{error:'Clean sticker artwork could not load. Try again.'});}
   }
   if(req.method==='POST'&&route==='/api/discover'){
     const result=discover((await body(req)).history);
     return json(200,{...result,deck:result.deck.map(p=>({id:p.id,title:p.title,handle:p.handle,image:image(p,600,true),price:Number(p.variants.find(v=>v.available).price)})),feed:undefined,feedHtml:result.feed.map(card).join('')});
   }
   if(req.method==='POST'&&route==='/api/cart/quote'){
     try{return json(200,quote((await body(req)).items));}catch(error){return json(422,{error:error.message});}
   }
   if(req.method!=='GET'&&req.method!=='HEAD')return json(405,{error:'Method not allowed'});
   if(route==='/api/posters/catalog'){try{return json(200,posterCatalog());}catch{return json(503,{error:'Poster catalog is being prepared. Please try again shortly.'});}}
   if(route==='/api/health')return json(200,{ok:true,products:products.length,collections:collections().length});
   if(route==='/api/products')return json(200,selectProducts(url.searchParams,url.searchParams.get('collection')||'all'));
   if(route.startsWith('/api/products/')){const p=byHandle.get(route.split('/').pop());return json(p?200:404,p||{error:'Product not found'});}
   if(route==='/api/collections')return json(200,collections().map(({title,handle,product_count})=>({title,handle,product_count})));
   if(route==='/robots.txt')return send(200,'User-agent: *\nDisallow: /\n','text/plain');
   if(route==='/favicon.ico'){res.writeHead(204);return res.end();}
   const ext=path.extname(route);
   if(ext&&mime[ext]){
     const file=path.resolve(root,'public','.'+route),publicRoot=path.join(root,'public')+path.sep;
     if(!file.startsWith(publicRoot))return send(403,'Forbidden');
     try{await stat(file);return send(200,await readFile(file),mime[ext]);}catch{return send(404,'File not found','text/plain');}
   }
   if(route==='/pages/poster-studio')return send(200,posterPage());
   if(route==='/')return send(200,homePage());
   if(route==='/pages/try-live'){const html=arPage(url);return send(html?200:404,html||notFound());}
   if(route==='/pages/sticker-studio')return send(200,studioPage());
   if(route==='/pages/find-your-vibe')return send(200,discoveryPage());
   if(route==='/collections')return send(200,collectionIndex());
   if(route.startsWith('/products/')||/\/products\//.test(route)){
     const handle=route.split('/products/').pop();const p=byHandle.get(handle);
     return send(p?200:404,p?productPage(p,url):notFound());
   }
   if(route.startsWith('/collections/')||route==='/search'){const result=collectionPage(url);return send(result.status,result.html);}
   if(['/cart','/checkout','/pages/track-your-order'].includes(route)||route.startsWith('/account'))return send(200,localPage(route));
   if(hasCaptured(route))return send(200,capturedPage(route));
   return send(404,notFound());
 }catch(error){console.error(error);return json(500,{error:'Unable to load this page.'});}
};}
export function createServer(options={}){return http.createServer(requestHandler(options));}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const port=Number(process.env.PORT)||3000;
 createServer().listen(port,'0.0.0.0',()=>console.log(`STICK IT UP recreation: http://localhost:${port}`));
}
