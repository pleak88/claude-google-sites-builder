#!/bin/bash
# bgpage.sh <page> [offset]  — на уже собранной странице (редактор открыт на ней) загрузить общий фон во все секции стиля "img".
# Env: PLAN=path/plan.json  BG=path/bg-tall.jpg  SESSION=gs  (offset = 1 на главной из-за Cover-хедера, 0 на внутренних)
S="$(cd "$(dirname "$0")" && pwd)"; P=$1; OFF=${2:-0}; TMP="${TMPDIR:-/tmp}/_bg_$$.js"
# конфиг: при наличии site.json (gs.sh) SESSION/PLAN берутся из него; SECS_OVERRIDE="0 2" — явные индексы секций; BG — файл фона
if [ -f "${SITE:-$PWD/site.json}" ]; then source "$S/gs.sh"; PLAN="${PLAN:-$V/_src/plan.json}"; BG="${BG:-$V/_src/img/bg-tall.png}"; fi
SESSION=${SESSION:-gs}
SECS=$(OFF="$OFF" PLAN="$PLAN" PG="$P" python -c '
import json,os
t=json.load(open(os.environ["PLAN"],encoding="utf-8"))[os.environ["PG"]]["tiles"]; out=[]; i=0
for x in t:
    n = 2 if (x["kind"]=="layout" and x.get("pattern")=="top") else 1   # фото «сверху» = 2 секции
    if x["style"]=="img": out += [str(i+k+int(os.environ["OFF"])) for k in range(n)]
    i += n
print(" ".join(out))')
SECS=${SECS_OVERRIDE:-$SECS}
echo "bg sections: $SECS"
for s in $SECS; do
  python "$S/render.py" js/bgimg.tpl.js "$TMP" SEC=$s 'MODE="Upload"' >/dev/null
  playwright-cli -s=$SESSION run-code --filename "$TMP" >/dev/null 2>&1
  playwright-cli -s=$SESSION upload "$BG" >/dev/null 2>&1     # ⚠️ сразу upload: eval при открытом чузере падает «modal state»
  for k in 1 2 3 4 5 6 7 8 9 10 11 12; do sleep 1; r=$(playwright-cli -s=$SESSION --raw eval "(()=>{const s=document.querySelectorAll('section')[$s]; const el=[s,...s.querySelectorAll('div')].filter(e=>!e.closest('tile')).find(e=>/url\(/.test(getComputedStyle(e).backgroundImage)); return !!el})()" 2>&1 | tail -1); case "$r" in *true*) break;; esac; done; sleep 1
  bg=$(playwright-cli -s=$SESSION --raw eval "(()=>{const s=document.querySelectorAll('section')[$s]; const el=[s,...s.querySelectorAll('div')].find(e=>/url\(/.test(getComputedStyle(e).backgroundImage)); return el? 'IMG':'no bg'})()" 2>&1 | tail -1)
  echo "sec $s → $bg"
done
rm -f "$TMP"
