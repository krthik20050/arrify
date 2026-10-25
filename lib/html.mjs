import {load} from 'cheerio';
import {readFileSync,existsSync} from 'node:fs';
export const escape = value => String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const money = value => `Rs. ${Number(value).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})}`;
export function safeHtml(raw) {
 const $=load(raw||'',null,false);
 $('script,iframe,object,embed,base,meta,link').remove();
 $('*').each((i,e)=>Object.keys(e.attribs||{}).forEach(a=>{if(/^on/i.test(a)||/^(?:javascript|data:text\/html):/i.test(e.attribs[a])) $(e).removeAttr(a);}));
 return $.html();
}
export function cleanDocument(raw) {
 const $=load(raw);
 $('script,iframe,object,embed,base,noscript,link[rel="preconnect"],link[rel="dns-prefetch"],link[rel="canonical"],meta[http-equiv]').remove();
 $('#siuPopupOverlay,#shopify-section-email-signup-popup,#shopify-section-cookies-banner,#shopify-section-cart-drawer,toast-message-manager,back-button-menu,input[type="hidden"]').remove();
 $('[id^="shopify-block-"]').remove();
 $('*').each((i,e)=>Object.keys(e.attribs||{}).forEach(a=>{if(/^on/i.test(a)) $(e).removeAttr(a);}));
 $('link[as="style"]').attr('rel','stylesheet').removeAttr('as').removeAttr('media');
 $('link[rel="stylesheet"]').removeAttr('media');
 const mapFile=new URL('../reference/assets.json',import.meta.url);
 const rawMap=existsSync(mapFile)?JSON.parse(readFileSync(mapFile)):{};
 const map=rawMap.assets||rawMap;
 const asset=url=>{
   if(!url)return url;
   const absolute=url.startsWith('//')?'https:'+url:url.startsWith('/cdn/')?'https://www.stickitup.xyz'+url:url;
   const mapped=map[absolute];
   return typeof mapped==='string'?mapped:mapped?.local||mapped?.path||absolute;
 };
 $('[src],[href],[srcset],[poster]').each((i,e)=>{
   const el=$(e);
   for(const name of ['src','poster']) if(el.attr(name)) el.attr(name,asset(el.attr(name)));
   if(el.attr('srcset')) el.attr('srcset',el.attr('srcset').replace(/(^|,\s*)(\/\/[^\s,]+)/g,'$1https:$2'));
   const href=el.attr('href');
   if(href) {
     if(e.tagName==='link') el.attr('href',asset(href));
     else if(/^https?:\/\/(www\.)?stickitup\.xyz\//.test(href)) el.attr('href',new URL(href).pathname+new URL(href).search+new URL(href).hash);
     else if(href.includes('track.stickitup'))el.attr('href','/pages/track-your-order');
     else if(href.startsWith('tel:')&&href.includes('@'))el.attr('href','mailto:'+href.slice(4));
   }
 });
 $('a[href*="/customer_authentication"],a[href^="/account"]').attr('href','/account/login');
 $('form').each((i,e)=>{const f=$(e);if(f.attr('action')?.includes('/search'))f.attr('action','/search').attr('method','get');else f.attr('data-local-form','true').removeAttr('action');});
 $('style').each((i,e)=>$(e).html(($(e).html()||'').replace(/url\((['"]?)(\/\/[^)'" ]+)/g,'url($1https:$2')));
 $('html').removeClass('no-js').addClass('js');
 $('head').append('<meta name="robots" content="noindex,nofollow"><link rel="stylesheet" href="/app.css">');
 $('body').prepend('<div class="local-offer"><strong>STICKERS AT ₹10 ENDS IN:</strong><span class="offer-clock"><span data-clock>00 : 05 : 59 : 59</span><small>Days &nbsp;&nbsp;&nbsp; Hours &nbsp;&nbsp;&nbsp; Mins &nbsp;&nbsp;&nbsp; Secs</small></span></div>');
 $('body').append('<dialog id="local-dialog" aria-label="Shopping dialog"></dialog><div id="local-toast" role="status" aria-live="polite"></div><script type="module" src="/app.js"></script>');
 $('footer').append('<p class="local-disclosure">Independent local recreation for review. Demo checkout — no payment or order is sent to STICK IT UP.</p>');
 return $;
}
