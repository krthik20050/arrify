import{load}from'cheerio';import{readFileSync}from'node:fs';
const $=load(readFileSync('reference/pages/%2Fproducts%2Fwasted-sticker.html','utf8'));
console.log('main children',$('main').children().map((i,e)=>[e.tagName,$(e).attr('id'),$(e).attr('class')]).get());
console.log('product',$('.product').first().children().map((i,e)=>[e.tagName,$(e).attr('id'),$(e).attr('class')]).get());
console.log('info',$('product-info').first().children().map((i,e)=>[e.tagName,$(e).attr('id'),$(e).attr('class')]).get());
console.log('heading',$('h1').map((i,e)=>$(e).parent().attr()).get());
console.log('media',$('media-gallery').first().html()?.slice(0,1200));
console.log('forms',$('main form').map((i,e)=>$(e).attr()).get());
console.log('main size',$('main').html()?.length);
