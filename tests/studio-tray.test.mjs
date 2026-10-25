import test from 'node:test';
import assert from 'node:assert/strict';
import {dropPosition} from '../public/studio-placement.js';

test('tray drops use the actual canvas bounds and reject releases outside it', () => {
  const frame={left:20,top:200,width:300,height:400};
  assert.deepEqual(dropPosition(95,300,frame),{x:25,y:25});
  assert.equal(dropPosition(95,150,frame),null);
  assert.equal(dropPosition(321,300,frame),null);
  assert.equal(dropPosition(20,200,{...frame,width:0}),null);
});
