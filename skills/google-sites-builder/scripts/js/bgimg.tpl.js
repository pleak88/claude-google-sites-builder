async (page) => {
  // фон-картинка секции __SEC__: палитра Section colors → строка Image → __MODE__ (Upload | Select)
  const SEC = __SEC__; const MODE = '__MODE__';
  const log=[];
  const rcXY = async (x,y) => { await page.mouse.move(x,y); await page.waitForTimeout(120); await page.mouse.down(); await page.waitForTimeout(90); await page.mouse.up(); };
  const until = async (fn, cap=3000, step=100) => { const t0=Date.now(); while (Date.now()-t0 < cap) { try { if (await fn()) return true; } catch(e) {} await page.waitForTimeout(step); } return false; };
  await page.keyboard.press('Escape'); await page.waitForTimeout(150); await page.keyboard.press('Escape'); await page.setViewportSize({width:1440,height:900}); await page.waitForTimeout(200);
  // прокрутить так, чтобы верх секции был во вьюпорте
  await page.mouse.move(600,500);
  for (let i=0;i<40;i++){ const r=await page.evaluate(k=>{const s=document.querySelectorAll('section')[k]; if(!s) return null; const b=s.getBoundingClientRect(); return {y:b.y,h:b.height}}, SEC); if(!r){log.push('no section '+SEC); break;} if (r.y>90 && r.y<400) break; await page.mouse.wheel(0, r.y>400 ? 400 : -400); await page.waitForTimeout(120); }
  const sec = page.locator('section').nth(SEC);
  await sec.hover({force:true}); await page.waitForTimeout(350);
  const pal = sec.locator('[aria-label="Section colors"]').first();
  if (!(await pal.count())) { log.push('no palette'); await page.evaluate(t=>document.title=t, JSON.stringify(log)); return; }
  const pb = await pal.boundingBox().catch(()=>null);
  if (pb) { await rcXY(pb.x+pb.width/2, pb.y+pb.height/2); } else { await pal.click({force:true}); }
  await until(()=>page.evaluate(()=>[...document.querySelectorAll('*')].some(e=>!e.children.length && /^Image$/.test((e.innerText||'').trim()) && e.getBoundingClientRect().width>0)), 2500);   // палитра открылась
  await page.waitForTimeout(150);
  const rows = await page.evaluate(()=>{const o=[];document.querySelectorAll('*').forEach(e=>{if(e.children.length) return; const t=(e.innerText||'').trim();const r=e.getBoundingClientRect();if(r.width>0&&r.x<400&&r.y>0&&/^(Style \d|Image)$/.test(t))o.push({t:t.slice(0,10),x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)});});return o;});
  log.push('rows='+rows.map(r=>r.t).join('/'));
  const s3 = rows.find(r=>r.t==='Style 3');
  const im = rows.filter(r=>/^Image/.test(r.t) && (!s3 || r.y>s3.y)).sort((a,b)=>a.y-b.y)[0];
  if (!im) { log.push('no Image row'); await page.keyboard.press('Escape'); await page.evaluate(t=>document.title=t, JSON.stringify(log)); return; }
  const findItem = () => page.evaluate(m=>{const el=[...document.querySelectorAll('*')].find(e=>e.children.length===0 && (e.innerText||'').trim()===m && e.getBoundingClientRect().width>0 && e.getBoundingClientRect().y>0); if(!el) return null; const r=el.getBoundingClientRect(); return {x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)};}, MODE);
  await page.mouse.move(im.x-30, im.y); await page.waitForTimeout(150); await page.mouse.move(im.x, im.y);
  await until(async()=>!!(await findItem()), 2000);   // подменю Upload/Select
  let item = await findItem();
  if (!item) { log.push('hover miss → click Image'); await rcXY(im.x, im.y); await until(async()=>!!(await findItem()), 1500); item = await findItem(); }
  if (!item) { log.push('no '+MODE+' item'); await page.keyboard.press('Escape'); await page.evaluate(t=>document.title=t, JSON.stringify(log)); return; }
  await rcXY(item.x,item.y); await page.waitForTimeout(MODE==='Select' ? 2000 : 900);
  if (MODE==='Select') {
    const d = await page.evaluate(()=>{const x=[...document.querySelectorAll('[role=dialog]')].pop(); if(!x) return 'no dialog'; const tabs=[...x.querySelectorAll('[role=tab]')].map(t=>t.innerText.trim()); const imgs=[...x.querySelectorAll('img')].map(i=>{const r=i.getBoundingClientRect(); return Math.round(r.width)+'x'+Math.round(r.height)+'@'+Math.round(r.x)+','+Math.round(r.y)}); return 'tabs='+tabs.join('/')+' imgs='+imgs.slice(0,6).join(';')+' txt='+x.innerText.replace(/\s+/g,' ').slice(0,200);});
    log.push(d);
  } else log.push('chooser opened');
  await page.evaluate(t=>document.title=t.slice(0,900), JSON.stringify(log));
}
