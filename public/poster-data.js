export const catalogPromise=fetch('/api/posters/catalog',{signal:AbortSignal.timeout(30000)}).then(async response=>{const data=await response.json();if(!response.ok)throw new Error(data.error||'Could not load posters.');return data;});
export const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const posterPrice=product=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(Math.min(...product.variants.map(v=>v.price)));
