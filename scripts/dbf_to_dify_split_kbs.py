#!/usr/bin/env python3
"""Split customs HS DBF into two Dify knowledge bases (Markdown).

1) 出口退税率知识库 — only export rebate rate (no VAT / TSL)
2) 进口增值税与暂定税率知识库 — only import VAT + provisional rate (no rebate)

Outputs `.md` files for Dify upload.

Usage:
  .venv-dbf/bin/python scripts/dbf_to_dify_split_kbs.py [/path/to/dbf-folder]
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
OUT_VAT = ROOT / "data" / "dify-hs-import-vat"
DESKTOP_REBATE = Path.home() / "Desktop" / "DIFY知识库" / "海关编码-出口退税率"
DESKTOP_VAT = Path.home() / "Desktop" / "DIFY知识库" / "海关编码-进口增值税与暂定税率"

DEFAULT_CANDIDATES = [
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
        return f"{int(f)}%" if f == int(f) else f"{f}%"
    except ValueError:
        return f"{s}%" if not s.endswith("%") else s


def parse_export_rebate(note: str) -> str:
    """Parse NOTE like '退13;' / '退9;' / '退9;13;' → display string."""
    text = clean(note)
    rates = re.findall(r"退\s*([0-9]+(?:\.[0-9]+)?)", text)
    if not rates:
        return "0%"
    parts = []
    for r in rates:
        try:
            f = float(r)
            parts.append(f"{int(f)}%" if f == int(f) else f"{f}%")
        except ValueError:
            parts.append(f"{r}%")
    seen: set[str] = set()
    uniq: list[str] = []
    for p in parts:
        if p not in seen:
            seen.add(p)
            uniq.append(p)
    return " / ".join(uniq)


def parse_vat(cm: dict) -> str:
    zraw = clean(cm.get("ZSSL_SET"))
    if not zraw:
        return "0%"
    if "," in zraw:
        return " / ".join(fmt_pct(x) if x.strip() else "0%" for x in zraw.split(","))
    return fmt_pct(zraw)


def parse_tsl(cm: dict) -> str:
    tsl_raw = cm.get("TSL")
    return fmt_pct(tsl_raw) if tsl_raw not in (None, "", 0, 0.0) else "0%"


def build_aliases(name: str) -> list[str]:
    aliases: list[str] = []
    if "镶嵌钻石的银首饰" in name:
        aliases.extend(["镶钻银饰", "钻石银饰", "镶嵌钻石银饰"])
    if "镶嵌钻石的黄金制首饰" in name or "镶嵌钻石的黄金" in name:
        aliases.extend(["镶钻金饰", "钻石金饰", "镶嵌钻石金饰"])
    if "镶嵌钻石的铂金制首饰" in name or "镶嵌钻石的铂金" in name:
        aliases.extend(["镶钻铂金饰", "钻石铂金饰"])
    if "银首饰" in name and "镶嵌钻石" not in name:
        aliases.append("银饰")
    seen: set[str] = set()
    out: list[str] = []
    for a in aliases:
        if a not in seen:
            seen.add(a)
            out.append(a)
    return out


def validity_line(cm: dict) -> str:
    st, en = clean(cm.get("ST_DATE")), clean(cm.get("END_DATE"))
    if st or en:
        return f"有效期：{st} ~ {en}"
    return ""


def rebate_record(code: str, name: str, unit: str, dwcode: str, cm: dict) -> str:
    rebate = parse_export_rebate(cm.get("NOTE") or "")
    aliases = build_aliases(name)
    alias_part = f"、{'、'.join(aliases)}" if aliases else ""

    lines = [
        f"## 商品编码 {code}",
        "",
        f"**出口退税率问答**：问：{code}、{name}{alias_part} 的出口退税率是多少？答：{rebate}。",
        "",
        f"- **出口退税率**：{rebate}",
        f"- **出口退税率（仅此字段作答）**：{rebate}",
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

    lines.append("")
    lines.append(
        f"**关键词**：出口退税率{rebate} 海关编码{code} HS{code} {name} {' '.join(aliases)}".rstrip()
    )
    lines.append("")
    lines.append("---")
    lines.append("")
    return "\n".join(lines)


def vat_record(code: str, name: str, unit: str, dwcode: str, cm: dict) -> str:
    vat = parse_vat(cm)
    tsl = parse_tsl(cm)
    aliases = build_aliases(name)
    alias_part = f"、{'、'.join(aliases)}" if aliases else ""

    lines = [
        f"## 商品编码 {code}",
        "",
        f"**进口增值税税率问答**：问：{code}、{name}{alias_part} 的进口增值税税率是多少？答：{vat}。",
        "",
        f"- **进口增值税税率**：{vat}",
        f"- **增值税税率**：{vat}",
        f"- **暂定税率**：{tsl}",
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

    lines.append("")
    lines.append(
        f"**关键词**：进口增值税税率{vat} 暂定税率{tsl} 海关编码{code} HS{code} "
        f"{name} {' '.join(aliases)}".rstrip()
    )
    lines.append("")
    lines.append("---")
    lines.append("")
    return "\n".join(lines)


def write_kb(
    *,
    title: str,
    field_note: str,
    records: list[dict],
    std_map: dict,
    record_fn,
    out_dirs: list[Path],
    guide: str,
) -> tuple[int, int]:
    files: list[tuple[str, str]] = []
    for i in range(0, len(records), RECORDS_PER_FILE):
        chunk = records[i : i + RECORDS_PER_FILE]
        start_code = clean(chunk[0]["CODE"])
        end_code = clean(chunk[-1]["CODE"])
        idx = i // RECORDS_PER_FILE + 1
        name = f"hs_{idx:03d}_{start_code}_{end_code}.md"
        parts = [
            f"# {title}第 {idx} 批",
            "",
            f"- **编码范围**：{start_code} ~ {end_code}",
            f"- **本文件条数**：{len(chunk)}",
            f"- **说明**：{field_note}",
            "",
            "---",
            "",
        ]
        for r in chunk:
            code = clean(r.get("CODE"))
            std = std_map.get(code, {})
            parts.append(
                record_fn(
                    code,
                    std.get("NAME") or clean(r.get("NAME")),
                    std.get("UNIT") or clean(r.get("UNIT")),
                    std.get("DWCODE") or clean(r.get("DWCODE")),
                    r,
                )
            )
        files.append((name, "\n".join(parts)))

    for root in out_dirs:
        if root.exists():
            shutil.rmtree(root)
        root.mkdir(parents=True)

    batch_count = 0
    for b in range(0, len(files), FILES_PER_BATCH):
        batch_count += 1
        batch_files = files[b : b + FILES_PER_BATCH]
        for root in out_dirs:
            batch_dir = root / f"batch-{batch_count:02d}"
            batch_dir.mkdir(parents=True, exist_ok=True)
            for fname, text in batch_files:
                (batch_dir / fname).write_text(text, encoding="utf-8")

    for root in out_dirs:
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
    rebate_nz = sum(
        1 for r in current if parse_export_rebate(r.get("NOTE") or "") != "0%"
    )
    print(f"valid current codes: {len(current)} (export rebate >0: {rebate_nz})")

    # sanity samples
    for code in ("76101000", "71131911"):
        sample = next((r for r in current if clean(r.get("CODE")) == code), None)
        if not sample:
            continue
        print(
            f"sample {code}: rebate={parse_export_rebate(sample.get('NOTE') or '')} "
            f"vat={parse_vat(sample)} tsl={parse_tsl(sample)}"
        )

    rebate_guide = """# 如何上传到 Dify（出口退税率知识库）

