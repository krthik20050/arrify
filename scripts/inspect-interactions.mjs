import {readFileSync}from'node:fs';import{load}from'cheerio';const $=load(readFileSync('homepage.html','utf8'));
console.log('VIBE',$('#siuVibeGrid').parent().html()?.slice(-12500));
console.log('FAQ',$('main [onclick]').map((i,x)=>[x.tagName,$(x).attr('class'),$(x).attr('onclick')]).get());
console.log('TABS',$('input[type="radio"]').slice(0,3).map((i,x)=>$(x).attr()).get());
console.log('CART',$('#cart-icon-bubble').html()?.slice(-2500));
console.log('FORMS',$('.card-wrapper').first().find('form').html()?.slice(0,2000));
