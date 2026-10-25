// Prepared catalog assets are supplied by the server. No model generation runs on a cube tap.
const appleMobile=/iPhone|iPad|iPod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const appleAR=appleMobile&&(()=>{try{return document.createElement('a').relList.supports('ar');}catch{return false;}})();
const android=/Android/i.test(navigator.userAgent);
function nativeLinks(){
 for(const link of document.querySelectorAll('a[data-native-ar]:not([data-ar-linked])')){
  link.dataset.arLinked='true';const fallback=new URL(link.href,location.href).href;
  if(appleAR){const usdz=new URL(link.dataset.arUsdz,location.href),options=new URLSearchParams(usdz.hash.slice(1));options.set('allowsContentScaling','0');usdz.hash=options.toString();link.href=usdz.href;link.setAttribute('rel','ar');}
  else if(android){const params=new URLSearchParams({file:new URL(link.dataset.arGlb,location.href).href,mode:'ar_preferred',resizable:'false',enable_vertical_placement:'true',title:link.getAttribute('aria-label')||'Sticker preview'});link.href=`intent://arvr.google.com/scene-viewer/1.0?${params}#Intent;scheme=https;package=com.google.android.googlequicksearchbox;action=android.intent.action.VIEW;S.browser_fallback_url=${encodeURIComponent(fallback)};end;`;}
 }
}
nativeLinks();new MutationObserver(nativeLinks).observe(document.body,{childList:true,subtree:true});
