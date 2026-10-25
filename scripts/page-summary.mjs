import {readFileSync} from 'node:fs'; import {load} from 'cheerio';
for(const name of process.argv.slice(2)) {
 const $=load(readFileSync(`reference/pages/${encodeURIComponent(name)}.html`,'utf8'));
 const main=$('main');
 console.log(name,main.text().replace(/\s+/g,' ').slice(0,3000));
 console.log('controls',main.find('button,[onclick],form').map((i,e)=>({tag:e.tagName,id:$(e).attr('id'),text:$(e).text().trim().slice(0,90),onclick:$(e).attr('onclick')})).get());
 console.log('scripts',main.find('script').map((i,e)=>$(e).text().slice(0,800)).get());
}
