import {readFile,writeFile} from 'node:fs/promises'; import{execFile}from'node:child_process';import{promisify}from'node:util';import{load}from'cheerio';
const run=promisify(execFile),origin='https://www.stickitup.xyz';
const routes=JSON.parse(await readFile('reference/routes.json','utf8'));
const seen=new Set(Object.keys(routes));let cursor=0,queue=Object.keys(routes);let captured=0;
while(cursor<queue.length&&seen.size<100){
 const current=queue[cursor++],$=load(await readFile(routes[current],'utf8'));
 const links=[...new Set($('main a[href]').map((i,e)=>$(e).attr('href')).get().map(href=>{try{return new URL(href,origin);}catch{return null;}}).filter(u=>u?.origin===origin&&/^\/(pages|policies|blogs)\//.test(u.pathname)&&!seen.has(u.pathname)).map(u=>u.pathname))];
 for(const route of links){seen.add(route);try{const file=`reference/pages/${encodeURIComponent(route)}.html`;await run('curl.exe',['--noproxy','*','-L','--fail','--silent','--show-error','--max-time','45','--retry','1',origin+route,'-o',file]);routes[route]=file;queue.push(route);captured++;console.log(route);await writeFile('reference/routes.json',JSON.stringify(routes,null,2));}catch(error){console.warn('Unavailable content:',route);}}
}
console.log('Additional content pages:',captured);
