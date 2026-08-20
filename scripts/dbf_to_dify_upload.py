#!/usr/bin/env python3
"""Build Dify upload packs from customs HS-code DBF (mixed fields, legacy).

Prefer the split knowledge bases instead:
  .venv-dbf/bin/python scripts/dbf_to_dify_split_kbs.py

- 增值税税率 ← ZSSL_SET
- 出口退税率 ← NOTE 中明确「退x;」（含退0）；无「退x」则跳过该条，禁止默认 0%
- 暂定税率 ← TSL（不是退税）

Usage:
  .venv-dbf/bin/python scripts/dbf_to_dify_upload.py [/path/to/dbf-folder]
"""
from __future__ import annotations

import re
import shutil
import sys
from datetime import date
from pathlib import Path

from dbfread import DBF

_SCRIPTS = Path(__file__).resolve().parent
if str(_SCRIPTS) not in sys.path:
    sys.path.insert(0, str(_SCRIPTS))
from hs_special_goods_flag import special_goods_flag_keyword, special_goods_flag_line

ROOT = Path(__file__).resolve().parents[1]
OUT_ROOT = ROOT / "data" / "dify-hs-upload"
DESKTOP = Path.home() / "Desktop" / "dify-hs-upload"
CURRENT_END_YEAR = 2099
RECORDS_PER_FILE = 80
FILES_PER_BATCH = 5

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
        return f"{int(f)}%" if f == int(f) else f"{f}%"
    except ValueError:
        return f"{s}%" if not s.endswith("%") else s


def parse_export_rebate(note: str) -> str | None:
    """Parse NOTE like '退13;' / '退9;' / '退0;' → display string.

    Returns None when NOTE has no explicit 「退x」.
    Empty NOTE must NOT become 0% (that incorrectly zeroed phones etc.).
    """
    text = clean(note)
    rates = re.findall(r"退\s*([0-9]+(?:\.[0-9]+)?)", text)
    if not rates:
        return None
    parts = []
    for r in rates:
        try:
            f = float(r)
            parts.append(f"{int(f)}%" if f == int(f) else f"{f}%")
        except ValueError:
            parts.append(f"{r}%")
    # unique preserve order
    seen = set()
    uniq = []
    for p in parts:
        if p not in seen:
            seen.add(p)
            uniq.append(p)
    return " / ".join(uniq)


def record_txt(code: str, name: str, unit: str, dwcode: str, cm: dict) -> str:
    zraw = clean(cm.get("ZSSL_SET"))
    if zraw:
        if "," in zraw:
            vat = " / ".join(
                fmt_pct(x) if x.strip() else "0%" for x in zraw.split(",")
            )
        else:
            vat = fmt_pct(zraw)
    else:
        vat = "0%"

    rebate = parse_export_rebate(cm.get("NOTE") or "")
    rebate_display = rebate if rebate is not None else "未收录"
    rebate_answer = (
        rebate
        if rebate is not None
        else "未收录（海关商品编码 DBF 的 NOTE 无「退x」标注，禁止默认写成 0%）"
    )
    tsl_raw = cm.get("TSL")
    tsl = fmt_pct(tsl_raw) if tsl_raw not in (None, "", 0, 0.0) else "0%"

    aliases = build_aliases(name)

    # Put rebate Q&A first so retrieval + LLM latch onto rebate instead of VAT.
    lines = [
        f"【商品编码】{code}",
        f"【出口退税率问答】问：{code}、{name}"
        + (f"、{'、'.join(aliases)}" if aliases else "")
        + f" 的出口退税率是多少？答：{rebate_answer}。"
        + f"请注意：增值税税率是{vat}，绝对不是出口退税率；出口退税率={rebate_display}。",
        f"出口退税率：{rebate_display}",
        f"出口退税率（仅此字段作答）：{rebate_display}",
        f"商品名称：{name}",
    ]
    if aliases:
        lines.append(f"常用别名：{'、'.join(aliases)}")
    lines.append(f"商品编码：{code}")
    if unit:
        lines.append(f"计量单位：{unit}")
    if dwcode:
        lines.append(f"单位代码：{dwcode}")

    lines.append(f"增值税税率：{vat}（进口/内销征税率参考，严禁当作出口退税）")
    lines.append(f"暂定税率：{tsl}")
    flag_line = special_goods_flag_line(cm, markdown=False)
    if flag_line:
        lines.append(flag_line)
    if rebate is None:
        lines.append(
            "说明：本条 NOTE 无「退x」，出口退税率标记为未收录；"
            "禁止用增值税税率或默认 0% 代替。请以税局出口退税率文库终核。"
        )
    else:
        lines.append(
            "说明：回答「出口退税率」问题时，只能使用上面的出口退税率字段；"
            f"本题正确出口退税率为{rebate}，即使增值税为{vat}也不得改答{vat}。"
            "退税率0时必须同时看「特殊商品标识」：1=视同内销征税，2=出口免税、进项转出。"
        )

    for key, label in [
        ("BCFLAG", "监管条件标志"),
        ("SPLB", "商品类别"),
        ("SZ", "税则标志"),
        ("NOTE", "备注原文"),
    ]:
        val = clean(cm.get(key))
        if val and val not in ("False", "True"):
            lines.append(f"{label}：{val}")

    st, en = clean(cm.get("ST_DATE")), clean(cm.get("END_DATE"))
    if st or en:
        lines.append(f"有效期：{st} ~ {en}")

    kw_flag = special_goods_flag_keyword(cm)
    lines.append(
        f"关键词：出口退税率{rebate_display} 海关编码{code} HS{code} "
        f"{name} {' '.join(aliases)} 增值税{vat}(非退税) {kw_flag}".rstrip()
    )
    lines.append("")
    lines.append("---")
    lines.append("")
    return "\n".join(lines)


