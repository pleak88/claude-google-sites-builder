async (page) => {
  const log=[]; const H=__H__;
  await page.setViewportSize({width:1440,height:1400}); await page.waitForTimeout(1200);
  await page.keyboard.press('Escape'); await page.mouse.move(600,400); for (let i=0;i<8;i++){ await page.mouse.wheel(0,-900); await page.waitForTimeout(80); }
  const sel = () => page.evaluate(()=>{ const f=[...document.querySelectorAll('section')].find(x=>x.querySelector('iframe')); const r=f.querySelector('iframe').getBoundingClientRect(); const sr=f.getBoundingClientRect(); return {x:Math.round(r.x+r.width/2), y:Math.round(r.y+r.height/2), w:Math.round(r.width), h:Math.round(r.height), top:Math.round(r.y), secCx:Math.round(sr.x+sr.width/2)}; });
  const cursorAt = (x,y) => page.evaluate(([x,y])=>{const e=document.elementFromPoint(x,y); return e?getComputedStyle(e).cursor:'none'}, [x,y]);
  const click = async (x,y) => { await page.mouse.move(x,y); await page.waitForTimeout(200); await page.mouse.down(); await page.waitForTimeout(130); await page.mouse.up(); await page.waitForTimeout(900); };
  let p = await sel(); log.push('before '+p.w+'x'+p.h+' top='+p.top);
  for (let it=0; it<6 && p.h < H-6; it++) {
    // низ плитки должен быть в вьюпорте с запасом
    for (let i=0;i<20;i++){ p=await sel(); const b=p.top+p.h; if (b>200 && b<900) break; await page.mouse.move(600,600); await page.mouse.wheel(0, b>900? 400 : -400); await page.waitForTimeout(300); }
    await click(p.x,p.y); p = await sel();
    let by=null; for (const d of [0,-4,4,-8,8]) { if (/ns-resize/.test(await cursorAt(p.x, p.top+p.h+d))) { by=p.top+p.h+d; break; } }
    if (by===null) { log.push('no bottom handle it'+it); break; }
    const target = Math.min(1380, by + (H - p.h));
    await page.mouse.move(p.x,by); await page.waitForTimeout(300); await page.mouse.down(); let cy=by; while (cy<target) { cy=Math.min(target, cy+30); await page.mouse.move(p.x,cy); await page.waitForTimeout(50); } await page.waitForTimeout(250); await page.mouse.up(); await page.waitForTimeout(1500);
    p = await sel(); log.push('it'+it+' '+p.w+'x'+p.h+' top='+p.top);
  }
  log.push('after '+p.w+'x'+p.h+' dx='+(p.x-p.secCx)+' hdr='+await page.evaluate(()=>Math.round(document.querySelector('section').getBoundingClientRect().height)));
  await page.evaluate(t=>document.title=t.slice(0,600), JSON.stringify(log));
}
