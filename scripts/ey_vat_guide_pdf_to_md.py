#!/usr/bin/env python3
"""Split EY Worldwide VAT, GST and Sales Tax Guide PDF into per-country Markdown.

Source: ey-gl-vat-guide-03-2026.pdf (content current on 1 January 2026).

Usage:
  .venv-pdf/bin/python scripts/ey_vat_guide_pdf_to_md.py
  .venv-pdf/bin/python scripts/ey_vat_guide_pdf_to_md.py --pdf PATH --out-dir PATH
"""
from __future__ import annotations

import argparse
import re
from pathlib import Path

import fitz

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_PDF = ROOT / "data" / "ey-vat-guide-pdf" / "ey-gl-vat-guide-03-2026.pdf"
DEFAULT_OUT = ROOT / "data" / "ey-vat-gst-sales-tax-guide-md"

# Guide printed page → PDF page index offset (Albania guide p.2 == PDF p.10 → +8)
PAGE_OFFSET = 8

# Common Chinese aliases for retrieval (optional; English filename stays canonical)
ZH_ALIAS = {
    "China Mainland": "中国大陆",
    "Hong Kong": "中国香港",
    "Taiwan": "中国台湾",
    "Macau": "中国澳门",
    "Kazakhstan": "哈萨克斯坦",
    "United States": "美国",
    "United Kingdom": "英国",
    "Germany": "德国",
    "France": "法国",
    "Japan": "日本",
    "Korea, Republic of": "韩国",
    "Singapore": "新加坡",
    "Malaysia": "马来西亚",
    "Thailand": "泰国",
    "Vietnam": "越南",
    "Indonesia": "印度尼西亚",
    "India": "印度",
    "Australia": "澳大利亚",
    "Canada": "加拿大",
    "Mexico": "墨西哥",
    "Brazil": "巴西",
    "Russia": "俄罗斯",
    "Türkiye": "土耳其",
    "Saudi Arabia": "沙特阿拉伯",
    "United Arab Emirates": "阿联酋",
    "Poland": "波兰",
    "Spain": "西班牙",
    "Italy": "意大利",
    "Netherlands": "荷兰",
    "Switzerland": "瑞士",
    "Sweden": "瑞典",
    "Norway": "挪威",
    "Denmark": "丹麦",
    "Finland": "芬兰",
    "Belgium": "比利时",
    "Austria": "奥地利",
    "Portugal": "葡萄牙",
    "Ireland": "爱尔兰",
    "New Zealand": "新西兰",
    "Philippines": "菲律宾",
    "Cambodia": "柬埔寨",
    "Laos": "老挝",
    "Myanmar": "缅甸",
    "Pakistan": "巴基斯坦",
    "Bangladesh": "孟加拉国",
    "Nigeria": "尼日利亚",
    "South Africa": "南非",
    "Egypt": "埃及",
    "Israel": "以色列",
    "Chile": "智利",
    "Argentina": "阿根廷",
    "Colombia": "哥伦比亚",
    "Peru": "秘鲁",
    "Ukraine": "乌克兰",
    "Czech Republic": "捷克",
    "Romania": "罗马尼亚",
    "Hungary": "匈牙利",
    "Greece": "希腊",
    "Kenya": "肯尼亚",
    "Uzbekistan": "乌兹别克斯坦",
    "Kyrgyzstan": "吉尔吉斯斯坦",
    "Tajikistan": "塔吉克斯坦",
    "Mongolia": "蒙古",
}

SECTION_RE = re.compile(r"^([A-Z])\.\s+(.+)$")
PAGE_FOOTER_RE = re.compile(
    r"(?m)^\s*(?:\d{1,4}\s+)?[A-Za-zÀ-ÿ'’\-,\s()]{2,60}\s+\d{1,4}\s*$"
)
TOC_LINE_RE = re.compile(r"^(.+?)\s*\.{2,}\s*(\d+)\s*$")
TOC_LINE_FALLBACK = re.compile(r"^(.+?)\s+(\d+)\s*$")
DISCLAIMER_START = re.compile(
    r"(?i)^\s*(?:ey refers to|©\s*20\d{2}\s+eygm|this material has been prepared)"
)


def slug_filename(name: str) -> str:
    s = name.strip()
    s = s.replace("/", "-").replace(",", "")
    s = re.sub(r"\s+", "-", s)
    s = re.sub(r"[^\w\-.'()&+]", "", s, flags=re.UNICODE)
    return s or "Unknown"


