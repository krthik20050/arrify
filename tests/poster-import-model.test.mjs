import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizePiece} from '../public/poster-model.js';
test('imported poster identifiers survive save recovery without allowing arbitrary artwork',()=>{
 const allowed=[{id:'posterized-123',title:'A poster'}];
 assert.deepEqual(normalizePiece({art:'posterized-123',x:50,y:45,size:20,frame:'oak'},allowed),{art:'posterized-123',x:50,y:45,size:20,frame:'oak'});
 assert.equal(normalizePiece({art:'slow'},allowed),null);
});
test('saved image choices are bounded to that product image gallery',()=>{
 const allowed=[{id:'posterized-123',images:['/one.jpg','/two.jpg']}];
 assert.equal(normalizePiece({art:'posterized-123',imageIndex:1},allowed).imageIndex,1);
 assert.equal(normalizePiece({art:'posterized-123',imageIndex:999},allowed).imageIndex,undefined);
});