def build_aliases(name: str) -> list[str]:
    """Short search aliases for common jewelry wording."""
    aliases = []
    if "镶嵌钻石的银首饰" in name:
        aliases.extend(["镶钻银饰", "钻石银饰", "镶嵌钻石银饰"])
    if "镶嵌钻石的黄金制首饰" in name or "镶嵌钻石的黄金" in name:
        aliases.extend(["镶钻金饰", "钻石金饰", "镶嵌钻石金饰"])
    if "镶嵌钻石的铂金制首饰" in name or "镶嵌钻石的铂金" in name:
        aliases.extend(["镶钻铂金饰", "钻石铂金饰"])
    if "银首饰" in name and "镶嵌钻石" not in name:
        aliases.append("银饰")
    # unique
    seen = set()
    out = []
    for a in aliases:
        if a not in seen:
            seen.add(a)
            out.append(a)
    return out


def main() -> None:
    explicit = Path(sys.argv[1]).expanduser() if len(sys.argv) > 1 else None
    src = find_source(explicit)
    print(f"Source: {src}")

    std_path = src / "stdcm.dbf"
    if not std_path.exists():
        std_path = src / "stdcm.DBF"

    std_map = {}
    for r in open_dbf(std_path):
        code = clean(r.get("CODE"))
        if re.fullmatch(r"\d{4,12}", code):
            std_map[code] = {
                "NAME": clean(r.get("NAME")),
                "UNIT": clean(r.get("UNIT")),
                "DWCODE": clean(r.get("DWCODE")),
            }

    current = []
    for r in open_dbf(src / "cmcode.DBF", ignore_memo=True):
        end = r.get("END_DATE")
        if not end or getattr(end, "year", 0) < CURRENT_END_YEAR:
            continue
        code = clean(r.get("CODE"))
        if not re.fullmatch(r"\d{4,12}", code):
            continue
        current.append(dict(r))

    current.sort(key=lambda x: clean(x.get("CODE")))
    known = sum(1 for r in current if parse_export_rebate(r.get("NOTE") or "") is not None)
    print(
        f"valid current codes: {len(current)} | "
        f"explicit 退x: {known} | unmarked→未收录: {len(current) - known}"
    )

    # verify sample
    sample = next(r for r in current if clean(r.get("CODE")) == "71131911")
    print(
        "sample 71131911:",
        "VAT",
        clean(sample.get("ZSSL_SET")),
        "rebate",
        parse_export_rebate(sample.get("NOTE") or ""),
        "TSL",
        sample.get("TSL"),
    )

    files = []
    for i in range(0, len(current), RECORDS_PER_FILE):
        chunk = current[i : i + RECORDS_PER_FILE]
        start_code = clean(chunk[0]["CODE"])
        end_code = clean(chunk[-1]["CODE"])
        idx = i // RECORDS_PER_FILE + 1
        name = f"hs_{idx:03d}_{start_code}_{end_code}.txt"
        parts = [
            f"中国海关商品编码与出口退税率（现行有效）第 {idx} 批",
            f"编码范围：{start_code} ~ {end_code}",
            f"本文件共 {len(chunk)} 条。",
            "字段说明：NOTE 有「退x」才写具体退税率；无则出口退税率=未收录（禁止默认 0%）。",
            "",
        ]
        for r in chunk:
            code = clean(r.get("CODE"))
            std = std_map.get(code, {})
            parts.append(
                record_txt(
                    code,
                    std.get("NAME") or clean(r.get("NAME")),
                    std.get("UNIT") or clean(r.get("UNIT")),
                    std.get("DWCODE") or clean(r.get("DWCODE")),
                    r,
                )
            )
        files.append((name, "\n".join(parts)))

    for root in (OUT_ROOT, DESKTOP):
        if root.exists():
            shutil.rmtree(root)
        root.mkdir(parents=True)

    batch_count = 0
    for b in range(0, len(files), FILES_PER_BATCH):
        batch_count += 1
        batch_files = files[b : b + FILES_PER_BATCH]
        for root in (OUT_ROOT, DESKTOP):
            batch_dir = root / f"batch-{batch_count:02d}"
            batch_dir.mkdir(parents=True, exist_ok=True)
            for fname, text in batch_files:
                (batch_dir / fname).write_text(text, encoding="utf-8")

    guide = """如何上传到 Dify

1. 不要上传 zip。
2. 每次最多上传 5 个文件：打开 batch-01，全选其中 .txt 上传。
3. 等索引完成后再传 batch-02，依此类推。
4. 分段标识符用：---
5. 分段最大长度建议 1500 字符，重叠 1。
6. 本版已区分：增值税税率 / 出口退税率 / 暂定税率。
7. NOTE 无「退x」时，出口退税率记为「未收录」（禁止默认 0%）。

应用提示词建议加一句：
查询出口退税时只使用「出口退税率」字段，禁止用增值税税率代替；若为未收录则说明需查税局文库。
"""
    for root in (OUT_ROOT, DESKTOP):
        (root / "README上传说明.txt").write_text(guide, encoding="utf-8")

    print(f"Wrote {len(files)} files in {batch_count} batches")
    print(f"Desktop: {DESKTOP}")
    print(f"Project: {OUT_ROOT}")


if __name__ == "__main__":
    main()
