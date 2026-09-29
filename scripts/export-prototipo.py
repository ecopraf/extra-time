import re
import urllib.request

base = "http://localhost:12000"
html = urllib.request.urlopen(base + "/prototipo").read().decode("utf-8")
hrefs = re.findall(r'<link rel="stylesheet" href="([^"]+)"', html)
css = "".join(urllib.request.urlopen(base + h).read().decode("utf-8") for h in hrefs)
html = re.sub(r'<link rel="stylesheet" href="[^"]+"[^>]*/?>', "", html)
html = re.sub(r'<link rel="preload"[^>]*/?>', "", html)
html = re.sub(r'<script[^>]*>.*?</script>', "", html, flags=re.S)
html = re.sub(r'<script[^>]*/?>', "", html)
html = re.sub(r'</body>', "<style>\n" + css + "\n</style>\n</body>", html, count=1)

for out in (
    "docs/riferimenti/collaboratori/prototipo-stile-extratime.html",
    "apps/web/public/brand/prototipo-stile-extratime.html",
):
    with open(out, "w", encoding="utf-8") as f:
        f.write(html)

print("aggiornato:", len(html), "byte")
