import {templates,normalizePiece as normalize,clamp} from './poster-model.js';
import {catalogPromise,escapeHtml as e} from './poster-data.js';
const mount=document.querySelector('#poster-editor');
if(mount){
 const KEY='stickitup-posterized-studio-v1';
 let catalog;try{catalog=await catalogPromise;}catch(error){mount.textContent=error.message+' Reload to retry.';throw error;}
 const preferred=catalog.products.filter(p=>p.tags.includes('sizechart-single')&&!/wall setup|pack|split|combo|mix & match|build your|personalize/i.test(p.title));
 const defaultArtworks=preferred.length>=4?preferred:catalog.products;
 const artworks=catalog.products.map(p=>({id:p.id,title:p.title,image:p.images[0],images:p.images,thumbnail:p.thumbnail}));
 const loadImage=async src=>{const img=new Image();img.src=src;let timer;try{await Promise.race([img.decode(),new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('Image load timed out.')),20000);})]);return img;}finally{clearTimeout(timer);}};
 const urls=new Map(artworks.map(a=>[a.id,a.image]));
 const imageFor=p=>artworks.find(a=>a.id===p.art)?.images[p.imageIndex||0]||urls.get(p.art);
 const normalizePiece=p=>normalize(p,artworks);
 let pieces=[],selected=0,wallColor='#e8e3d8',photo=null,templateId='triptych',photoRevision=0;
 mount.innerHTML=`<div class="poster-grid"><aside class="poster-panel poster-gallery"><h2>Start with a layout</h2><div class="poster-templates">${templates.map(t=>`<button type="button" data-template="${t.id}" aria-pressed="false">${t.title}<span>${t.slots.length}</span></button>`).join('')}</div><h3>Posterized posters</h3><p class="poster-help">Add any poster from the catalog above, or search here. Up to 12 per wall.</p><input class="poster-gallery-search" type="search" data-art-search aria-label="Search studio posters" placeholder="Search posters"><div class="poster-art-grid"></div></aside><section class="poster-center" aria-label="Wall preview"><div class="poster-wall" role="group" aria-label="Poster arrangement. Select a poster and use arrow keys to move it."></div><p class="poster-help">Drag to arrange · Arrow keys move your selected poster · Shift + arrow moves faster.</p><div class="poster-actions"><button type="button" data-save>Save layout</button><button type="button" data-download>Download PNG</button><button type="button" data-clear>Clear wall</button></div><p class="poster-status" role="status" aria-live="polite"></p><p class="poster-help">Your layout and room photo stay in this browser. Photos are not included in saved layouts; upload yours again after returning.</p></section><aside class="poster-panel poster-settings"><h2>Make it yours</h2><div><label>Wall colour<input type="color" data-wall value="#e8e3d8"></label><label>Your room photo<input type="file" data-photo accept="image/jpeg,image/png,image/webp"></label><button type="button" data-remove-photo hidden>Remove room photo</button><p class="poster-help">JPG, PNG or WebP, up to 10 MB. Manual photo overlay; no surface tracking.</p></div><div><label>Selected poster size<input type="range" data-size min="10" max="32" value="20"></label><p class="poster-dimensions">Visual size relative to the wall.</p><label>Frame<select data-frame><option value="black">Black</option><option value="white">White</option><option value="oak">Oak</option><option value="none">Unframed</option></select></label><button type="button" data-remove class="poster-danger">Remove selected</button></div><div><h3>Swap selected artwork</h3><label>Artwork<select data-replace>${artworks.map(a=>`<option value="${a.id}">${e(a.title)}</option>`).join('')}</select></label><p class="poster-help">Templates replace the current arrangement. Save your layout first if you want to keep it.</p></div></aside></div>`;
 const q=s=>mount.querySelector(s),wall=q('.poster-wall'),say=s=>q('.poster-status').textContent=s;
 const arButton=document.createElement('button');arButton.type='button';arButton.textContent='Preview this wall in AR';arButton.dataset.posterAr='';q('.poster-actions').insertBefore(arButton,q('[data-clear]'));
 const onPoster=Boolean(document.querySelector('#poster-studio'));
 document.querySelectorAll('.si-departments a').forEach(a=>{if((onPoster&&a.pathname==='/pages/poster-studio')||(!onPoster&&a.pathname==='/'))a.setAttribute('aria-current','page');});
 function controls(){
  const p=pieces[selected];
  for(const selector of ['[data-size]','[data-frame]','[data-remove]','[data-replace]'])q(selector).disabled=!p;
  if(p){q('[data-size]').value=p.size;q('[data-frame]').value=p.frame;q('[data-replace]').value=p.art;}
  wall.querySelectorAll('.poster-piece').forEach((node,i)=>node.setAttribute('aria-pressed',String(i===selected)));
  mount.querySelectorAll('[data-template]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.template===templateId)));
 }
 function position(node,p){node.style.left=p.x+'%';node.style.top=p.y+'%';node.style.width=p.size+'%';node.dataset.frame=p.frame;}
 function render(){
  wall.replaceChildren();wall.style.backgroundColor=wallColor;wall.style.backgroundImage=photo?`url("${photo.src}")`:'none';
  pieces.forEach((p,index)=>{
   const node=document.createElement('button');node.type='button';node.className='poster-piece';node.setAttribute('aria-label',artworks.find(a=>a.id===p.art).title+'. Drag or use arrow keys to move.');
   const img=document.createElement('img');img.src=imageFor(p);img.alt='';img.draggable=false;node.append(img);position(node,p);
   node.addEventListener('focus',()=>{selected=index;controls();});
   node.addEventListener('pointerdown',event=>{
    if(event.button!==0)return;selected=index;node.focus();controls();node.setPointerCapture(event.pointerId);
    const start={x:event.clientX,y:event.clientY,px:p.x,py:p.y},rect=wall.getBoundingClientRect();
    const move=e=>{p.x=clamp(start.px+(e.clientX-start.x)/rect.width*100,15,85);p.y=clamp(start.py+(e.clientY-start.y)/rect.height*100,22,78);position(node,p);templateId='';controls();};
    const end=()=>{node.removeEventListener('pointermove',move);node.removeEventListener('pointerup',end);node.removeEventListener('pointercancel',end);node.removeEventListener('lostpointercapture',end);};
    node.addEventListener('pointermove',move);node.addEventListener('pointerup',end);node.addEventListener('pointercancel',end);node.addEventListener('lostpointercapture',end);
   });
   node.addEventListener('keydown',event=>{
    const delta=event.shiftKey?3:1;
    if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;
    event.preventDefault();if(event.key==='ArrowLeft')p.x-=delta;if(event.key==='ArrowRight')p.x+=delta;if(event.key==='ArrowUp')p.y-=delta;if(event.key==='ArrowDown')p.y+=delta;
    Object.assign(p,normalizePiece(p));templateId='';position(node,p);controls();
   });wall.append(node);
  });controls();
 }
 function applyTemplate(id){const t=templates.find(t=>t.id===id);pieces=t.slots.map(([x,y,size],i)=>({art:pieces[i]?.art||defaultArtworks[i].id,x,y,size,frame:'none'}));selected=0;templateId=id;render();say(t.title+' applied. Select any poster to customise it.');}
 mount.querySelectorAll('[data-template]').forEach(b=>b.onclick=()=>applyTemplate(b.dataset.template));
 function addPoster(id,imageIndex=0){if(!urls.has(id))return;if(pieces.length>=12)return say('Your wall can hold up to 12 posters. Remove one to add another.');pieces.push(normalizePiece({art:id,imageIndex,x:50,y:45,size:20,frame:'none'}));selected=pieces.length-1;templateId='';render();say('Product photo added. Drag it into place.');}
 function renderLibrary(){const query=q('[data-art-search]').value.toLocaleLowerCase();const matches=artworks.filter(a=>a.title.toLocaleLowerCase().includes(query));q('.poster-art-grid').innerHTML=matches.slice(0,24).map(a=>`<button type="button" data-art="${a.id}"><img src="${e(a.thumbnail)}" alt="" loading="lazy">${e(a.title)}</button>`).join('')||'<p>No matching posters.</p>';}
 q('[data-art-search]').oninput=renderLibrary;
 q('.poster-art-grid').addEventListener('click',event=>{const button=event.target.closest('[data-art]');if(button)addPoster(button.dataset.art);});
 window.addEventListener('poster:add',event=>addPoster(event.detail?.id,event.detail?.imageIndex));renderLibrary();
 q('[data-size]').oninput=e=>{if(!pieces[selected])return;pieces[selected].size=clamp(e.target.value,10,32);templateId='';render();};
 q('[data-frame]').onchange=e=>{if(!pieces[selected])return;pieces[selected].frame=e.target.value;render();};
 q('[data-replace]').onchange=e=>{if(!pieces[selected])return;pieces[selected].art=e.target.value;delete pieces[selected].imageIndex;render();};
 q('[data-remove]').onclick=()=>{pieces.splice(selected,1);selected=Math.max(0,selected-1);templateId='';render();say('Poster removed.');};
 q('[data-wall]').oninput=e=>{wallColor=e.target.value;wall.style.backgroundColor=wallColor;if(photo)say('Remove the room photo to see the wall colour.');};
 q('[data-clear]').onclick=()=>{pieces=[];selected=0;templateId='';render();say('Wall cleared. Pick artwork or a template to start again.');};
 const saveLayout=()=>localStorage.setItem(KEY,JSON.stringify({version:1,pieces,wallColor,templateId,wallRatio:wall.clientWidth/wall.clientHeight}));
 q('[data-save]').onclick=()=>{try{saveLayout();say('Layout saved in this browser. Room photos are not saved.');}catch{say('Could not save: browser storage is unavailable or full. You can still download a PNG.');}};
 arButton.onclick=()=>{if(!pieces.length)return say('Add posters to your wall before opening AR.');try{saveLayout();location.href='/pages/try-live?posterLayout=studio&surface=wall';}catch{say('Could not save this wall for AR. Check browser storage and try again.');}};
 q('[data-photo]').onchange=async event=>{
  const revision=++photoRevision,file=event.target.files[0];if(!file)return;
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>10*1024*1024){event.target.value='';return say('Choose a JPG, PNG or WebP photo smaller than 10 MB.');}
  try{const src=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file);});const img=new Image();img.src=src;await img.decode();if(revision!==photoRevision)return;photo=img;q('[data-remove-photo]').hidden=false;render();say('Room photo loaded. Drag posters to line them up with your wall.');}catch{say('This photo could not be opened. Try another image.');}
 };
 q('[data-remove-photo]').onclick=()=>{photoRevision++;photo=null;q('[data-photo]').value='';q('[data-remove-photo]').hidden=true;render();say('Room photo removed.');};
 q('[data-download]').onclick=async()=>{
  const button=q('[data-download]');button.disabled=true;
  try{
   // Snapshot the visible scene before asynchronous image decoding.
   const snapshot=pieces.map(p=>({...p})),background=photo,colour=wallColor,ratio=wall.clientWidth/wall.clientHeight;
   const canvas=document.createElement('canvas');canvas.width=1600;canvas.height=Math.round(1600/ratio);const ctx=canvas.getContext('2d');ctx.fillStyle=colour;ctx.fillRect(0,0,canvas.width,canvas.height);
   if(background){const scale=Math.max(canvas.width/background.width,canvas.height/background.height),w=background.width*scale,h=background.height*scale;ctx.drawImage(background,(canvas.width-w)/2,(canvas.height-h)/2,w,h);}
   ctx.fillStyle='#00000008';ctx.fillRect(0,canvas.height*.88,canvas.width,canvas.height*.12);
   for(const p of snapshot){const img=await loadImage(imageFor(p));const w=p.size/100*canvas.width,h=w*1.5,x=p.x/100*canvas.width-w/2,y=p.y/100*canvas.height-h/2,frame=p.frame==='none'?0:8;ctx.save();ctx.shadowColor='#0004';ctx.shadowBlur=14;ctx.shadowOffsetY=6;ctx.fillStyle=({black:'#20211e',white:'#fff',oak:'#b58b59',none:'#fff'})[p.frame];ctx.fillRect(x,y,w,h);ctx.restore();const innerW=w-frame*2,innerH=h-frame*2,scale=Math.min(innerW/img.width,innerH/img.height),iw=img.width*scale,ih=img.height*scale;ctx.drawImage(img,x+frame+(innerW-iw)/2,y+frame+(innerH-ih)/2,iw,ih);}
   ctx.fillStyle='#1c1e18';ctx.font='16px Arial';ctx.fillText('Posterized.in product photos / Wall preview - estimated scale',20,canvas.height-20);
   const data=canvas.toDataURL('image/png'),link=document.createElement('a');link.href=data;link.download='stickitup-poster-wall.png';link.click();say('PNG download started.');
  }catch{say('The preview could not be exported. Try a smaller room photo.');}finally{button.disabled=false;}
 };
 let restored=false;
 try{const saved=JSON.parse(localStorage.getItem(KEY));if(saved?.version===1&&Array.isArray(saved.pieces)){pieces=saved.pieces.slice(0,12).map(normalizePiece).filter(Boolean);if(/^#[0-9a-f]{6}$/i.test(saved.wallColor))wallColor=saved.wallColor;templateId=templates.some(t=>t.id===saved.templateId)?saved.templateId:'';q('[data-wall]').value=wallColor;render();say('Saved wall restored. Room photos can be uploaded again.');restored=true;}}catch{}
 if(!restored)applyTemplate('triptych');
}
