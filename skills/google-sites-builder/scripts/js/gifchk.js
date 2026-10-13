async (page) => {
  const r = await page.evaluate(async ()=>{const s=document.querySelector('section'); const el=[s,...s.querySelectorAll('div')].find(e=>/url\(/.test(getComputedStyle(e).backgroundImage)); const u=getComputedStyle(el).backgroundImage.slice(5,-2);
    const res = await fetch(u, {credentials:'include'}); const b = new Uint8Array(await res.arrayBuffer());
    let frames=0; for (let i=0;i<b.length-2;i++) if (b[i]===0x21 && b[i+1]===0xF9 && b[i+2]===0x04) frames++;
    return res.headers.get('content-type')+' '+b.length+' bytes, head='+String.fromCharCode(...b.slice(0,6))+' gce='+frames;});
  await page.evaluate(t=>document.title=t, r);
}
