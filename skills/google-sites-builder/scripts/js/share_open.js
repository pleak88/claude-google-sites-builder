async page => {
  const rc = async (loc) => { const b=await loc.boundingBox({timeout:6000}).catch(()=>null); if(!b) return false; await page.mouse.move(b.x+b.width/2,b.y+b.height/2); await page.waitForTimeout(180); await page.mouse.down(); await page.waitForTimeout(120); await page.mouse.up(); return true; };
  await rc(page.locator('[aria-label="Share with others"]').first()); await page.waitForTimeout(4000);
  const fr = page.frames().map(f=>f.url().slice(0,80));
  let txt='';
  for (const f of page.frames()) { try { const t = await f.evaluate(()=>document.body.innerText.replace(/\s+/g,' ').slice(0,700)); if (/Published site|Опубликованный|Draft|Restricted|Public/i.test(t)) txt += ' ### '+f.url().slice(0,60)+' :: '+t; } catch(e){} }
  await page.screenshot({path:'_share.png'});
  return fr.join(' , ') + '\n' + txt;
}
