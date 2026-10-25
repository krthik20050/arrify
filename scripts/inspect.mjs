import {load} from 'cheerio';
import {readFileSync} from 'node:fs';
const $=load(readFileSync('homepage.html','utf8'));
console.log(JSON.stringify({body:$('body').attr(),header:$('header').attr(),main:$('main').attr(),children:$('body').children().map((i,e)=>[e.tagName,$(e).attr('class'),$(e).attr('id')].join('|')).get(),products:$('a[href*="/products/"]').slice(0,3).map((i,e)=>$(e).attr('href')).get()},null,2));
