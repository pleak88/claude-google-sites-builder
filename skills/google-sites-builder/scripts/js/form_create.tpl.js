// form_create.tpl.js — Google Forms (новый UI, 13.10.2026). Открыть https://docs.google.com/forms/u/0/create в сессии проекта, затем:
// 1) этот скрипт: заголовок формы + описание + первый вопрос (FIRST_Q, Short answer по умолчанию) + остальные QUESTIONS с типом + имя документа;
// 2) form_publish.js (новые Forms без Publish не принимают ответы); 3) form_link.js → viewform URL; 4) button_insert.tpl.js на странице Contact.
// Типы берутся кликом по дропдауну (leaf «Multiple choice/Short answer/…») → role=option. Required-переключатель — по желанию.
async (page) => {
  const log=[];
  const rcXY = async (x,y) => { await page.mouse.move(x,y); await page.waitForTimeout(200); await page.mouse.down(); await page.waitForTimeout(130); await page.mouse.up(); };
  const leaf = (re) => page.evaluate(src=>{const re=new RegExp(src); const e=[...document.querySelectorAll('*')].filter(x=>x.children.length===0 && re.test((x.innerText||'').trim()) && x.getBoundingClientRect().width>0 && x.getBoundingClientRect().y>0).pop(); if(!e) return null; const b=e.getBoundingClientRect(); return {x:Math.round(b.x+b.width/2), y:Math.round(b.y+b.height/2), t:e.innerText.trim()};}, re.source);
  // первый вопрос: contenteditable «Untitled Question» → FIRST_Q
  const q0 = page.locator('[contenteditable=true]').filter({hasText:/^Untitled Question$/}).first();
  if (await q0.count()) { await q0.click(); await page.waitForTimeout(300); await page.keyboard.press('Control+A'); await page.keyboard.type('__FIRST_Q__', {delay:15}); await page.waitForTimeout(500); }

  const setDiv = async (loc, text) => { await loc.click(); await page.waitForTimeout(300); await page.keyboard.press('Control+A'); await page.keyboard.type(text, {delay:15}); await page.waitForTimeout(400); };
  await setDiv(page.locator('[contenteditable=true]').filter({hasText:'Untitled form'}).first(), '__TITLE__');
  const desc = page.locator('[aria-label="Form description"], [contenteditable=true]').nth(1);
  await setDiv(desc, '__DESC__');
  const Q = __QUESTIONS__;   // первый вопрос формы уже создан как Short answer: сюда остальные, напр. [['Email address','Short answer'],['Your question or comment','Paragraph']]
  for (let i=0;i<Q.length;i++){
    if (i>0) { await page.locator('[aria-label="Add question"]').first().click(); await page.waitForTimeout(2200); }
    const q = await page.evaluate(()=>{const e=[...document.querySelectorAll('[contenteditable=true]')].filter(x=>!x.innerText.trim() && x.getBoundingClientRect().width>100).pop(); if(!e) return null; const b=e.getBoundingClientRect(); return {x:Math.round(b.x+b.width/2), y:Math.round(b.y+b.height/2)};});
    if (!q) { log.push('no empty title '+i); break; }
    await rcXY(q.x,q.y); await page.waitForTimeout(300); await page.keyboard.type(Q[i][0], {delay:15}); await page.waitForTimeout(600);
    const dd = await leaf(/^(Multiple choice|Short answer|Paragraph|Checkboxes|Dropdown)$/);
    log.push('dd='+JSON.stringify(dd));
    if (dd) { await rcXY(dd.x, dd.y); await page.waitForTimeout(1200);
      const opt = await page.evaluate(w=>{const e=[...document.querySelectorAll('[role=option]')].find(x=>(x.innerText||'').trim()===w && x.getBoundingClientRect().width>0); if(!e) return null; const b=e.getBoundingClientRect(); return {x:Math.round(b.x+b.width/2), y:Math.round(b.y+b.height/2)};}, Q[i][1]);
      log.push('opt='+JSON.stringify(opt));
      if (opt) { await rcXY(opt.x, opt.y); await page.waitForTimeout(1000); } else await page.keyboard.press('Escape'); }
    const sw = await page.evaluate(()=>{const e=[...document.querySelectorAll('[role=switch]')].filter(x=>x.getBoundingClientRect().width>0).pop(); if(!e) return null; const b=e.getBoundingClientRect(); return {x:Math.round(b.x+b.width/2), y:Math.round(b.y+b.height/2), c:e.getAttribute('aria-checked')};});
    if (sw && sw.c!=='true') { await rcXY(sw.x, sw.y); await page.waitForTimeout(500); }
    log.push('q'+i+' done');
  }
  // required для первого вопроса (Name): кликнуть его карточку и переключатель
  const nm = await leaf(/^Name$/); if (nm) { await rcXY(nm.x, nm.y); await page.waitForTimeout(1200); const sw = await page.evaluate(()=>{const e=[...document.querySelectorAll('[role=switch]')].filter(x=>x.getBoundingClientRect().width>0)[0]; if(!e) return null; const b=e.getBoundingClientRect(); return {x:Math.round(b.x+b.width/2), y:Math.round(b.y+b.height/2), c:e.getAttribute('aria-checked')};}); if (sw && sw.c!=='true') { await rcXY(sw.x, sw.y); await page.waitForTimeout(500); } log.push('name req '+JSON.stringify(sw)); }
  // имя документа
  const dn = page.locator('input[aria-label="Form title"], input').filter({has:page.locator(':scope')}).first();
  const inp = await page.evaluate(()=>{const i=[...document.querySelectorAll('input')].find(x=>x.value==='Untitled form'); if(!i) return null; const b=i.getBoundingClientRect(); return {x:Math.round(b.x+b.width/2), y:Math.round(b.y+b.height/2)};});
  if (inp) { await rcXY(inp.x, inp.y); await page.keyboard.press('Control+A'); await page.keyboard.type('__TITLE__', {delay:15}); await page.keyboard.press('Tab'); await page.waitForTimeout(1200); log.push('docname set'); }
  const summary = await page.evaluate(()=>[...document.querySelectorAll('[role=listitem]')].map(c=>(c.innerText||'').replace(/\s+/g,' ').trim().slice(0,60)).filter(t=>t && !/option value/i.test(t)).slice(0,6));
  log.push(JSON.stringify(summary));
  await page.evaluate(t=>document.title=t.slice(0,900), JSON.stringify(log));
}