def ey_doc_filename(name: str) -> str:
    """Prefixed filename so Dify KB does not collide with Deloitte country docs."""
    return f"EY-VAT-GST-2026-{slug_filename(name)}.md"


def clean_text(text: str) -> str:
    text = text.replace("\xa0", " ").replace("\u00ad", "").replace("\xad", "")
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = text.replace("\t", " ")
    # Soft hyphen / odd bullets
    text = text.replace("•\t", "- ").replace("• ", "- ")
    text = text.replace("­", "")
    lines = [ln.rstrip() for ln in text.split("\n")]
    out: list[str] = []
    for ln in lines:
        if DISCLAIMER_START.match(ln):
            break
        # Drop lone page numbers / "Country  N" running headers when short
        if re.fullmatch(r"\d{1,4}", ln.strip()):
            continue
        if re.fullmatch(r"[A-Za-zÀ-ÿ'’\-,\s()]{2,50}\s+\d{1,4}", ln.strip()) and len(ln) < 60:
            continue
        if ln.strip() == "ey.com/GlobalTaxGuides":
            continue
        out.append(ln)
    text = "\n".join(out)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def soft_join_paragraphs(text: str) -> str:
    """Join wrapped lines that are not list/heading starts."""
    lines = text.split("\n")
    joined: list[str] = []
    buf = ""
    for ln in lines:
        s = ln.strip()
        if not s:
            if buf:
                joined.append(buf)
                buf = ""
            joined.append("")
            continue
        if SECTION_RE.match(s) or s.startswith("#") or s.startswith("- ") or s.startswith("* "):
            if buf:
                joined.append(buf)
                buf = ""
            joined.append(s)
            continue
        # Label lines ending with short rate cells often stay separate
        if buf and not buf.endswith(("-", "/", "(")) and not s[:1].islower():
            # start new paragraph if previous ended sentence-like or this looks like a heading
            if buf.endswith((".", ":", ";", ")", "%")) or len(s) < 40 and s.endswith(":"):
                joined.append(buf)
                buf = s
                continue
        if not buf:
            buf = s
        else:
            buf = f"{buf} {s}"
    if buf:
        joined.append(buf)
    return "\n".join(joined)


def promote_sections(text: str, country: str) -> str:
    lines = text.split("\n")
    out: list[str] = []
    for ln in lines:
        s = ln.strip()
        m = SECTION_RE.match(s)
        if m:
            out.append(f"## {m.group(1)}. {m.group(2).strip()}")
            continue
        # "VAT rates" / glance labels → bold key lines when "Label  value" pattern
        if re.match(r"^(Name of the tax|Local name|Date introduced|VAT rates|Standard|Reduced|Other|Thresholds|Registration)\b", s):
            # keep as bullet-ish
            if "\t" in ln or "  " in ln:
                parts = re.split(r"\s{2,}|\t+", s, maxsplit=1)
                if len(parts) == 2 and parts[1].strip():
                    out.append(f"- **{parts[0].strip()}**: {parts[1].strip()}")
                    continue
            out.append(f"- **{s}**" if not s.startswith("-") else s)
            continue
        out.append(ln)
    body = "\n".join(out)
    # Normalize At-a-glance rate lines that may have been split
    body = re.sub(
        r"(?m)^- \*\*Standard\*\*\s*\n+(\d[\d.]*%)\s*$",
        r"- **Standard**: \1",
        body,
    )
    body = re.sub(
        r"(?m)^- \*\*Reduced\*\*\s*\n+([^\n]+)\s*$",
        r"- **Reduced**: \1",
        body,
    )
    return body


def parse_toc(doc: fitz.Document) -> list[tuple[str, int]]:
    toc_text = "\n".join(doc[i].get_text("text") for i in range(3, 8))
    entries: list[tuple[str, int]] = []
    seen: set[str] = set()
    for ln in toc_text.splitlines():
        ln = ln.strip().replace("\xad", "").replace("\u00ad", "")
        if not ln:
            continue
        m = TOC_LINE_RE.match(ln) or TOC_LINE_FALLBACK.match(ln)
        if not m:
            continue
        name, page = m.group(1).strip().rstrip("."), int(m.group(2))
        name = re.sub(r"\s+", " ", name)
        low = name.lower()
        if low in {"preface", "contents"} or "contacts" in low:
            continue
        if page < 2 or len(name) < 2:
            continue
        if name in seen:
            continue
        seen.add(name)
        entries.append((name, page))
    entries.sort(key=lambda x: x[1])
    return entries


