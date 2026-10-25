import test from 'node:test'; import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';import {load} from 'cheerio';
import {products,byHandle,variants,collections,selectProducts,quote,available,price} from '../lib/catalog.mjs';
import {homePage,productPage,collectionPage,capturedPage,card} from '../lib/render.mjs';
import {createServer} from '../server.mjs';
const manifest=JSON.parse(readFileSync(new URL('../data/manifest.json',import.meta.url)));
test('bumper catalog thumbnails never autoplay reflective GIF backgrounds',()=>{
 const bumper=collections().find(c=>c.handle==='bumper-sticker');
 for(const id of bumper.product_ids){const p=products.find(p=>p.id===id),$=load(card(p));
  $('.local-card-media img').each((i,img)=>{const src=$(img).attr('src');assert.doesNotMatch(src,/\.gif(?:\?|$)/i,`${p.title} renders an animated catalog thumbnail`);if(src.startsWith('/assets/card-stills/'))assert.ok(existsSync(new URL('../public'+src,import.meta.url)),`${p.title} still must exist`);});
 }
});
test('catalog preserves all verified public pages and unique products',()=>{
 assert.equal(products.length,manifest.productCount);assert.equal(new Set(products.map(p=>p.id)).size,products.length);
 assert.equal(new Set(products.map(p=>p.handle)).size,products.length);
 assert.equal(products.reduce((n,p)=>n+p.variants.length,0),manifest.variantCount);
 assert.ok(manifest.observations.every(o=>o.terminalEmptyPage));
});
test('every collection references real catalog products',()=>{const ids=new Set(products.map(p=>p.id));for(const c of collections())for(const id of c.product_ids)assert.ok(ids.has(id),`${c.handle}: ${id}`);});
test('all variant prices are valid currency values',()=>{for(const v of variants.values())assert.ok(Number.isFinite(Number(v.price))&&Number(v.price)>=0);});
test('source sold-out state is retained',()=>assert.equal(products.filter(p=>!available(p)).length,manifest.soldOutProductCount));
test('all 29 genre/style filters have complete source captures and real IDs',()=>{const report=JSON.parse(readFileSync(new URL('../reference/filter-report.json',import.meta.url)));assert.equal(report.length,29);assert.ok(report.every(r=>r.complete));const ids=new Set(products.map(p=>p.id));const filters=JSON.parse(readFileSync(new URL('../data/filters.json',import.meta.url)));for(const members of Object.values(filters))assert.ok(members.every(id=>ids.has(id)));});
test('all captured internal links resolve and social thumbnails are retained',()=>{const audit=JSON.parse(readFileSync(new URL('../reference/link-audit.json',import.meta.url)));assert.equal(audit.checkedRoutes,43);assert.deepEqual(audit.missing,{});const social=JSON.parse(readFileSync(new URL('../data/social.json',import.meta.url)));assert.equal(social.length,20);assert.ok(social.every(im=>im.local.startsWith('/assets/')));});
test('cart totals use captured variant prices and merge duplicate lines',()=>{
 const p=byHandle.get('wasted-sticker'),v=p.variants[0];const result=quote([{id:v.id,quantity:2},{id:v.id,quantity:3}]);
 assert.equal(result.items.length,1);assert.equal(result.item_count,5);assert.equal(result.total,Math.round(Number(v.price)*100)*5);
});
test('cart rejects unavailable or unknown variants and invalid quantities',()=>{
 const unavailable=[...variants.values()].find(v=>!v.available),v=[...variants.values()].find(v=>v.available);
 assert.throws(()=>quote([{id:unavailable.id,quantity:1}]),/sold out/);assert.throws(()=>quote([{id:'bad',quantity:1}]),/not in/);
 for(const quantity of [-1,0,1.1,100,'abc'])assert.throws(()=>quote([{id:v.id,quantity}]));
});
test('search, filtering and price sort select matching real products',()=>{
 const params=new URLSearchParams({q:'anime',sort_by:'price-ascending',availability:'in-stock'});const result=selectProducts(params);
 assert.ok(result.count>0);assert.ok(result.items.every(available));assert.deepEqual(result.items.map(price),result.items.map(price).sort((a,b)=>a-b));
});
test('pagination has no duplicate products and respects bounds',()=>{
 const one=selectProducts(new URLSearchParams('page=1')),two=selectProducts(new URLSearchParams('page=2'));const ids=new Set(one.items.map(p=>p.id));
 assert.ok(two.items.every(p=>!ids.has(p.id)));assert.equal(selectProducts(new URLSearchParams('page=-5')).page,1);
});
test('homepage has local navigation and only reviewed local executable scripts',()=>{
 const $=load(homePage());$('script[src]').each((i,x)=>assert.ok($(x).attr('src').startsWith('/')));
 assert.equal($('[onclick],[onload]').length,0);assert.equal($('iframe').length,0);assert.ok($('a[href="/pages/find-your-vibe"]').length>0);
});
test('every product renders correct title, prices, variants and images',()=>{
 // Exercise each product data contract without reparsing thousands of full HTML documents.
 for(const p of products){assert.ok(p.title);assert.ok(p.variants.length);assert.ok(p.images.every(im=>/^https:\/\//.test(im.src)));}
 for(const p of [products[0],byHandle.get('wasted-sticker'),products.find(p=>p.variants.length>3),products.find(p=>!p.images.length)]){
  const $=load(productPage(p,new URL(`http://localhost/products/${p.handle}`)));assert.equal($('.local-product-heading h1').text(),p.title);
  assert.equal($('#product-variant option').length,p.variants.length);assert.equal($('#product-add-form').length,1);assert.equal($('#product-data').length,1);
 }
});
test('collection pages render real membership and unknown collections return 404',()=>{
 const c=collections().find(c=>c.product_count>50&&c.handle!=='all');const result=collectionPage(new URL(`http://localhost/collections/${c.handle}`));
 assert.equal(result.status,200);assert.equal(load(result.html)('.local-card').length,24);assert.equal(collectionPage(new URL('http://localhost/collections/does-not-exist')).status,404);
});
test('discovery replaces the questionnaire with a swipe mount',()=>{const $=load(capturedPage('/pages/find-your-vibe'));assert.equal($('#taste-discovery').length,1);assert.equal($('script[src="/quiz.js"]').length,0);assert.equal($('[data-fvq-call]').length,0);});

test('server supports public routes and validates cart without external transactions',async()=>{
 const server=createServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin=`http://127.0.0.1:${server.address().port}`;
 try{
  for(const route of ['/','/collections/all','/products/wasted-sticker','/search?q=anime','/cart','/checkout','/account/login','/pages/faqs','/policies/privacy-policy','/app.js','/app.css','/redesign.css','/taste.js','/studio.js','/pages/sticker-studio','/pages/find-your-vibe']){const response=await fetch(origin+route);assert.equal(response.status,200,route);}
  const discovery=await fetch(origin+'/api/discover',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({history:[]})});assert.equal(discovery.status,200);const picks=await discovery.json();assert.equal(picks.deck.length,20);assert.ok(picks.feedHtml.includes('local-card'));
  const response=await fetch(origin+'/api/cart/quote',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items:[{id:'invalid',quantity:1}]})});assert.equal(response.status,422);
  assert.equal((await fetch(origin+'/unknown-route')).status,404);
 }finally{await new Promise(resolve=>server.close(resolve));}
});
