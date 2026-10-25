document.querySelectorAll('.catalog-filter').forEach(el=>{el.open=matchMedia('(min-width:750px)').matches;});
const $=(s,root=document)=>root.querySelector(s);
const $$=(s,root=document)=>[...root.querySelectorAll(s)];
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=cents=>`Rs. ${(cents/100).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const storage={get(key,fallback){try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}},set(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{toast('Browser storage is unavailable. Your changes will last for this page only.');return false;}}};
let cart=storage.get('stickitup-cart-v1',[]),quote={items:[],total:0,item_count:0},discount=false;
if(!Array.isArray(cart))cart=[];
let lastFocus,toastTimer,searchController;
const dialog=$('#local-dialog');
function toast(message){const el=$('#local-toast');el.textContent=message;el.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('visible'),4000);}
async function api(url,options={}){const res=await fetch(url,{...options,signal:options.signal||AbortSignal.timeout(15000)});const data=await res.json();if(!res.ok)throw new Error(data.error||'Unable to complete this action.');return data;}
function showDialog(title,html,zoom=false){lastFocus=document.activeElement;dialog.classList.toggle('local-zoom',zoom);dialog.innerHTML=`<div class="local-dialog-head"><h2>${esc(title)}</h2><button class="local-close" aria-label="Close dialog" data-close>×</button></div><div class="local-dialog-body">${html}</div>`;if(!dialog.open)dialog.showModal();}
dialog.addEventListener('click',event=>{if(event.target===dialog||event.target.closest('[data-close]'))dialog.close();});
dialog.addEventListener('close',()=>{dialog.innerHTML='';lastFocus?.focus();});
function updateBadges(){
 $$('.cart-count-bubble span[aria-hidden="true"],.cart-count-bubble__number').forEach(el=>el.textContent=quote.item_count);
 $$('.cart-count-bubble .visually-hidden').forEach(el=>el.textContent=`${quote.item_count} items`);
 const bubble=$('#cart-icon-bubble');
 if(bubble){bubble.setAttribute('aria-label',`Cart, ${quote.item_count} items`);const subtotal=$('.header__cart-total__price',bubble);if(subtotal)subtotal.textContent=money(quote.total);}
}
async function refreshCart(){
 try{quote=await api('/api/cart/quote',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items:cart})});cart=quote.items.map(({id,quantity})=>({id,quantity}));storage.set('stickitup-cart-v1',cart);updateBadges();return true;}
 catch(error){toast(error.message);return false;}
}
async function addItem(id,quantity=1){
 const original=structuredClone(cart);const found=cart.find(line=>String(line.id)===String(id));
 if(found)found.quantity=Math.min(99,found.quantity+quantity);else cart.push({id:String(id),quantity});
 if(!await refreshCart()){cart=original;return;}
 if(dialog.open)dialog.close();
 toast('Added to cart');
}
function cartLine(item,summary=false){return `<div class="local-cart-line"><a href="/products/${esc(item.handle)}"><img src="${esc(item.image)}" alt="${esc(item.title)}"></a><div><h3><a href="/products/${esc(item.handle)}">${esc(item.title)}</a></h3>${item.variant!=='Default Title'?`<p>${esc(item.variant)}</p>`:''}<p>${money(item.price)}${summary?` × ${item.quantity}`:''}</p>${summary?'':`<div class="local-quantity"><button data-cart-delta="-1" data-id="${item.id}" aria-label="Decrease quantity of ${esc(item.title)}">−</button><input type="number" min="1" max="99" value="${item.quantity}" data-cart-input="${item.id}" aria-label="Quantity for ${esc(item.title)}"><button data-cart-delta="1" data-id="${item.id}" aria-label="Increase quantity of ${esc(item.title)}">+</button></div><button class="local-remove" data-remove="${item.id}">Remove</button>`}</div><strong>${money(item.price*item.quantity)}</strong></div>`;}
function cartMarkup(){
 if(!quote.items.length)return '<div class="local-empty"><h2>Your cart is empty</h2><p>Find a little something that feels like you.</p><a class="local-primary" href="/collections/all">Continue shopping</a></div>';
 const hasStickers=quote.items.some(item=>/^(Stickers|Bumper Sticker|Holographic stickers|Glitter Stickers|Infinity Stickers)$/.test(item.product_type||''));
 return `${quote.items.map(i=>cartLine(i)).join('')}${hasStickers?'<section class="cart-sticker-workspace" aria-label="Arrange your cart stickers"><h2>Try them on your laptop</h2><p>Drag any sticker from the tray onto the space below.</p><div id="sticker-studio"></div></section>':''}<div class="local-cart-total"><span>Subtotal</span><span>${money(quote.total)}</span></div><p class="local-review-note">Shipping calculated at checkout.</p><div class="local-cart-actions"><a href="/collections/all">Continue shopping</a><a class="local-primary" href="/checkout">Check out</a></div>`;
}
async function mountCartStudio(){
 const mount=(dialog.open?dialog:document).querySelector('#sticker-studio');
 if(!mount)return;
 try{const studio=await import('/studio.js');studio.initializeStickerStudio(mount);}
 catch{mount.textContent='Sticker preview could not load. Refresh your cart and try again.';}
}
function renderCart(drawer=false){
 const markup=cartMarkup();
 if(drawer){showDialog('Your cart',markup);void mountCartStudio();}
 const el=$('#cart-page');if(el){el.innerHTML=`<h1>Your cart</h1>${markup}`;void mountCartStudio();}
}
async function changeQuantity(id,quantity){const original=structuredClone(cart);cart=cart.flatMap(i=>String(i.id)!==String(id)?[i]:quantity>0?[{...i,quantity:Math.min(99,quantity)}]:[]);if(!await refreshCart()){cart=original;return;}renderCart(dialog.open);if($('#checkout-page'))renderCheckout();}
function searchDialog(){showDialog('Search',`<form class="local-search-form" action="/search"><input name="q" aria-label="Search products" placeholder="Search 4,475 products" autocomplete="off"><button class="local-primary">Search</button></form><div class="local-search-results" aria-live="polite"></div>`);$('.local-search-form input').focus();}
let searchTimeout;
document.addEventListener('input',event=>{
 if(!event.target.matches('.local-search-form input'))return;
 clearTimeout(searchTimeout);searchController?.abort();
 const query=event.target.value.trim();const results=$('.local-search-results');if(query.length<2){results.innerHTML='';return;}
 searchTimeout=setTimeout(async()=>{try{searchController=new AbortController();const data=await api(`/api/products?q=${encodeURIComponent(query)}`,{signal:searchController.signal});if(!dialog.open)return;results.innerHTML=data.items.slice(0,6).map(p=>`<a href="/products/${esc(p.handle)}"><img src="${esc(p.images[0]?.src||'/placeholder.svg')}" alt=""><span>${esc(p.title)}<small>${money(Math.round(Number(p.variants[0].price)*100))}</small></span></a>`).join('')+`<a href="/search?q=${encodeURIComponent(query)}" class="local-primary">View all ${data.count} results →</a>`;}catch(error){if(error.name!=='AbortError')results.textContent='Search unavailable. Press Search to try the full results page.';}},220);
});
async function quickView(handle){try{const p=await api(`/api/products/${encodeURIComponent(handle)}`);const first=p.variants.find(v=>v.available)||p.variants[0];showDialog(p.title,`<div class="local-quick-info"><img src="${esc(p.images[0]?.src||'/placeholder.svg')}" alt="${esc(p.title)}"><p>${money(Math.round(Number(first.price)*100))}</p><label>Options<select id="quick-variant">${p.variants.map(v=>`<option value="${v.id}" ${v.id===first.id?'selected':''} ${v.available?'':'disabled'}>${esc(v.title)} — ${money(Math.round(Number(v.price)*100))}${v.available?'':' (Sold out)'}</option>`).join('')}</select></label><button class="local-primary" data-quick-add ${first.available?'':'disabled'}>${first.available?'Add to cart':'Sold out'}</button><a href="/products/${esc(handle)}">View full details →</a></div>`);}catch(error){toast(error.message);}}
document.addEventListener('click',async event=>{
 const target=event.target.closest('button,a,summary,[data-zoom],back-to-top');if(!target)return;
 if(target.closest('#cart-icon-bubble')||target.matches('a[href="/cart"]')){event.preventDefault();await refreshCart();renderCart(true);return;}
 if(target.matches('[data-quick]')||target.dataset.productUrl){event.preventDefault();await quickView(target.dataset.quick||target.dataset.productUrl.split('/').pop());return;}
 if(target.hasAttribute('data-quick-add')){event.preventDefault();await addItem($('#quick-variant').value);return;}
 if(target.hasAttribute('data-add')){event.preventDefault();const pform=target.closest('form');if(pform?.dataset.productHandle&&pform.querySelectorAll('input[type="radio"]').length){await quickView(pform.dataset.productHandle);return;}await addItem(target.dataset.add);return;}
 if(target.hasAttribute('data-cart-delta')){const item=cart.find(i=>String(i.id)===target.dataset.id);if(item)await changeQuantity(item.id,item.quantity+Number(target.dataset.cartDelta));return;}
 if(target.hasAttribute('data-remove')){await changeQuantity(target.dataset.remove,0);return;}
 if(target.closest('.header__search')||target.matches('[aria-label="Search"],.header__icon--search')){event.preventDefault();searchDialog();return;}
 if(target.hasAttribute('data-quantity')){const input=$('input[name="quantity"]',target.closest('form'));input.value=Math.max(1,Math.min(99,Number(input.value)+Number(target.dataset.quantity)));return;}
 if(target.hasAttribute('data-image')){$('#product-image').src=target.dataset.image;$$('.local-thumbnails button').forEach(b=>b.classList.toggle('selected',b===target));return;}
 if(target.hasAttribute('data-social-image')){showDialog('STICK IT UP on Instagram',`<img src="${esc(target.dataset.socialImage)}" alt="${esc(target.dataset.socialCaption)}"><p>${esc(target.dataset.socialCaption)}</p><a href="https://www.instagram.com/stickitup.xyz/" target="_blank" rel="noopener">View on Instagram ↗</a>`,true);return;}
 if(target.hasAttribute('data-zoom')){showDialog('Product image',`<img src="${esc($('#product-image').src)}" alt="${esc($('#product-image').alt)}">`,true);return;}
 if(target.hasAttribute('data-share')){try{await navigator.clipboard.writeText(location.href);toast('Product link copied');}catch{showDialog('Share product',`<label>Product link<input readonly value="${esc(location.href)}" style="width:100%;padding:12px"></label>`);}return;}
 if(target.matches('back-to-top')||target.closest('back-to-top')){window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});return;}
 if(target.matches('[data-fvq-call]')){const match=target.dataset.fvqCall.match(/^(fvqGo|fvqBack|fvqPersona|fvqReset|fvqShare)\((?:(\d+)|'([^']*)')?\)$/);if(match&&typeof window[match[1]]==='function')window[match[1]](match[2]?Number(match[2]):match[3]);return;}
 if(target.matches('[data-logout]')){storage.set('stickitup-demo-account',null);location.reload();return;}
 if(target.matches('.footer-block__collapse-link')){event.preventDefault();if(innerWidth<750){const block=target.closest('.footer-block')||target.parentElement.parentElement;const content=$('.footer-block__details-content',block);if(content){const open=getComputedStyle(content).display==='none';content.style.display=open?'block':'none';target.setAttribute('aria-expanded',String(open));}}return;}
 if(target.matches('[data-retake-checkout]')){renderCheckout();return;}
 // Original theme sliders retain their exact markup and move locally.
 if(target.id?.endsWith('-next-button')||target.id?.endsWith('-prev-button')){event.preventDefault();const slider=$('#'+CSS.escape(target.id.replace(/-(next|prev)-button$/,'')));if(slider){slider.scrollBy({left:(target.id.endsWith('-next-button')?1:-1)*slider.clientWidth*.85,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});slider.parentElement.querySelectorAll('button').forEach(b=>b.disabled=false);}return;}
 const slideButton=target.getAttribute('aria-label')?.match(/^Go to slide (\d+)$/);
 if(slideButton){const container=target.closest('[class*="ai-slideshow-"]')?.parentElement;setSlide(container,Number(slideButton[1])-1);return;}
});
document.addEventListener('change',async event=>{
 if(event.target.hasAttribute('data-cart-input'))await changeQuantity(event.target.dataset.cartInput,Math.max(1,Math.min(99,Math.floor(Number(event.target.value)||1))));
 if(event.target.id==='product-variant')updateVariant();
});
document.addEventListener('submit',async event=>{
 const form=event.target;
 const formId=form.getAttribute('id');
 if(formId==='product-add-form'){event.preventDefault();const data=new FormData(form);await addItem(data.get('id'),Math.max(1,Math.min(99,Math.floor(Number(data.get('quantity'))||1))));return;}
 if(formId==='account-form'){event.preventDefault();storage.set('stickitup-demo-account',{name:new FormData(form).get('name')});renderAccount();return;}
 if(formId==='track-form'){event.preventDefault();const id=String(new FormData(form).get('order')).trim();const order=storage.get('stickitup-demo-orders',[]).find(o=>o.id===id);$('#tracking-result').textContent=order?`${id}: Demo order created on ${new Date(order.date).toLocaleString()}. This is a local preview; no shipment was created.`:'No matching local demo order. Check your order number.';return;}
 if(formId==='checkout-form'){event.preventDefault();await placeDemoOrder(form);return;}
 if(form.dataset.localForm){event.preventDefault();const type=form.querySelector('input[type="email"]')?'subscription':'message';showDialog('Demo preview',`<p>Your ${type} has been validated locally. This recreation is not connected to the store’s mailing list or customer support.</p><button data-close class="local-primary">Done</button>`);return;}
});
function updateVariant(){const data=$('#product-data');if(!data)return;const p=JSON.parse(data.textContent);const v=p.variants.find(v=>String(v.id)===$('#product-variant').value);if(!v)return;$('#product-price').textContent=money(Math.round(Number(v.price)*100));$('#compare-price').textContent=Number(v.compare_at_price)>Number(v.price)?money(Math.round(Number(v.compare_at_price)*100)):'';$('#product-saving').textContent=Number(v.compare_at_price)>Number(v.price)?`Save ${money(Math.round((Number(v.compare_at_price)-Number(v.price))*100))}`:'';$('#product-add').disabled=!v.available;$('#product-add').textContent=v.available?'🕯️　Add to cart　🕯️':'Sold out';if(v.featured_image?.src)$('#product-image').src=v.featured_image.src;const url=new URL(location.href);url.searchParams.set('variant',v.id);history.replaceState(null,'',url);const tryLink=$('#product-try');if(tryLink){const next=new URL(tryLink.href);next.searchParams.set('variant',v.id);tryLink.href=next.href;}}
function renderAccount(){const account=storage.get('stickitup-demo-account',null);if(!account)return;$('#account-form').hidden=true;$('#account-state').innerHTML=`<h2>Welcome, ${esc(account.name)}</h2><p>You are exploring a local demo account.</p><a href="/pages/track-your-order">Track a demo order</a><p><button data-logout class="local-primary">Log out</button></p>`;}
function renderCheckout(){
 const el=$('#checkout-page');if(!el)return;
 const existingForm=$('#checkout-form');const values=existingForm?new FormData(existingForm):null;
 if(!quote.items.length){el.innerHTML='<div class="local-empty"><h1>Your cart is empty</h1><a class="local-primary" href="/collections/all">Continue shopping</a></div>';return;}
 const total=discount?Math.round(quote.total*.9):quote.total;
 el.innerHTML=`<h1>Checkout</h1><p class="local-note">Demo checkout. No payment is collected and no order is sent to the actual store.</p><div class="local-checkout"><section class="local-form-panel"><form id="checkout-form"><h2>Contact</h2><label>Email<input type="email" name="email" required autocomplete="email"></label><h2>Delivery</h2><div class="local-fields"><label>First name<input name="firstName" required autocomplete="given-name"></label><label>Last name<input name="lastName" required autocomplete="family-name"></label></div><label>Address<input name="address" required autocomplete="street-address"></label><div class="local-fields"><label>City<input name="city" required autocomplete="address-level2"></label><label>State<input name="state" required autocomplete="address-level1"></label><label>PIN code<input name="pin" required inputmode="numeric" pattern="[0-9]{6}" maxlength="6" autocomplete="postal-code"></label><label>Phone<input name="phone" type="tel" required pattern="[+0-9 ()-]{10,16}" autocomplete="tel"></label></div><h2>Payment</h2><p>Demo payment — ₹0 charged. Enter sample details to review this flow.</p><label>Order note (optional)<textarea name="note" rows="3"></textarea></label><button class="local-primary">Create demo order</button></form></section><aside class="local-summary"><h2>Order summary</h2>${quote.items.map(i=>cartLine(i,true)).join('')}<form id="discount-form" class="local-discount"><input aria-label="Discount code" placeholder="Demo code: DEMO10" ${discount?'value="DEMO10" disabled':''}><button type="submit" ${discount?'disabled':''}>${discount?'Applied':'Apply'}</button></form><p id="discount-message" role="status">${discount?'Demo discount: 10% off':''}</p><p>Shipping: Demo — included</p><div class="local-cart-total"><span>Total</span><span>${money(total)}</span></div><a href="/cart">Return to cart</a></aside></div>`;
 $('#discount-form').addEventListener('submit',event=>{event.preventDefault();if($('#discount-form input').value.trim().toUpperCase()==='DEMO10'){discount=true;renderCheckout();}else $('#discount-message').textContent='Code unavailable. Use DEMO10 to test this demo.';});
 if(values)$$('input,textarea,select',$('#checkout-form')).forEach(field=>{if(values.has(field.name))field.value=values.get(field.name);});
}
async function placeDemoOrder(form){
 if(!form.reportValidity())return;
 if(!await refreshCart())return;
 const order={id:`DEMO-${Date.now().toString(36).toUpperCase()}`,date:new Date().toISOString(),items:quote.items,total:discount?Math.round(quote.total*.9):quote.total};
 const previous=storage.get('stickitup-demo-orders',[]);storage.set('stickitup-demo-orders',[order,...previous].slice(0,20));
 cart=[];await refreshCart();
 $('#checkout-page').innerHTML=`<div class="local-order-success"><h1>Demo order created</h1><h2>${order.id}</h2><p>${order.items.reduce((n,i)=>n+i.quantity,0)} items · ${money(order.total)}</p><p>₹0 charged. No order was sent to STICK IT UP. Your contact and delivery details were not saved.</p><a href="/pages/track-your-order">View demo order status</a><a class="local-primary" href="/collections/all">Continue shopping</a></div>`;
 window.scrollTo(0,0);
}
function setSlide(container,index){if(!container)return;const slides=$$('[class*="ai-slideshow-slide-"]',container).filter(el=>!el.className.includes('link'));if(!slides.length)return;slides.forEach((el,i)=>el.classList.toggle('active',i===index%slides.length));$$('button',container).forEach((b,i)=>b.classList.toggle('active',i===index));}
// Bind custom slideshow elements after removing remote theme execution.
const slideShows=$$('[class^="ai-slideshow-container-"]');
slideShows.forEach(container=>{let index=0;setSlide(container,0);$$('button',container.parentElement).forEach((button,i)=>button.addEventListener('click',()=>{index=i;setSlide(container,i);}));});
$$('.slider-button--prev,.slider-button--next').forEach(b=>b.disabled=false);
const filterForm=$('.local-filters');
if(filterForm){const selected=[];for(const [name,value] of new URL(location.href).searchParams){if(name.startsWith('filter.')){const input=document.createElement('input');input.type='hidden';input.name=name;input.value=value;filterForm.append(input);selected.push(value);}}if(selected.length){const label=document.createElement('p');label.textContent=`Selected: ${selected.join(', ')}`;label.className='local-review-note';filterForm.prepend(label);}}
const productData=$('#product-data');
if(productData&&/t-shirt/i.test(JSON.parse(productData.textContent).product_type)){const link=document.createElement('a');link.href='/pages/size-chart-t-shirt';link.textContent='Size chart';link.className='local-review-note';$('.local-purchase').prepend(link);}
$$('input[type="radio"][name^="tab-"]').forEach(input=>input.addEventListener('change',()=>input.checked=true));
$$('.siu-faq-item').forEach(item=>item.addEventListener('click',()=>item.classList.toggle('open')));
// Converted captured inline FAQ handlers are represented as accessible data actions.
$$('[data-faq-toggle]').forEach(button=>button.addEventListener('click',()=>{const item=button.closest('[data-faq-item]')||button.parentElement;item.classList.toggle('open');button.setAttribute('aria-expanded',String(item.classList.contains('open')));}));
$$('img').forEach(img=>img.addEventListener('error',()=>{if(!img.src.endsWith('/placeholder.svg')){img.removeAttribute('srcset');img.src='/placeholder.svg';}},{once:true}));
await refreshCart();
if($('#cart-page'))renderCart();if($('#checkout-page'))renderCheckout();if($('#account-state'))renderAccount();

// Keep the department switch current on every page.
document.querySelectorAll(".si-departments a").forEach(a => { if ((location.pathname === "/pages/poster-studio") === (a.pathname === "/pages/poster-studio")) a.setAttribute("aria-current", "page"); });
