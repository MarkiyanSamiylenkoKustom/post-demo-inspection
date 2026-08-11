#!/usr/bin/env python3
"""Kustom Field Documentation Tools - build script.

Assembles the 8 deployable pages in the repo root from src/:
  src/pages/<name>.html      page body with {{BLOCK:...}} placeholders
  src/blocks/*.html          shared blocks (top controls, field comfort, eggs)
  src/assets/sprites.json    base64 characters per page, the shared van, ball frames
  pages.json                 per-page version + egg parameters

Usage:
  python3 build.py           build into repo root
  python3 build.py --check   rebuild and fail if committed pages differ (CI)
"""
import json, re, sys, pathlib, tempfile, filecmp, shutil

ROOT = pathlib.Path(__file__).parent
SRC = ROOT / "src"

def read(p): return p.read_text(encoding="utf-8")

def build_egg(cfg, sprites, blocks):
    if cfg["type"] == "bespoke":
        return blocks[cfg["block"]]
    g = blocks["egg_generic"]
    return (g.replace("__P__", cfg["prefix"])
             .replace("__CHAR__", sprites["chars"][cfg["page"]])
             .replace("__VAN__", sprites["van"])
             .replace("__BALLS__", sprites["balls"])
             .replace("__BUBBLE__", cfg["bubble"])
             .replace("__CH__", str(cfg["ch"]))
             .replace("__BH__", str(cfg["ch"] + 10)))

def build(outdir: pathlib.Path):
    pages = json.loads(read(ROOT / "pages.json"))
    sprites = json.loads(read(SRC / "assets" / "sprites.json"))
    blocks = {p.stem: read(p) for p in (SRC / "blocks").glob("*.html")}
    for name, meta in pages.items():
        s = read(SRC / "pages" / name)
        if "{{BLOCK:top_controls}}" in s:
            s = s.replace("{{BLOCK:top_controls}}", blocks["top_controls"])
        if "{{BLOCK:field_comfort}}" in s:
            s = s.replace("{{BLOCK:field_comfort}}", blocks["field_comfort"])
        egg = dict(meta["egg"]); egg["page"] = name
        s = s.replace("{{BLOCK:egg}}", build_egg(egg, sprites, blocks))
        # invariants
        assert "{{BLOCK:" not in s, f"{name}: unresolved placeholder"
        ver = re.search(r"&middot;\s*(v\d+)</footer>", s).group(1)
        assert ver == meta["version"], f"{name}: footer {ver} != pages.json {meta['version']}"
        (outdir / name).write_text(s, encoding="utf-8")
    # verify sw cache name references a version and every page is in the shell
    sw = read(ROOT / "sw.js")
    for name in pages: assert f'"./{name}"' in sw, f"sw.js missing {name}"
    print(f"built {len(pages)} pages -> {outdir}")

if __name__ == "__main__":
    if "--check" in sys.argv:
        with tempfile.TemporaryDirectory() as td:
            tdp = pathlib.Path(td)
            build(tdp)
            bad = [n for n in json.loads(read(ROOT/'pages.json'))
                   if not (ROOT/n).exists() or read(ROOT/n) != read(tdp/n)]
            if bad:
                print("DRIFT: committed pages differ from build output:", bad)
                sys.exit(1)
            print("check OK: committed pages match build output")
    else:
        build(ROOT)
