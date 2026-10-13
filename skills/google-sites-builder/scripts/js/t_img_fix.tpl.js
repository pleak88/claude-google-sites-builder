async (page) => {
  const SEC = __SEC__, log=[];
  await page.setViewportSize({width:1440,height:1400}); await page.waitForTimeout(800);
  const geo = () => page.evaluate(k=>{const s=document.querySelectorAll('section')[k]; const t=s.querySelector('tile'); if(!t) return null; const r=t.getBoundingClientRect(); const sr=s.getBoundingClientRect(); return {x:r.x,y:r.y,w:r.width,h:r.height,secX:sr.x,secW:sr.width}}, SEC);
  for (let i=0;i<30;i++){ const g=await geo(); if (!g) break; if (g.y>120 && g.y<400) break; await page.mouse.move(600,600); await page.mouse.wheel(0, g.y>400?300:-300); await page.waitForTimeout(300); }
  let g=await geo(); if(!g){ await page.evaluate(()=>document.title='NO TILE'); return; }
  log.push('tile0 '+Math.round(g.w)+'x'+Math.round(g.h)+' @'+Math.round(g.x)+','+Math.round(g.y));
  const cur = (x,y)=>page.evaluate(([x,y])=>{const e=document.elementFromPoint(x,y); return e?getComputedStyle(e).cursor:'none'},[x,y]);
  const rcXY = async (x,y) => { await page.mouse.move(x,y); await page.waitForTimeout(200); await page.mouse.down(); await page.waitForTimeout(130); await page.mouse.up(); };
  const findHandle = async (x0,y0,horiz,re) => { for (let d=0; d<=40; d+=2) for (const sgn of [-1,1]) { const x=horiz?x0+sgn*d:x0, y=horiz?y0:y0+sgn*d; await page.mouse.move(x,y); await page.waitForTimeout(50); if (re.test(await cur(x,y))) return {x,y}; } return null; };
  const dragTo = async (h,tx,ty) => { await page.mouse.move(h.x,h.y); await page.waitForTimeout(300); await page.mouse.down(); await page.waitForTimeout(200); let x=h.x,y=h.y; while (Math.abs(x-tx)>5||Math.abs(y-ty)>5){ x+=Math.sign(tx-x)*Math.min(25,Math.abs(tx-x)); y+=Math.sign(ty-y)*Math.min(25,Math.abs(ty-y)); await page.mouse.move(x,y); await page.waitForTimeout(40);} await page.mouse.move(tx,ty); await page.waitForTimeout(250); await page.mouse.up(); await page.waitForTimeout(1500); };
  // фаза 1: ширина
  if (g.w < 900) {
    await rcXY(g.x+g.w/2, g.y+g.h/2); await page.waitForTimeout(1200);
    const h = await findHandle(Math.round(g.x+g.w), Math.round(g.y+g.h/2), true, /ew-resize/);
    log.push('rightHandle='+JSON.stringify(h));
    if (h) await dragTo(h, g.secX+g.secW-60, h.y);
    g=await geo(); log.push('tile1 '+Math.round(g.w)+'x'+Math.round(g.h));
  }
  // фаза 2: высота 3:2
  const target = Math.round(g.y + g.w*800/1200);
  if (g.h < g.w*800/1200 - 10) {
    await rcXY(g.x+g.w/2, g.y+g.h/2); await page.waitForTimeout(1200);
    const h = await findHandle(Math.round(g.x+g.w/2), Math.round(g.y+g.h), false, /ns-resize/);
    log.push('bottomHandle='+JSON.stringify(h));
    if (h) await dragTo(h, h.x, target);
    g=await geo(); log.push('tile2 '+Math.round(g.w)+'x'+Math.round(g.h)+' target '+Math.round(g.w*800/1200));
  }
  await page.mouse.move(700,1300); await page.keyboard.press('Escape'); await page.waitForTimeout(500);
  await page.screenshot({path:'_fixtile.png', clip:{x:0,y:0,width:1440,height:1100}});
  await page.setViewportSize({width:1440,height:900});
  await page.evaluate(t=>document.title=t.slice(0,600), JSON.stringify(log));
}
