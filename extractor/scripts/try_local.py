#!/usr/bin/env python3
"""
Roda o roteador num arquivo local e despeja o resultado numa pasta.

Sem Supabase, sem Edge Function, sem túnel: é a forma mais rápida de conferir se
a extração aproveita as figuras do SEU material.

    python scripts/try_local.py ~/material/anatomia.pdf
    python scripts/try_local.py aula.pptx --out /tmp/saida

Sai: bundle.json, as figuras aprovadas em img/ e as descartadas (com o motivo no
nome) em rejeitadas/ — dá para olhar o que o filtro cortou e calibrar.
"""

from __future__ import annotations

import argparse
import json
import mimetypes
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from extractors import Options, UnsupportedFormat, extract  # noqa: E402


def main() -> int:
    parser = argparse.ArgumentParser(description="Extrai um arquivo local.")
    parser.add_argument("arquivo", type=Path)
    parser.add_argument("--out", type=Path, default=None, help="pasta de saída")
    parser.add_argument(
        "--render-scanned",
        action="store_true",
        help="renderiza as páginas de PDF digitalizado (custa tempo e espaço)",
    )
    args = parser.parse_args()

    source: Path = args.arquivo.expanduser()
    if not source.is_file():
        print(f"não achei o arquivo: {source}", file=sys.stderr)
        return 1

    out: Path = (args.out or Path("saida") / source.stem).expanduser()
    mime = mimetypes.guess_type(source.name)[0] or ""

    try:
        bundle = extract(
            source.read_bytes(),
            mime,
            source.name,
            Options(render_scanned_pages=args.render_scanned),
        )
    except UnsupportedFormat as e:
        print(f"✗ {e}", file=sys.stderr)
        return 2

    payload = bundle.to_json()
    stats = payload["stats"]

    (out / "img").mkdir(parents=True, exist_ok=True)
    (out / "rejeitadas").mkdir(parents=True, exist_ok=True)
    (out / "bundle.json").write_text(
        json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    for image in bundle.images:
        if image.candidate:
            target = out / "img" / f"{image.id:04d}_p{image.page}.jpg"
        else:
            reason = re.sub(r"[^a-z0-9]+", "-", (image.reject_reason or "").lower())
            target = out / "rejeitadas" / f"{image.id:04d}_p{image.page}_{reason}.jpg"
        target.write_bytes(image.data)

    print(f"\n  {source.name}  →  {bundle.source['type'].upper()}")
    print(f"  páginas/slides : {stats['pages']}")
    print(f"  texto          : {stats['chars']} caracteres")
    print(f"  figuras        : {stats['images_kept']} aprovadas de {stats['images_found']}")
    if bundle.warnings:
        print("\n  avisos:")
        for w in bundle.warnings:
            print(f"    ! [{w['code']}] {w['message']}")
    print(f"\n  saída: {out.resolve()}\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
