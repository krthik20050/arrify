import {dropPosition} from './studio-placement.js';
export function initializeStickerStudio(mount=document.getElementById('sticker-studio')) {
  if (!mount) return;
  if(mount.dataset.studioInitialized)return;
  mount.dataset.studioInitialized='true';
  const KEY = 'stickitup-studio-v1';
  const appleMobile=/iPhone|iPad|iPod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  const clamp = (n, min, max) => Math.min(max, Math.max(min, Number(n) || 0));
  const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
  const el = (tag, cls, text) => { const node = document.createElement(tag); if (cls) node.className = cls; if (text) node.textContent = text; return node; };
  let items = [], pieces = [], selected = null, stream = null, cameraRequest = 0;
  const images = new Map();
  let previewTimer, previewExpiry, previewRequest, previewRevision = 0, imagesReady = false;
  mount.innerHTML = `<div class="studio-toolbar"><div><span class="studio-eyebrow">MAKE IT YOURS</span><h1>Your stickers. Your space.</h1><p>Arrange your cart stickers, then view the whole layout in your space.</p></div><a href="/collections/all">Find more stickers ↗</a></div><div class="studio-layout"><section class="studio-workspace" aria-label="Sticker arrangement"><div class="studio-mode"><button type="button" data-camera>Camera overlay (optional)</button><button type="button" data-stop hidden>Stop camera</button><span data-camera-label>Layout preview</span></div><div class="studio-view"><video autoplay muted playsinline aria-label="Live camera preview"></video><div class="studio-stage" aria-label="Arrangement canvas; select and drag stickers"></div></div><p class="studio-help">Drag to arrange · Select a sticker, then use arrow keys to move it. Shift + arrow moves faster.</p><div class="studio-controls"><label>Sticker size <input data-size type="range" min="8" max="42" value="20" disabled></label><label>Rotation <input data-rotation type="range" min="-180" max="180" value="0" disabled></label><button type="button" data-delete disabled>Remove selected</button></div><div class="studio-actions"><button type="button" data-save>Save layout</button><button type="button" data-export>Download PNG</button><a href="/pages/try-live?layout=cart" data-ar-layout><img class="studio-ar-icon" src="/placeholder.svg" alt=""><span>View this layout in your space ↗</span></a><button type="button" data-reset>Clear layout</button></div><p class="studio-status" role="status" aria-live="polite"></p><p class="studio-ar-status" role="status" aria-live="polite"></p><p class="studio-disclaimer">Camera mode is a manual overlay: hold your phone steady and line up your laptop with the frame. It does not track surfaces or show exact physical size. Camera images stay on your device. In AR, the arrangement moves and scales as one group. Return here to move individual stickers.</p></section><aside class="studio-bag"><div class="studio-bag-heading"><h2>Your cart stickers</h2><button type="button" data-refresh>Refresh</button></div><p>Your stickers are placed for you. Drag, resize or rotate each one. Up to 25 copies per layout.</p><button type="button" class="studio-add-all" data-add-all>Add all cart stickers</button><div class="studio-items"></div><a class="studio-cart-link" href="/cart">Back to your bag →</a></aside></div>`;
  const q = selector => mount.querySelector(selector);
  mount.classList.add('sticker-workspace');
  if(location.pathname==='/pages/sticker-studio')document.body.classList.add('studio-full-page');
  const tray=q('.studio-bag');
  q('.studio-view').prepend(tray);
  q('.studio-bag-heading h2').textContent='Your stickers';
  for(const [label,direction] of [['Previous stickers',-1],['Next stickers',1]]){
    const button=el('button','studio-tray-scroll',direction<0?'←':'→');button.type='button';button.setAttribute('aria-label',label);
    button.addEventListener('click',()=>q('.studio-items').scrollBy({left:direction*180,behavior:'smooth'}));
    q('.studio-bag-heading').append(button);
  }
  tray.querySelector('p').textContent='Drag a bubble onto your surface, or tap to place. Nothing is placed automatically.';
  q('.studio-toolbar h1').textContent='Arrange your stickers';
  q('.studio-toolbar p').textContent='Place each sticker yourself. Open your finished layout in AR / Object.';
  q('[data-camera]').textContent='Start camera';
  q('[data-ar-layout] span').textContent='Open AR / Object ↗';
  const stage = q('.studio-stage'), video = q('video'), status = q('.studio-status');
  const say = text => { status.textContent = text; };
  const asset = src => { try { const url = new URL(src, location.origin); return ['http:', 'https:'].includes(url.protocol) ? url.href : ''; } catch { return ''; } };
  const current = () => pieces.find(piece => piece.key === selected);
  function select(key) {
    selected = key;
    stage.querySelectorAll('.studio-piece').forEach(node => node.classList.toggle('is-selected', node.dataset.key === key));
    const piece = current();
    q('[data-size]').disabled = q('[data-rotation]').disabled = q('[data-delete]').disabled = !piece;
    if (piece) { q('[data-size]').value = piece.size; q('[data-rotation]').value = piece.rotation; }
  }
  function position(node, piece) {
    node.style.left = `${piece.x}%`; node.style.top = `${piece.y}%`; node.style.width = `${piece.size}%`;
    node.style.transform = `translate(-50%, -50%) rotate(${piece.rotation}deg)`;
    schedulePreview();
  }
  function render() {
    stage.replaceChildren();
    pieces.forEach(piece => {
      const item = items.find(value => String(value.id) === piece.id);
      if (!item) return;
      const node = el('button', 'studio-piece'); node.type = 'button'; node.dataset.key = piece.key;
      node.setAttribute('aria-label', `${item.title}. Drag or use arrow keys to move.`);
      const img = el('img'); img.src = images.get(piece.id)?.src || asset(item.image); img.alt = ''; img.draggable = false;
      img.addEventListener('error', () => { node.classList.add('studio-image-error'); node.title = 'Image unavailable'; });
      node.append(img); position(node, piece);
      node.addEventListener('focus', () => select(piece.key));
      node.addEventListener('pointerdown', event => {
        event.preventDefault(); select(piece.key); node.focus({preventScroll:true}); node.setPointerCapture(event.pointerId);
        const rect = stage.getBoundingClientRect(); const start = {x:event.clientX,y:event.clientY,px:piece.x,py:piece.y};
        const move = e => { piece.x = clamp(start.px + (e.clientX-start.x)/rect.width*100, 0,100); piece.y = clamp(start.py+(e.clientY-start.y)/rect.height*100,0,100); position(node,piece); };
        const end = () => { node.removeEventListener('pointermove',move); node.removeEventListener('pointerup',end); node.removeEventListener('pointercancel',end); };
        node.addEventListener('pointermove',move); node.addEventListener('pointerup',end); node.addEventListener('pointercancel',end);
      });
      node.addEventListener('keydown', event => {
        const step = event.shiftKey ? 5 : 1;
        if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)) {
          event.preventDefault(); piece.x = clamp(piece.x + (event.key==='ArrowLeft'?-step:event.key==='ArrowRight'?step:0),0,100); piece.y = clamp(piece.y+(event.key==='ArrowUp'?-step:event.key==='ArrowDown'?step:0),0,100); position(node,piece);
        }
        if (event.key==='Delete' || event.key==='Backspace') { event.preventDefault(); remove(); }
      });
      stage.append(node);
    });
    select(selected);
    schedulePreview();
  }
  function add(item, point) {
    if (pieces.length >= 25) { say('This layout has 25 stickers. Remove one to make room.'); return; }
    const owned = clamp(item.quantity,1,25);
    if (pieces.filter(piece=>piece.id===String(item.id)).length >= owned) { say('All copies of this sticker in your cart are already in the layout.'); return; }
    const piece = {key:crypto.randomUUID(),id:String(item.id),x:point?.x ?? 50,y:point?.y ?? 50,size:20,rotation:0};
    pieces.push(piece); selected=piece.key; render(); say(`${item.title} added to your layout.`);
  }
  function remove() { pieces=pieces.filter(piece=>piece.key!==selected); selected=null; render(); say('Sticker removed from the layout. Your bag is unchanged.'); }
  function addAll() {
    let added = 0;
    for (const item of items) {
      const present = pieces.filter(piece => piece.id === String(item.id)).length;
      for (let i = present; i < clamp(item.quantity, 1, 25) && pieces.length < 25; i++) {
        const index = pieces.length;
        pieces.push({key:crypto.randomUUID(),id:String(item.id),x:18+(index%5)*16,y:20+(Math.floor(index/5)%5)*15,size:16,rotation:0});
        added++;
      }
    }
    render();
    const total = items.reduce((sum, item) => sum + Number(item.quantity), 0);
    say(total > 25 ? 'The first 25 cart stickers are in this layout. Remove copies to try other stickers.' : added ? `${pieces.length} cart sticker${pieces.length === 1 ? '' : 's'} ready. Arrange them, then choose View this layout in your space.` : 'All cart stickers are already in your layout.');
  }
  async function prepare(item) {
    const id=String(item.id), source=asset(item.image); if(!source) return;
    try {
      const img=new Image(); img.crossOrigin='anonymous'; img.src=source; await img.decode();
      const canvas=document.createElement('canvas'); const ratio=Math.min(1,600/Math.max(img.width,img.height)); canvas.width=Math.max(1,Math.round(img.width*ratio)); canvas.height=Math.max(1,Math.round(img.height*ratio));
      const context=canvas.getContext('2d'); context.drawImage(img,0,0,canvas.width,canvas.height);
      // Remove only near-white pixels connected to the outer edge, preserving interior white artwork.
      const data=context.getImageData(0,0,canvas.width,canvas.height), pixels=data.data, seen=new Uint8Array(canvas.width*canvas.height), queue=[];
      const visit=index=>{ if(index<0 || index>=seen.length || seen[index])return; seen[index]=1; const p=index*4; if(pixels[p]>242&&pixels[p+1]>242&&pixels[p+2]>242){queue.push(index); pixels[p+3]=0;} };
      for(let x=0;x<canvas.width;x++){visit(x);visit((canvas.height-1)*canvas.width+x);} for(let y=0;y<canvas.height;y++){visit(y*canvas.width);visit(y*canvas.width+canvas.width-1);}
      for(let i=0;i<queue.length;i++){const n=queue[i],x=n%canvas.width; if(x>0)visit(n-1);if(x<canvas.width-1)visit(n+1);visit(n-canvas.width);visit(n+canvas.width);}
      context.putImageData(data,0,0); const output=new Image(); output.src=canvas.toDataURL('image/png'); await output.decode(); images.set(id,output);
    } catch { /* Display catalog image unchanged when its server does not permit pixel access. */ }
  }
  async function load() {
    q('[data-refresh]').disabled=true; imagesReady=false; schedulePreview();
    try {
      const cart=read('stickitup-cart-v1',[]);
      const response=await fetch('/api/cart/quote',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items:Array.isArray(cart)?cart:[]}),signal:AbortSignal.timeout(12000)});
      if(!response.ok)throw new Error('Unable to load bag');
      const result=await response.json(); items=Array.isArray(result.items)?result.items.filter(item=>/^(Stickers|Bumper Sticker|Holographic stickers|Glitter Stickers|Infinity Stickers)$/.test(item.product_type||'')).map(item=>({...item,image:`/api/ar/image/${encodeURIComponent(item.handle)}?canvas=1`})):[];
      const list=q('.studio-items');list.replaceChildren();
      if(!items.length){list.append(el('p','studio-empty','No individual stickers to arrange yet. Add stickers to your bag, then come back. Clothing and other products stay in your bag.'));const link=el('a','studio-browse','Browse stickers →');link.href='/collections/all';list.append(link);}
      items.forEach(item=>{
        const button=el('button','studio-item');button.type='button';
        button.setAttribute('aria-label',`${item.title}, ${item.quantity} in cart. Drag or tap to place.`);button.title=item.title;
        const img=el('img');img.src=asset(item.image);img.alt='';img.loading='lazy';img.draggable=false;
        const count=el('small','studio-quantity',String(item.quantity));button.append(img,count);
        let suppressClick=false;
        button.addEventListener('click',()=>{if(!suppressClick)add(item);});
        button.addEventListener('pointerdown',event=>{
          if(event.button!==0)return;
          button.setPointerCapture(event.pointerId);
          const start={x:event.clientX,y:event.clientY};let ghost=null;
          const move=e=>{
            if(e.pointerId!==event.pointerId)return;
            if(!ghost && Math.hypot(e.clientX-start.x,e.clientY-start.y)<8)return;
            if(!ghost){ghost=el('img','studio-drag-ghost');ghost.src=images.get(String(item.id))?.src||img.src;ghost.alt='';document.body.append(ghost);}
            ghost.style.left=`${e.clientX}px`;ghost.style.top=`${e.clientY}px`;
          };
          const end=e=>{
            if(e.pointerId!==event.pointerId)return;
            button.removeEventListener('pointermove',move);button.removeEventListener('pointerup',end);button.removeEventListener('pointercancel',end);button.removeEventListener('lostpointercapture',end);
            if(ghost){ghost.remove();suppressClick=true;setTimeout(()=>{suppressClick=false;},0);
              if(e.type==='pointerup'){
                const point=dropPosition(e.clientX,e.clientY,stage.getBoundingClientRect());
                const trayBox=tray.getBoundingClientRect();
                const overTray=e.clientX>=trayBox.left&&e.clientX<=trayBox.right&&e.clientY>=trayBox.top&&e.clientY<=trayBox.bottom;
                if(point&&!overTray)add(item,point);else say('Drop onto the preview below the tray to place a sticker.');
              }
            }
          };
          button.addEventListener('pointermove',move);button.addEventListener('pointerup',end);button.addEventListener('pointercancel',end);button.addEventListener('lostpointercapture',end);
        });
        list.append(button);
      });
      const saved=read(KEY,null); const source=pieces.length?pieces:saved;
      const used=new Map();pieces=(Array.isArray(source)?source:[]).slice(0,25).filter(p=>{if(!p||typeof p!=='object')return false;const item=items.find(i=>String(i.id)===String(p.id));const count=(used.get(String(p.id))||0)+1;used.set(String(p.id),count);return item&&count<=item.quantity;}).map((p,index)=>({key:`saved-${index}`,id:String(p.id),x:clamp(p.x,0,100),y:clamp(p.y,0,100),size:clamp(p.size,8,42),rotation:clamp(p.rotation,-180,180)}));
      render();
      q('[data-add-all]').disabled = !items.length;
      await Promise.allSettled(items.map(prepare)); imagesReady=true; render();
    } catch { say('Your bag could not load. Check your connection and tap Refresh.'); }
    finally {q('[data-refresh]').disabled=false;}
  }
  function stopCamera(message=true) {
    cameraRequest++;if(stream)stream.getTracks().forEach(track=>track.stop());stream=null;video.srcObject=null;mount.classList.remove('studio-camera-on');q('[data-camera]').disabled=false;q('[data-camera]').hidden=false;q('[data-stop]').hidden=true;q('[data-camera-label]').textContent='Layout preview';if(message)say('Camera stopped.');
  }
  q('[data-camera]').addEventListener('click',async()=>{
    if(!navigator.mediaDevices?.getUserMedia){say('Camera preview needs HTTPS or localhost and a browser with camera support. You can still use the laptop preview.');return;}
    const request=++cameraRequest;q('[data-camera]').disabled=true;q('[data-stop]').hidden=false;say('Allow camera access in your browser, or tap Stop camera to cancel.');
    try {
      const incoming=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false});
      if(request!==cameraRequest || document.hidden){incoming.getTracks().forEach(track=>track.stop());return;}
      stream=incoming;video.srcObject=stream;await video.play();if(request!==cameraRequest || !stream)return;mount.classList.add('studio-camera-on');q('[data-camera]').hidden=true;q('[data-stop]').hidden=false;q('[data-camera-label]').textContent='Live camera · manual framing';say('Line up your laptop with the frame, then arrange your stickers.');
    } catch(error) {if(request!==cameraRequest)return;stopCamera(false);say(error.name==='NotAllowedError'?'Camera access was declined. You can change permission in browser settings and try again.':error.name==='NotFoundError'?'No camera found. Use laptop preview or try a phone.':'Camera could not start. Close other camera apps and try again.');}
  });
  q('[data-stop]').addEventListener('click',()=>stopCamera());
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stopCamera(false);});window.addEventListener('pagehide',()=>stopCamera(false));
  q('[data-refresh]').addEventListener('click',load);
  q('[data-add-all]').addEventListener('click',addAll);
  q('[data-delete]').addEventListener('click',remove);
  [['[data-size]','size'],['[data-rotation]','rotation']].forEach(([selector,property])=>q(selector).addEventListener('input',event=>{const piece=current();if(piece){piece[property]=Number(event.target.value);const node=stage.querySelector(`[data-key="${piece.key}"]`);if(node)position(node,piece);}}));
  q('[data-save]').addEventListener('click',()=>{try{localStorage.setItem(KEY,JSON.stringify(pieces));schedulePreview();say('Layout saved on this device.');}catch{say('Your browser could not save this layout. Try Download PNG instead.');}});
  q('[data-reset]').addEventListener('click',()=>{pieces=[];selected=null;render();try{localStorage.setItem(KEY,'[]');say('Layout cleared. Your bag is unchanged.');}catch{say('Layout cleared for this visit. Browser storage is unavailable.');}});
  q('[data-ar-layout]').addEventListener('click',event=>{
    if(!pieces.length){event.preventDefault();say('Place a sticker first, then view your layout.');return;}
    try{localStorage.setItem(KEY,JSON.stringify(pieces));stopCamera(false);}
    catch{event.preventDefault();say('The layout could not be saved. Enable browser storage to transfer it to AR.');}
  });
  function schedulePreview() {
    const revision=++previewRevision;
    clearTimeout(previewTimer);clearTimeout(previewExpiry);previewRequest?.abort();
    const link=q('[data-ar-layout]');link.removeAttribute('rel');link.href='/pages/try-live?layout=cart';
    const hint=q('.studio-ar-status');
    if(!pieces.length){hint.textContent='Add stickers to view a layout in your space.';return;}
    if(!imagesReady){hint.textContent='Loading your sticker artwork…';return;}
    if(pieces.some(piece=>!images.has(piece.id))){hint.textContent='Some artwork could not load. Open the preview to retry.';return;}
    hint.textContent='Updating your 3D layout in the background…';
    previewTimer=setTimeout(async()=>{
      const request=new AbortController();previewRequest=request;
      const timeout=setTimeout(()=>request.abort(),45000);
      try {
        const canvas=document.createElement('canvas');canvas.width=1400;canvas.height=900;
        const context=canvas.getContext('2d');
        for(const piece of pieces){const image=images.get(piece.id),width=1400*piece.size/100,height=width*image.height/image.width;context.save();context.translate(piece.x*14,piece.y*9);context.rotate(piece.rotation*Math.PI/180);context.drawImage(image,-width/2,-height/2,width,height);context.restore();}
        const response=await fetch('/api/ar/prepare',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({png:canvas.toDataURL('image/png'),widthMm:320}),signal:request.signal});
        const model=await response.json();if(!response.ok)throw new Error(model.error||'Unable to prepare layout');
        if(revision!==previewRevision)return;
        const native=new URL(model.iosSrc||'',location.origin),glb=new URL(model.url||'',location.origin);
        if(!model.url||glb.origin!==location.origin)throw new Error('Invalid model response');
        if(appleMobile&&link.relList?.supports?.('ar')&&model.iosSrc&&native.origin===location.origin){link.rel='ar';native.hash='allowsContentScaling=0';link.href=native.href;hint.textContent='Ready. Tap View this layout in your space to open AR.';}
        else if(/Android/i.test(navigator.userAgent)){const fallback=encodeURIComponent(new URL('/pages/try-live?layout=cart',location.origin).href);link.href=`intent://arvr.google.com/scene-viewer/1.0?file=${encodeURIComponent(glb.href)}&mode=ar_preferred&resizable=false&enable_vertical_placement=true#Intent;scheme=https;package=com.google.ar.core;action=android.intent.action.VIEW;S.browser_fallback_url=${fallback};end;`;hint.textContent='Ready. Tap View this layout in your space to open AR.';}
        else hint.textContent='Your 3D layout is ready. Open the preview for a phone QR.';
        const lifetime=Number(model.expiresInSeconds)||1800;
        previewExpiry=setTimeout(schedulePreview,Math.max(1000,(lifetime-30)*1000));
      }catch(error){if(revision===previewRevision)hint.textContent='Direct AR is not ready. You can still open the preview and retry.';}
      finally{clearTimeout(timeout);if(previewRequest===request)previewRequest=null;}
    },800);
  }
  window.addEventListener('pagehide',()=>{clearTimeout(previewTimer);clearTimeout(previewExpiry);previewRequest?.abort();});
  q('[data-export]').addEventListener('click',async()=>{
    const button=q('[data-export]');button.disabled=true;
    try {
      if(!pieces.length){say('Place a sticker first, then download your layout.');return;}
      if(pieces.some(piece=>!images.has(piece.id))){say('Some image servers do not allow export. Your layout is still available here; use Save layout to keep it on this device.');return;}
      const canvas=document.createElement('canvas');canvas.width=1400;canvas.height=900;const context=canvas.getContext('2d');
      if(stream && video.readyState>=2){const view=q('.studio-view').getBoundingClientRect(),frame=stage.getBoundingClientRect(),ratio=Math.max(view.width/video.videoWidth,view.height/video.videoHeight);const sx=(frame.left-view.left+(video.videoWidth*ratio-view.width)/2)/ratio,sy=(frame.top-view.top+(video.videoHeight*ratio-view.height)/2)/ratio;context.drawImage(video,sx,sy,frame.width/ratio,frame.height/ratio,0,0,1400,900);}else{context.fillStyle='#d8dadd';context.fillRect(0,0,1400,900);}
      pieces.forEach(piece=>{const image=images.get(piece.id),width=1400*piece.size/100,height=width*image.height/image.width;context.save();context.translate(piece.x*14,piece.y*9);context.rotate(piece.rotation*Math.PI/180);context.drawImage(image,-width/2,-height/2,width,height);context.restore();});
      const link=el('a');link.download='my-stickitup-layout.png';link.href=canvas.toDataURL('image/png');link.click();say('Layout downloaded. This is a visual arrangement, not a physical size guide.');
    }catch{say('Export is unavailable in this browser. Use Save layout to keep your arrangement.');}finally{button.disabled=false;}
  });
  load();
}
if(document.getElementById('sticker-studio'))initializeStickerStudio();
