async (page) => {
  const log=[];
  const rcXY = async (x,y) => { await page.mouse.move(x,y); await page.waitForTimeout(220); await page.mouse.down(); await page.waitForTimeout(140); await page.mouse.up(); };
  await page.keyboard.press('Escape');
  await page.mouse.move(600,400); for (let i=0;i<8;i++){ await page.mouse.wheel(0,-900); await page.waitForTimeout(80); }
  // низ хедера → y≈560
  for (let i=0;i<10;i++){ const b=await page.evaluate(()=>{const r=document.querySelector('section').getBoundingClientRect(); return r.y+r.height}); if (b>500 && b<620) break; await page.mouse.wheel(0, b>620 ? Math.min(300,b-560) : -200); await page.waitForTimeout(300); }
  const hb = await page.evaluate(()=>{const r=document.querySelector('section').getBoundingClientRect(); return {x:Math.round(r.x+r.width/2), b:Math.round(r.y+r.height), t:Math.round(r.y)}});
  await page.mouse.move(hb.x, Math.max(120, hb.b-200)); await page.waitForTimeout(1200);
  const find = (txt) => page.evaluate(t=>{const e=[...document.querySelectorAll('*')].find(x=>x.children.length===0 && (x.innerText||'').trim()===t && x.getBoundingClientRect().width>0 && x.getBoundingClientRect().y>0 && x.getBoundingClientRect().y<900); if(!e) return null; const r=e.getBoundingClientRect(); return {x:Math.round(r.x+r.width/2), y:Math.round(r.y+r.height/2)};}, txt);
  let im = await find('Image');
  if (!im) { await rcXY(hb.x, Math.max(120, hb.b-200)); await page.waitForTimeout(1200); im = await find('Image'); }
  log.push('hdr bottom='+hb.b+' img='+JSON.stringify(im));
  if (!im) { await page.evaluate(t=>document.title=t, JSON.stringify(log)); return; }
  await rcXY(im.x, im.y); await page.waitForTimeout(1500);
  const up = await find('Upload');
  log.push('upload='+JSON.stringify(up));
  if (up) { await rcXY(up.x, up.y); await page.waitForTimeout(2000); }
  await page.evaluate(t=>document.title=t, JSON.stringify(log));
}
