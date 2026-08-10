#!/usr/bin/env python3
"""Generate a FULL export-rebate Markdown KB from CMCODE2026B (all current HS codes).

CMCODE NOTE only marks a minority of codes with explicit「退x」. To cover nearly all
codes for Dify retrieval, resolve rates as:

  1) NOTE has「退x」(incl. 退0) → use that (文库明确)
  2) else HS chapter in known zero-rebate chapters → 0% (章目/政策口径)
  3) else ZSSL_SET (VAT) present → same as VAT (征退一致推断)
  4) else chapter default from map if any
  5) else skip (未收录)

Usage:
  .venv-dbf/bin/python scripts/dbf_to_dify_full_rebate_kb.py [/path/to/CMCODE2026B]
"""
from __future__ import annotations

import re
import shutil
import sys
from datetime import date
from pathlib import Path

from dbfread import DBF

ROOT = Path(__file__).resolve().parents[1]
CURRENT_END_YEAR = 2099
RECORDS_PER_FILE = 80
FILES_PER_BATCH = 5

OUT_REBATE = ROOT / "data" / "dify-hs-rebate"
DESKTOP_REBATE = Path.home() / "Desktop" / "DIFY知识库" / "海关编码-出口退税率"

DEFAULT_CANDIDATES = [
    Path.home() / "Desktop" / "出口退税率文库CMCODE2026B",
    Path("/Users/cheryl/Downloads/f1fbd423b0f749dc8b6019496bbc621b"),
]

# Chapters where empty NOTE should NOT fall back to VAT (征退一致会错）
ZERO_REBATE_CHAPTERS = {
    "05",
    "07",
    "08",
    "09",
    "10",
    "11",
    "12",
    "13",
    "14",
    "15",
    "23",
    "25",
    "26",
    "27",
    "31",
    "41",
    "43",
    "44",
    "45",
    "47",
    "71",  # 贵金属首饰等多数 0%
    "72",  # 钢铁等
    "74",
    "75",
    "76",  # 铝材等，2024年第15号起取消退税
    "78",
    "79",
    "80",
    "81",
    "93",
    "97",
}

# Fallback when NOTE empty、非零章、且无 ZSSL
CHAPTER_DEFAULT = {
    "01": "9%",
    "02": "9%",
    "03": "9%",
    "04": "9%",
    "06": "9%",
    "16": "13%",
    "17": "13%",
    "18": "13%",
    "19": "13%",
    "20": "13%",
    "21": "13%",
    "22": "13%",
    "24": "13%",
    "28": "13%",
    "29": "13%",
    "30": "13%",
    "32": "13%",
    "33": "13%",
    "34": "13%",
    "35": "13%",
    "36": "13%",
    "37": "13%",
    "38": "13%",
    "39": "13%",
    "40": "13%",
    "42": "13%",
    "46": "13%",
    "48": "13%",
    "49": "13%",
    "50": "13%",
    "51": "13%",
    "52": "13%",
    "53": "13%",
    "54": "13%",
    "55": "13%",
    "56": "13%",
    "57": "13%",
    "58": "13%",
    "59": "13%",
    "60": "13%",
    "61": "13%",
    "62": "13%",
    "63": "13%",
    "64": "13%",
    "65": "13%",
    "66": "13%",
    "67": "13%",
    "68": "13%",
    "69": "13%",
    "70": "13%",
    "73": "13%",
    "82": "13%",
    "83": "13%",
    "84": "13%",
    "85": "13%",
    "86": "13%",
    "87": "13%",
    "88": "13%",
    "89": "13%",
    "90": "13%",
    "91": "13%",
    "92": "13%",
    "94": "13%",
    "95": "13%",
    "96": "13%",
}


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
    raise SystemExit("No CMCODE folder found. Pass path as argv[1].")


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
        return f"{int(f)}%" if f == int(f) else f"{f}%"
    except ValueError:
        return f"{s}%" if not s.endswith("%") else s


def parse_note_rebate(note: str) -> str | None:
    rates = re.findall(r"退\s*([0-9]+(?:\.[0-9]+)?)", clean(note))
    if not rates:
        return None
    parts: list[str] = []
    seen: set[str] = set()
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


def parse_zssl(zssl) -> str | None:
    raw = clean(zssl)
    if not raw:
        return None
    # "13,9" → take first as primary answer rate
    first = raw.split(",")[0].strip()
    if not first:
        return None
    return fmt_pct(first)


