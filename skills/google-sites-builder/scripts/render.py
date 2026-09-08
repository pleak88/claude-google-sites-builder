# -*- coding: utf-8 -*-
"""Подставить параметры в JS-шаблон шага и записать готовый скрипт для playwright-cli run-code.

    python render.py js/t_text.tpl.js out.js BLOCKS='[["h1","..."]]' STYLE=1
    python render.py js/footer.tpl.js out.js FOOTER_TEXT='"© 2026 …"' FOOTER_PAGES='["Privacy"]'

Значения — JSON-литералы. '__K__' в кавычках в шаблоне → сырая строка, голый __K__ → литерал.
__COMMON__ подставляется из js/_common.js автоматически.
"""
import io, json, pathlib, re, sys

HERE = pathlib.Path(__file__).parent
tpl, out, *pairs = sys.argv[1:]
src = io.open(HERE / tpl if not pathlib.Path(tpl).exists() else tpl, encoding="utf-8").read()
src = src.replace("__COMMON__", io.open(HERE / "js" / "_common.js", encoding="utf-8").read())
for kv in pairs:
    k, v = kv.split("=", 1)
    val = json.loads(v)
    def quoted(m, v=val):
        q = m.group(1); return q + str(v).replace("\\", "\\\\").replace(q, "\\" + q) + q
    src = re.sub("([" + chr(39) + chr(34) + "])__" + re.escape(k) + "__" + chr(92) + "1", quoted, src)
    src = src.replace(f"__{k}__", json.dumps(val, ensure_ascii=False))
io.open(out, "w", encoding="utf-8").write(src)
print("rendered", out, "from", tpl)
