#!/usr/bin/env python3
"""Build the public site into docs/ (served by GitHub Pages).

Each topic folder NN-name/ with an index.html becomes docs/NN-name/index.html,
wrapped in a full HTML document. docs/index.html lists all topics.
The topic index.html files stay as they are, so they can still be published
as claude.ai artifacts (which add their own document wrapper).
"""
import html
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "docs"

HEAD = """<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<style>
:root{{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}}
body{{margin:0;font:14px/1.4 system-ui,sans-serif}}
img{{max-width:100%}}
[hidden]{{display:none!important}}
</style>
</head>
<body>
{body}
</body>
</html>
"""

HOME = """<title>Cahier de français</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,800&family=Inter:wght@400;600&display=swap">
<style>
:root{{--paper:#f7f8fc;--card:#fff;--ink:#1b2140;--muted:#5b6386;--line:#e0e5f2;--seyes:#d6def5;--blue:#2846b4;--red:#c8303a}}
@media (prefers-color-scheme:dark){{:root{{--paper:#11131c;--card:#191c28;--ink:#e6e8f3;--muted:#9ba2c2;--line:#2a2f43;--seyes:#222842;--blue:#8fa5ff;--red:#ff7d84;color-scheme:dark}}}}
body{{background:var(--paper);color:var(--ink);font-family:Inter,system-ui,sans-serif;font-size:16px;
  padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px));padding-block:24px 48px}}
.wrap{{max-width:640px;margin:0 auto;display:grid;gap:20px}}
h1{{font-family:"Bricolage Grotesque",system-ui,sans-serif;font-weight:800;font-size:2.2rem;margin:0;letter-spacing:-.02em}}
.sub{{color:var(--muted);margin:0}}
ol{{list-style:none;margin:0;padding:0;border:1px solid var(--line);border-radius:6px;background:var(--card)}}
li{{border-bottom:1px solid var(--line)}} li:last-child{{border-bottom:0}}
a{{display:grid;grid-template-columns:3ch 1fr;gap:12px;padding:14px 16px;color:inherit;text-decoration:none}}
a:hover,a:focus-visible{{background:var(--paper)}}
.n{{color:var(--red);font-weight:600;font-variant-numeric:tabular-nums}}
.t{{font-weight:600}} .s{{display:block;color:var(--muted);font-size:.9rem;font-weight:400}}
</style>
<div class="wrap">
  <h1>Cahier de français</h1>
  <p class="sub">A2–B1 · grammaire et vocabulaire. Choose a topic.</p>
  <ol>
{items}
  </ol>
</div>
"""


def first(pattern, text, default="", flags=re.S):
    m = re.search(pattern, text, flags)
    return m.group(1).strip() if m else default


def main():
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir()
    (OUT / ".nojekyll").write_text("")

    items = []
    for topic in sorted(p for p in ROOT.iterdir() if p.is_dir() and re.match(r"\d\d-", p.name)):
        page = topic / "index.html"
        if not page.exists():
            continue
        src = page.read_text(encoding="utf-8")
        dest = OUT / topic.name
        dest.mkdir()
        (dest / "index.html").write_text(HEAD.format(body=src), encoding="utf-8")

        num = topic.name[:2]
        lecon = topic / "lecon.md"
        heading = first(r"^#\s+(.+)$", lecon.read_text(encoding="utf-8"), flags=re.M) if lecon.exists() else ""
        name = re.sub(r"^\d+\s*·\s*", "", heading) or first(r"<title>(.*?)</title>", src, topic.name)
        example = first(r"<title>(.*?)</title>", src)
        items.append(
            f'    <li><a href="{topic.name}/"><span class="n">{num}</span>'
            f'<span class="t">{html.escape(name)}<span class="s">{html.escape(example)}</span></span></a></li>'
        )
        print(f"  built {topic.name}")

    (OUT / "index.html").write_text(HEAD.format(body=HOME.format(items="\n".join(items))), encoding="utf-8")
    print(f"Site ready in {OUT}")


if __name__ == "__main__":
    main()
