import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from '../server.mjs';
test('poster studio is reachable and both departments are linked', async()=>{
 const server=createServer(); await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try {
  const base=`http://127.0.0.1:${server.address().port}`;
  const response=await fetch(base+'/pages/poster-studio');
  assert.equal(response.status,200);
  const html=await response.text();
  assert.match(html,/id="poster-studio"/);
  assert.match(html,/aria-label="Shop department"/);
  assert.match(html,/href="\/">Stickers/);
  assert.match(html,/src="\/poster-studio.js"/);
  assert.match(html,/Posterized\.in/);
  const home=await (await fetch(base)).text();
  assert.match(home,/href="\/pages\/poster-studio"/);
 } finally {await new Promise(resolve=>server.close(resolve));}
});
import {artworks,templates,normalizePiece,artworkSvg} from '../public/poster-model.js';
test('saved poster state rejects unknown art and bounds untrusted positions',()=>{
 assert.equal(normalizePiece({art:'unknown'}),null);
 assert.deepEqual(normalizePiece({art:artworks[0].id,x:-40,y:200,size:999,frame:'url(bad)'}),{art:artworks[0].id,x:15,y:78,size:32,frame:'black'});
 assert.equal(normalizePiece(null),null);
});
test('built-in wall templates fit their landscape wall without overlapping artwork',()=>{
 assert.equal(new Set(templates.map(t=>t.id)).size,4);
 for(const template of templates){
  const rects=template.slots.map(([x,y,w])=>({left:x-w/2,right:x+w/2,top:y-w,bottom:y+w}));
  for(const rect of rects){assert.ok(rect.left>=0&&rect.right<=100&&rect.top>=0&&rect.bottom<=100,template.id);}
  for(let i=0;i<rects.length;i++)for(let j=i+1;j<rects.length;j++){
   const a=rects[i],b=rects[j];assert.ok(a.right<=b.left||b.right<=a.left||a.bottom<=b.top||b.bottom<=a.top,template.id);
  }
 }
});
test('concept artwork is self contained for local image export',()=>{
 assert.equal(artworks.length,6);
 for(const art of artworks){const svg=artworkSvg(art);assert.match(svg,/STUDIO CONCEPT/);assert.doesNotMatch(svg,/<script|href=|<image/);}
});
