#!/usr/bin/env python3
"""Convert Deloitte Tax Highlights PDFs to readable Markdown for Dify KB.

Improvements over plain text dump:
  - Promote known H2/H3 section titles
  - Soft line-join for wrapped paragraphs
  - Convert rate / bracket / label-value patterns into MD tables or bullet KV lists
  - Normalize bullet characters to Markdown lists

Usage:
  .venv-pdf/bin/python scripts/deloitte_pdf_to_md.py
  .venv-pdf/bin/python scripts/deloitte_pdf_to_md.py --pdf-dir PATH --out-dir PATH
"""
from __future__ import annotations

import argparse
import re
import shutil
from pathlib import Path

import fitz

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_PDF_DIR = ROOT / "data" / "deloitte-tax-highlights-pdf"
DEFAULT_OUT_DIR = ROOT / "data" / "deloitte-tax-highlights-md"

H2 = {
    "Recent developments",
    "Investment basics",
    "Corporate taxation",
    "Individual taxation",
    "Withholding tax",
    "Anti-avoidance rules",
    "Compliance for corporations",
    "Compliance for individuals",
    "Value added tax",
    "Other taxes",
    "Tax treaties",
    "Tax authorities",
    "Other taxes on corporations and individuals",
}

H3 = {
    "Rates",
    "Residence",
    "Basis",
    "Taxable income",
    "Taxation of dividends",
    "Capital gains",
    "Losses",
    "Foreign tax credit",
    "Foreign tax relief",
    "Participation exemption",
    "Holding company regime",
    "Incentives",
    "Other",
    "Rate",
    "Tax year",
    "Filing and payment",
    "Penalties",
    "Rulings",
    "General",
    "Surtax",
    "Alternative minimum tax",
    "Global minimum tax (Pillar Two)",
    "Dividends",
    "Interest",
    "Royalties",
    "Technical service fees",
    "Branch remittance tax",
    "Other",
    "Transfer pricing",
    "Interest deduction limitations",
    "Controlled foreign companies",
    "Hybrid mismatches",
    "Disclosure requirements",
    "General anti-avoidance rule",
    "Exit tax",
    "Taxable transactions",
    "Rates and thresholds",
}

RATE_LABEL_RE = re.compile(
    r"^(?P<label>.{3,80}?(?:tax\s+rate|income\s+tax\s+rate|rate|rates?|levy|surcharge|contribution))"
    r"(?:\s+(?P<value>\d[\d.,\s/%()\-–—toand]*))?$",
    re.I,
)
BRACKET_RE = re.compile(
    r"^(?P<label>(?:Up to|Over|Above|From|Less than|More than|[0-9][\d,.\s]*[-–—][\d,.\s]*|"
    r"[0-9][\d,.]*\s*(?:and above|or more|plus)?))\s+"
    r"(?P<value>\d[\d.,]*%(?:\s*\+[^%]*%)?|\d[\d.,]*\s*(?:percent|per cent))",
    re.I,
)
KV_RE = re.compile(r"^([A-Z][^:]{1,80}):\s+(.+)$")
PERCENT_ONLY_RE = re.compile(r"^[\d.,]+\s*%(?:\s*/\s*[\d.,]+\s*%)?(?:\s*\([^)]*\))?$")
PAGE_RE = re.compile(r"(?m)^\s*Page\s+\d+\s+of\s+\d+\s*$")
# Boilerplate about Deloitte / legal disclaimer at end of each PDF
DISCLAIMER_RE = re.compile(
    r"(?s)"
    r"\s*Deloitte refers to one or more of Deloitte Touche Tohmatsu Limited.*?"
    r"relying on this communication\.?"
    r"(?:\s*©\s*\d{4}\.? For information, contact Deloitte Global\.?)?"
)


def clean_text(text: str) -> str:
    text = text.replace("\xa0", " ")
    text = PAGE_RE.sub("", text)
    text = DISCLAIMER_RE.sub("\n", text)
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = "\n".join(line.rstrip() for line in text.split("\n"))
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def is_heading(line: str) -> bool:
    t = line.strip().lstrip("#").strip()
    return (
        line.strip().startswith("#")
        or t in H2
        or t in H3
        or bool(re.search(r"Highlights\s+20\d{2}", t))
    )


