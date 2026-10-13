# -*- coding: utf-8 -*-
"""mktile.py <page> <tileIdx> [a|b] [SEC] [join]  → пишет <проект>/_tile.js для тайла из <проект>/_src/plan.json.
Запускать из папки проекта (там site.json). Шаблоны берутся из скилла (scripts/js):
   text     → t_text.tpl.js (BLOCKS, STYLE) — новая секция
   textjoin → t_textjoin.tpl.js (BLOCKS, SEC) — текст в ТУ ЖЕ секцию SEC (режим sections=one или JOIN)
   image    → t_simg_a.tpl.js (SEC) — картинка (нативный чузер → playwright-cli upload)
   layout   → 'a': t_lay_a/t_img_a (вставить + открыть чузер); 'b': t_lay_b/t_img_b (H2, PS, STYLE)
   acc      → t_acc.tpl.js (ITEMS, STYLE)
Печатает: kind|style|img|… (для шага upload).
Маркеры site.json["markers"] (регэкспы текстов плашки 18+ / ©) исключают такие секции из «последней контентной»."""
import io, json, os, subprocess, sys, pathlib
S = pathlib.Path(__file__).parent
V = pathlib.Path(os.environ.get("SITE", "site.json")).resolve().parent
cfg = json.load(io.open(V / "site.json", encoding="utf-8")) if (V / "site.json").exists() else {}
plan = json.load(io.open(V / "_src" / "plan.json", encoding="utf-8"))
page, idx = sys.argv[1], int(sys.argv[2])
phase = sys.argv[3] if len(sys.argv) > 3 else "a"
SEC = sys.argv[4] if len(sys.argv) > 4 else "0"
force_join = len(sys.argv) > 5 and sys.argv[5] == "join"
t = plan[page]["tiles"][idx]
st = 1 if t["style"] in ("img", "photo") else 3 if t["style"] == "plq" else t["style"]
out = str(V / "_tile.js")
join = t.get("join") or force_join


def render(tpl, *pairs):
    subprocess.run([sys.executable, str(S / "render.py"), tpl, out, *pairs], check=True, capture_output=True, cwd=str(V))


if t["kind"] == "text" and join:
    render("js/t_textjoin.tpl.js", "BLOCKS=" + json.dumps(t["blocks"], ensure_ascii=True), f"SEC={SEC}")
    print(f"textjoin|{t['style']}|-|{len(t['blocks'])} blocks")
elif t["kind"] == "text":
    render("js/t_text.tpl.js", "BLOCKS=" + json.dumps(t["blocks"], ensure_ascii=True), f"STYLE={st}")
    print(f"text|{t['style']}|-|{len(t['blocks'])} blocks")
elif t["kind"] == "image":
    render("js/t_simg_a.tpl.js", f"SEC={SEC}")
    print(f"image|{t['style']}|{t['img']}")
elif t["kind"] == "acc":
    render("js/t_acc.tpl.js", "ITEMS=" + json.dumps(t["items"], ensure_ascii=False), f"STYLE={st}")
    print(f"text|{t['style']}|-|acc {len(t['items'])} items")
elif phase == "a":
    render("js/t_img_a.tpl.js" if t.get("pattern") == "top" else "js/t_lay_a.tpl.js")
    print(f"layout-a|{t['style']}|{t['img']}")
else:
    render("js/t_img_b.tpl.js" if t.get("pattern") == "top" else "js/t_lay_b.tpl.js",
           "H2=" + json.dumps(t["h2"], ensure_ascii=False), "PS=" + json.dumps(t["ps"], ensure_ascii=False), f"STYLE={st}")
    print(f"layout-b|{t['style']}|{t['img']}")

# секции плашки 18+ / © не считать «последней контентной» (иначе новые тайлы встают после них)
markers = cfg.get("markers") or []
if markers:
    rx = "|".join(markers)
    s = io.open(out, encoding="utf-8").read()
    s = s.replace("!/footer/i.test(s[i].getAttribute('aria-label')||'')",
                  "!/footer/i.test(s[i].getAttribute('aria-label')||'') && !/" + rx + "/.test(s[i].innerText||'')")
    s = s.replace("const last=s[s.length-1];",
                  "const last=s.filter(x=>!/footer/i.test(x.getAttribute('aria-label')||'') && !/" + rx + "/.test(x.innerText||'')).pop();")
    io.open(out, "w", encoding="utf-8").write(s)
