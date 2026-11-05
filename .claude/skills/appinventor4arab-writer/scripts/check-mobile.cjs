const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();
for(const f of process.argv.slice(2)){const p=await b.newPage({viewport:{width:390,height:844}});
const body=fs.readFileSync(f,'utf8');
await p.setContent('<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="max-width:700px;margin:auto;padding:16px;font-family:sans-serif">'+body+'</body></html>',{waitUntil:'load'});
for(let y=0;y<30000;y+=700){await p.evaluate(y=>window.scrollTo(0,y),y);await p.waitForTimeout(120);}
await p.waitForTimeout(1500);
const r=await p.evaluate(()=>({imgs:[...document.images].map(i=>i.naturalWidth).filter(w=>w===0).length+' broken of '+document.images.length,iframes:[...document.querySelectorAll('iframe')].map(i=>Math.round(i.getBoundingClientRect().width)+'x'+Math.round(i.getBoundingClientRect().height)),wide:[...document.querySelectorAll('body *')].filter(e=>e.getBoundingClientRect().right>document.documentElement.clientWidth+1&&!e.closest('[style*="overflow-x"]')).length}));
console.log(f.split('/').pop(),JSON.stringify(r));await p.close();}
await b.close();})();