def join_soft_wraps(lines: list[str]) -> list[str]:
    if not lines:
        return []
    out: list[str] = []
    buf = lines[0]
    for nxt in lines[1:]:
        a = buf.rstrip()
        b = nxt.strip()
        if not b:
            out.append(a)
            out.append("")
            buf = ""
            continue
        if not a:
            buf = b
            continue
        if is_heading(a) or is_heading(b) or b.startswith("#") or a.startswith("#"):
            out.append(a)
            buf = b
            continue
        if a.startswith("|") or b.startswith("|") or a.startswith("- **"):
            out.append(a)
            buf = b
            continue
        if a.endswith("-") and b[:1].islower():
            buf = a[:-1] + b
            continue
        if a.endswith(":"):
            buf = a + " " + b
            continue
        if re.search(r"[.!?]$", a):
            out.append(a)
            buf = b
            continue
        # Keep percent / band lines separate for the rate-table builder
        if PERCENT_ONLY_RE.match(b) and not PERCENT_ONLY_RE.match(a):
            out.append(a)
            buf = b
            continue
        if PERCENT_ONLY_RE.match(a):
            out.append(a)
            buf = b
            continue
        if re.match(
            r"^(Up to|Over|Above|From|Less than|More than)\b", a, re.I
        ) or re.match(r"^\d[\d,.\s]*[-–—]\d", a):
            out.append(a)
            buf = b
            continue
        # Column headers that often sit above progressive tables
        rate_headers = {
            "Taxable income",
            "Taxable income (AUD)",
            "Individual income tax rate",
            "Corporate income tax rate",
            "Corporate income tax rates",
            "Rate",
            "Rates",
        }
        if a in rate_headers or b in rate_headers:
            out.append(a)
            buf = b
            continue
        if b[:1].islower() or b[:1].isdigit() or b[:1] in "(%$€£":
            buf = a + " " + b
            continue
        if re.match(r"^[A-Z][^:]{0,60}:\s", b):
            out.append(a)
            buf = b
            continue
        if not re.search(r"[.!?]$", a):
            buf = a + " " + b
            continue
        out.append(a)
        buf = b
    if buf != "":
        out.append(buf)
    return [re.sub(r"[ \t]{2,}", " ", x).strip() if x.strip() else "" for x in out]


def promote_sections(text: str, country: str) -> str:
    lines = text.split("\n")
    out = []
    title_re = re.compile(r"Highlights\s+20\d{2}")
    seen_title = False
    for line in lines:
        stripped = line.strip()
        if not stripped:
            out.append("")
            continue
        if stripped == "International Tax":
            continue
        split_done = False
        for h in sorted(H2, key=len, reverse=True):
            if stripped == h:
                out.append(f"## {h}")
                split_done = True
                break
            if stripped.startswith(h + " ") or stripped.startswith(h + "\t"):
                out.append(f"## {h}")
                rest = stripped[len(h) :].strip()
                if rest:
                    out.append(rest)
                split_done = True
                break
        if split_done:
            continue
        for h in sorted(H3, key=len, reverse=True):
            if stripped == h:
                out.append(f"### {h}")
                split_done = True
                break
            # Only split long compound lines for a few safe H3s; avoid
            # "Capital gains tax rate" → "### Capital gains" + "tax rate"
            if h in {"Global minimum tax (Pillar Two)", "Alternative minimum tax"} and (
                stripped.startswith(h + " ") or stripped.startswith(h + "\t")
            ):
                out.append(f"### {h}")
                rest = stripped[len(h) :].strip()
                if rest:
                    out.append(rest)
                split_done = True
                break
        if split_done:
            continue
        if title_re.search(stripped) and len(stripped) < 120:
            m = re.match(r"^(.*Highlights\s+20\d{2})\s*(.*)$", stripped)
            if m:
                title, rest = m.group(1).strip(), m.group(2).strip()
                if not seen_title:
                    out.append(f"# {title}")
                    seen_title = True
                if rest:
                    out.append(rest)
                continue
        out.append(line)
    body = re.sub(r"\n{3,}", "\n\n", "\n".join(out)).strip()
    if not body.startswith("# "):
        body = f"# {country} Tax Highlights\n\n{body}"
    return body


