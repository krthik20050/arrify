import {readFileSync} from 'node:fs';
import {products,available,collections,byId} from './catalog.mjs';
const filters=JSON.parse(readFileSync(new URL('../data/filters.json',import.meta.url)));
const labels=new Map();
for(const [label,ids] of Object.entries(filters))for(const id of ids){if(!labels.has(id))labels.set(id,[]);labels.get(id).push(label.split(':')[1]);}
export const candidates=products.filter(p=>['Stickers','Bumper Sticker','Holographic stickers','Glitter Stickers','Infinity Stickers'].includes(p.product_type)&&available(p)&&p.images.length);
const eligible=new Set(candidates.map(p=>p.id));
export function historyEvents(input){return (Array.isArray(input)?input:[]).slice(-300).filter(x=>x&&eligible.has(Number(x.id))&&['like','pass'].includes(x.decision)).map(x=>({id:Number(x.id),decision:x.decision}));}
export function tasteProfile(input){const history=historyEvents(input),weights=new Map();for(const event of history){const tags=labels.get(event.id)||[];for(const tag of tags)weights.set(tag,(weights.get(tag)||0)+(event.decision==='like'?1:-.25)/Math.sqrt(tags.length||1));}return {history,weights};}
export function popular(){const ids=collections().find(c=>c.handle==='best-seller-vinyl-stickers-india')?.product_ids||[];return ids.map(id=>byId.get(id)).filter(p=>p&&eligible.has(p.id)).slice(0,12);}
export function discover(input){
 const {history,weights}=tasteProfile(input),seen=new Set(history.map(x=>x.id));
 const score=p=>(labels.get(p.id)||[]).reduce((sum,t)=>sum+Math.max(-1,Math.min(3,weights.get(t)||0)),0)/Math.sqrt((labels.get(p.id)||[]).length||1);
 const ranked=[...candidates].sort((a,b)=>score(b)-score(a)||a.id-b.id);
 // Round-robin captured genres keeps an untrained deck and exploration broad.
 const diverse=[],used=new Set();const genres=Object.entries(filters).filter(([k])=>k.startsWith('genre:'));
 const groups=genres.map(([,ids])=>ids.map(id=>byId.get(id)).filter(p=>p&&eligible.has(p.id)));
 for(let n=0;n<100;n++)for(const group of groups){const p=group[n];if(p&&!used.has(p.id)){used.add(p.id);diverse.push(p);}}
 const blend=(primary,explore,count)=>{const out=[],added=new Set();let a=0,b=0;while(out.length<count&&(a<primary.length||b<explore.length)){const p=out.length%5===4&&b<explore.length?explore[b++]:primary[a++]||explore[b++];if(p&&!added.has(p.id)){added.add(p.id);out.push(p);}}return out;};
 const passed=new Set(history.filter(x=>x.decision==='pass').map(x=>x.id));
 const unseen=ranked.filter(p=>!seen.has(p.id)),explore=diverse.filter(p=>!seen.has(p.id));
 return {deck:history.length?blend(unseen,explore,20):explore.slice(0,20),feed:history.some(x=>x.decision==='like')?blend(ranked.filter(p=>!passed.has(p.id)),diverse.filter(p=>!passed.has(p.id)),12):popular(),themes:[...weights].filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([t])=>t),likes:history.filter(x=>x.decision==='like').length,count:history.length};
}
