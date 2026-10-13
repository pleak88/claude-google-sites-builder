# -*- coding: utf-8 -*-
"""Из content.py делает план сборки для Google Sites: список тайлов на страницу.

Тайл: {"kind":"text","style":1|2|3,"blocks":[[tag,text],...]}
      {"kind":"layout","style":1|2|3,"img":"content-1","h2":"...","ps":["...","..."]}
"""
import io, json, sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).parent)); sys.path.insert(0, str(pathlib.Path.cwd()))
from content import PAGES, SITE  # noqa

STYLE = {"s1": 1, "s2": 2, "s3": 3, "img": "img"}
PATTERN = ["left", "top"]


def plan_page(page):
    tiles, cur, buf = [], 1, []
    lay = None
    nlay = [0]

    def flush_text():
        nonlocal buf
        if buf:
            tiles.append({"kind": "text", "style": cur, "blocks": buf})
            buf = []

    def flush_lay():
        nonlocal lay
        if lay:
            tiles.append({"kind": "layout", "style": cur, "pattern": PATTERN[nlay[0] % len(PATTERN)], **lay})
            nlay[0] += 1
            lay = None

    for kind, text in page["blocks"]:
        if kind == "sec":
            flush_lay(); flush_text(); cur = STYLE[text]; continue
        if kind == "layout":
            flush_lay(); flush_text(); lay = {"img": text, "h2": None, "ps": []}; continue
        if lay is not None:
            if kind == "h2" and lay["h2"] is None:
                lay["h2"] = text; continue
            if kind == "p":
                lay["ps"].append(text); continue
            flush_lay()
        buf.append([kind, text])
    flush_lay(); flush_text()
    return tiles


if __name__ == "__main__":
    out = {}
    for p in PAGES:
        out[p["path"]] = {"title": p["title"], "nav": p["nav"], "tiles": plan_page(p)}
    io.open("plan.json", "w", encoding="utf-8").write(json.dumps(out, ensure_ascii=False, indent=1))
    for path, d in out.items():
        desc = " ".join(
            (f'L{t["style"]}{t["pattern"][0]}' if t["kind"] == "layout" else f'T{t["style"]}({len(t["blocks"])})')
            for t in d["tiles"]
        )
        print(f'{path:24s} {len(d["tiles"])} tiles: {desc}')
