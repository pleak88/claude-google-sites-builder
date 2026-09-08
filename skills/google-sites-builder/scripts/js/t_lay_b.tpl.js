async (page) => {
__COMMON__
  const H2 = __H2__;
  const PS = __PS__;
  const ST = __STYLE__;
  const log = [];
  const measure = () => page.evaluate(() => {
    const s=[...document.querySelectorAll('section')];
    let last=null;
    for (let i=s.length-1;i>=0;i--){ if(!/footer/i.test(s[i].getAttribute('aria-label')||'')) { last=s[i]; break; } }
    const seen=[], out=[];
    [...last.querySelectorAll('[aria-label="Text"]')].forEach(e=>{
      const r=e.getBoundingClientRect();
      if (r.width<60 || r.height<20) return;
      if (seen.some(y=>Math.abs(y-r.y)<40)) return;
      seen.push(r.y);
      out.push({x:Math.round(r.x+r.width/2), y:Math.round(r.y+18)});
    });
    return out.sort((a,b)=>a.y-b.y);
  });
  let spots = await measure();
  log.push('spots0='+JSON.stringify(spots));
  if (spots.length >= 2) {
    await fillAt(spots[0].x, spots[0].y, [['h2', H2]]);
    spots = await measure();
    log.push('spots1='+JSON.stringify(spots));
    if (spots.length >= 2) await fillAt(spots[1].x, spots[1].y, PS.map(p=>['p',p]));
    else log.push('body spot lost');
    log.push('filled');
  } else log.push('NOT ENOUGH SPOTS');
  log.push('style:'+await setStyleLast(ST));
  await page.evaluate(t=>document.title=t.slice(0,400), JSON.stringify(log));
}
