async (page) => {
  // Ресайз embed-плитки до 760×968 СИММЕТРИЧНО относительно центра секции + обязательная проверка центра.
  // Урок latloto-info (11.09.2026): растягивать только правой ручкой = левый край стоит, центр уезжает
  // вправо на половину прироста (80px в редакторе ≈ 100px на живом). Клиент правил руками.
  const log=[];
  const W=760, H=968;
  await page.setViewportSize({width:1440,height:1400});
  await page.waitForTimeout(1500);
  const sel = () => page.evaluate(()=>{ const s=[...document.querySelectorAll('section')];
    const f=s.find(x=>x.querySelector('iframe')); if(!f) return null;
    const r=f.querySelector('iframe').getBoundingClientRect(); const sr=f.getBoundingClientRect();
    return {x:Math.round(r.x+r.width/2), y:Math.round(r.y+r.height/2), w:Math.round(r.width), h:Math.round(r.height),
            top:Math.round(r.y), left:Math.round(r.x), secCx:Math.round(sr.x+sr.width/2), secLeft:Math.round(sr.x), secW:Math.round(sr.width)}; });
  for (let i=0;i<25;i++){
    const p = await sel(); if(!p) break;
    if (p.top>60 && p.top<300) break;
    await page.mouse.move(600,600);
    await page.mouse.wheel(0, p.top>300 ? 300 : -300); await page.waitForTimeout(350);
  }
  let p = await sel();
  if (!p) { log.push('no iframe'); await page.evaluate(t=>document.title=t, JSON.stringify(log)); return; }
  log.push('before '+p.w+'x'+p.h+' left='+p.left+' dx='+(p.x-p.secCx));
  const select = async () => { const q=await sel(); for (let k=0;k<4;k++){
    await page.mouse.move(q.x,q.y); await page.waitForTimeout(200);
    await page.mouse.down(); await page.waitForTimeout(130); await page.mouse.up(); await page.waitForTimeout(900);
    if (await page.evaluate(()=>!!document.querySelector('[aria-label*="resize"], [class*="resize"]'))) break; } };
  const cursorAt = (x,y) => page.evaluate(([x,y])=>{const e=document.elementFromPoint(x,y); return e?getComputedStyle(e).cursor:'none'}, [x,y]);
  const drag = async (fx,fy,tx,ty) => { await page.mouse.move(fx,fy); await page.waitForTimeout(400);
    const c = await cursorAt(fx,fy); if (!/resize/.test(c)) return 'cursor='+c;
    await page.mouse.down(); let cx=fx, cy=fy;
    while (Math.abs(cx-tx)>12 || Math.abs(cy-ty)>12) { cx += Math.sign(tx-cx)*Math.min(30,Math.abs(tx-cx)); cy += Math.sign(ty-cy)*Math.min(30,Math.abs(ty-cy)); await page.mouse.move(cx,cy); await page.waitForTimeout(60); }
    await page.mouse.move(tx,ty); await page.waitForTimeout(200); await page.mouse.up(); await page.waitForTimeout(1500); return 'ok'; };
  await select();
  // ── ширина: целевые края симметрично вокруг центра секции; сначала та ручка, которая расширяет
  p = await sel();
  const tl = p.secCx - W/2, tr = p.secCx + W/2, hy = p.top + Math.round(p.h/2);
  log.push('right: '+await drag(p.left+p.w, hy, tr, hy));
  p = await sel(); await select(); p = await sel();
  log.push('left: '+await drag(p.left, p.top+Math.round(p.h/2), tl, p.top+Math.round(p.h/2)));
  // ── высота: нижняя-средняя ручка
  p = await sel(); await select(); p = await sel();
  log.push('bottom: '+await drag(p.left+Math.round(p.w/2), p.top+p.h, p.left+Math.round(p.w/2), p.top+H));
  p = await sel();
  const dx = p.x - p.secCx;
  log.push('after '+p.w+'x'+p.h+' dx='+dx+(Math.abs(dx)>8 ? ' ⚠️ OFF-CENTER — не публиковать, поправить' : ' centered'));
  await page.evaluate(t=>document.title=t.slice(0,600), JSON.stringify(log));
}
