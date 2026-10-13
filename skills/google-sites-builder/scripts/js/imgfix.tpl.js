// imgfix.tpl.js — растянуть последнюю картинку секции __SEC__ на ширину колонки (двухфазный ресайз, 3:2).
// render: python render.py js/imgfix.tpl.js _imgfix.js SEC=2
async (page) => {
__COMMON__
  // растянуть последнюю картинку секции SEC на ширину колонки (двухфазный ресайз), пропорция 3:2
  const SEC = __SEC__; const ASPECT = 800/1200; const log=[];
  await page.setViewportSize({width:1440,height:1400}); await page.waitForTimeout(400);
  await page.keyboard.press('Escape');
  const geo = () => page.evaluate(k=>{const s=document.querySelectorAll('section')[k]; const sr=s.getBoundingClientRect();
    const tiles=[...s.querySelectorAll('tile')].filter(t=>t.querySelector('img')); const t=tiles[tiles.length-1]; if(!t) return null;
    const z=t.querySelector('.ZqMSce'); let r=null; if (z && z.getBoundingClientRect().width>150) r=z.getBoundingClientRect();
    if (!r) { const all=[...t.querySelectorAll('div')].map(e=>e.getBoundingClientRect()).filter(b=>b.width>150 && b.height>100); all.sort((a,b)=>a.width-b.width); r=all[0]||t.getBoundingClientRect(); }
    return {x:r.x,y:r.y,w:r.width,h:r.height,secX:sr.x,secW:sr.width};}, SEC);
  if (!(await geo())) { log.push('NO image in section '+SEC); await report(log); return; }
  for (let i=0;i<40;i++){ const g=await geo(); if (g.y>120 && g.y<500) break; await page.mouse.move(600,600); await page.mouse.wheel(0, g.y>500 ? 300 : -300); await page.waitForTimeout(150); }
  let g = await geo(); log.push('img0 '+Math.round(g.w)+'x'+Math.round(g.h)+' @'+Math.round(g.x)+','+Math.round(g.y));
  const cursorAt = (x,y) => page.evaluate(([x,y])=>{const e=document.elementFromPoint(x,y); return e?getComputedStyle(e).cursor:'none'}, [x,y]);
  const select = async () => { for (let k=0;k<4;k++){ const q=await geo(); await rcXY(q.x+q.w/2, q.y+q.h/2); await page.waitForTimeout(500);
      const c1 = await cursorAt(q.x+q.w, q.y+q.h/2); if (/resize/.test(c1)) return true; } return false; };
  const drag = async (fx,fy,tx,ty) => { await page.mouse.move(fx,fy); await page.waitForTimeout(250);
    const c = await cursorAt(fx,fy); if (!/resize/.test(c)) return 'cursor='+c;
    await page.mouse.down(); let cx=fx, cy=fy;
    while (Math.abs(cx-tx)>10 || Math.abs(cy-ty)>10) { cx += Math.sign(tx-cx)*Math.min(30,Math.abs(tx-cx)); cy += Math.sign(ty-cy)*Math.min(30,Math.abs(ty-cy)); await page.mouse.move(cx,cy); await page.waitForTimeout(50); }
    await page.mouse.move(tx,ty); await page.waitForTimeout(150); await page.mouse.up(); await page.waitForTimeout(700); return 'ok'; };
  log.push('select='+await select());
  g = await geo();
  const rightEdge = g.secX + g.secW - 60;
  log.push('right: '+await drag(g.x+g.w, g.y+g.h/2, rightEdge, g.y+g.h/2));
  g = await geo(); log.push('img1 '+Math.round(g.w)+'x'+Math.round(g.h));
  await select(); g = await geo();
  const targetH = Math.round(g.w*ASPECT);
  let by=g.y+g.h; for (const dy of [0,1,2,-1,3]) { if (/ns-resize/.test(await cursorAt(g.x+g.w/2, g.y+g.h+dy))) { by=g.y+g.h+dy; break; } }
  log.push('bottom: '+await drag(g.x+g.w/2, by, g.x+g.w/2, g.y+targetH));
  g = await geo(); log.push('img2 '+Math.round(g.w)+'x'+Math.round(g.h)+' target '+targetH);
  await page.mouse.move(600,300); await page.keyboard.press('Escape'); await page.waitForTimeout(200);
  await page.setViewportSize({width:1440,height:900}); await page.waitForTimeout(200);
  await report(log);
}
