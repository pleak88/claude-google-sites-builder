async (page) => {
__COMMON__
  // Паттерн «фото сверху»: шаг B — растянуть фото на колонку (двухфазный ресайз), Style, затем Text box с H2+абзацами
  const H2 = __H2__;
  const PS = __PS__;
  const ST = __STYLE__;
  const ASPECT = 800/1200;           // кадр 3:2
  const log = [];
  await page.setViewportSize({width:1440,height:1400}); await page.waitForTimeout(1200);
  const secInfo = () => page.evaluate(()=>{
    const s=[...document.querySelectorAll('section')].map((e,i)=>({i,len:(e.innerText||'').length}));
    return s;
  });
  log.push('secs='+JSON.stringify(await secInfo()).slice(0,300));
  // секция с картинкой = последняя контентная (или та, где .WB0DVd)
  const imgSec = await lastContentIdx();   // картинка только что вставлена своей секцией в конец
  const geo = () => page.evaluate(k=>{const s=document.querySelectorAll('section')[k]; const sr=s.getBoundingClientRect();
    const z=s.querySelector('.ZqMSce'); if (z){const r=z.getBoundingClientRect(); if (r.width>150) return {x:r.x,y:r.y,w:r.width,h:r.height,secX:sr.x,secW:sr.width};}   // 14.09 veikkaus: после растяжения ширины эвристика ловила чужой div 944x629 → фаза 2 не запускалась
    const all=[...s.querySelectorAll('div')].map(e=>{const r=e.getBoundingClientRect(); return {w:r.width,h:r.height,x:r.x,y:r.y}});
    let cand=all.filter(o=>o.w>150 && o.w<1000 && o.h>100 && o.h<800 && Math.abs(o.w/o.h-1.5)<0.4).sort((a,b)=>a.w-b.w);
    if (!cand.length) cand=all.filter(o=>o.w>900 && o.w<1000 && o.h>100 && o.h<900).sort((a,b)=>a.h-b.h);   // после растяжения по ширине
    const c=cand[0]||null; return c?{x:c.x,y:c.y,w:c.w,h:c.h,secX:sr.x,secW:sr.width}:null;}, imgSec);
  if (!(await geo())) { log.push('NO image geometry'); await report(log); return; }
  // прокрутить так, чтобы картинка была в верхней части вьюпорта
  for (let i=0;i<30;i++){ const g=await geo(); if (g.y>120 && g.y<400) break; await page.mouse.move(600,600); await page.mouse.wheel(0, g.y>400 ? 300 : -300); await page.waitForTimeout(300); }
  let g = await geo(); log.push('img0 '+Math.round(g.w)+'x'+Math.round(g.h)+' @'+Math.round(g.x)+','+Math.round(g.y));
  const cursorAt = (x,y) => page.evaluate(([x,y])=>{const e=document.elementFromPoint(x,y); return e?getComputedStyle(e).cursor:'none'}, [x,y]);
  const select = async () => { for (let k=0;k<4;k++){ const q=await geo(); await rcXY(q.x+q.w/2, q.y+q.h/2); await page.waitForTimeout(900);
      const c1 = await cursorAt(q.x+q.w, q.y+q.h/2); if (/resize/.test(c1)) return true; } return false; };
  const drag = async (fx,fy,tx,ty) => { await page.mouse.move(fx,fy); await page.waitForTimeout(400);
    const c = await cursorAt(fx,fy); if (!/resize/.test(c)) return 'cursor='+c;
    await page.mouse.down(); let cx=fx, cy=fy;
    while (Math.abs(cx-tx)>10 || Math.abs(cy-ty)>10) { cx += Math.sign(tx-cx)*Math.min(30,Math.abs(tx-cx)); cy += Math.sign(ty-cy)*Math.min(30,Math.abs(ty-cy)); await page.mouse.move(cx,cy); await page.waitForTimeout(50); }
    await page.mouse.move(tx,ty); await page.waitForTimeout(200); await page.mouse.up(); await page.waitForTimeout(1500); return 'ok'; };
  // фаза 1: ширина до правого края колонки
  log.push('select='+await select());
  g = await geo();
  const rightEdge = g.secX + g.secW - 60;            // правый край контентной колонки (padding 60)
  log.push('right: '+await drag(g.x+g.w, g.y+g.h/2, rightEdge, g.y+g.h/2));
  g = await geo(); log.push('img1 '+Math.round(g.w)+'x'+Math.round(g.h));
  // фаза 2: высота по пропорции кадра
  await select(); g = await geo();
  const targetH = Math.round(g.w*ASPECT);
  let by=g.y+g.h; for (const dy of [0,1,2,-1,3]) { if (/ns-resize/.test(await cursorAt(g.x+g.w/2, g.y+g.h+dy))) { by=g.y+g.h+dy; break; } }
  log.push('bottom: '+await drag(g.x+g.w/2, by, g.x+g.w/2, g.y+targetH));
  g = await geo(); log.push('img2 '+Math.round(g.w)+'x'+Math.round(g.h)+' target '+targetH);
  await page.mouse.move(600,300); await page.keyboard.press('Escape'); await page.waitForTimeout(500);
  // стиль секции с картинкой
  log.push('imgstyle:'+await setStyleLast(ST));
  // текстовый блок после картинки
  await page.setViewportSize({width:1440,height:900}); await page.waitForTimeout(800);
  await toBottom();
  const before = await page.evaluate(()=>document.querySelectorAll('section').length);
  if (!(await insertByLabel('Text box'))) log.push('no Text box control');
  const after = await page.evaluate(()=>document.querySelectorAll('section').length);
  log.push('secs '+before+'→'+after);
  const tiles = page.locator('[aria-label="Text"][contenteditable="true"]');
  const n = await tiles.count();
  if (!n) log.push('NO TILE'); else { await fillTile(tiles.nth(n-1), [['h2',H2]].concat(PS.map(p=>['p',p]))); log.push('filled'); }
  log.push('style:'+await setStyleLast(ST));
  await report(log);
}