def extract_country(
    doc: fitz.Document, name: str, start_guide: int, end_guide: int
) -> str:
    start_pdf = start_guide + PAGE_OFFSET - 1  # 0-index
    end_pdf = end_guide + PAGE_OFFSET - 1
    start_pdf = max(0, start_pdf)
    end_pdf = min(doc.page_count, end_pdf)
    chunks: list[str] = []
    for i in range(start_pdf, end_pdf):
        chunks.append(doc[i].get_text("text"))
    raw = "\n".join(chunks)
    text = clean_text(raw)
    # Strip leading country title / GMT / office block noise lightly — keep contacts
    text = soft_join_paragraphs(text)
    text = promote_sections(text, name)
    zh = ZH_ALIAS.get(name, "")
    keywords = [
        "EY",
        "Worldwide VAT GST and Sales Tax Guide 2026",
        "indirect tax",
        "VAT",
        "GST",
        "sales tax",
        name,
    ]
    if zh:
        keywords.append(zh)
    header = [
        f"# EY Worldwide VAT, GST and Sales Tax Guide 2026 — {name}",
        "",
        f"> **检索关键词**：{', '.join(keywords)}",
        ">",
        "> **来源**：EY *Worldwide VAT, GST and Sales Tax Guide 2026*（内容截至 2026-01-01，更新以原文为准）。",
        "> **采信优先级**：涉及增值税 / GST / 销售税等**间接税**税率、征税范围、登记门槛、进项抵扣、申报缴纳时，",
        "> **优先采信本文件**；与税总《投资税收指南》或其它四大材料冲突时，以本指南「Standard / Rates」及带生效说明的条款为准。",
        "",
    ]
    if zh:
        header.insert(1, f"（{zh}）")
        header.insert(2, "")
    return "\n".join(header) + text.strip() + "\n"


def write_index(out_dir: Path, countries: list[str]) -> None:
    lines = [
        "# EY Worldwide VAT, GST and Sales Tax Guide 2026 — 索引",
        "",
        "> 间接税（VAT / GST / sales tax）权威摘要；按国拆分便于检索。",
        "> 原文 PDF：`data/ey-vat-guide-pdf/ey-gl-vat-guide-03-2026.pdf`",
        "> 内容截至 2026-01-01。",
        "",
        f"共 {len(countries)} 个司法辖区。",
        "",
        "## 国家/地区",
        "",
    ]
    for name in countries:
        fn = ey_doc_filename(name)
        zh = ZH_ALIAS.get(name)
        label = f"{name}（{zh}）" if zh else name
        lines.append(f"- [{label}]({fn})")
    (out_dir / "EY-VAT-GST-2026-00-索引.md").write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--pdf", type=Path, default=DEFAULT_PDF)
    ap.add_argument("--out-dir", type=Path, default=DEFAULT_OUT)
    ap.add_argument("--limit", type=int, default=0, help="Only convert first N countries (debug)")
    args = ap.parse_args()

    pdf = args.pdf
    out_dir: Path = args.out_dir
    if not pdf.is_file():
        raise SystemExit(f"PDF not found: {pdf}")

    out_dir.mkdir(parents=True, exist_ok=True)
    doc = fitz.open(pdf)
    entries = parse_toc(doc)
    if not entries:
        raise SystemExit("Failed to parse TOC country list")

    # End page = next country start (last → near end of book before back matter)
    last_end = doc.page_count - PAGE_OFFSET + 1
    ranges: list[tuple[str, int, int]] = []
    for i, (name, start) in enumerate(entries):
        end = entries[i + 1][1] if i + 1 < len(entries) else last_end
        ranges.append((name, start, end))

    if args.limit > 0:
        ranges = ranges[: args.limit]

    names: list[str] = []
    for name, start, end in ranges:
        body = extract_country(doc, name, start, end)
        fn = out_dir / ey_doc_filename(name)
        fn.write_text(body, encoding="utf-8")
        names.append(name)
        print(f"OK  {name}  pages {start}-{end - 1}  → {fn.name}  ({len(body)} chars)")

    write_index(out_dir, names)
    print(f"Done. {len(names)} countries → {out_dir}")


if __name__ == "__main__":
    main()