def md_escape_cell(s: str) -> str:
    return s.replace("|", "\\|").replace("\n", " ").strip()


def to_md_table(headers: list[str], rows: list[list[str]]) -> list[str]:
    headers = [md_escape_cell(h) for h in headers]
    body = [[md_escape_cell(c) for c in r] for r in rows]
    out = [
        "| " + " | ".join(headers) + " |",
        "| " + " | ".join("---" for _ in headers) + " |",
    ]
    for r in body:
        # pad/truncate to header width
        while len(r) < len(headers):
            r.append("")
        out.append("| " + " | ".join(r[: len(headers)]) + " |")
    return out


def to_kv_list(pairs: list[tuple[str, str]]) -> list[str]:
    return [f"- **{k.strip()}**: {v.strip()}" for k, v in pairs if k.strip() and v.strip()]


def looks_like_rate_label(s: str) -> bool:
    s = s.strip()
    if not s or len(s) > 100:
        return False
    if PERCENT_ONLY_RE.match(s):
        return False
    if s.endswith(":"):
        return False
    if re.match(r"^(Up to|Over|Above|From|Less than|More than)\b", s, re.I):
        return True
    if re.match(r"^\d[\d,.\s]*[-–—]\d", s):
        return True
    return bool(
        re.search(r"rate|tax|levy|surcharge|contribution|withholding|VAT|GST|CIT", s, re.I)
        or (s[0].isupper() and len(s.split()) <= 12)
    )


def extract_pairs_from_lines(chunk: list[str]) -> tuple[list[tuple[str, str]], list[str]]:
    """Return (pairs, leftover_lines) from a rates-like chunk."""
    pairs: list[tuple[str, str]] = []
    leftover: list[str] = []
    i = 0
    while i < len(chunk):
        line = chunk[i].strip()
        if not line:
            i += 1
            continue
        bm = BRACKET_RE.match(line)
        if bm:
            pairs.append((bm.group("label").strip(), bm.group("value").strip()))
            i += 1
            continue
        # "Label value%" on one line
        m = re.match(
            r"^(.+?)\s+(\d[\d.,]*%(?:\s*/\s*\d[\d.,]*%)?(?:\s*\([^)]*\))?)$",
            line,
        )
        if m and looks_like_rate_label(m.group(1)) and len(m.group(1)) < 80:
            pairs.append((m.group(1).strip(), m.group(2).strip()))
            i += 1
            continue
        # Label then next line is percent / short value
        if i + 1 < len(chunk):
            nxt = chunk[i + 1].strip()
            # "45% Capital gains tax rate …" if soft-wrap still glued
            glued = re.match(
                r"^([\d.,]+\s*%(?:\s*/\s*[\d.,]+\s*%)?)\s+(.+)$",
                nxt,
            )
            if looks_like_rate_label(line) and glued and len(glued.group(1)) < 20:
                pairs.append((line, glued.group(1).strip()))
                chunk.insert(i + 2, glued.group(2).strip())
                i += 2
                continue
            if looks_like_rate_label(line) and (
                PERCENT_ONLY_RE.match(nxt)
                or (len(nxt) < 80 and re.search(r"\d", nxt) and not looks_like_rate_label(nxt))
            ):
                # Avoid swallowing long prose
                if PERCENT_ONLY_RE.match(nxt) or re.match(r"^[\d.,]+\s*/\s*[\d.,]+", nxt):
                    pairs.append((line, nxt))
                    i += 2
                    continue
                if len(nxt) < 120 and not nxt.endswith("."):
                    pairs.append((line, nxt))
                    i += 2
                    continue
        leftover.append(line)
        i += 1
    return pairs, leftover


