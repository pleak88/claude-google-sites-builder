#!/bin/bash
# gs.sh — общий конфиг проекта из site.json (вместо sed по скриптам). Подключать: source "$SKILL/scripts/gs.sh"
# Ищет site.json в $SITE или в текущем каталоге проекта. Экспортирует V (папка проекта), SESSION, PROFILE, SITEID, ADDRESS, SKILL.
# Функции: gs_open | gs_goto <pagekey> | gs_run <file.js> | gs_title | gs_eval "<js>" | gs_upload <file> | gs_render <tpl> <out> K=V…
#
# site.json (пример):
# { "name":"BetFans Australia Info", "address":"betfans-com-au-info", "url":"https://sites.google.com/view/betfans-com-au-info",
#   "session":"bf13", "profile":"C:/Users/pleak/.gsites-profile-BT-16.09-13LV", "siteId":"1N54…",
#   "sections":"separate",               # separate (по умолчанию) | one — режим секций контента на ВСЕХ страницах
#   "pages":{"home":"1iUv…","bet-types":"1Ih9…"},
#   "colors":{"accent":"#55F0D2","red":"#FF4D6A"},
#   "strings":{"notice":"18+ · Gamble responsibly","copy":"© 2026 betfans-com-au-info"},
#   "markers":["18\\+ · Gamble responsibly · Betting","© 2026 betfans-com-au-info"]   # тексты тайлов, которые НЕ считать контентом (плашка/©)
# }
SKILL="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SITE="${SITE:-$PWD/site.json}"
[ -f "$SITE" ] || { echo "gs.sh: нет site.json ($SITE)"; return 1 2>/dev/null || exit 1; }
V="$(cd "$(dirname "$SITE")" && pwd)"
_cfg(){ SITE="$SITE" python -c "import json,os,sys;c=json.load(open(os.environ['SITE'],encoding='utf-8'));v=c
for k in sys.argv[1].split('.'):
    v=v.get(k,'') if isinstance(v,dict) else ''
print(v if not isinstance(v,(dict,list)) else json.dumps(v,ensure_ascii=False))" "$1"; }
SESSION="$(_cfg session)"; PROFILE="$(_cfg profile)"; SITEID="$(_cfg siteId)"; ADDRESS="$(_cfg address)"; SECTIONS="$(_cfg sections)"
export SKILL SITE V SESSION PROFILE SITEID ADDRESS SECTIONS
gs_open(){ playwright-cli -s="$SESSION" open "${1:-https://sites.google.com/}" --browser=chrome --profile="$PROFILE" >/dev/null 2>&1; sleep 8; }
gs_goto(){ local id; id="$(_cfg "pages.$1")"; [ -n "$id" ] || { echo "no page $1"; return 1; }
  playwright-cli -s="$SESSION" goto "https://sites.google.com/d/$SITEID/p/$id/edit" >/dev/null 2>&1; sleep "${2:-8}"; }
gs_run(){ playwright-cli -s="$SESSION" run-code --filename "$1" >/dev/null 2>&1; }
gs_title(){ playwright-cli -s="$SESSION" --raw eval "document.title" 2>&1 | tail -1 | cut -c1-"${1:-400}"; }
gs_eval(){ playwright-cli -s="$SESSION" --raw eval "$1" 2>&1 | tail -1; }
# gs_upload <file> [settleSec] [jsCondition] [capSec] — после upload НЕ спать 8–9 с, а опрашивать условие (eval → truthy) раз в секунду;
# без условия: ждать закрытия чузера (eval снова отвечает) + settle (по умолчанию 2 с). Пример условия: фон секции стал data-URI.
gs_upload(){ local f="$1" settle="${2:-2}" cond="$3" cap="${4:-12}"; playwright-cli -s="$SESSION" upload "$f" >/dev/null 2>&1
  local i=0; while [ $i -lt "$cap" ]; do i=$((i+1)); sleep 1
    if [ -n "$cond" ]; then r=$(gs_eval "$cond"); case "$r" in *true*) break;; esac
    else r=$(gs_eval "1"); case "$r" in *1*) break;; esac; fi
  done; sleep "$settle"; }
# gs_profile_busy — занят ли Chrome-профиль другой сборкой: процесс chrome.exe с этим user-data-dir ИЛИ открытая playwright-сессия
# на другом сайте. Печатает FREE | BUSY:<причина>. Запускать в pre-flight вместо вопроса пользователю.
gs_profile_busy(){ local dir; dir="$(basename "$PROFILE")"
  local n; n=$(powershell -NoProfile -Command "(Get-CimInstance Win32_Process -Filter \"Name='chrome.exe'\" | Where-Object { \$_.CommandLine -like '*$dir*' } | Measure-Object).Count" 2>/dev/null | tr -d ' ')
  if [ -n "$n" ] && [ "$n" != "0" ]; then
    local u; u=$(gs_eval "location.href" 2>/dev/null)
    case "$u" in *"$SITEID"*) echo "FREE (own session on this site)";; *"/d/"*) echo "BUSY: Chrome on profile $dir is editing another site: $u";; *) echo "BUSY: $n chrome.exe on profile $dir (manual Chrome or another build) — close it first";; esac
  else echo "FREE"; fi; }
gs_preflight(){ local b; b=$(gs_profile_busy); echo "profile: $b"; case "$b" in BUSY*) return 1;; esac; }
gs_render(){ local tpl="$1" out="$2"; shift 2; (cd "$V" && SITE="$SITE" python "$SKILL/scripts/render.py" "$tpl" "$out" "$@" >/dev/null); }
gs_edit_url_guard(){ gs_eval "location.href.includes('/edit') ? 'EDITOR' : 'LIVE'"; }
