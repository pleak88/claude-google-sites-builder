#!/bin/bash
# publish.sh — публикация ОДИН раз + аудит живого сайта (~30 с) в cookie-less сессии. Конфиг из site.json (gs.sh).
# site.json: address, pages (ключи = слаги), sections, и опционально audit: {notice, notice_rgb, byline, byline_rgb, forbidden_rgb, modal}
# Режимы: publish.sh (первая публикация) | publish.sh re (republish) | publish.sh audit (только аудит)
# Выход: печатает fails; код 1, если аудит не пуст — сборка НЕ закончена, править и republish.sh.
source "$(cd "$(dirname "$0")" && pwd)/gs.sh" || exit 1
JS="$SKILL/scripts/js"; ANON="${ANON:-anon}"
cfgj(){ SITE="$SITE" python -c "import json,os;c=json.load(open(os.environ['SITE'],encoding='utf-8'));a=c.get('audit',{});print(json.dumps(c.get($1) if '$1'.startswith(\"'\") else a.get($1), ensure_ascii=False))" "$1"; }
if [ "$1" = "audit" ]; then :   # только аудит, без публикации
elif [ "$1" != "re" ]; then
  gs_render js/publish1.tpl.js "$V/_publish1.js" ADDRESSES="[\"$ADDRESS\"]"; gs_run "$V/_publish1.js"; echo "publish: $(gs_title)"
  sleep 4; gs_run "$JS/share_open.js"; gs_run "$JS/share_public.js"; gs_run "$JS/share_done.js"; playwright-cli -s="$SESSION" press Escape >/dev/null 2>&1
else
  gs_run "$JS/republish.js"; echo "republish: $(gs_title)"
fi
sleep 20
PAGES=$(SITE="$SITE" python -c "import json,os;print(json.dumps(list(json.load(open(os.environ['SITE'],encoding='utf-8'))['pages'].keys())))")
A(){ SITE="$SITE" python -c "import json,os;a=json.load(open(os.environ['SITE'],encoding='utf-8')).get('audit',{});print(json.dumps(a.get('$1','$2')))"; }
gs_render js/audit_live.tpl.js "$V/_audit.js" ADDRESS="\"$ADDRESS\"" PAGES="$PAGES" SECTIONS="\"${SECTIONS:-separate}\"" MODAL="$(A modal true)" \
  NOTICE="$(A notice '')" NOTICE_RGB="$(A notice_rgb '')" BYLINE="$(A byline '')" BYLINE_RGB="$(A byline_rgb '')" FORBIDDEN_RGB="$(A forbidden_rgb '')"
playwright-cli -s="$ANON" open "https://sites.google.com/view/$ADDRESS/home" >/dev/null 2>&1; sleep 6
T=$(playwright-cli -s="$ANON" --raw eval "document.title" 2>&1 | tail -1)
echo "$T" | grep -q "accounts.google.com" && { echo "NOT PUBLIC: live site asks for login"; }
playwright-cli -s="$ANON" run-code --filename "$V/_audit.js" >/dev/null 2>&1
RES=$(playwright-cli -s="$ANON" --raw eval "document.title" 2>&1 | tail -1)
playwright-cli -s="$ANON" close >/dev/null 2>&1
echo "$RES" | python -c "import json,sys;r=json.loads(json.loads(sys.stdin.read()));print('AUDIT FAILS:',len(r['fails']));[print(' -',f) for f in r['fails']];print('pages:',', '.join(k+' '+str(v['chars'])+'ch' for k,v in r['info'].items()))
sys.exit(1 if r['fails'] else 0)"
