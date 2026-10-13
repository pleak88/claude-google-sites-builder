# -*- coding: utf-8 -*-
"""Подставить параметры в JS-шаблон шага и записать готовый скрипт для playwright-cli run-code.

    python render.py js/t_text.tpl.js out.js BLOCKS='[["h1","..."]]' STYLE=1
    python render.py js/footer.tpl.js out.js FOOTER_TEXT='"© 2026 …"' FOOTER_PAGES='["Privacy"]'

Значения — JSON-литералы. '__K__' в кавычках в шаблоне → сырая строка, голый __K__ → литерал.
__COMMON__ подставляется из js/_common.js автоматически.

Конфиг проекта (вместо sed по 60 скриптам): если в текущем каталоге есть site.json (или задан env SITE=path),
автоматически доступны плейсхолдеры
    __SESSION__ __PROFILE__ __SITEID__ __ADDRESS__ __URL__ __NAME__   — верхние ключи site.json
    __PAGE_<key>__                                                     — site.json["pages"][key] (id страницы)
    __C_<name>__                                                       — site.json["colors"][name] (hex)
    __S_<name>__                                                       — site.json["strings"][name] (любая строка)
Явные пары K=V в аргументах имеют приоритет над конфигом.
"""
import io, json, os, pathlib, re, sys

HERE = pathlib.Path(__file__).parent
tpl, out, *pairs = sys.argv[1:]
src = io.open(HERE / tpl if not pathlib.Path(tpl).exists() else tpl, encoding="utf-8").read()
src = src.replace("__COMMON__", io.open(HERE / "js" / "_common.js", encoding="utf-8").read())


def subst(src, k, val):
    def quoted(m, v=val):
        q = m.group(1); return q + str(v).replace("\\", "\\\\").replace(q, "\\" + q) + q
    src = re.sub("([" + chr(39) + chr(34) + "])__" + re.escape(k) + "__" + chr(92) + "1", quoted, src)
    return src.replace(f"__{k}__", json.dumps(val, ensure_ascii=False))


explicit = {}
for kv in pairs:
    k, v = kv.split("=", 1)
    explicit[k] = json.loads(v)

for k, v in explicit.items():
    src = subst(src, k, v)
cfg_path = pathlib.Path(os.environ.get("SITE", "site.json"))
if cfg_path.exists():
    cfg = json.load(io.open(cfg_path, encoding="utf-8"))
    auto = {}
    for k in ("session", "profile", "siteId", "address", "url", "name"):
        if k in cfg: auto[k.upper() if k != "siteId" else "SITEID"] = cfg[k]
    for k, v in (cfg.get("pages") or {}).items(): auto["PAGE_" + k.replace("-", "_")] = v
    for k, v in (cfg.get("colors") or {}).items(): auto["C_" + k] = v
    for k, v in (cfg.get("strings") or {}).items(): auto["S_" + k] = v
    for k, v in auto.items():
        if k not in explicit and f"__{k}__" in src: src = subst(src, k, v)

io.open(out, "w", encoding="utf-8").write(src)
left = sorted(set(re.findall(r"__([A-Z][A-Z0-9_]+)__", src)))
print("rendered", out, "from", tpl, ("UNFILLED: " + ",".join(left)) if left else "")
