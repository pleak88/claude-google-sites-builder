async (page) => {
  // Аудит ЖИВОГО сайта (~30 с) — запускать в cookie-less сессии (-s=anon) сразу после публикации; сборка не считается
  // законченной, пока fails пустой. Параметры из site.json через render.py: ADDRESS, PAGES (слаги), SECTIONS ("one"|"separate"),
  // опционально NOTICE (регэксп строки 18+), NOTICE_RGB ("rgb(255, 77, 106)"), BYLINE (регэксп), BYLINE_RGB, FORBIDDEN_RGB
  // (цвет seed-темы, которого не должно быть, напр. "rgb(115, 67, 50)"), MODAL (true/false).
  const ADDRESS='__ADDRESS__', PAGES=__PAGES__, SECTIONS='__SECTIONS__', MODAL=__MODAL__;
  const NOTICE='__NOTICE__', NOTICE_RGB='__NOTICE_RGB__', BYLINE='__BYLINE__', BYLINE_RGB='__BYLINE_RGB__', FORBIDDEN_RGB='__FORBIDDEN_RGB__';
  const base='https://sites.google.com/view/'+ADDRESS; const fails=[]; const info={};
  await page.setViewportSize({width:1440,height:900});
  for (const s of PAGES) {
    const r = await page.goto(base+'/'+s, {waitUntil:'domcontentloaded'}); await page.waitForTimeout(3500);
    const d = await page.evaluate(([notice, byline, forb]) => {
      const secs=[...document.querySelectorAll('section')];
      const hdr=secs[0]; const hdrIfr=hdr?hdr.querySelectorAll('iframe').length:0;
      const hdrText=hdr?[...hdr.querySelectorAll('h1,h2,h3,p')].filter(e=>e.innerText.trim()).length:0;
      const addr=location.pathname.split('/')[2]; const isFooter=(s)=>/footer/i.test(s.getAttribute('aria-label')||'') || (s===secs[secs.length-1] && [...s.querySelectorAll('a')].filter(x=>(x.getAttribute('href')||'').includes('/view/'+addr+'/')).length>=2);
      const content=secs.filter(s=>!isFooter(s) && !s.querySelector('iframe'));
      const leaf=(re)=>{ const rx=new RegExp(re); const pool=[]; content.forEach(s=>pool.push(...s.querySelectorAll('h1,h2,h3,p')));   // только контент-секции, не футер
        const c=pool.filter(e=>rx.test(e.innerText||'') && e.getBoundingClientRect().width>0 && (e.innerText||'').length<400); return c.find(e=>/^H[1-3]$/.test(e.tagName)) || c[0] || null; };
      const n=notice?leaf(notice):null; const b=byline?leaf(byline):null; const h1=document.querySelector('h1');
      const forbEls=forb?[...document.querySelectorAll('a,button,span,div')].filter(e=>getComputedStyle(e).color===forb || getComputedStyle(e).backgroundColor===forb).length:0;
      return {
        h1:h1?h1.innerText.slice(0,50):'', chars:document.body.innerText.length, hscroll:document.documentElement.scrollWidth>document.documentElement.clientWidth,
        icon:((document.querySelector('link[rel*=icon]')||{}).href||''), nav:[...document.querySelectorAll('[role=navigation] a, nav a')].map(a=>a.innerText.trim()).filter(Boolean).length,
        secs:secs.length, contentSecs:content.length, hdrIfr, hdrText, imgs:[...document.images].filter(i=>i.getBoundingClientRect().width>200).map(i=>Math.round(i.getBoundingClientRect().width)),
        noticeColor:n?getComputedStyle([...n.querySelectorAll('span')].find(x=>x.innerText.trim())||n).color:'', bylineColor:b?getComputedStyle([...b.querySelectorAll('span')].find(x=>x.innerText.trim())||b).color:'',
        bylineBelowH1: (b&&h1)? (b.getBoundingClientRect().y>h1.getBoundingClientRect().y) : null,
        bylineAlign: b?getComputedStyle(b.closest('p,h1,h2,h3,div')).textAlign:'', forbEls,
        bgSecs: secs.filter(s=>[s,...s.querySelectorAll(':scope > div')].some(e=>/url\(/.test(getComputedStyle(e).backgroundImage))).length,
      };
    }, [NOTICE||'', BYLINE||'', FORBIDDEN_RGB||'']);
    info[s]={chars:d.chars, secs:d.contentSecs, imgs:d.imgs.length, n18:d.noticeColor, by:d.bylineColor};
    if (!r || r.status()!==200) fails.push(s+': status '+(r&&r.status()));
    if (!d.h1) fails.push(s+': no h1');
    if (d.hscroll) fails.push(s+': horizontal scroll');
    if (/gstatic/.test(d.icon)) fails.push(s+': default favicon');
    if (d.imgs.some(w=>w<900)) fails.push(s+': narrow image '+d.imgs.join('/'));
    if (d.forbEls) fails.push(s+': '+d.forbEls+' elements in forbidden seed colour');
    if (SECTIONS==='one') { const expect = (s==='home' && MODAL) ? 2 : 1; if (d.contentSecs>expect) fails.push(s+': '+d.contentSecs+' content sections, expected ≤'+expect+' (mode one)'); }
    if (s==='home') {
      if (MODAL && d.hdrIfr!==1) fails.push('home: header iframe count '+d.hdrIfr);
      if (MODAL && d.hdrText) fails.push('home: '+d.hdrText+' text blocks left in the header (remove the Title tile)');
      if (NOTICE && d.noticeColor && NOTICE_RGB && d.noticeColor!==NOTICE_RGB) fails.push('home: 18+ line colour '+d.noticeColor+' ≠ '+NOTICE_RGB);
      if (NOTICE && !d.noticeColor) fails.push('home: 18+ line not found');
      if (BYLINE && d.bylineBelowH1===false) fails.push('home: byline above H1 (prototype: below)');
      if (BYLINE && d.bylineAlign && d.bylineAlign!=='center') fails.push('home: byline align '+d.bylineAlign);
      if (BYLINE && BYLINE_RGB && d.bylineColor && d.bylineColor!==BYLINE_RGB) fails.push('home: byline colour '+d.bylineColor+' ≠ '+BYLINE_RGB);
    }
  }
  await page.evaluate(t=>document.title=t, JSON.stringify({fails, info}).slice(0,8000));
}
