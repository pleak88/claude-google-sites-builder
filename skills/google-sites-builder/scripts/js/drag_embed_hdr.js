// drag_embed_hdr.js — перетащить только что вставленный embed (секция с iframe) в Cover-хедер (section 0).
// Проверено 12.10.2026 (star-casino-cz-information): вьюпорт 1440×1400 (хедер = вьюпорт−64), прокрутка так, чтобы
// верх embed-тайла был на y≈1000, выделение real-click'ом, захват за верхнюю кромку тайла (cursor: move на top+2),
// 45 шагов к середине видимой части хедера, пауза 0,9 с, mouse.up. Потом resize.js (W=782,H=620) → dx=0.
// Запуск: playwright-cli -s=<s> run-code --filename js/drag_embed_hdr.js; результат в document.title.
async (page) => {
  const log=[];
  await page.setViewportSize({width:1440,height:1400}); await page.waitForTimeout(1200);
  await page.keyboard.press('Escape');
  await page.mouse.move(600,1200); for (let i=0;i<10;i++){ await page.mouse.wheel(0,-1500); await page.waitForTimeout(100); } await page.waitForTimeout(600);
  const tiles = () => page.evaluate(()=>[...document.querySelectorAll('section')].map((s,i)=>i+':'+s.querySelectorAll('tile').length+'t:'+s.querySelectorAll('iframe').length+'ifr:'+Math.round(s.getBoundingClientRect().height)).join(' | '));
  const geo = () => page.evaluate(()=>{const s=[...document.querySelectorAll('section')]; const si=s.findIndex(x=>x.querySelector('iframe')); const t=[...s[si].querySelectorAll('tile')].pop(); const r=t.getBoundingClientRect(); const h=s[0].getBoundingClientRect(); return {si, x:r.x+r.width/2, top:r.y, h:r.height, hx:h.x+h.width/2, hy:h.y, hh:h.height};});
  for (let i=0;i<40;i++){ const q=await geo(); if (q.top>900 && q.top<1250) break; await page.mouse.move(600,700); await page.mouse.wheel(0, q.top>1250 ? 300 : -300); await page.waitForTimeout(250); }
  let g = await geo(); log.push('src sec '+g.si+' top='+Math.round(g.top)+' hdr y='+Math.round(g.hy)+' h='+Math.round(g.hh));
  if (g.hy+g.hh < 300) { log.push('header not visible enough'); }
  await page.mouse.move(g.x, g.top+30); await page.waitForTimeout(200); await page.mouse.down(); await page.waitForTimeout(130); await page.mouse.up(); await page.waitForTimeout(900);
  g = await geo();
  const curAt = (x,y) => page.evaluate(([x,y])=>{const e=document.elementFromPoint(x,y); return e?getComputedStyle(e).cursor:'none'}, [x,y]);
  let fy = g.top+2; let cur = await curAt(g.x, fy);
  if (!/move|grab/.test(cur)) { fy = g.top+g.h/2; cur = await curAt(g.x, fy); }
  log.push('cursor '+cur);
  const fx=g.x, tx=g.hx, ty=Math.max(150, Math.min(g.hy+g.hh-150, (g.hy+g.hh)/2));
  await page.mouse.move(fx,fy); await page.waitForTimeout(300); await page.mouse.down(); await page.waitForTimeout(500);
  await page.mouse.move(fx+3,fy+3); await page.waitForTimeout(150); await page.mouse.move(fx+8,fy-8); await page.waitForTimeout(150);
  const steps=45; for (let k=1;k<=steps;k++){ await page.mouse.move(fx+(tx-fx)*k/steps, fy+(ty-fy)*k/steps); await page.waitForTimeout(45); }
  await page.waitForTimeout(900); await page.mouse.up(); await page.waitForTimeout(3000);
  log.push(await tiles());
  await page.setViewportSize({width:1440,height:900}); await page.waitForTimeout(500);
  await page.evaluate(t=>document.title=t.slice(0,900), JSON.stringify(log));
}
