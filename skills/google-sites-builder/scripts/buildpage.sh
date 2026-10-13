#!/bin/bash
# buildpage.sh <pagekey> [keephdr]  — заливает тайлы страницы из <проект>/_src/plan.json по конфигу site.json (gs.sh).
# Режим секций: site.json "sections": "separate" (по умолчанию — каждый тайл своей секцией, стили из плана)
#               | "one" — все тайлы страницы в ОДНУ секцию (первый тайл создаёт секцию, остальные переносятся drag'ом в неё).
# Env: JOIN=<idx> — принудительно переносить join-тайлы в секцию idx; START/END — диапазон тайлов; NOGO=1 — не делать goto.
# Главная с Cover-хедером: buildpage.sh home keephdr (секция 0 = хедер).
source "$(cd "$(dirname "$0")" && pwd)/gs.sh" || exit 1
P=$1; KEEP=$2; JS="$SKILL/scripts/js"; IMG="$V/_src/img"; TMP="$V/_tile.js"
lastsec(){ gs_eval "(()=>{const s=[...document.querySelectorAll('section')];for(let i=s.length-1;i>=0;i--){if(!/footer/i.test(s[i].getAttribute('aria-label')||''))return i;}return s.length-1})()"; }
[ -z "$NOGO" ] && gs_goto "$P"
if [ "$KEEP" != "keephdr" ]; then gs_run "$JS/delhdr.js"; echo "hdr: $(gs_title)"; fi
N=$(PLAN="$V/_src/plan.json" PG="$P" python -c "import json,os;print(len(json.load(open(os.environ['PLAN'],encoding='utf-8'))[os.environ['PG']]['tiles']))")
ONE=""; [ "$SECTIONS" = "one" ] && ONE=1
for ((i=${START:-0};i<${END:-$N};i++)); do
  SEC=$(lastsec)
  # в режиме one: первый контентный тайл страницы создаёт секцию, все следующие — join в неё
  if [ -n "$ONE" ] && [ -z "$JOIN" ] && [ "$i" -gt "${START:-0}" ]; then JOIN=$SEC; fi
  k=$(cd "$V" && SITE="$SITE" python "$SKILL/scripts/mktile.py" "$P" $i a "$SEC" ${JOIN:+join}); kind=${k%%|*}
  if [ "$kind" = "text" ] || [ "$kind" = "textjoin" ]; then gs_run "$TMP"; echo "tile $i $k sec=$SEC → $(gs_title 200)"
    if [ "$kind" = "textjoin" ] && [ -n "$JOIN" ]; then gs_render js/drag_src.tpl.js "$V/_drag.js" SRC=$((JOIN+1)) DST=$JOIN POS='"end"'; gs_run "$V/_drag.js"; echo "   join→$JOIN: $(gs_title 200)"; fi
  elif [ "$kind" = "image" ]; then
    img=$(echo "$k" | cut -d'|' -f3); gs_run "$TMP"; echo "tile $i $k sec=$SEC"
    gs_upload "$IMG/$img.jpg" 1 "(()=>{const s=[...document.querySelectorAll('section')].pop(); const t=[...document.querySelectorAll('tile')].pop(); return !!(t && [t,...t.querySelectorAll('div')].some(e=>/data:image|sites-images/.test(getComputedStyle(e).backgroundImage)))})()" 12
    if [ -n "$JOIN" ]; then gs_render js/drag_src.tpl.js "$V/_drag.js" SRC=$((JOIN+1)) DST=$JOIN POS='"end"'; gs_run "$V/_drag.js"; echo "   join→$JOIN: $(gs_title 200)"
      gs_render js/imgfix.tpl.js "$V/_imgfix.js" SEC=$JOIN; gs_run "$V/_imgfix.js"; echo "   imgfix: $(gs_title 200)"; fi
  else
    img=$(echo "$k" | cut -d'|' -f3); gs_run "$TMP"; echo "tile $i $k"
    gs_upload "$IMG/$img.jpg" 1 "(()=>{const t=[...document.querySelectorAll('tile')].pop(); return !!(t && [t,...t.querySelectorAll('div')].some(e=>/data:image|sites-images/.test(getComputedStyle(e).backgroundImage)))})()" 12
    (cd "$V" && SITE="$SITE" python "$SKILL/scripts/mktile.py" "$P" $i b >/dev/null); gs_run "$TMP"; echo "tile $i b → $(gs_title 200)"
  fi
done
gs_eval "[...document.querySelectorAll('section')].map((s,i)=>i+':'+(s.getAttribute('aria-label')||'').slice(0,12)+':'+(s.innerText||'').replace(/\s+/g,' ').length+':'+s.querySelectorAll('img,[style*=background-image]').length).join(' | ')"
