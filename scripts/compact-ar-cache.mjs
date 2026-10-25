import {mkdir,readFile,writeFile,access} from 'node:fs/promises';
import {list,del} from '@vercel/blob';
const prefix='sticker-ar/catalog/clean-v2-native-v1/';
const manifest=JSON.parse(await readFile(new URL('../data/ar-catalog.json',import.meta.url),'utf8'));
const cache=new URL('../artifacts/ar-catalog-source/',import.meta.url);await mkdir(cache,{recursive:true});
const queue=Object.entries(manifest);let saved=0;
async function worker(){for(;;){const next=queue.shift();if(!next)return;const [handle,entry]=next;if(entry.version!=='clean-v2-native-v1')continue;
 const url=new URL(entry.texture);if(!url.pathname.startsWith('/'+prefix))throw new Error('Unexpected cache prefix; refusing cleanup.');
 try{await access(new URL(`${handle}.png`,cache));saved++;continue;}catch{}
 const response=await fetch(url,{signal:AbortSignal.timeout(30000)});if(!response.ok)throw new Error(`Could not preserve ${handle}`);await writeFile(new URL(`${handle}.png`,cache),Buffer.from(await response.arrayBuffer()));saved++;if(saved%100===0)console.log('Preserved',saved);
}}
await Promise.all(Array.from({length:16},worker));await writeFile(new URL('metadata.json',cache),JSON.stringify(manifest));
let cursor,objects=[];do{const page=await list({prefix,limit:1000,cursor});objects.push(...page.blobs);cursor=page.hasMore?page.cursor:undefined;}while(cursor);
if(objects.some(b=>!b.pathname.startsWith(prefix)))throw new Error('Cache scope mismatch.');
for(let i=0;i<objects.length;i+=100){for(let attempt=0;;attempt++){try{await del(objects.slice(i,i+100).map(b=>b.url));break;}catch(error){if(!error.retryAfter||attempt>=5)throw error;console.log('Storage cooldown',error.retryAfter);await new Promise(resolve=>setTimeout(resolve,Math.max(1000,error.retryAfter*1000+1000)));}}console.log('Cleared',Math.min(i+100,objects.length));}
console.log(JSON.stringify({preserved:saved,removedGeneratedCacheFiles:objects.length,prefix}));
