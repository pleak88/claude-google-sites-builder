async (page) => {
  // перетащить ПОСЛЕДНЮЮ контентную секцию-текст (тайл) в низ секции DST; высокий вьюпорт, чтобы обе были видны
  const DST = __DST__, SRC = __SRC__, POS = '__POS__'; const log=[];
  await page.setViewportSize({width:1440,height:4000}); await page.waitForTimeout(1200);
  await page.keyboard.press('Escape');
  const tiles = () => page.evaluate(()=>[...document.querySelectorAll('section')].map((s,i)=>i+':'+s.querySelectorAll('tile').length+'t:'+(s.innerText||'').replace(/\s+/g,' ').length).join(' | '));
  const srcIdx = SRC;
  const geo = () => page.evaluate(([si,di])=>{const s=[...document.querySelectorAll('section')]; const t=[...s[si].querySelectorAll('tile')].pop(); const r=t.getBoundingClientRect(); const d=s[di].getBoundingClientRect(); const dl=[...s[di].querySelectorAll('tile')].pop().getBoundingClientRect(); return {x:r.x+r.width/2, top:r.y, w:r.width, h:r.height, dBottom:d.y+d.height, dx:d.x+d.width/2, dLastBottom:dl.y+dl.height, dLastTop:dl.y};}, [srcIdx, DST]);
  // прокрутка: низ секции DST в верхней трети, источник ниже
  for (let i=0;i<60;i++){ const g=await geo(); if (g.dBottom>150 && g.dBottom<3800 && g.top>100) break; await page.mouse.move(600,1200); await page.mouse.wheel(0, g.dBottom>3800 ? 500 : -500); await page.waitForTimeout(250); }
  let g = await geo(); log.push('src top='+Math.round(g.top)+' dst bottom='+Math.round(g.dBottom)+' lastTileBottom='+Math.round(g.dLastBottom));
  if (g.top > 3900 || g.top < 0) { log.push('src outside viewport'); await page.evaluate(t=>document.title=t.slice(0,900), JSON.stringify(log)); return; }
  await page.mouse.move(g.x, g.top+30); await page.waitForTimeout(200); await page.mouse.down(); await page.waitForTimeout(130); await page.mouse.up(); await page.waitForTimeout(900);
  g = await geo();
  const curAt = (x,y) => page.evaluate(([x,y])=>{const e=document.elementFromPoint(x,y); return e?getComputedStyle(e).cursor:'none'}, [x,y]);
  let fy = g.top+2; let cur = await curAt(g.x, fy);
  if (!/move|grab/.test(cur)) { fy = g.top+g.h/2; cur = await curAt(g.x, fy); }
  log.push('cursor: '+cur+' at '+Math.round(fy-g.top));
  if (!/move|grab/.test(cur)) { log.push('NO MOVE CURSOR'); await page.setViewportSize({width:1440,height:900}); await page.evaluate(t=>document.title=t.slice(0,900), JSON.stringify(log)); return; }
  const fx=g.x, tx=g.dx, ty=(POS==='beforeLast' ? g.dLastTop-14 : g.dLastBottom+12);
  await page.mouse.move(fx,fy); await page.waitForTimeout(300); await page.mouse.down(); await page.waitForTimeout(500);
  await page.mouse.move(fx+3,fy+3); await page.waitForTimeout(150); await page.mouse.move(fx+8,fy-8); await page.waitForTimeout(150);
  const steps=45; for (let k=1;k<=steps;k++){ await page.mouse.move(fx+(tx-fx)*k/steps, fy+(ty-fy)*k/steps); await page.waitForTimeout(45); }
  await page.waitForTimeout(800); await page.mouse.up(); await page.waitForTimeout(2500);
  log.push(await tiles());
  await page.setViewportSize({width:1440,height:900}); await page.waitForTimeout(500);
  await page.evaluate(t=>document.title=t.slice(0,900), JSON.stringify(log));
}
