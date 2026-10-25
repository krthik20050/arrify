import {load} from 'cheerio'; import {readFileSync} from 'node:fs';
const $=load(readFileSync('homepage.html','utf8'));
for(const selector of ['header','main > *:first-child','.card-wrapper','.siu-vibe-grid']) console.log(selector, $(selector).first().html()?.slice(0,9000));
console.log('IMAGES',$('main img').slice(0,8).map((i,e)=>$(e).attr()).get());
