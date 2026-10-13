async (page) => {
  const log=[];
  const rcXY = async (x,y) => { await page.mouse.move(x,y); await page.waitForTimeout(200); await page.mouse.down(); await page.waitForTimeout(130); await page.mouse.up(); };
  const find = (re) => page.evaluate(src=>{const re=new RegExp(src); const e=[...document.querySelectorAll('[role=button],button,[role=tab],[aria-label]')].find(x=>re.test((x.innerText||'').trim()) || re.test(x.getAttribute('aria-label')||'')); if(!e) return null; const r=e.getBoundingClientRect(); return r.width>0?{x:Math.round(r.x+r.width/2), y:Math.round(r.y+r.height/2)}:null;}, re.source);
  const send = await find(/^Send$/); log.push('send='+JSON.stringify(send));
  if (send) { await rcXY(send.x, send.y); await page.waitForTimeout(2500); }
  const lnk = await find(/^Link$/); log.push('linktab='+JSON.stringify(lnk));
  if (lnk) { await rcXY(lnk.x, lnk.y); await page.waitForTimeout(1500); }
  const url = await page.evaluate(()=>[...document.querySelectorAll('input')].map(i=>i.value).find(v=>/docs\.google\.com\/forms\/d\/e\//.test(v))||'');
  log.push('url='+url);
  await page.evaluate(t=>document.title=t.slice(0,600), JSON.stringify(log));
}
