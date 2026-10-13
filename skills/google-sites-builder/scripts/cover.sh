#!/bin/bash
# cover.sh — первый экран главной одной командой (конфиг site.json → "cover": {"image":"_src/img/cover.jpg","popup":"_src/popup.html","w":782,"h":620}).
# Шаги: Header type → Cover · очистить и УДАЛИТЬ тайл Title · очистить Site name · фон хедера (Upload, ждём data-URI) ·
#       embed модалки · перенос в хедер · симметричный ресайз W×H · проверка dx и состава хедера.
source "$(cd "$(dirname "$0")" && pwd)/gs.sh" || exit 1
JS="$SKILL/scripts/js"
cfg(){ SITE="$SITE" python -c "import json,os;c=json.load(open(os.environ['SITE'],encoding='utf-8')).get('cover',{});print(c.get('$1','$2'))"; }
IMG="$V/$(cfg image _src/img/cover.jpg)"; POPUP="$V/$(cfg popup _src/popup.html)"; W=$(cfg w 782); H=$(cfg h 620)
[ -f "$IMG" ] && [ -f "$POPUP" ] || { echo "cover.sh: нет $IMG или $POPUP"; exit 1; }
[ -z "$NOGO" ] && gs_goto home
echo "edit: $(gs_edit_url_guard)"
gs_run "$JS/cover4.js";        echo "cover:    $(gs_title 160)"
gs_run "$JS/clrhdr.js";        echo "clear:    $(gs_title 160)"
gs_run "$JS/rmhdrtitle.js";    echo "rm title: $(gs_title 200)"
gs_run "$JS/sitename_clear.js"; echo "sitename: $(gs_title 160)"
gs_run "$JS/hdrimg.js"
gs_upload "$IMG" 1 "(()=>{const s=document.querySelector('section'); const el=[s,...s.querySelectorAll('div')].find(e=>/url\(\"data:/.test(getComputedStyle(e).backgroundImage)); return !!el})()" 15
echo "hdr bg:   $(gs_eval "(()=>{const s=document.querySelector('section'); const el=[s,...s.querySelectorAll('div')].find(e=>/url\(/.test(getComputedStyle(e).backgroundImage)); return el? getComputedStyle(el).backgroundImage.slice(0,30):'NO BG'})()")"
python - "$POPUP" "$JS/embed.tpl.js" "$V/_embed.js" <<'EOF'
import base64,io,sys
h=io.open(sys.argv[1],encoding='utf-8').read(); b=base64.b64encode(h.encode('utf-8')).decode()
io.open(sys.argv[3],'w',encoding='utf-8').write(io.open(sys.argv[2],encoding='utf-8').read().replace('__B64__',b))
EOF
gs_run "$V/_embed.js";         echo "embed:    $(gs_title 200)"
gs_run "$JS/drag_embed_hdr.js"; echo "drag:     $(gs_title 200)"
gs_render js/resize.tpl.js "$V/_resize.js" W=$W H=$H; gs_run "$V/_resize.js"; echo "resize:   $(gs_title 200)"
gs_eval "(()=>{const s=document.querySelector('section'); const f=s.querySelector('iframe'); const r=f?f.getBoundingClientRect():null; const sr=s.getBoundingClientRect(); return JSON.stringify({hdrTiles:s.querySelectorAll('tile').length, ifr:r?Math.round(r.width)+'x'+Math.round(r.height):'NONE', dx:r?Math.round((r.x+r.width/2)-(sr.x+sr.width/2)):null, hdrH:Math.round(sr.height)})})()"