def resolve_rebate(code: str, note: str, zssl) -> tuple[str, str] | None:
    """Return (rate_display, source_label) or None if unknown."""
    note_rate = parse_note_rebate(note)
    if note_rate is not None:
        return note_rate, "文库NOTE明确"

    chapter = code[:2]
    if chapter in ZERO_REBATE_CHAPTERS:
        return "0%", "章目/政策口径（NOTE无退x）"

    z = parse_zssl(zssl)
    if z is not None:
        return z, "征退一致推断（NOTE无退x，按增值税税率）"

    ch = CHAPTER_DEFAULT.get(chapter)
    if ch:
        return ch, "章目默认（NOTE无退x且无ZSSL）"

    return None


def build_aliases(name: str) -> list[str]:
    aliases: list[str] = []
    if "镶嵌钻石的银首饰" in name:
        aliases.extend(["镶钻银饰", "钻石银饰", "镶嵌钻石银饰"])
    if "镶嵌钻石的黄金制首饰" in name or "镶嵌钻石的黄金" in name:
        aliases.extend(["镶钻金饰", "钻石金饰", "镶嵌钻石金饰"])
    if "智能手机" in name:
        aliases.append("手机")
    seen: set[str] = set()
    out: list[str] = []
    for a in aliases:
        if a not in seen:
            seen.add(a)
            out.append(a)
    return out


def rebate_record(code: str, name: str, unit: str, dwcode: str, cm: dict) -> str | None:
    resolved = resolve_rebate(code, cm.get("NOTE") or "", cm.get("ZSSL_SET"))
    if resolved is None:
        return None
    rebate, source = resolved
    aliases = build_aliases(name)
    alias_part = f"、{'、'.join(aliases)}" if aliases else ""

    lines = [
        f"## 商品编码 {code}",
        "",
        f"**出口退税率问答**：问：{code}、{name}{alias_part} 的出口退税率是多少？答：{rebate}。",
        "",
        f"- **出口退税率**：{rebate}",
        f"- **出口退税率（仅此字段作答）**：{rebate}",
        f"- **退税率来源**：{source}",
        f"- **商品名称**：{name}",
    ]
    if aliases:
        lines.append(f"- **常用别名**：{'、'.join(aliases)}")
    lines.append(f"- **商品编码**：{code}")
    if unit:
        lines.append(f"- **计量单位**：{unit}")
    if dwcode:
        lines.append(f"- **单位代码**：{dwcode}")

    for key, label in [
        ("BCFLAG", "监管条件标志"),
        ("TSFLAG", "特殊标志"),
        ("SPLB", "商品类别"),
        ("SZ", "税则标志"),
    ]:
        val = clean(cm.get(key))
        if val and val not in ("False", "True"):
            lines.append(f"- **{label}**：{val}")

    st, en = clean(cm.get("ST_DATE")), clean(cm.get("END_DATE"))
    if st or en:
        lines.append(f"- **有效期**：{st} ~ {en}")

    note = clean(cm.get("NOTE"))
    if note:
        lines.append(f"- **NOTE原文**：{note}")

    lines.append("")
    lines.append(
        f"**关键词**：出口退税率{rebate} 海关编码{code} HS{code} {name} {' '.join(aliases)}".rstrip()
    )
    lines.append("")
    lines.append("---")
    lines.append("")
    return "\n".join(lines)


