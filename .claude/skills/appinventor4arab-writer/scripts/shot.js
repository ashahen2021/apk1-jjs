const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1200,height:800}});
await p.goto('file://'+process.argv[2],{waitUntil:'networkidle'});await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(500);
console.log(await p.evaluate(()=>document.fonts.check('900 40px Cairo')));
await p.screenshot({path:process.argv[3]});await b.close();})();
