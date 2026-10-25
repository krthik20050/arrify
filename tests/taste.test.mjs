import test from 'node:test';
import assert from 'node:assert/strict';
import {discover,tasteProfile,historyEvents,candidates} from '../lib/taste.mjs';
test('discovery has diverse purchasable actual stickers and stable cold start',()=>{
 const a=discover([]),b=discover([]);assert.equal(a.deck.length,20);assert.equal(new Set(a.deck.map(p=>p.id)).size,20);assert.deepEqual(a.deck.map(p=>p.id),b.deck.map(p=>p.id));assert.ok(a.deck.every(p=>candidates.includes(p)));assert.equal(a.feed.length,12);
});
test('likes shape labels; passes are weaker; removing an event exactly restores weights',()=>{
 const p=discover([]).deck[0];const positive=tasteProfile([{id:p.id,decision:'like'}]),negative=tasteProfile([{id:p.id,decision:'pass'}]);assert.ok(positive.weights.size);
 for(const [tag,value]of positive.weights)assert.equal(negative.weights.get(tag),value*-.25);
 const history=[{id:p.id,decision:'like'},{id:discover([]).deck[1].id,decision:'pass'}];history.pop();assert.deepEqual(tasteProfile(history).weights,positive.weights);
 const result=discover(history);assert.ok(!result.deck.some(x=>x.id===p.id));assert.ok(result.themes.length);assert.equal(result.likes,1);
});
test('invalid input cannot introduce unknown merchandise or arbitrary decision weights',()=>{
 assert.deepEqual(historyEvents([{id:'unknown',decision:'like'},{id:candidates[0].id,decision:'super-like'},null]),[]);assert.equal(historyEvents(Array(400).fill({id:candidates[0].id,decision:'like'})).length,300);
});

import {quote} from '../lib/catalog.mjs';
test('cart and studio use static bumper previews',()=>{for(const p of candidates.filter(p=>p.product_type==='Bumper Sticker')){const image=quote([{id:p.variants.find(v=>v.available).id,quantity:1}]).items[0].image;assert.ok(!new URL(image,'http://localhost').pathname.endsWith('.gif'));}});
