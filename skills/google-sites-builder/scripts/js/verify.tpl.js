async (page) => {
  const base=__BASE__;
  let slugs=__SLUGS__;
  {
    await page.goto(base, {waitUntil:'domcontentloaded'}); await page.waitForTimeout(3500);
    const live = await page.evaluate(()=>{const addr=location.pathname.split('/')[2]; const set=new Set(); document.querySelectorAll('a').forEach(a=>{const h=a.getAttribute('href')||''; const m=h.match(new RegExp('/view/'+addr+'/([^/?#]+)')); if(m) set.add(decodeURIComponent(m[1]));}); return [...set];});
    if (live.length) slugs = live;   // реальные слаги (в т.ч. с диакритикой/греческие) главнее ключей плана
  }
  const out=[];
  await page.setViewportSize({width:1440,height:900});
  for (const s of slugs) {
    const r = await page.goto(base+'/'+s, {waitUntil:'domcontentloaded'});
    await page.waitForTimeout(3200);
    const d = await page.evaluate(() => ({
      h1:((document.querySelector('h1')||{}).innerText||'').slice(0,60),
      chars:document.body.innerText.length,
      imgs:[...document.images].filter(i=>i.getBoundingClientRect().width>80).map(i=>Math.round(i.getBoundingClientRect().width)),
      ifr:document.querySelectorAll('iframe').length,
      nav:[...document.querySelectorAll('[role=navigation] a, nav a')].map(a=>a.innerText.trim()).filter(Boolean).slice(0,8),
      flinks:[...new Set([...document.querySelectorAll('a')].map(a=>a.getAttribute('href')||'').filter(h=>h.includes('/view/'+location.pathname.split('/')[2]+'/')))].length,
      hscroll:document.documentElement.scrollWidth>document.documentElement.clientWidth,
      icon:((document.querySelector('link[rel*=icon]')||{}).href||'').slice(0,60),
    }));
    out.push({s, st:r?r.status():0, ...d});
  }
  await page.evaluate(t=>document.title=t.slice(0,4000), JSON.stringify(out));
}
