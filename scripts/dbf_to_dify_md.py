#!/usr/bin/env python3
"""Convert Chinese customs HS-code DBF tables into Markdown for Dify KB.

Reads cmcode.DBF (rates / validity) + stdcm.dbf/.FPT (full memo names),
keeps currently valid rows (END_DATE year >= 2099), and writes one MD per
HS chapter plus a combined file.

Usage:
  .venv-dbf/bin/python scripts/dbf_to_dify_md.py [/path/to/dbf-folder]
"""
from __future__ import annotations

import re
import sys
from collections import defaultdict
from datetime import date
from pathlib import Path

from dbfread import DBF

_SCRIPTS = Path(__file__).resolve().parent
if str(_SCRIPTS) not in sys.path:
    sys.path.insert(0, str(_SCRIPTS))
from hs_special_goods_flag import special_goods_flag_keyword, special_goods_flag_line

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "data" / "dify-hs-codes"
CURRENT_END_YEAR = 2099

DEFAULT_CANDIDATES = [
    Path.home() / "Desktop" / "出口退税率文库CMCODE2026B",
    Path("/Users/cheryl/Downloads/f1fbd423b0f749dc8b6019496bbc621b"),
    Path("/Users/cheryl/Downloads/f1fbd423b0f749dc8b6019496bbc621b-1"),
    Path("/Users/cheryl/Downloads/34ad0f0b7c4c460bb2a3bd137b4440ea"),
]


def find_source(explicit: Path | None = None) -> Path:
    if explicit:
        if not explicit.exists():
            raise SystemExit(f"Source folder not found: {explicit}")
        return explicit
    for p in DEFAULT_CANDIDATES:
        if (p / "cmcode.DBF").exists() and (
            (p / "stdcm.dbf").exists() or (p / "stdcm.DBF").exists()
        ):
            return p
    raise SystemExit("No DBF source folder found. Pass the folder path as argv[1].")


def open_dbf(path: Path, ignore_memo: bool = False) -> DBF:
    return DBF(
        str(path),
        encoding="gbk",
        char_decode_errors="replace",
        load=True,
        ignore_missing_memofile=ignore_memo,
    )


def clean(s) -> str:
    if s is None:
        return ""
    if isinstance(s, date):
        return s.isoformat()
    return str(s).replace("\x00", "").strip()


def fmt_pct(v) -> str:
    if v in (None, "", 0, 0.0):
        return "0%"
    s = clean(v)
    if not s:
        return "0%"
    try:
        f = float(s)
        if f == int(f):
            return f"{int(f)}%"
        return f"{f}%"
    except ValueError:
        return f"{s}%" if not s.endswith("%") else s


def parse_export_rebate(note: str) -> str | None:
    """Parse NOTE like '退13;' / '退9;13;' / '退0;' → display string.

    Returns None when NOTE has no explicit 「退x」 (do not default to 0%).
    """
    rates = re.findall(r"退\s*([0-9]+(?:\.[0-9]+)?)", clean(note))
    if not rates:
        return None
    parts = []
    seen = set()
    for r in rates:
        try:
            f = float(r)
            p = f"{int(f)}%" if f == int(f) else f"{f}%"
        except ValueError:
            p = f"{r}%"
        if p not in seen:
            seen.add(p)
            parts.append(p)
    return " / ".join(parts)


def fmt_vat(zssl) -> str:
    raw = clean(zssl)
    if not raw:
        return "0%"
    if "," in raw:
        return " / ".join(fmt_pct(x) for x in raw.split(","))
    return fmt_pct(raw)


def record_md(code: str, name: str, unit: str, dwcode: str, cm: dict) -> str:
    vat = fmt_vat(cm.get("ZSSL_SET"))
    rebate = parse_export_rebate(cm.get("NOTE") or "")
    rebate_display = rebate if rebate is not None else "未收录"
    tsl = fmt_pct(cm.get("TSL")) if cm.get("TSL") not in (None, "", 0, 0.0) else "0%"

    lines = [
        f"## 商品编码 {code}",
        "",
        f"- **商品名称**：{name}",
        f"- **商品编码**：{code}",
    ]
    if unit:
        lines.append(f"- **计量单位**：{unit}")
    if dwcode:
        lines.append(f"- **单位代码**：{dwcode}")

    lines.append(f"- **增值税税率**：{vat}")
    lines.append(f"- **出口退税率**：{rebate_display}")
    lines.append(f"- **暂定税率**：{tsl}")
    flag_line = special_goods_flag_line(cm)
    if flag_line:
        lines.append(flag_line)
    if rebate is None:
        lines.append(
            "- **说明**：NOTE 无「退x」，出口退税率未收录（禁止默认 0%）；"
            "增值税≠出口退税；请以税局出口退税率文库终核。"
        )
    else:
        lines.append(
            "- **说明**：增值税税率与出口退税率不同；查询出口退税时只看「出口退税率」。"
            "退税率0时必须同时看「特殊商品标识」：1=视同内销征税，2=出口免税、进项转出。"
        )

    clde = cm.get("CLDE")
    cjdl = cm.get("CJDL")
    if clde not in (None, "", 0, 0.0):
        lines.append(f"- **从量定额**：{clde}")
    if cjdl not in (None, "", 0, 0.0):
        lines.append(f"- **从价税率相关**：{cjdl}")

    for key, label in [
        ("BCFLAG", "监管条件标志"),
        ("SPLB", "商品类别"),
        ("SZ", "税则标志"),
        ("ZHCMCODE", "组合商品编码"),
        ("NOTE", "备注原文"),
    ]:
        val = clean(cm.get(key))
        if val and val not in ("False", "True"):
            lines.append(f"- **{label}**：{val}")

    st = clean(cm.get("ST_DATE"))
    en = clean(cm.get("END_DATE"))
    if st or en:
        lines.append(f"- **有效期**：{st} ~ {en}")

    kw_flag = special_goods_flag_keyword(cm)
    lines.append("")
    lines.append(
        f"关键词：海关编码 {code} HS {code} 出口退税率 {rebate_display} 增值税 {vat} {name} {kw_flag}".rstrip()
    )
    lines.append("")
    return "\n".join(lines)