def structure_kv_lines(lines: list[str]) -> list[str]:
    """Turn plain 'Label: value' lines into bold KV bullets when dense."""
    out: list[str] = []
    buf_pairs: list[tuple[str, str]] = []

    def flush():
        nonlocal buf_pairs
        if len(buf_pairs) >= 2:
            out.extend(to_kv_list(buf_pairs))
        else:
            for k, v in buf_pairs:
                out.append(f"{k}: {v}")
        buf_pairs = []

    for line in lines:
        s = line.strip()
        if not s:
            flush()
            out.append("")
            continue
        if s.startswith("#") or s.startswith("|") or s.startswith("- **"):
            flush()
            out.append(s)
            continue
        # bullets
        if s.startswith("•") or s.startswith("·") or s.startswith("- "):
            flush()
            item = re.sub(r"^[•·\-]\s*", "", s)
            out.append(f"- {item}")
            continue
        km = KV_RE.match(s)
        if km and len(km.group(1)) < 70 and not km.group(1).startswith("http"):
            buf_pairs.append((km.group(1), km.group(2)))
            continue
        flush()
        out.append(s)
    flush()
    return out


def structure_rate_sections(lines: list[str]) -> list[str]:
    """Under ### Rates (and similar), convert label/value runs into tables."""
    out: list[str] = []
    i = 0
    rate_heads = {"Rates", "Rate", "Rates and thresholds"}
    # Column titles that PDFs often emit inside rate tables — do not end the chunk
    inner_noise = {
        "Taxable income",
        "Taxable income (AUD)",
        "Rate",
        "Rates",
        "Individual income tax rate",
        "Corporate income tax rates",
        "Corporate income tax rate",
        "(AUD)",
        "AUD",
        "General",
    }
    while i < len(lines):
        s = lines[i].strip()
        heading = s.lstrip("#").strip()
        is_rate_h = s.startswith("### ") and heading in rate_heads
        if not is_rate_h:
            out.append(lines[i])
            i += 1
            continue
        out.append(s if s.startswith("#") else f"### {heading}")
        i += 1
        chunk: list[str] = []
        while i < len(lines):
            nxt = lines[i].strip()
            h = nxt.lstrip("#").strip()
            if not nxt:
                i += 1
                continue
            if nxt.startswith("## "):
                break
            if nxt.startswith("### "):
                if h in rate_heads or h in inner_noise:
                    i += 1
                    continue
                break
            if nxt in inner_noise:
                i += 1
                continue
            if KV_RE.match(nxt) and nxt.split(":", 1)[0] in {
                "Residence",
                "Basis",
                "Taxable income",
                "Taxation of dividends",
                "Capital gains",
                "Losses",
                "Foreign tax credit",
                "Foreign tax relief",
                "Participation exemption",
                "Holding company regime",
                "Incentives",
            }:
                # Only stop if this looks like a long prose KV, not a rate row
                if len(nxt) > 80:
                    break
            chunk.append(nxt)
            i += 1

        pairs, leftover = extract_pairs_from_lines(chunk)
        if len(pairs) >= 2:
            bracketish = sum(
                1
                for k, _ in pairs
                if re.search(r"up to|over|above|from|\d.*[-–—].*\d", k, re.I)
            )
            out.append("")
            if bracketish >= max(2, len(pairs) // 2):
                out.extend(
                    to_md_table(["Taxable income / band", "Rate"], [[k, v] for k, v in pairs])
                )
            else:
                out.extend(
                    to_md_table(["Item", "Rate / amount"], [[k, v] for k, v in pairs])
                )
            out.append("")
            for line in leftover:
                if line:
                    out.append(line)
        else:
            for line in chunk:
                out.append(line)
    return out


def normalize_bullets_inline(text: str) -> str:
    # "is: • A; • B; and • C" → multiline list when many bullets
    def repl(m: re.Match) -> str:
        body = m.group(1)
        parts = [p.strip(" ;") for p in re.split(r"\s*•\s*", body) if p.strip(" ;")]
        if len(parts) < 2:
            return m.group(0)
        return ":\n" + "\n".join(f"- {p}" for p in parts)

    return re.sub(r":\s*((?:•\s*[^•]+){2,})", repl, text)


def pdf_to_md(pdf_path: Path) -> tuple[str, dict]:
    doc = fitz.open(pdf_path)
    raw = "\n".join(page.get_text("text") for page in doc)
    pages = doc.page_count
    doc.close()
    country = pdf_path.stem

    body = promote_sections(clean_text(raw), country)
    lines = join_soft_wraps(body.split("\n"))
    lines = structure_rate_sections(lines)
    lines = structure_kv_lines(lines)
    body = "\n".join(lines)
    body = normalize_bullets_inline(body)
    body = re.sub(r"\n{3,}", "\n\n", body).strip()
    if not body.startswith("# "):
        body = f"# {country} Tax Highlights\n\n{body}"

    md = "\n".join(
        [
            body,
            "",
            "---",
            "",
            f"**Source:** Deloitte International Tax {country} Highlights (PDF)",
            f"**Country / jurisdiction:** {country}",
            f"**Pages:** {pages}",
            "",
            f"Keywords: Deloitte Tax Highlights {country} corporate tax individual tax withholding VAT rates",
            "",
        ]
    )
    return md, {"country": country, "pages": pages, "chars": len(md)}


def copy_to_desktop(out_dir: Path) -> Path | None:
    """Best-effort copy to Desktop DIFY folder (may fail under TCC)."""
    candidates = [
        Path.home() / "Desktop" / "DIFY知识库" / "Deloitte-Tax-Highlights-MD",
        Path.home() / "Desktop" / "DIFY知识库" / "Deloitte-Tax-Highlights" / "md",
        Path.home() / "Desktop" / "Deloitte-Tax-Highlights-MD",
    ]
    for dest in candidates:
        try:
            dest.parent.mkdir(parents=True, exist_ok=True)
            if dest.exists():
                shutil.rmtree(dest)
            shutil.copytree(out_dir, dest)
            return dest
        except OSError:
            continue
    return None


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--pdf-dir", type=Path, default=DEFAULT_PDF_DIR)
    ap.add_argument("--out-dir", type=Path, default=DEFAULT_OUT_DIR)
    ap.add_argument("--no-desktop-copy", action="store_true")
    args = ap.parse_args()

    pdf_dir: Path = args.pdf_dir
    out_dir: Path = args.out_dir
    pdfs = sorted(pdf_dir.glob("*.pdf"))
    if not pdfs:
        raise SystemExit(f"No PDFs in {pdf_dir}")

    out_dir.mkdir(parents=True, exist_ok=True)
    for old in out_dir.glob("*.md"):
        old.unlink()

    print(f"Converting {len(pdfs)} PDFs -> {out_dir}")
    index = [
        "# Deloitte International Tax Highlights",
        "",
        f"共 {len(pdfs)} 个司法管辖区，由 PDF 转换为 Markdown（含税率表 / 键值列表结构化），供 Dify 知识库使用。",
        "",
        "## 可读性处理说明",
        "",
        "- 规整的税率 / 税档对照 → Markdown 表格",
        "- `Label: value` 密集字段 → `- **Label**: value` 列表",
        "- 复杂叙述保留段落；`•` 转为 Markdown 列表",
        "",
        "## 文件列表",
        "",
    ]
    table_docs = 0
    for i, pdf in enumerate(pdfs, 1):
        md, meta = pdf_to_md(pdf)
        # Prefixed so Dify KB does not collide with EY country docs of the same stem.
        out_name = f"Deloitte-Tax-Highlights-{pdf.stem}.md"
        (out_dir / out_name).write_text(md, encoding="utf-8")
        if "\n| " in md and "\n| ---" in md:
            table_docs += 1
        index.append(
            f"- [{meta['country']}](./{out_name})"
            f"（{meta['pages']} 页，约 {meta['chars']} 字符）"
        )
        if i % 30 == 0 or i == len(pdfs):
            print(f"  [{i}/{len(pdfs)}] {pdf.name}")

    index.insert(
        8,
        f"- 含 Markdown 表格的文件约 **{table_docs}/{len(pdfs)}** 个",
    )
    index.insert(9, "")
    (out_dir / "README.md").write_text("\n".join(index) + "\n", encoding="utf-8")
    print(f"Done. Tables detected in ~{table_docs}/{len(pdfs)} files.")

    if not args.no_desktop_copy:
        dest = copy_to_desktop(out_dir)
        if dest:
            print(f"Copied to Desktop: {dest}")
        else:
            print(
                "Desktop copy skipped (permission). "
                f"MD files are in: {out_dir}"
            )


if __name__ == "__main__":
    main()
