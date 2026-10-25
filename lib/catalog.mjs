import {readFileSync, existsSync} from 'node:fs';
export const products = JSON.parse(readFileSync(new URL('../data/catalog.json', import.meta.url))).products;
export const byHandle = new Map(products.map(p => [p.handle,p]));
export const byId = new Map(products.map(p => [p.id,p]));
export const variants = new Map(products.flatMap(p => p.variants.map(v => [String(v.id),{...v,product:p}])));
export function collections() {
  const file = new URL('../data/collections.json',import.meta.url);
  return existsSync(file) ? JSON.parse(readFileSync(file)).collections : [];
}
export const price = p => Math.min(...p.variants.map(v => Number(v.price)));
export const available = p => p.variants.some(v=>v.available);
export function selectProducts(params, handle='all') {
  let list = products;
  let collection;
  if(handle !== 'all') {
    collection=collections().find(c=>c.handle===handle);
    const ids=new Set(collection?.product_ids || []);
    list=products.filter(p=>ids.has(p.id));
    const ranks=new Map((collection?.product_ids||[]).map((id,i)=>[id,i]));
    list.sort((a,b)=>ranks.get(a.id)-ranks.get(b.id));
  }
  const query=(params.get('q')||'').trim().toLocaleLowerCase();
  if(query) list=list.filter(p=>`${p.title} ${p.product_type} ${p.tags.join(' ')}`.toLocaleLowerCase().includes(query));
  const filtersFile=new URL('../data/filters.json',import.meta.url);
  const filterData=existsSync(filtersFile)?JSON.parse(readFileSync(filtersFile)):{};
  for(const type of ['genre','personality']){
    const selected=params.getAll(`filter.p.m.filters.${type}`);
    if(selected.length){const ids=new Set(selected.flatMap(value=>filterData[`${type}:${value}`]||[]));list=list.filter(p=>ids.has(p.id));}
  }
  const type=params.get('type');
  if(type) list=list.filter(p=>p.product_type===type);
  if(params.get('availability')==='in-stock') list=list.filter(available);
  if(params.get('availability')==='sold-out') list=list.filter(p=>!available(p));
  const min=params.get('min'),max=params.get('max');
  if(min) list=list.filter(p=>price(p)>=Number(min));
  if(max) list=list.filter(p=>price(p)<=Number(max));
  const sort=params.get('sort_by');
  list=[...list];
  if(sort==='price-ascending') list.sort((a,b)=>price(a)-price(b));
  if(sort==='price-descending') list.sort((a,b)=>price(b)-price(a));
  if(sort==='title-ascending') list.sort((a,b)=>a.title.localeCompare(b.title));
  if(sort==='title-descending') list.sort((a,b)=>b.title.localeCompare(a.title));
  if(sort==='created-descending') list.sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
  const count=list.length;
  const pages=Math.max(1,Math.ceil(count/24));
  const page=Math.min(pages,Math.max(1,Math.floor(Number(params.get('page'))||1)));
  return {items:list.slice((page-1)*24,page*24),count,page,pages,collection};
}
export function quote(lines) {
  if(!Array.isArray(lines)||lines.length>100) throw new Error('A cart can contain up to 100 different items.');
  const merged=new Map();
  for(const line of lines) {
    const variant=variants.get(String(line.id));
    const quantity=Number(line.quantity);
    if(!variant) throw new Error('This product variant is not in the captured catalog.');
    if(!Number.isInteger(quantity)||quantity<1||quantity>99) throw new Error('Quantity must be between 1 and 99.');
    if(!variant.available) throw new Error(`${variant.product.title} is sold out.`);
    merged.set(String(line.id),Math.min(99,(merged.get(String(line.id))||0)+quantity));
  }
  const items=[...merged].map(([id,quantity])=>{
    const v=variants.get(id),p=v.product;
    return {id,quantity,product_type:p.product_type,title:p.title,handle:p.handle,variant:v.title,price:Math.round(Number(v.price)*100),image:stillImage(p,v.featured_image?.src)};
  });
  return {items,item_count:items.reduce((n,i)=>n+i.quantity,0),total:items.reduce((n,i)=>n+i.price*i.quantity,0),currency:'INR'};
}

function stillImage(p,preferred){const isStill=src=>src&&!new URL(src,'http://localhost').pathname.toLowerCase().endsWith('.gif');return isStill(preferred)?preferred:p.images.find(im=>isStill(im.src))?.src||(p.images.length?`/assets/card-stills/${p.id}.png`:'/placeholder.svg');}