def main() -> None:
    explicit = Path(sys.argv[1]).expanduser() if len(sys.argv) > 1 else None
    src = find_source(explicit)
    print(f"Source: {src}")

    cm_path = src / "cmcode.DBF"
    std_path = src / "stdcm.dbf"
    if not std_path.exists():
        std_path = src / "stdcm.DBF"

    std_table = open_dbf(std_path)
    std_map = {}
    for r in std_table:
        code = clean(r.get("CODE"))
        if not code:
            continue
        std_map[code] = {
            "NAME": clean(r.get("NAME")),
            "UNIT": clean(r.get("UNIT")),
            "DWCODE": clean(r.get("DWCODE")),
        }

    cm_table = open_dbf(cm_path, ignore_memo=True)
    current = []
    for r in cm_table:
        end = r.get("END_DATE")
        if not end or getattr(end, "year", 0) < CURRENT_END_YEAR:
            continue
        current.append(dict(r))

    by_chapter: dict[str, list] = defaultdict(list)
    for r in current:
        code = clean(r.get("CODE"))
        if not code:
            continue
        by_chapter[code[:2].zfill(2)].append(r)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for old in OUT_DIR.glob("*.md"):
        old.unlink()

    index_lines = [
        "# 中国海关商品编码知识库（现行有效）",
        "",
        f"数据来源：`{src.name}` 中的 `cmcode.DBF` + `stdcm`（含 memo 全称）。",
        "",
        f"现行有效编码数量：**{len(current)}**（END_DATE ≥ {CURRENT_END_YEAR}）。",
        "",
        "本知识库按 HS 章（商品编码前两位）拆分，便于上传到 Dify 知识库做检索增强。",
        "",
        "## 章节索引",
        "",
    ]

    total_files = 0
    for chapter in sorted(by_chapter.keys()):
        rows = sorted(by_chapter[chapter], key=lambda x: clean(x.get("CODE")))
        body = [
            f"# 第{chapter}章 海关商品编码",
            "",
            f"本章共 {len(rows)} 条现行有效商品编码。",
            "",
            "可用于查询：商品编码、HS Code、品名、计量单位、增值税税率、监管条件等。",
            "",
        ]
        for r in rows:
            code = clean(r.get("CODE"))
            std = std_map.get(code, {})
            name = std.get("NAME") or clean(r.get("NAME"))
            unit = std.get("UNIT") or clean(r.get("UNIT"))
            dwcode = std.get("DWCODE") or clean(r.get("DWCODE"))
            body.append(record_md(code, name, unit, dwcode, r))

        (OUT_DIR / f"hs-chapter-{chapter}.md").write_text(
            "\n".join(body), encoding="utf-8"
        )
        total_files += 1
        index_lines.append(
            f"- [第{chapter}章](./hs-chapter-{chapter}.md)（{len(rows)} 条）"
        )

    (OUT_DIR / "README.md").write_text("\n".join(index_lines) + "\n", encoding="utf-8")

    all_parts = [
        "# 中国海关商品编码（现行有效·合集）",
        "",
        f"共 {len(current)} 条。",
        "",
    ]
    for chapter in sorted(by_chapter.keys()):
        rows = sorted(by_chapter[chapter], key=lambda x: clean(x.get("CODE")))
        all_parts.append(f"# 第{chapter}章")
        all_parts.append("")
        for r in rows:
            code = clean(r.get("CODE"))
            std = std_map.get(code, {})
            name = std.get("NAME") or clean(r.get("NAME"))
            unit = std.get("UNIT") or clean(r.get("UNIT"))
            dwcode = std.get("DWCODE") or clean(r.get("DWCODE"))
            all_parts.append(record_md(code, name, unit, dwcode, r))

    combined = OUT_DIR / "hs-codes-all.md"
    combined.write_text("\n".join(all_parts), encoding="utf-8")

    print(f"Wrote {total_files} chapter files + README + hs-codes-all.md -> {OUT_DIR}")
    print(f"Combined size: {combined.stat().st_size / 1024:.1f} KB")


if __name__ == "__main__":
    main()
