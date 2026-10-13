# -*- coding: utf-8 -*-
"""Проверка: влезает ли карточка модалки в iframe без внутреннего скролла.

    python popup_fit.py <путь к popup.html> [W:H тайла, по умолчанию 782:530]

Меряет headless-Chrome'ом scrollHeight/clientHeight документа модалки в рамках,
пропорциональных заданному тайлу: десктоп + все ширины, до которых Google Sites
ужимает embed на телефонах (390/375/360/320/280 px вьюпорта → ~0.9 ширины).
overflow > 0 хоть на одной строке = на живом сайте будет скролл внутри embed.
"""
import json, os, pathlib, re, subprocess, sys

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
# ширины iframe на живой странице: десктоп + телефоны (Sites даёт ≈ 0.9 ширины вьюпорта)
WIDTHS = [957, 782, 600, 480, 400, 352, 324, 287, 260, 240]


def measure(url: str, w: int, h: int, tmp: pathlib.Path) -> dict | None:
    probe = tmp / "probe.html"
    probe.write_text(
        f'<!DOCTYPE html><meta charset=utf-8><body style="margin:0">'
        f'<iframe id=f src="{url}" style="width:{w}px;height:{h}px;border:0"></iframe>'
        f'<pre id=o></pre><script>f.onload=()=>{{const d=f.contentDocument;'
        f'o.textContent=JSON.stringify({{sh:d.documentElement.scrollHeight,'
        f'ch:d.documentElement.clientHeight,'
        f'card:Math.round((d.querySelector(".card")||{{getBoundingClientRect:()=>({{height:0}})}})'
        f'.getBoundingClientRect().height)}});}};</script>',
        encoding="utf-8")
    r = subprocess.run(
        [CHROME, "--headless", "--disable-gpu", "--hide-scrollbars",
         "--allow-file-access-from-files", "--force-device-scale-factor=1",
         f"--user-data-dir={tmp / 'prof'}", f"--window-size={w + 40},{h + 200}",
         "--virtual-time-budget=3000", "--dump-dom", probe.as_uri()],
        capture_output=True, timeout=90)
    out = r.stdout.decode("utf-8", "replace")     # stdout Chrome — UTF-8, консоль Windows — нет
    m = re.search(r'<pre id="o">(\{.*?\})</pre>', out)
    return json.loads(m.group(1)) if m else None


def main() -> None:
    src = pathlib.Path(sys.argv[1]).resolve()
    tw, th = (int(x) for x in (sys.argv[2] if len(sys.argv) > 2 else "782:530").split(":"))
    tmp = pathlib.Path(os.environ.get("TEMP", "/tmp")) / "popupfit"
    tmp.mkdir(exist_ok=True)
    url = src.as_uri()
    bad = 0
    print(f"tile {tw}x{th} (ratio {th / tw:.3f})   {src.name}")
    print(f"{'iframe':>12} {'scrollH':>8} {'clientH':>8} {'overflow':>9} {'card':>6}")
    for w in WIDTHS:
        h = round(w * th / tw)
        d = measure(url, w, h, tmp)
        if not d:
            print(f"{w}x{h:<6} -- no data"); continue
        ov = d["sh"] - d["ch"]
        bad += ov > 0
        flag = "  <= SCROLL" if ov > 0 else ""
        print(f"{w}x{h:<7} {d['sh']:>8} {d['ch']:>8} {ov:>9} {d['card']:>6}{flag}")
    print(f"FAIL: card overflows in {bad} frame(s)" if bad else "OK: no scroll inside the embed")
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
