import {stickerTexture} from './ar-texture.js';
const root=document.querySelector('#ar-app');
if(root){
 const q=s=>root.querySelector(s),viewer=q('#sticker-ar'),status=q('#ar-status'),prepare=q('#ar-prepare'),launch=q('#ar-launch'),progress=q('#ar-progress'),width=q('#ar-width'),measured=q('#ar-measured'),cutout=q('#ar-cutout'),share=q('#ar-share'),qrStatus=q('#ar-qr-status');
 const surface=q('#ar-surface'),rotation=q('#ar-rotation'),tilt=q('#ar-tilt'),lean=q('#ar-lean'),photoShadow=q('#ar-photo-shadow');
 const mobileAR=/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
 const canLaunchAR=()=>mobileAR&&window.isSecureContext&&viewer.canActivateAR;
 const layout=root.dataset.layout==='cart',posterLayout=root.dataset.posterLayout==='studio',shared=root.dataset.handoff;let handle=root.dataset.handle,revision=0,controller,enginePromise,readyUrl,expiryTimer,loadTimer,preparedCatalog=null;
 if(!shared&&new URL(location.href).searchParams.get('surface')==='wall'){surface.value='wall';viewer.setAttribute('ar-placement','wall');viewer.setAttribute('camera-orbit','0deg 90deg auto');}
 const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}};
 const say=(text,error=false)=>{status.textContent=text;status.classList.toggle('ar-error',error);};
 async function json(url,options={}){const res=await fetch(url,{signal:AbortSignal.timeout(20000),...options});const data=await res.json();if(!res.ok)throw new Error(data.error||'Unable to prepare preview.');return data;}
 function invalidate(){preparedCatalog=null;viewer.removeAttribute("ios-src");share.disabled=true;q('#ar-qr-result').hidden=true;q('#ar-qr-image').removeAttribute('src');qrStatus.textContent='Your phone link appears when the preview loads.';revision++;controller?.abort();clearTimeout(loadTimer);clearTimeout(expiryTimer);readyUrl=null;launch.disabled=true;launch.hidden=true;viewer.hidden=true;viewer.removeAttribute('src');q('#ar-poster').hidden=false;progress.hidden=true;prepare.disabled=false;q('#ar-scale-tag').textContent=measured.checked?'Uses your entered width · verify physical fit':'Estimated size · print size unverified';q('#ar-current-size').textContent='';}
 function deviceInfo(){const secure=window.isSecureContext;launch.textContent=/iPhone|iPad|iPod/i.test(navigator.userAgent)?'Open AR on iPhone / iPad':'Open AR on this device';q('#ar-device').textContent=!secure?'Live AR needs HTTPS on your phone. This HTTP address can only show the 3D preview.':canLaunchAR()?'This browser offers an AR viewer. Camera access starts only after you tap View in AR. On iPhone, Apple’s viewer opens; edit the layout here before opening it.':'You can inspect the 3D preview here. For tracked placement, open this same page in Safari on an iPhone or a compatible Android browser. AR availability is checked after the model loads.';launch.disabled=!canLaunchAR();launch.hidden=!canLaunchAR();}
 for(const control of [width,measured,cutout,rotation,tilt,lean,photoShadow])control.addEventListener('input',()=>{invalidate();say('Settings changed. Tap Update preview to apply.');});
 function showMetadata(data){q('#ar-title').textContent=data.title;say('Loading your 3D preview…');}
 async function setup(){
  if(shared){await loadShared();return;}
  try{if(posterLayout){q('#ar-cutout-label').hidden=true;q('#ar-poster').alt='Your saved poster wall layout';q('#ar-title').textContent='Your poster wall layout';say('Preparing the wall saved in Poster Studio…');}
  else if(layout){q('#ar-cutout-label').hidden=true;q('#ar-poster').alt='Your saved sticker arrangement';say('Save your arrangement in Laptop studio, then prepare it here.');}
  else{const data=await json(`/api/ar/products/${encodeURIComponent(handle)}`);showMetadata(data);
   const cart=read('stickitup-cart-v1',[]);if(Array.isArray(cart)&&cart.length){try{const quote=await json('/api/cart/quote',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items:cart})});const list=[{handle,title:data.title},...quote.items.filter(i=>/^(Stickers|Bumper Sticker|Holographic stickers|Glitter Stickers|Infinity Stickers)$/.test(i.product_type))];const seen=new Set();for(const item of list){if(seen.has(item.handle))continue;seen.add(item.handle);const option=document.createElement('option');option.value=item.handle;option.textContent=item.title;q('#ar-picker').append(option);}q('#ar-picker-label').hidden=seen.size<2;}catch{/* Selected product still works when the cart cannot be quoted. */}}
  }
  q('#ar-device').textContent=window.isSecureContext?'Loading the preview and checking AR support…':'Live AR requires HTTPS on your phone. You can still inspect the 3D preview here.';
  }catch(error){say(error.message,true);prepare.disabled=false;}
 }
 surface.addEventListener('change',()=>{invalidate();viewer.setAttribute('ar-placement',surface.value);viewer.setAttribute('camera-orbit',surface.value==='wall'?'0deg 90deg auto':'0deg 0deg auto');if(shared){say('This is a shared scene. Change the surface on your laptop and generate a new QR.');return;}prepare.click();});
 rotation.addEventListener('input',()=>q('#ar-rotation-value').textContent=rotation.value+'°');tilt.addEventListener('input',()=>q('#ar-tilt-value').textContent=tilt.value+'°');lean.addEventListener('input',()=>q('#ar-lean-value').textContent=lean.value+'°');
 photoShadow.addEventListener('input',()=>{if(photoShadow.checked)cutout.checked=true;});
 cutout.addEventListener('input',()=>{if(!cutout.checked)photoShadow.checked=false;});
 for(const button of root.querySelectorAll('[data-ar-preset]'))button.addEventListener('click',()=>{rotation.value=tilt.value=lean.value='0';for(const id of ['rotation','tilt','lean'])q('#ar-'+id+'-value').textContent='0°';surface.value=button.dataset.arPreset;surface.dispatchEvent(new Event('change'));});
 q('#ar-reset').addEventListener('click',()=>{rotation.value=tilt.value=lean.value='0';q('#ar-rotation-value').textContent=q('#ar-tilt-value').textContent=q('#ar-lean-value').textContent='0°';invalidate();prepare.click();});
 async function loadShared(){
  q('#ar-phone').hidden=true;q('#ar-presets').hidden=true;q('#ar-adjustments').hidden=true;surface.disabled=true;prepare.hidden=true;prepare.disabled=true;width.disabled=true;measured.disabled=true;cutout.disabled=true;q('#ar-cutout-label').hidden=true;q('#ar-poster').hidden=true;progress.hidden=false;say('Opening the preview shared from your laptop…');
  q('#ar-device').nextElementSibling.textContent='To change a shared arrangement, edit it on your laptop and create a new QR.';
  q('#ar-size-note').textContent='This is the size prepared on your laptop. Edit there and create a new QR to change it.';
  try{if(!/^[a-f0-9]{32}$/.test(shared))throw new Error('This phone preview link is invalid. Create a new QR on your laptop.');const data=await json(`/api/ar/handoffs/${encodeURIComponent(shared)}`);surface.value=data.placement==='wall'?'wall':'floor';viewer.setAttribute('ar-placement',surface.value);viewer.setAttribute('camera-orbit',surface.value==='wall'?'0deg 90deg auto':'0deg 0deg auto');q('#ar-title').textContent=data.title;width.value=(data.widthMm/10).toFixed(2);measured.checked=data.measured;q('#ar-scale-tag').textContent=data.measured?'Uses the width entered on your laptop':'Estimated size · print size unverified';
   q('#ar-current-size').textContent=`Shared preview: ${(data.widthMm/10).toFixed(2)} × ${(data.heightMm/10).toFixed(2)} cm. ${data.kind==='layout'||data.kind==='poster-layout'?'The saved arrangement moves as one group.':''}`;
   if(data.kind==='poster-layout'){q('.ar-back').href='/pages/poster-studio';q('.ar-back').textContent='← Back to posters';q('.ar-heading .ar-kicker').textContent='YOUR SPACE. YOUR POSTERS.';q('.ar-heading h1').textContent='View your poster wall in AR.';q('.ar-device').nextElementSibling.textContent='Edit the wall in Poster Studio and create a new QR to change it.';}
   await Promise.race([import('/vendor/model-viewer/model-viewer.js'),new Promise((_,reject)=>{loadTimer=setTimeout(()=>reject(new Error('The 3D viewer took too long to load. Reload to retry.')),20000);})]);clearTimeout(loadTimer);
   readyUrl=data.url;if(data.iosSrc)viewer.setAttribute('ios-src',data.iosSrc);viewer.setAttribute('loading','eager');viewer.setAttribute('src',data.url);viewer.hidden=false;
   loadTimer=setTimeout(()=>{progress.hidden=true;say('The shared model could not load. Reload, or create a new QR on your laptop.',true);},25000);
   expiryTimer=setTimeout(()=>{readyUrl=null;launch.disabled=true;say('This shared preview expired. Create a new QR on your laptop.',true);},Math.max(0,data.expiresAt-Date.now()));
  }catch(error){clearTimeout(loadTimer);progress.hidden=true;say(error.message,true);q('#ar-device').textContent='Return to your laptop and create a new QR if the link has expired.';}
 }
 share.addEventListener('click',async event=>{
  if(!readyUrl){qrStatus.textContent='Prepare your preview before creating the QR.';return;}
  const token=revision,model=readyUrl;share.disabled=true;qrStatus.textContent='Creating a phone link for this prepared scene…';
  try{const result=preparedCatalog?await json(`/api/ar/ready-link/${encodeURIComponent(handle)}`):await json('/api/ar/handoffs',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model,title:q('#ar-title').textContent,kind:posterLayout?'poster-layout':layout?'layout':'single',placement:surface.value,measured:measured.checked})});if(token!==revision||model!==readyUrl)return;
   q('#ar-qr-image').src=result.qr;q('#ar-phone-link').href=result.url;q('#ar-qr-result').hidden=false;if(event.isTrusted)q('#ar-qr-result').scrollIntoView({block:'center',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
   q('#ar-qr-expiry').textContent=result.expiresAt?`This QR expires in ${Math.max(1,Math.floor((result.expiresAt-Date.now())/60000))} minutes. ${result.requiresLaptop===false?'Your laptop can be closed.':'Keep the laptop preview running.'}`:'Prepared catalog preview. Your laptop can be closed.';
   qrStatus.textContent='Scan with your phone camera, open the link, then tap View in AR. No cart transfer or QR scanner app is needed.';
  }catch(error){if(token===revision)qrStatus.textContent=error.message;}finally{if(token===revision)share.disabled=false;}
 });
 q('#ar-qr-image').addEventListener('error',()=>{qrStatus.textContent='The QR image could not load. Use the phone preview link or generate the QR again.';});
 q('#ar-copy-link').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(q('#ar-phone-link').href);qrStatus.textContent='Phone preview link copied.';}catch{qrStatus.textContent='Copy is unavailable. Open the phone preview link and copy its address.';}});
 q('#ar-picker').addEventListener('change',async event=>{invalidate();handle=event.target.value;const token=revision;try{const data=await json(`/api/ar/products/${encodeURIComponent(handle)}`);if(token!==revision)return;showMetadata(data);q('#ar-poster').src=`/api/ar/image/${encodeURIComponent(handle)}`;q('#ar-poster').alt=data.title;const url=new URL(location.href);url.searchParams.set('product',handle);url.searchParams.delete('variant');history.replaceState(null,'',url);}catch(error){say(error.message,true);}});
 async function arrangement(signal){
  if(posterLayout)return posterArrangement(signal);
  const saved=read('stickitup-studio-v1',[]);if(!Array.isArray(saved)||!saved.length)throw new Error('No saved arrangement. Open Laptop studio, place your stickers and choose Save layout first.');
  const cart=read('stickitup-cart-v1',[]),quote=await json('/api/cart/quote',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items:Array.isArray(cart)?cart:[]}),signal});
  const pieces=saved.slice(0,25).filter(p=>p&&quote.items.some(i=>String(i.id)===String(p.id)&&/^(Stickers|Bumper Sticker|Holographic stickers|Glitter Stickers|Infinity Stickers)$/.test(i.product_type))),textures=new Map();
  if(!pieces.length)throw new Error('The saved arrangement has no stickers currently in your cart. Save a new layout.');
  for(const piece of pieces){const item=quote.items.find(i=>String(i.id)===String(piece.id));if(!textures.has(piece.id))textures.set(piece.id,await stickerTexture(item.handle,true,signal,false,photoShadow.checked));}
  const canvas=document.createElement('canvas');canvas.width=1400;canvas.height=900;const ctx=canvas.getContext('2d');const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0));
  for(const piece of pieces){const image=textures.get(piece.id),size=1400*clamp(piece.size,8,42)/100,height=size*image.height/image.width;ctx.save();ctx.translate(clamp(piece.x,0,100)*14,clamp(piece.y,0,100)*9);ctx.rotate(clamp(piece.rotation,-180,180)*Math.PI/180);ctx.drawImage(image,-size/2,-height/2,size,height);ctx.restore();}return canvas;
 }
 async function posterArrangement(signal){
  const saved=read('stickitup-posterized-studio-v1',null),pieces=Array.isArray(saved?.pieces)?saved.pieces.slice(0,12):[];
  if(!pieces.length)throw new Error('Add posters in Poster Studio and choose Preview this wall in AR first.');
  const catalog=await json('/api/posters/catalog',{signal}),byId=new Map(catalog.products.map(product=>[product.id,product]));
   const ratio=Math.max(1,Math.min(1.5,Number(saved.wallRatio)||4/3)),canvas=document.createElement('canvas');canvas.width=1024;canvas.height=Math.round(1024/ratio);
  const ctx=canvas.getContext('2d'),clamp=(value,min,max)=>Math.max(min,Math.min(max,Number(value)||min)),frameColors={black:'#20211e',white:'#fff',oak:'#b58b59',none:null};let rendered=0;
  for(const piece of pieces){if(signal.aborted)throw new DOMException('Preparation stopped.','AbortError');const product=byId.get(piece?.art);if(!product?.images?.length)continue;
   const image=new Image();image.src=product.images[Number.isInteger(piece.imageIndex)&&piece.imageIndex>=0&&piece.imageIndex<product.images.length?piece.imageIndex:0];
   await Promise.race([image.decode(),new Promise((_,reject)=>setTimeout(()=>reject(new Error(`Poster image could not load: ${product.title}`)),20000))]);
   const size=clamp(piece.size,10,32)/100*canvas.width,w=size,h=size*1.5,x=clamp(piece.x,15,85)/100*canvas.width-w/2,y=clamp(piece.y,22,78)/100*canvas.height-h/2,frame=frameColors[piece.frame]===undefined?'black':piece.frame;
   if(frame!=='none'){const border=Math.max(5,w*.025);ctx.save();ctx.shadowColor='#0005';ctx.shadowBlur=14;ctx.shadowOffsetY=7;ctx.fillStyle=frameColors[frame];ctx.fillRect(x,y,w,h);ctx.restore();}
   const inset=frame==='none'?0:Math.max(5,w*.025),innerW=w-inset*2,innerH=h-inset*2,scale=Math.min(innerW/image.width,innerH/image.height),drawW=image.width*scale,drawH=image.height*scale;
   ctx.drawImage(image,x+inset+(innerW-drawW)/2,y+inset+(innerH-drawH)/2,drawW,drawH);rendered++;
  }
  if(!rendered)throw new Error('No saved poster images could be loaded. Return to Poster Studio and choose other photos.');return canvas;
 }
 prepare.addEventListener('click',async()=>{
  invalidate();viewer.setAttribute('ar-placement',surface.value);viewer.setAttribute('camera-orbit',surface.value==='wall'?'0deg 90deg auto':'0deg 0deg auto');const token=revision,cm=Number(width.value);if(!Number.isFinite(cm)||cm<.5||cm>100){say('Enter a width between 0.5 and 100 cm.',true);return;}
  controller=new AbortController();const current=controller;const preparationTimer=setTimeout(()=>current.abort(),45000);prepare.disabled=true;progress.hidden=false;say('Updating your layout…');
  try{enginePromise ||= import('/vendor/model-viewer/model-viewer.js').catch(error=>{enginePromise=null;throw error;});
   const texture=layout||posterLayout?await arrangement(current.signal):await stickerTexture(handle,cutout.checked,current.signal,true,photoShadow.checked);if(token!==revision)return;
   const model=await json('/api/ar/prepare',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({png:texture.toDataURL('image/png'),widthMm:cm*10,placement:surface.value,rotation:Number(rotation.value),tilt:Number(tilt.value),lean:Number(lean.value)}),signal:current.signal});await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('The 3D viewer took too long to load. Try again.')),20000);enginePromise.then(value=>{clearTimeout(timer);resolve(value);},error=>{clearTimeout(timer);reject(error);});});if(token!==revision)return;
   readyUrl=model.url;if(model.iosSrc)viewer.setAttribute('ios-src',model.iosSrc);viewer.setAttribute('loading','eager');viewer.setAttribute('src',model.url);viewer.hidden=false;q('#ar-poster').hidden=true;
   q('#ar-current-size').textContent=`Preview: ${(model.widthMm/10).toFixed(2)} × ${(model.heightMm/10).toFixed(2)} cm. ${measured.checked?'Width entered by you; height follows the artwork proportions.':'Estimated dimensions — verify against the printed sticker.'}`;
   loadTimer=setTimeout(()=>{if(token===revision&&progress.hidden===false){current.abort();invalidate();say('The 3D model took too long to load. Prepare it again.',true);}},25000);
   expiryTimer=setTimeout(()=>{if(token===revision){invalidate();say('This preview expired. Prepare it again to continue.');}},model.expiresInSeconds*1000);
  }catch(error){if(token!==revision)return;progress.hidden=true;prepare.disabled=false;q('#ar-adjustments').open=true;say(error.name==='AbortError'?'Preparation stopped. Try again.':`Could not prepare the preview: ${error.message}`,true);}finally{clearTimeout(preparationTimer);}
 });
 viewer.addEventListener('load',()=>{if(!readyUrl||viewer.getAttribute('src')!==readyUrl)return;clearTimeout(loadTimer);progress.hidden=true;prepare.disabled=false;share.disabled=false;launch.hidden=false;deviceInfo();q('#ar-view-hint').textContent='Drag in any direction to inspect · Pinch to zoom';say(canLaunchAR()?'Preview ready. Open AR and place it on the chosen surface. Pinch to resize.':'3D preview ready. Live AR is unavailable on this device; the preview is not camera tracking.');});
 viewer.addEventListener('error',()=>{if(!readyUrl)return;clearTimeout(loadTimer);progress.hidden=true;prepare.disabled=false;launch.disabled=true;say('The model could not be displayed. Check your connection and prepare it again.',true);});
 launch.addEventListener('click',()=>{if(!readyUrl||!canLaunchAR()){deviceInfo();return;}say('Opening your AR viewer. Move slowly to find a flat surface, then tap to place.');viewer.activateAR().catch(error=>say(`AR could not open: ${error.message}. You can still use the 3D preview.`,true));});
 viewer.addEventListener('ar-status',event=>{if(event.detail.status==='failed')say('AR could not start. Check device support and camera permission, then try again.',true);if(event.detail.status==='object-placed')say(posterLayout?'Poster wall placed. Move around slowly to inspect alignment and scale.':'Sticker placed. Move around slowly to inspect alignment and size.');if(event.detail.status==='not-presenting')deviceInfo();});
 viewer.addEventListener('ar-tracking',event=>{if(event.detail.status==='not-tracking')say('Tracking lost. Hold the phone steady and rescan a detailed, well-lit surface.');});
 window.addEventListener('pagehide',()=>{controller?.abort();clearTimeout(expiryTimer);clearTimeout(loadTimer);});
 viewer.addEventListener('load',()=>{
  if(!readyUrl)return;
  prepare.textContent='Update preview';
  if(canLaunchAR()){q('#ar-phone').hidden=true;launch.classList.add('ar-primary');}
  else if(!shared){share.click();}
 });
 async function loadPrepared(){
  const token=revision,selectedHandle=handle;
  try{const data=await json(`/api/ar/ready/${encodeURIComponent(selectedHandle)}`);if(token!==revision||handle!==selectedHandle)return true;await import('/vendor/model-viewer/model-viewer.js');if(token!==revision||handle!==selectedHandle)return true;preparedCatalog=data;readyUrl=data.glb;viewer.setAttribute('ios-src',data.usdz);viewer.setAttribute('loading','eager');viewer.setAttribute('src',data.glb);viewer.hidden=false;q('#ar-poster').hidden=true;const fitBox=data.fitBoxMm?`${(data.fitBoxMm.width/10).toFixed(2)} × ${(data.fitBoxMm.height/10).toFixed(2)} cm max fit area`:'listing fit area';q('#ar-current-size').textContent=`Estimated preview: ${(data.widthMm/10).toFixed(2)} × ${(data.heightMm/10).toFixed(2)} cm within the ${fitBox}. Actual printed dimensions may be smaller.`;say('Loading your ready-to-view sticker…');return true;}
  catch{return token!==revision||handle!==selectedHandle;}
 }
 const initialRevision=revision;
 setup().then(async()=>{if(revision!==initialRevision)return;if(!shared){if(!layout&&surface.value!=='wall'&&await loadPrepared())return;prepare.click();}});
}