1. 新建知识库，名称建议：`海关编码-出口退税率`
2. 不要上传 zip；每次最多 5 个 **Markdown（.md）** 文件（一个 batch 文件夹）
3. 打开 `batch-01`，全选 `.md` 上传 → 等索引完成 → 再传 `batch-02`
4. 分段标识符：`---`
5. 分段最大长度建议 1200，重叠 1
6. 本库【仅含出口退税率】，不含增值税/暂定税率
7. NOTE 无「退x」时，出口退税率记为 0%

Chatflow 提示：查询出口退税时只检索本库，只回答「出口退税率」字段。  
官网左侧退税率查询也应绑定本库 Dataset ID。
"""

    vat_guide = """# 如何上传到 Dify（进口增值税与暂定税率知识库）

1. 新建知识库，名称建议：`海关编码-进口增值税与暂定税率`
2. 不要上传 zip；每次最多 5 个 **Markdown（.md）** 文件（一个 batch 文件夹）
3. 打开 `batch-01`，全选 `.md` 上传 → 等索引完成 → 再传 `batch-02`
4. 分段标识符：`---`
5. 分段最大长度建议 1200，重叠 1
6. 本库【仅含进口增值税税率 + 暂定税率】，不含出口退税率

Chatflow 提示：问进口增值税/暂定税率时只检索本库；问出口退税时不要检索本库。
"""

    n1, b1 = write_kb(
        title="中国海关商品编码·出口退税率（现行有效）",
        field_note="本文件仅含出口退税率字段，不含增值税税率与暂定税率。",
        records=current,
        std_map=std_map,
        record_fn=rebate_record,
        out_dirs=[OUT_REBATE, DESKTOP_REBATE],
        guide=rebate_guide,
    )
    n2, b2 = write_kb(
        title="中国海关商品编码·进口增值税与暂定税率（现行有效）",
        field_note="本文件仅含进口增值税税率与暂定税率，不含出口退税率。",
        records=current,
        std_map=std_map,
        record_fn=vat_record,
        out_dirs=[OUT_VAT, DESKTOP_VAT],
        guide=vat_guide,
    )

    print(f"Rebate KB: {n1} files / {b1} batches")
    print(f"  Project: {OUT_REBATE}")
    print(f"  Desktop: {DESKTOP_REBATE}")
    print(f"VAT KB:    {n2} files / {b2} batches")
    print(f"  Project: {OUT_VAT}")
    print(f"  Desktop: {DESKTOP_VAT}")


if __name__ == "__main__":
    main()
