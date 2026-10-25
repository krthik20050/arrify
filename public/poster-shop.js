import {catalogPromise,escapeHtml as e,posterPrice} from './poster-data.js';
const shop=document.querySelector('#poster-shop');
if(shop){
 const q=s=>shop.querySelector(s),grid=q('.poster-products'),dialog=q('#poster-details');
 try{
  const catalog=await catalogPromise;let currentPage=1,filtered=[];const size=24;
  q('[data-poster-collection]').innerHTML='<option value="">All collections</option>'+catalog.collections.filter(c=>c.productIds.length).map(c=>`<option value="${e(c.handle)}">${e(c.title)} (${c.productIds.length})</option>`).join('');
  function filter(){const text=q('[data-poster-search]').value.trim().toLocaleLowerCase(),collection=catalog.collections.find(c=>c.handle===q('[data-poster-collection]').value),ids=collection?new Set(collection.productIds):null;
   filtered=catalog.products.filter(p=>(!ids||ids.has(p.id))&&(!text||`${p.title} ${p.type} ${p.tags.join(' ')}`.toLocaleLowerCase().includes(text)));
   const sort=q('[data-poster-sort]').value,price=p=>Math.min(...p.variants.map(v=>v.price));
   if(sort==='price-up')filtered.sort((a,b)=>price(a)-price(b));if(sort==='price-down')filtered.sort((a,b)=>price(b)-price(a));if(sort==='title')filtered.sort((a,b)=>a.title.localeCompare(b.title));currentPage=1;render();
  }
  function render(){const pages=Math.max(1,Math.ceil(filtered.length/size));q('[data-poster-count]').textContent=`${filtered.length.toLocaleString()} products · ${catalog.manifest.downloadedImageCount.toLocaleString()} captured images · Source: Posterized.in`;
   grid.innerHTML=filtered.slice((currentPage-1)*size,currentPage*size).map(p=>`<article class="poster-product"><button type="button" class="poster-product-image" data-details="${e(p.id)}" aria-label="View ${e(p.title)}"><img src="${e(p.thumbnail)}" alt="${e(p.title)}" loading="lazy"></button><span class="poster-product-type">${e(p.type)}</span><h3>${e(p.title)}</h3><p>From ${posterPrice(p)}${p.variants.some(v=>v.available)?'':' · Sold out at capture'}</p><div><button type="button" data-add-poster="${e(p.id)}">Add to wall</button><button type="button" data-details="${e(p.id)}">Details · ${p.images.length} photos</button></div></article>`).join('')||'<p>No posters match. Try another search or collection.</p>';
   q('[data-poster-page]').textContent=`Page ${currentPage} of ${pages}`;q('[data-poster-prev]').disabled=currentPage===1;q('[data-poster-next]').disabled=currentPage===pages;
  }
  function add(id,imageIndex=0){window.dispatchEvent(new CustomEvent('poster:add',{detail:{id,imageIndex}}));document.querySelector('#poster-editor').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});}
  function details(id){const p=catalog.products.find(p=>p.id===id);if(!p)return;
   dialog.innerHTML=`<button type="button" data-close-poster aria-label="Close poster details">Close ×</button><h2>${e(p.title)}</h2><p>${e(p.type)} · Source: Posterized.in</p><div class="poster-detail-images">${p.images.map((src,i)=>`<div><img src="${e(src)}" alt="${e(p.title)} — product photo ${i+1}" loading="lazy"><button type="button" data-add-poster="${e(p.id)}" data-image-index="${i}">Use photo ${i+1} on wall</button></div>`).join('')}</div><label>Size / option<select data-poster-variant>${p.variants.map((v,i)=>`<option value="${i}">${e(v.title)} — ₹${v.price}${v.available?'':' — sold out at capture'}</option>`).join('')}</select></label><p>Prices and stock are from the capture. Confirm current options on the original store.</p><button type="button" data-add-poster="${e(p.id)}">Add product photo to wall</button><a href="${e(p.url)}" target="_blank" rel="noopener">View on Posterized.in ↗</a>`;
   dialog.showModal();
  }
  shop.addEventListener('click',event=>{const target=event.target.closest('button');if(!target)return;if(target.hasAttribute('data-close-poster'))dialog.close();if(target.dataset.details)details(target.dataset.details);if(target.dataset.addPoster){dialog.close();add(target.dataset.addPoster,Number(target.dataset.imageIndex)||0);}});
  q('[data-poster-search]').oninput=filter;q('[data-poster-collection]').onchange=filter;q('[data-poster-sort]').onchange=filter;
  q('[data-poster-prev]').onclick=()=>{currentPage--;render();};q('[data-poster-next]').onclick=()=>{currentPage++;render();};filter();
 }catch(error){q('[data-poster-count]').textContent=error.message+' Reload this page to retry.';}
}
