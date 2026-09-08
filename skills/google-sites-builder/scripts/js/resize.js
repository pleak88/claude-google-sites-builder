async (page) => {
  const log=[];
  await page.setViewportSize({width:1440,height:1400});
  await page.waitForTimeout(1500);
  const sel = async () => {
    const p = await page.evaluate(()=>{ const s=[...document.querySelectorAll('section')];
      const f=s.find(x=>x.querySelector('iframe')); if(!f) return null;
      const r=f.querySelector('iframe').getBoundingClientRect();
      return {x:Math.round(r.x+r.width/2), y:Math.round(r.y+r.height/2), w:Math.round(r.width), h:Math.round(r.height), top:Math.round(r.y), left:Math.round(r.x)}; });
    return p;
  };
  // прокрутить embed в центр
  for (let i=0;i<25;i++){
    const p = await sel(); if(!p) break;
    if (p.top>60 && p.top<300) break;
    await page.mouse.move(600,600);
    await page.mouse.wheel(0, p.top>300 ? 300 : -300); await page.waitForTimeout(350);
  }
  let p = await sel();
  if (!p) { log.push('no iframe'); await page.evaluate(t=>document.title=t, JSON.stringify(log)); return; }
  log.push('before '+p.w+'x'+p.h+' top='+p.top);
  // выделить
  for (let k=0;k<4;k++){
    await page.mouse.move(p.x,p.y); await page.waitForTimeout(200);
    await page.mouse.down(); await page.waitForTimeout(130); await page.mouse.up();
    await page.waitForTimeout(900);
    const has = await page.evaluate(()=>!!document.querySelector('[aria-label*="resize"], [class*="resize"]'));
    if (has) break;
  }
  // ── ширина: правая-средняя ручка
  p = await sel();
  let hx = p.left + p.w, hy = p.top + Math.round(p.h/2);
  await page.mouse.move(hx, hy); await page.waitForTimeout(400);
  const cur1 = await page.evaluate(([x,y])=>{const e=document.elementFromPoint(x,y); return e?getComputedStyle(e).cursor:'none'}, [hx,hy]);
  log.push('cursorW='+cur1);
  if (/ew-resize/.test(cur1)) {
    await page.mouse.down();
    const target = p.left + 760;
    let cx = hx;
    while (Math.abs(cx-target) > 12) { cx += (target>cx?30:-30); await page.mouse.move(cx, hy); await page.waitForTimeout(60); }
    await page.mouse.move(target, hy); await page.waitForTimeout(200);
    await page.mouse.up(); await page.waitForTimeout(1500);
  }
  // ── высота: нижняя-средняя ручка
  p = await sel();
  let vx = p.left + Math.round(p.w/2), vy = p.top + p.h;
  await page.mouse.move(vx, vy); await page.waitForTimeout(400);
  const cur2 = await page.evaluate(([x,y])=>{const e=document.elementFromPoint(x,y); return e?getComputedStyle(e).cursor:'none'}, [vx,vy]);
  log.push('cursorH='+cur2);
  if (/ns-resize/.test(cur2)) {
    await page.mouse.down();
    const target = p.top + 968;
    let cy = vy;
    while (Math.abs(cy-target) > 12) { cy += (target>cy?30:-30); await page.mouse.move(vx, cy); await page.waitForTimeout(60); }
    await page.mouse.move(vx, target); await page.waitForTimeout(200);
    await page.mouse.up(); await page.waitForTimeout(1500);
  }
  p = await sel();
  log.push('after '+p.w+'x'+p.h);
  await page.evaluate(t=>document.title=t.slice(0,400), JSON.stringify(log));
}