def write_files(records: list[dict], std_map: dict[str, dict]) -> tuple[int, int]:
    files: list[tuple[str, str]] = []
    for i in range(0, len(records), RECORDS_PER_FILE):
        chunk = records[i : i + RECORDS_PER_FILE]
        start_code = clean(chunk[0]["CODE"])
        end_code = clean(chunk[-1]["CODE"])
        idx = i // RECORDS_PER_FILE + 1
        name = f"hs_{idx:03d}_{start_code}_{end_code}.md"
        parts = [
            f"# 中国出口退税率文库（CMCODE全量·现行有效）第 {idx} 批",
            "",
            f"- **编码范围**：{start_code} ~ {end_code}",
            f"- **本文件条数**：{len(chunk)}",
            "- **说明**：含现行有效税号出口退税率；优先NOTE「退x」，否则按章目0%或征退一致推断。",
            "",
            "---",
            "",
        ]
        body: list[str] = []
        for r in chunk:
            code = clean(r.get("CODE"))
            std = std_map.get(code, {})
            block = rebate_record(
                code,
                std.get("NAME") or clean(r.get("NAME")),
                std.get("UNIT") or clean(r.get("UNIT")),
                std.get("DWCODE") or clean(r.get("DWCODE")),
                r,
            )
            if block:
                body.append(block)
        if not body:
            continue
        parts[3] = f"- **本文件条数**：{len(body)}"
        files.append((name, "\n".join(parts + body)))

    for root in (OUT_REBATE, DESKTOP_REBATE):
        if root.exists():
            shutil.rmtree(root)
        root.mkdir(parents=True)

    guide = """# 如何上传到 Dify（全量出口退税率知识库）

1. 知识库：`海关编码和出口退税率`
2. 每次最多 5 个 `.md`（一个 batch 文件夹）
3. 分段标识符：`---`
4. 分段最大长度建议 1200，重叠 1

## 税率判定规则（生成时）

1. NOTE 含「退x」（含退0）→ 用该税率（文库明确）
2. 否则若税号章属于常见零退税章（如 71/72/74/75/76 等）→ 0%
3. 否则若有增值税税率 ZSSL → 按征退一致采用该税率
4. 否则用章目默认；仍无则不收录

推断条目请以税局申报系统终核为准。
"""
    batch_count = 0
    for b in range(0, len(files), FILES_PER_BATCH):
        batch_count += 1
        batch_files = files[b : b + FILES_PER_BATCH]
        for root in (OUT_REBATE, DESKTOP_REBATE):
            batch_dir = root / f"batch-{batch_count:02d}"
            batch_dir.mkdir(parents=True, exist_ok=True)
            for fname, text in batch_files:
                (batch_dir / fname).write_text(text, encoding="utf-8")
            (root / "README上传说明.md").write_text(guide, encoding="utf-8")

    return len(files), batch_count


def main() -> None:
    explicit = Path(sys.argv[1]).expanduser() if len(sys.argv) > 1 else None
    src = find_source(explicit)
    print(f"Source: {src}")

    std_path = src / "stdcm.dbf"
    if not std_path.exists():
        std_path = src / "stdcm.DBF"

    std_map: dict[str, dict] = {}
    for r in open_dbf(std_path):
        code = clean(r.get("CODE"))
        if re.fullmatch(r"\d{4,12}", code):
            std_map[code] = {
                "NAME": clean(r.get("NAME")),
                "UNIT": clean(r.get("UNIT")),
                "DWCODE": clean(r.get("DWCODE")),
            }

    current: list[dict] = []
    for r in open_dbf(src / "cmcode.DBF", ignore_memo=True):
        end = r.get("END_DATE")
        if not end or getattr(end, "year", 0) < CURRENT_END_YEAR:
            continue
        code = clean(r.get("CODE"))
        if not re.fullmatch(r"\d{4,12}", code):
            continue
        current.append(dict(r))
    current.sort(key=lambda x: clean(x.get("CODE")))

    kept: list[dict] = []
    src_counts = {"文库NOTE明确": 0, "章目/政策口径（NOTE无退x）": 0, "征退一致推断（NOTE无退x，按增值税税率）": 0, "章目默认（NOTE无退x且无ZSSL）": 0}
    for r in current:
        code = clean(r.get("CODE"))
        resolved = resolve_rebate(code, r.get("NOTE") or "", r.get("ZSSL_SET"))
        if resolved is None:
            continue
        kept.append(r)
        src_counts[resolved[1]] = src_counts.get(resolved[1], 0) + 1

    print(f"current codes: {len(current)} | with rate: {len(kept)} | skipped: {len(current) - len(kept)}")
    for k, v in src_counts.items():
        print(f"  {k}: {v}")

    for code in ("85171300", "76101000", "76081000", "71131110", "0210990090"):
        sample = next((r for r in current if clean(r.get("CODE")) == code), None)
        if not sample:
            print(f"sample {code}: MISSING")
            continue
        print(f"sample {code}: {resolve_rebate(code, sample.get('NOTE') or '', sample.get('ZSSL_SET'))}")

    n, b = write_files(kept, std_map)
    print(f"Wrote {n} files / {b} batches")
    print(f"  Project: {OUT_REBATE}")
    print(f"  Desktop: {DESKTOP_REBATE}")


if __name__ == "__main__":
    main()
