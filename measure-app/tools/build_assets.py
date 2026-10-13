"""Embed logo PNGs from assets/ into assets.html (Apps Script can't serve static files)."""
import base64, io, json, pathlib
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
SPEC = {"logoWhite": ("logo-white.png", 520), "markWhite": ("mark-white.png", 320), "mark": ("mark.png", 160)}

out = {}
for key, (name, width) in SPEC.items():
    im = Image.open(ROOT / "assets" / name)
    im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, "PNG", optimize=True)
    out[key] = "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()

(ROOT / "assets.html").write_text("<script>window.ASSETS = " + json.dumps(out) + ";</script>\n")
print({k: len(v) // 1024 for k, v in out.items()}, "KB")
