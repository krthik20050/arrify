import {readFile,writeFile}from'node:fs/promises';import{load}from'cheerio';import{execFile}from'node:child_process';import{promisify}from'node:util';
const run=promisify(execFile),$=load(await readFile('reference/instagram-rendered.html','utf8'));
const images=[...new Map($('img[src]').map((i,x)=>({src:$(x).attr('src'),alt:$(x).attr('alt')})).get().map(im=>[im.src,im])).values()];
let next=0;const results=[];
await Promise.all(Array.from({length:3},async()=>{while(next<images.length){const index=next++,image=images[index],filename=`social-${index+1}.jpg`;try{await run('curl.exe',['--noproxy','*','--fail','--silent','--show-error','--max-time','45','--retry','1',image.src,'-o',`public/assets/${filename}`]);results[index]={...image,local:`/assets/${filename}`};}catch(error){results[index]={...image,local:image.src};}}}));
await writeFile('data/social.json',JSON.stringify(results,null,2));console.log('Social images captured:',results.filter(x=>x.local.startsWith('/')).length,'of',results.length);
