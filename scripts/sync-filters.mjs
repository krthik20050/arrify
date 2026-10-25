import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {execFile} from 'node:child_process'; import {promisify} from 'node:util'; import {load} from 'cheerio';
const run=promisify(execFile),origin='https://www.stickitup.xyz';
const catalog=JSON.parse(await readFile('data/catalog.json','utf8')).products;
const handles=new Map(catalog.map(p=>[p.handle,p.id]));
await mkdir('reference/filters',{recursive:true});
const source=await readFile('reference/quiz-original.js','utf8');
const parts=source.split('var styles=');
const names=part=>[...part.matchAll(/filter:"([^"]+)"/g)].map(x=>x[1]);
const jobs=[...names(parts[0]).map(value=>({type:'genre',value})),...names(parts[1].split('var themeCounts')[0]).map(value=>({type:'personality',value}))].filter(job=>!process.argv[2]||job.value===process.argv[2]);
let cursor=0;const results=existsSync('data/filters.json')?JSON.parse(await readFile('data/filters.json','utf8')):{};
const report=process.argv[2]?JSON.parse(await readFile('reference/filter-report.json','utf8')).filter(job=>job.value!==process.argv[2]):[];
await Promise.all(Array.from({length:3},async()=>{while(cursor<jobs.length){const {type,value}=jobs[cursor++],key=`filter.p.m.filters.${type}`,ids=new Set(),pages=[];let complete=false;
 for(let page=1;page<=60;page++){
  const url=`${origin}/collections/buy-vinyl-stickers-online-india?${key}=${encodeURIComponent(value)}&page=${page}`;
  const file=`reference/filters/${type}-${encodeURIComponent(value)}-${page}.html`;
  try{await run('curl.exe',['--noproxy','*','-L','--fail','--silent','--show-error','--max-time','60','--retry','2',url,'-o',file],{maxBuffer:1048576});
   const $=load(await readFile(file,'utf8'));const current=new Set();
   const cards=$('#product-grid .card-wrapper');
   cards.each((i,e)=>{const href=$(e).find('a[href*="/products/"]').first().attr('href');const handle=href?.split('/products/').pop().split('?')[0];const id=handles.get(handle);if(id)current.add(id);});
   pages.push(current.size);const added=[...current].filter(id=>!ids.has(id));added.forEach(id=>ids.add(id));
   if(cards.length<80){complete=true;break;}if(!added.length)throw new Error('Pagination repeated a full page');
  }catch(error){report.push({type,value,error:error.message.slice(0,180)});break;}
 }
 results[`${type}:${value}`]=[...ids];report.push({type,value,count:ids.size,pages,complete});console.log(type,value,ids.size,complete);
 await writeFile('data/filters.json',JSON.stringify(results));await writeFile('reference/filter-report.json',JSON.stringify(report,null,2));
}}));
