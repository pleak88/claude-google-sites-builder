async (page) => {
  // диалог Settings → Brand images уже открыт (brand_open.js); вторая пара Upload/Select = Favicon
  const btn = await page.evaluate(() => {
    const d=[...document.querySelectorAll('[role=dialog]')].pop(); if(!d) return null;
    const ups=[...d.querySelectorAll('[role=button],button')].filter(e=>(e.innerText||'').trim()==='Upload' && e.getBoundingClientRect().width>8)
      .map(e=>{const r=e.getBoundingClientRect(); return {x:Math.round(r.x+r.width/2), y:Math.round(r.y+r.height/2)}});
    return ups[ups.length-1] || null;   // последний Upload = Favicon (Logo выше)
  });
  if (!btn) { await page.evaluate(()=>document.title='NO favicon Upload btn'); return; }
  await page.mouse.move(btn.x, btn.y); await page.waitForTimeout(250);
  await page.mouse.down(); await page.waitForTimeout(140); await page.mouse.up();
  await page.waitForTimeout(2500);   // открылся нативный чузер → дальше playwright-cli upload
}
