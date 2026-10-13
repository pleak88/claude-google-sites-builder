# -*- coding: utf-8 -*-
"""Veo mp4 → плавный анимированный GIF-фон Cover-хедера Google Sites (проверено 01.10.2026, marantellibet-knowledge).
    python mkgif.py <in.mp4> <out.gif> [fps=12]
env: GW/GH размер (1024×576), GT длина петли, с (7), GC цветов (48), GD дизеринг (dither=none),
     GK множитель яркости (1 = без затемнения), GV виньетка 0..1 (0).
Петля: последняя секунда растворяется в первую (PIL; xfade в ffmpeg-win64-7.1 падает с -22).
Временные кадры — в папке рядом с out (<out>_frames/_loop) → параллельные прогоны с разными out не мешают.
Постер первого кадра = <out без .gif>.poster.jpg (НЕ cover.jpg — раньше затирал статичную обложку)."""
import subprocess, sys, pathlib, shutil
from PIL import Image, ImageStat
import imageio_ffmpeg

FF = imageio_ffmpeg.get_ffmpeg_exe()
src = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "video/cover.mp4")
out = pathlib.Path(sys.argv[2] if len(sys.argv) > 2 else "img/cover.gif")
fps = int(sys.argv[3]) if len(sys.argv) > 3 else 12
W, H = int(__import__("os").environ.get("GW","1024")), int(__import__("os").environ.get("GH","576"))
fr = out.parent / (out.stem + "_frames"); shutil.rmtree(fr, ignore_errors=True); fr.mkdir()

# 1. кадры, базовый тёмный тон (eq)
subprocess.run([FF, "-y", "-i", str(src)] + ["-t", __import__("os").environ.get("GT", "7")] + ["-vf",
                f"fps={fps},scale={W}:{H}:flags=lanczos,eq=brightness=-0.30:contrast=1.08:saturation=0.95",
                str(fr / "f%03d.png")], check=True, capture_output=True)
frames = sorted(fr.glob("f*.png"))
n = len(frames); X = fps                      # X кадров = 1 секунда кроссфейда
head = [Image.open(f).convert("RGB") for f in frames[:X]]
main = [Image.open(f).convert("RGB") for f in frames[X:]]
# 2. последние X кадров main растворяются в head → петля замыкается на main[0]
for i in range(X):
    a = (i + 1) / (X + 1)
    main[len(main) - X + i] = Image.blend(main[len(main) - X + i], head[i], a)
lp = out.parent / (out.stem + "_loop"); shutil.rmtree(lp, ignore_errors=True); lp.mkdir()
_os = __import__("os"); _K = float(_os.environ.get("GK", "1")); _V = float(_os.environ.get("GV", "0"))
_mask = None
if _K != 1 or _V:
    # затемнение поверх кадра: общий множитель GK + радиальная виньетка GV (0..1, доля затемнения у краёв)
    from PIL import ImageDraw, ImageFilter, ImageChops
    w0, h0 = main[0].size
    _mask = Image.new("L", (w0, h0), int(255 * _K * (1 - _V)))
    ImageDraw.Draw(_mask).ellipse((-w0 * .1, -h0 * .05, w0 * 1.1, h0 * 1.05), fill=int(255 * _K))
    _mask = _mask.filter(ImageFilter.GaussianBlur(w0 // 6))
for i, im in enumerate(main):
    if _mask is not None:
        im = ImageChops.multiply(im, Image.merge("RGB", (_mask, _mask, _mask)))
    im.save(lp / f"l{i:03d}.png")
# 3. GIF с общей палитрой
subprocess.run([FF, "-y", "-framerate", str(fps), "-i", str(lp / "l%03d.png"), "-filter_complex",
                "[0:v]split[s0][s1];[s0]palettegen=max_colors=" + __import__("os").environ.get("GC","48") + ":stats_mode=diff[p];"
                "[s1][p]paletteuse=" + __import__("os").environ.get("GD","dither=none") + ":diff_mode=rectangle",
                "-loop", "0", str(out)], check=True, capture_output=True)
shutil.rmtree(fr); shutil.rmtree(lp)
g = Image.open(out)
g.seek(0); g.convert("RGB").save(out.with_suffix(".poster.jpg"), quality=88)   # постер = первый кадр
print(out, g.size, "frames", g.n_frames, f"{out.stat().st_size/1e6:.1f} MB",
      "brightness", round(ImageStat.Stat(g.convert("L")).mean[0], 1))
