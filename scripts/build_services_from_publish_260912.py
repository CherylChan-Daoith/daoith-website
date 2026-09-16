#!/usr/bin/env python3
"""Rebuild js/services.js from 服务产品发布页_260912.docx (publish-page format)."""
from __future__ import annotations

import json
import re
from pathlib import Path

from docx import Document
from docx.oxml.ns import qn
from docx.table import Table
from docx.text.paragraph import Paragraph

ROOT = Path(__file__).resolve().parents[1]
DOCX = Path("/Users/cheryl/Desktop/服务管理/服务产品发布页_260912.docx")
OUT = ROOT / "js" / "services.js"
JSON_OUT = ROOT / "data" / "service-publish-260912.json"

# Mainland / HK products: title fragment → (id, category, priceLabel, priceValue, unit)
PRODUCT_META = {
    "财税专家 1v1 咨询": ("consult-1v1", "consult", "¥2,999", 2999, "/小时"),
    "跨境电商财税合规方案定制": ("domestic-diagnosis", "consult", "¥28,000", 28000, "/次"),
    "财税合规陪跑": ("consult-annual", "consult", "¥38,000", 38000, "/年起"),
    "企业财务管理 AI 落地陪跑": ("consult-ai-finance-coach", "consult", "¥60,000", 60000, "起"),
    "高新技术企业申请": ("consult-hnte", "consult", "¥68,000", 68000, ""),
    "软件企业申请": ("consult-software-enterprise", "consult", "¥50,000", 50000, ""),
    "技术先进型服务企业申请": ("consult-atas", "consult", "¥50,000", 50000, ""),
    "合规代账": ("domestic-compliance-bookkeeping", "compliance", "¥5,000", 5000, "/年起"),
    "公司注册服务（公司设立）": ("domestic-setup", "compliance", "¥500", 500, "/次"),
    "个体户注册核定及税务申报": ("domestic-1039-sole", "compliance", "¥4,500", 4500, "/年"),
    "1039 市场采购出口": ("domestic-1039-export", "compliance", "0.4%", 0, "/报关金额"),
    "进出口权办理": ("domestic-trade-license", "compliance", "¥2,000", 2000, ""),
    "首单退税辅导": ("domestic-rebate-first", "compliance", "¥10,000", 10000, ""),
    "代理退税申报": ("domestic-rebate", "compliance", "0.1%", 5000, "/年起"),
    "1210/9610 出口退税首单陪跑服务": ("domestic-rebate-1210-9610", "compliance", "¥10,000", 10000, ""),
    "9810 出口退税首单陪跑服务": ("domestic-rebate-9810", "compliance", "¥10,000", 10000, ""),
    "香港公司注册": ("hk-company", "hongkong", "¥5,000", 5000, ""),
    "香港公司年审": ("hk-annual", "hongkong", "¥3,000", 3000, "/次"),
    "香港公司审计报税": ("hk-audit-tax", "hongkong", "¥2,200", 2200, "起"),
    "香港公司开立银行账户": ("hk-bank", "hongkong", "¥5,000", 5000, "起"),
    "香港公司变更服务": ("hk-change", "hongkong", "¥800", 800, "起"),
    "香港公司注销": ("hk-deregister", "hongkong", "¥3,500", 3500, "/次"),
    "0110 出口退税 + 香港公司合规全托管": ("domestic-arch-0110-hk", "compliance", "全托管计价", 0, "/3项起9折"),
    "1039 出口免税 + 香港公司合规全托管": ("domestic-arch-1039-hk", "compliance", "全托管计价", 0, "/3项起9折"),
}

# Overseas leaf SKUs (also used as product-start detectors under country sections)
OVERSEAS_META = {
    "马来西亚公司设立": ("asia-my-setup", "asia", "¥12,800", 12800, ""),
    "马来西亚公司做账报税": ("asia-my-bookkeeping", "asia", "¥10,000", 10000, "起"),
    "马来西亚公司年审": ("asia-my-audit", "asia", "¥10,000", 10000, ""),
    "新加坡公司设立": ("asia-sg-setup", "asia", "¥39,000", 39000, ""),
    "新加坡公司做账报税": ("asia-sg-bookkeeping", "asia", "¥55,800", 55800, "起"),
    "新加坡公司审计服务": ("asia-sg-audit", "asia", "¥34,200", 34200, "起"),
    "英国公司设立": ("europe-uk-setup", "europe", "¥4,300", 4300, ""),
    "英国 VAT 注册及申报": ("europe-uk-vat", "europe", "¥1,500", 1500, ""),
    "英国VAT注册及申报": ("europe-uk-vat", "europe", "¥1,500", 1500, ""),
    "英国公司做账报税（不含 VAT）": ("europe-uk-bookkeeping", "europe", "¥4,000", 4000, "起"),
    "英国公司做账报税": ("europe-uk-bookkeeping", "europe", "¥4,000", 4000, "起"),
    "德国公司设立": ("europe-de-setup", "europe", "¥80,000", 80000, ""),
    "德国 VAT 注册及申报": ("europe-de-vat", "europe", "¥2,500", 2500, ""),
    "德国VAT注册及申报": ("europe-de-vat", "europe", "¥2,500", 2500, ""),
    "德国公司做账报税（不含 VAT）": ("europe-de-bookkeeping", "europe", "¥20,000", 20000, "起"),
    "德国公司做账报税": ("europe-de-bookkeeping", "europe", "¥20,000", 20000, "起"),
    "法国公司设立": ("europe-fr-setup", "europe", "¥13,000", 13000, ""),
    "法国 VAT 税号注册": ("europe-fr-vat", "europe", "¥3,500", 3500, "起"),
    "法国VAT税号注册": ("europe-fr-vat", "europe", "¥3,500", 3500, "起"),
    "法国公司做账报税（不含 VAT）": ("europe-fr-bookkeeping", "europe", "¥10,000", 10000, "起"),
    "法国公司做账报税": ("europe-fr-bookkeeping", "europe", "¥10,000", 10000, "起"),
    "美国公司设立": ("other-us-setup", "other", "¥2,500", 2500, "起"),
    "美国公司做账报税": ("other-us-bookkeeping", "other", "¥2,500", 2500, "起"),
}

COUNTRY_MARKERS = {"马来西亚", "新加坡", "英国", "德国", "法国", "美国"}

BUNDLE_0110 = {
    "id": "0110",
    "discountFrom": 3,
    "discountRate": 0.9,
    "discountLabel": "3项及以上全托管可享受9折",
    "modules": [
        {"label": "①出口公司设立", "serviceId": "domestic-setup", "priceValue": 500, "priceLabel": "¥500"},
        {"label": "②进出口权办理", "serviceId": "domestic-trade-license", "priceValue": 2000, "priceLabel": "¥2,000"},
        {"label": "③首单退税辅导", "serviceId": "domestic-rebate-first", "priceValue": 10000, "priceLabel": "¥10,000"},
        {
            "label": "④代理退税申报",
            "serviceId": "domestic-rebate",
            "priceValue": 0,
            "priceLabel": "按出口额0.1%",
            "pricingModel": "percent",
            "volumeScope": "mainland",
            "rate": 0.001,
            "minFee": 5000,
            "maxFee": 30000,
        },
        {"label": "⑤退税公司记账报税", "serviceId": "domestic-compliance-bookkeeping", "priceValue": 5000, "priceLabel": "¥5,000起"},
        {"label": "⑥香港公司年审", "serviceId": "hk-annual", "priceValue": 3000, "priceLabel": "¥3,000"},
        {
            "label": "⑦香港公司审计报税",
            "serviceId": "hk-audit-tax",
            "priceValue": 0,
            "priceLabel": "按营业额分级",
            "pricingModel": "tier",
            "volumeScope": "hk",
            "tiers": "hk-audit-ecom",
        },
    ],
}

BUNDLE_1039 = {
    "id": "1039",
    "discountFrom": 3,
    "discountRate": 0.9,
    "discountLabel": "3项及以上全托管可享受9折",
    "modules": [
        {"label": "①个体户注册核定及税务申报", "serviceId": "domestic-1039-sole", "priceValue": 4500, "priceLabel": "¥4,500起"},
        {
            "label": "②1039市场采购出口",
            "serviceId": "domestic-1039-export",
            "priceValue": 0,
            "priceLabel": "按报关金额0.4%",
            "pricingModel": "percent",
            "volumeScope": "mainland",
            "rate": 0.004,
            "minFee": 0,
        },
        {"label": "③香港公司年审", "serviceId": "hk-annual", "priceValue": 3000, "priceLabel": "¥3,000"},
        {
            "label": "④香港公司审计报税",
            "serviceId": "hk-audit-tax",
            "priceValue": 0,
            "priceLabel": "按营业额分级",
            "pricingModel": "tier",
            "volumeScope": "hk",
            "tiers": "hk-audit-ecom",
        },
    ],
}


def iter_block_items(doc: Document):
    for child in doc.element.body.iterchildren():
        if child.tag == qn("w:p"):
            yield ("p", Paragraph(child, doc))
        elif child.tag == qn("w:tbl"):
            yield ("t", Table(child, doc))


def para_has_strike(p: Paragraph) -> bool:
    for run in p.runs:
        if run.font.strike:
            return True
        rPr = run._element.rPr
        if rPr is not None and (
            rPr.find(qn("w:strike")) is not None or rPr.find(qn("w:dstrike")) is not None
        ):
            return True
    return False


def table_rows(table: Table) -> list[list[str]]:
    rows = []
    for row in table.rows:
        cells = []
        seen = None
        for c in row.cells:
            txt = re.sub(r"\s+", " ", c.text.strip())
            if txt != seen:
                cells.append(txt)
                seen = txt
        if any(cells):
            rows.append(cells)
    return rows


def normalize_title(t: str) -> str:
    return re.sub(r"\s+", " ", t.strip())


def match_leaf_title(t: str) -> str | None:
    """Return canonical title if paragraph starts a leaf product."""
    raw = normalize_title(t)
    if raw in OVERSEAS_META or raw in PRODUCT_META:
        return raw
    # tolerate spacing / VAT variants
    compact = raw.replace(" ", "")
    for key in list(OVERSEAS_META) + list(PRODUCT_META):
        if key.replace(" ", "") == compact:
            return key
    return None


def parse_docx(path: Path) -> list[dict]:
    doc = Document(str(path))
    products: list[dict] = []
    current = None
    section = None
    field = None

    def flush():
        nonlocal current
        if current and current.get("title") not in COUNTRY_MARKERS:
            products.append(current)
        current = None

    def start_product(title: str):
        nonlocal current, field
        flush()
        current = {
            "section": section,
            "title": title,
            "tagline": "",
            "fields": {},
            "tables": [],
        }
        field = None

    for kind, item in iter_block_items(doc):
        if kind == "p":
            t = item.text.strip()
            if not t:
                continue
            struck = para_has_strike(item)
            if re.match(r"^[一二三四五六]、", t):
                flush()
                section = t
                field = None
                continue
            if t.startswith("▎"):
                title = re.sub(r"^\d+\.\s*", "", t.lstrip("▎").strip())
                title = normalize_title(title)
                if title in COUNTRY_MARKERS:
                    # country banner only — leaf SKUs follow as plain titles
                    flush()
                    field = None
                    continue
                start_product(title)
                continue
            leaf = match_leaf_title(t)
            if leaf and (current is None or normalize_title(current.get("title", "")) != leaf):
                # overseas / nested leaf product title
                start_product(leaf)
                continue
            if current is None:
                continue
            if t.startswith("「") and "」" in t:
                current["tagline"] = t.strip("「」")
                continue
            headers = [
                "服务简介",
                "服务内容",
                "服务周期",
                "服务流程",
                "服务收费",
                "适合对象",
                "核心优势",
                "办理条件",
            ]
            matched = next((h for h in headers if t.startswith(h)), None)
            if matched:
                field = matched
                current["fields"].setdefault(field, [])
                continue
            if field and not struck:
                if "━━━━" in t:
                    continue
                if "红色标注" in t and "服务协议" in t:
                    continue
                current["fields"].setdefault(field, []).append(t)
        else:
            if current is None:
                continue
            rows = table_rows(item)
            if rows:
                current["tables"].append({"field": field or "table", "rows": rows})

    flush()
    return products


def js_str(s: str) -> str:
    s = str(s or "").replace("\r\n", "\n").replace("\r", "\n")
    return "`" + s.replace("\\", "\\\\").replace("`", "\\`") + "`"


def join_lines(lines: list[str]) -> str:
    return "\n".join(x.strip() for x in lines if x and x.strip())


def process_steps_from_tables(tables: list[dict], index: int = 0) -> list[dict]:
    flow = [t for t in tables if t.get("field") == "服务流程"]
    if index >= len(flow):
        return []
    rows = flow[index]["rows"]
    steps = []
    for row in rows[1:]:
        if len(row) < 2:
            continue
        title = row[1].strip()
        time = row[2].strip() if len(row) > 2 else ""
        if title:
            steps.append({"title": title, "time": time})
    return steps


def pricing_table_from_tables(tables: list[dict]) -> dict | None:
    for t in tables:
        if t.get("field") != "服务收费":
            continue
        rows = t["rows"]
        if len(rows) < 2:
            continue
        headers = rows[0]
        body = [r for r in rows[1:] if any(r)]
        if body:
            return {"headers": headers, "rows": body}
    return None


def split_fee_lines(lines: list[str]) -> tuple[str, str]:
    """Return (main_pricing_display, note). Prefer empty main when table exists."""
    cleaned = [x for x in lines if x and "━━━━" not in x]
    if not cleaned:
        return "", ""
    # If first looks like a price and rest are notes
    if len(cleaned) == 1:
        return cleaned[0], ""
    # multi: first may be price or note-in-parens
    if cleaned[0].startswith("（") or cleaned[0].startswith("("):
        return "", join_lines(cleaned)
    return cleaned[0], join_lines(cleaned[1:])


def ai_coach_table() -> dict:
    return {
        "headers": ["交付期", "服务费", "说明"],
        "rows": [
            ["2个月内", "¥60,000", "调研后确认可在2个月内完成约定范围落地"],
            ["4个月内", "¥100,000", "调研后确认可在4个月内完成约定范围落地"],
            ["6个月内", "¥150,000", "调研后确认可在6个月内完成约定范围落地"],
        ],
    }


def coach_note_from_fee(fee_lines: list[str]) -> str:
    text = join_lines(fee_lines)
    # strip leading tier list if present
    if "按陪跑周期" in text:
        idx = text.find("按陪跑周期")
        return text[idx:]
    if "；" in text and "60,000" in text:
        parts = text.split("；", 1)
        return parts[1] if len(parts) > 1 else text
    return text


def emit_service(
    *,
    sid: str,
    category: str,
    title: str,
    desc: str,
    price_label: str,
    price_value: int,
    unit: str,
    content: str,
    cycle: str,
    process_steps: list[dict],
    pricing: str,
    pricing_note: str,
    pricing_table: dict | None,
    advantages: str,
    audience: str,
    conditions: str = "",
    bundle: dict | None = None,
) -> str:
    steps_js = "null"
    if process_steps:
        step_parts = []
        for s in process_steps:
            step_parts.append(
                "{ title: %s, time: %s }"
                % (js_str(s.get("title", "")), js_str(s.get("time", "")))
            )
        steps_js = "[" + ", ".join(step_parts) + "]"

    table_js = "null"
    if pricing_table:
        headers = json.dumps(pricing_table["headers"], ensure_ascii=False)
        rows = json.dumps(pricing_table["rows"], ensure_ascii=False)
        table_js = "{\n          headers: %s,\n          rows: %s,\n        }" % (headers, rows)

    bundle_js = "null"
    if bundle:
        bundle_js = json.dumps(bundle, ensure_ascii=False)

    return f"""    {{
      id: '{sid}',
      category: '{category}',
      title: {js_str(title)},
      desc: {js_str(desc)},
      priceLabel: {js_str(price_label)},
      priceValue: {price_value},
      unit: {js_str(unit)},
      details: excelBlocks({{
        content: {js_str(content)},
        cycle: {js_str(cycle)},
        processSteps: {steps_js},
        process: ``,
        pricing: {js_str(pricing)},
        pricingNote: {js_str(pricing_note)},
        advantages: {js_str(advantages)},
        audience: {js_str(audience)},
        conditions: {js_str(conditions)},
        pricingTable: {table_js},
        bundle: {bundle_js},
      }}),
    }}"""


def find_meta(title: str):
    t = normalize_title(title)
    if t in PRODUCT_META:
        sid, cat, plabel, pval, unit = PRODUCT_META[t]
        return sid, cat, t, plabel, pval, unit
    if t in OVERSEAS_META:
        sid, cat, plabel, pval, unit = OVERSEAS_META[t]
        return sid, cat, t, plabel, pval, unit
    compact = t.replace(" ", "")
    for k, v in PRODUCT_META.items():
        if k.replace(" ", "") == compact:
            sid, cat, plabel, pval, unit = v
            return sid, cat, k, plabel, pval, unit
    for k, v in OVERSEAS_META.items():
        if k.replace(" ", "") == compact:
            sid, cat, plabel, pval, unit = v
            return sid, cat, k, plabel, pval, unit
    return None


def build_from_product(p: dict) -> list[str]:
    out: list[str] = []
    fields = p.get("fields") or {}
    tables = p.get("tables") or []
    tagline = (p.get("tagline") or "").strip()
    intro = join_lines(fields.get("服务简介") or [])
    content = join_lines(fields.get("服务内容") or [])
    cycle = join_lines(fields.get("服务周期") or [])
    advantages = join_lines(fields.get("核心优势") or [])
    audience = join_lines(fields.get("适合对象") or [])
    conditions = join_lines(fields.get("办理条件") or [])
    fee_lines = fields.get("服务收费") or []
    pricing_table = pricing_table_from_tables(tables)

    meta = find_meta(p["title"])
    if not meta:
        print("WARN skip unmapped:", p["title"])
        return []
    sid, cat, title, plabel, pval, unit = meta
    steps = process_steps_from_tables(tables, 0)
    main_price, note = split_fee_lines(fee_lines)

    # Special cases
    if sid == "consult-ai-finance-coach":
        pricing_table = ai_coach_table()
        main_price = ""
        note = coach_note_from_fee(fee_lines) or (
            "按陪跑周期分档计价；含调研诊断、规划、搭建、部署、带教与验收；第三方软件费用及超范围定制开发另计；可按里程碑分期支付"
        )
    if sid == "consult-annual":
        main_price = ""
        note = "按年签约；周期内线上沟通不限次数，重大税局事项随时响应；尚未完成诊断者可搭配「跨境电商财税合规方案定制」先行出方案再进入陪跑。"
    if sid == "consult-1v1":
        main_price = "¥2,999 / 小时"
        note = "不足 1 小时按 1 小时计费；超出1小时部分按半小时为单位计费"
    if sid == "domestic-diagnosis":
        main_price = "28,000 元/次"
        note = "建议配合「财税合规陪跑」服务购买"
    if pricing_table:
        main_price = ""

    bundle = None
    if sid == "domestic-arch-0110-hk":
        bundle = BUNDLE_0110
        packs = [x for x in fee_lines if ("：" in x or ":" in x) and "根据选项" not in x and "套餐" not in x]
        rows = []
        for line in packs:
            parts = re.split(r"[：:]", line, 1)
            if len(parts) == 2:
                rows.append([parts[0].strip(), parts[1].strip(), ""])
        if rows:
            pricing_table = {"headers": ["套餐参考", "模块组合", "说明"], "rows": rows}
        main_price = ""
        note = "根据选项组合计价，3项及以上组合享9折"
    if sid == "domestic-arch-1039-hk":
        bundle = BUNDLE_1039
        packs = [x for x in fee_lines if ("：" in x or ":" in x) and "根据选项" not in x and "套餐" not in x]
        rows = []
        for line in packs:
            parts = re.split(r"[：:]", line, 1)
            if len(parts) == 2:
                rows.append([parts[0].strip(), parts[1].strip(), ""])
        if rows:
            pricing_table = {"headers": ["套餐参考", "模块组合", "说明"], "rows": rows}
        main_price = ""
        note = "根据选项组合计价，3项及以上组合享9折；1039出口代理费（报关金额0.4%）另计。"

    # US setup: fee line is note-only; table carries state prices
    if sid == "other-us-setup" and pricing_table:
        main_price = ""
        note = join_lines(fee_lines)

    desc = intro or tagline or (content.split("\n")[0][:100] if content else title)
    if intro:
        desc = intro
    elif tagline:
        desc = tagline

    out.append(
        emit_service(
            sid=sid,
            category=cat,
            title=title,
            desc=desc,
            price_label=plabel,
            price_value=pval,
            unit=unit,
            content=content,
            cycle=cycle,
            process_steps=steps,
            pricing=main_price,
            pricing_note=note,
            pricing_table=pricing_table,
            advantages=advantages,
            audience=audience,
            conditions=conditions,
            bundle=bundle,
        )
    )
    return out


HEADER = r'''/* DAOITH service marketplace catalog
 * Source of truth: 服务产品发布页_260912.docx（发布页格式与内容）
 * Categories: consult | compliance | hongkong | asia | europe | other
 */
(function () {
  /** Single fee → bold text; multi fee → pricing table only (never both). */
  function formatSinglePricingDisplay(pricing) {
    const t = String(pricing || '').trim();
    if (!t) return '';
    if (/^\d[\d,]*$/.test(t)) {
      const n = Number(t.replace(/,/g, ''));
      if (Number.isFinite(n)) return `¥${n.toLocaleString('zh-CN')}`;
    }
    if (/^\d[\d,]*起$/.test(t)) {
      const n = Number(t.replace(/[,起]/g, ''));
      if (Number.isFinite(n)) return `¥${n.toLocaleString('zh-CN')}起`;
    }
    return t;
  }

  function excelBlocks(p) {
    const out = [];
    const content = p.content || '';
    const cycle = p.cycle || '';
    const process = p.process || '';
    const processSteps = Array.isArray(p.processSteps) ? p.processSteps : null;
    const pricing = p.pricing || '';
    const pricingNote = p.pricingNote || '';
    const advantages = p.advantages || '';
    const audience = p.audience || '';
    const conditions = p.conditions || '';
    const pricingTable = p.pricingTable || null;
    const bundle = p.bundle || null;

    function pushLines(title, text) {
      const raw = String(text || '').trim();
      if (!raw) return;
      out.push({ type: 'h2', text: title });
      out.push({ type: 'publish', text: raw });
    }

    pushLines('服务内容', bundle ? '' : content);
    if (bundle) {
      out.push({ type: 'h2', text: '服务内容' });
      out.push({ type: 'bundle-picker', bundle });
    }

    pushLines('办理条件', conditions);
    pushLines('服务周期', cycle);

    out.push({ type: 'h2', text: '服务流程' });
    if (processSteps && processSteps.length) {
      out.push({ type: 'timeline', steps: processSteps });
    } else if (process) {
      const steps = String(process).split(/→|->|➡/).map((s) => s.replace(/[。．]+$/g, '').trim()).filter(Boolean);
      if (steps.length > 1) {
        out.push({ type: 'timeline', steps: steps.map((title) => ({ title })) });
      } else {
        out.push({ type: 'publish', text: process });
      }
    }

    out.push({ type: 'h2', text: '服务收费' });
    const hasPricingTable = !!(pricingTable?.headers && pricingTable?.rows?.length);
    if (hasPricingTable) {
      out.push({
        type: 'table',
        variant: 'pricing',
        firstColHeader: true,
        headers: pricingTable.headers,
        rows: pricingTable.rows,
      });
    } else if (pricing) {
      out.push({ type: 'price', text: formatSinglePricingDisplay(pricing) });
    }
    if (pricingNote) out.push({ type: 'note', text: pricingNote });
    if (bundle) {
      out.push({ type: 'bundle-price', bundleId: bundle.id });
    }

    pushLines('核心优势', advantages);

    if (audience) {
      out.push({ type: 'h2', text: '适合对象' });
      const items = String(audience)
        .split(/\n/)
        .map((s) => s.trim())
        .filter(Boolean);
      if (items.length > 1) out.push({ type: 'ul', items });
      else out.push({ type: 'publish', text: audience });
    }
    return out;
  }

  window.DAOITH_SERVICE_CATEGORIES = [
    { id: 'all', label: '全部', en: 'All' },
    { id: 'consult', label: '财税咨询', en: 'Advisory', blurb: '1v1、方案定制、陪跑与资质认定', blurbEn: '1-on-1, custom plans, coaching and qualifications' },
    { id: 'compliance', label: '财税合规', en: 'Tax compliance', blurb: '合规代账、全托管、退税与出口合规', blurbEn: 'Bookkeeping, managed packs, rebates and export compliance' },
    { id: 'hongkong', label: '中国香港', en: 'Hong Kong', blurb: '注册、年审、审计报税、开户与变更注销', blurbEn: 'Setup, annual return, audit & tax, banking, changes' },
    { id: 'asia', label: '亚洲', en: 'Asia', blurb: '马来西亚、新加坡公司与财税服务', blurbEn: 'Malaysia and Singapore' },
    { id: 'europe', label: '欧洲', en: 'Europe', blurb: '英国、德国、法国 VAT、公司设立与做账报税', blurbEn: 'UK, Germany and France VAT, setup and bookkeeping' },
    { id: 'other', label: '其他地区', en: 'Other regions', blurb: '美国等跨境主体与合规', blurbEn: 'US and other markets' },
  ];

  window.DAOITH_SERVICES = [
'''

FOOTER = r'''
  ];

  const LEGACY_SERVICE_IDS = {
    'tax-consult': 'consult-1v1',
    'tax-diagnosis': 'domestic-diagnosis',
    'tax-coach': 'consult-annual',
    bookkeeping: 'domestic-compliance-bookkeeping',
    'company-setup': 'domestic-setup',
    'sole-trader': 'domestic-1039-sole',
    'export-1039': 'domestic-1039-export',
    'trade-license': 'domestic-trade-license',
    'rebate-first': 'domestic-rebate-first',
    'rebate-agent': 'domestic-rebate',
    'hk-setup': 'hk-company',
    'hk-annual-return': 'hk-annual',
    'hk-audit': 'hk-audit-tax',
    'bundle-0110': 'domestic-arch-0110-hk',
    'bundle-1039': 'domestic-arch-1039-hk',
    'hk-bank-account': 'hk-bank',
    'hk-alteration': 'hk-change',
    'hk-cancel': 'hk-deregister',
  };

  window.getServiceById = function getServiceById(id) {
    const resolved = LEGACY_SERVICE_IDS[id] || id;
    return (window.DAOITH_SERVICES || []).find((s) => s.id === resolved) || null;
  };

  window.formatServicePrice = function formatServicePrice(value) {
    const n = Number(value) || 0;
    return `¥${n.toLocaleString('zh-CN')}`;
  };

  /** Volume / tier pricing used by bundles + cart auto-calc */
  const HK_AUDIT_ECOM_TIERS = [
    { max: 0, fee: 2200, label: '无运营' },
    { max: 2000000, fee: 4800, label: '≤200万港币' },
    { max: 6000000, fee: 6000, label: '≤600万港币' },
    { max: 10000000, fee: 7200, label: '≤1,000万港币' },
    { max: 20000000, fee: 10000, label: '≤2,000万港币' },
    { max: 40000000, fee: 13000, label: '≤4,000万港币' },
    { max: 60000000, fee: 14800, label: '≤6,000万港币' },
    { max: 80000000, fee: 17800, label: '≤8,000万港币' },
    { max: 100000000, fee: 20500, label: '≤1亿港币' },
    { max: 150000000, fee: 25000, label: '≤1.5亿港币' },
    { max: 200000000, fee: 31000, label: '≤2亿港币' },
  ];

  window.DAOITH_VOLUME_RULES = {
    'domestic-1039-export': {
      model: 'percent',
      scope: 'mainland',
      rate: 0.004,
      minFee: 0,
      metricLabel: { zh: '预计年报关金额（人民币）', en: 'Est. annual customs value (RMB)' },
      hint: { zh: '按报关金额 0.4% 预估；实际按票结算，单票另有最低收费。', en: 'Estimate at 0.4% of customs value; actual billing is per shipment.' },
    },
    'domestic-rebate': {
      model: 'percent',
      scope: 'mainland',
      rate: 0.001,
      minFee: 5000,
      maxFee: 30000,
      metricLabel: { zh: '预计年度出口额（人民币）', en: 'Est. annual export value (RMB)' },
      hint: { zh: '按年度出口额 0.1% 计，最低 ¥5,000 / 封顶 ¥30,000。', en: '0.1% of annual export value, min ¥5,000 / max ¥30,000.' },
    },
    'hk-audit-tax': {
      model: 'tier',
      scope: 'hk',
      tiers: 'hk-audit-ecom',
      metricLabel: { zh: '香港公司预计年营业额（港币）', en: 'Est. HK company annual turnover (HKD)' },
      hint: { zh: '按电商档位预估审计报税费；填 0 视为无运营档。', en: 'E-commerce audit tier estimate; enter 0 for dormant.' },
    },
  };

  function resolveTiers(key) {
    if (key === 'hk-audit-ecom') return HK_AUDIT_ECOM_TIERS;
    return Array.isArray(key) ? key : null;
  }

  function enrichModulePricing(mod) {
    if (!mod) return null;
    const rule = window.DAOITH_VOLUME_RULES[mod.serviceId || mod.id] || null;
    const pricingModel =
      mod.pricingModel ||
      (rule?.model) ||
      (Number(mod.priceValue) > 0 ? 'fixed' : 'percent');
    const volumeScope = mod.volumeScope || rule?.scope || null;
    return {
      id: mod.serviceId || mod.id || '',
      label: mod.label || '',
      priceValue: Number(mod.priceValue) || 0,
      priceLabel: mod.priceLabel || '',
      pricingModel,
      volumeScope,
      rate: mod.rate != null ? Number(mod.rate) : rule?.rate,
      minFee: mod.minFee != null ? Number(mod.minFee) : rule?.minFee,
      maxFee: mod.maxFee != null ? Number(mod.maxFee) : rule?.maxFee,
      tiers: mod.tiers || rule?.tiers || null,
    };
  }

  function isVolumeModule(mod) {
    const m = enrichModulePricing(mod);
    return m && (m.pricingModel === 'percent' || m.pricingModel === 'tier');
  }

  function feeFromVolume(mod, salesByScope) {
    const m = enrichModulePricing(mod);
    if (!m || !isVolumeModule(m)) return { fee: Math.max(0, Number(m?.priceValue) || 0), pending: false };
    const scope = m.volumeScope || 'mainland';
    const raw = salesByScope?.[scope];
    if (raw == null || raw === '') return { fee: 0, pending: true };
    const amount = Math.max(0, Number(raw) || 0);

    if (m.pricingModel === 'percent') {
      let fee = Math.round(amount * (Number(m.rate) || 0));
      if (m.minFee != null) fee = Math.max(fee, Number(m.minFee) || 0);
      if (m.maxFee != null) fee = Math.min(fee, Number(m.maxFee) || fee);
      return { fee, pending: false };
    }

    if (m.pricingModel === 'tier') {
      const tiers = resolveTiers(m.tiers);
      if (!tiers?.length) return { fee: 0, pending: true };
      if (amount <= 0) return { fee: Number(tiers[0].fee) || 0, pending: false };
      const hit = tiers.find((t, i) => i > 0 && amount <= Number(t.max)) || tiers[tiers.length - 1];
      return { fee: Number(hit?.fee) || 0, pending: false };
    }
    return { fee: 0, pending: false };
  }

  function repriceCartItem(item) {
    const salesByScope = item.salesByScope || {};
    const mods = Array.isArray(item.bundleSelection) ? item.bundleSelection.map(enrichModulePricing) : null;
    const service = window.getServiceById?.(item.id);

    if (!mods?.length) {
      const rule = window.DAOITH_VOLUME_RULES[item.id];
      if (!rule) {
        return {
          ...item,
          priceValue: Number(item.priceValue) || 0,
          priceLabel: item.priceLabel || window.formatServicePrice(item.priceValue),
          volumePending: false,
        };
      }
      const { fee, pending } = feeFromVolume({ serviceId: item.id, pricingModel: rule.model, volumeScope: rule.scope }, salesByScope);
      return {
        ...item,
        priceValue: pending ? 0 : fee,
        priceLabel: pending ? (window.DAOITH_getLocale?.() === 'en' ? 'Enter sales to estimate' : '填写销售额后计算') : window.formatServicePrice(fee),
        volumePending: pending,
        volumeScopes: [rule.scope],
      };
    }

    const fixed = mods.filter((m) => !isVolumeModule(m));
    const variable = mods.filter((m) => isVolumeModule(m));
    const fixedSub = fixed.reduce((s, m) => s + (Number(m.priceValue) || 0), 0);
    const count = mods.length;
    const bundle =
      (service?.details || []).find((b) => b.type === 'bundle-picker')?.bundle || null;
    const from = Number(bundle?.discountFrom) || 3;
    const rate = Number(bundle?.discountRate) || 1;
    const fixedDiscounted = count >= from && fixedSub > 0 ? Math.round(fixedSub * rate) : fixedSub;

    let volumeSum = 0;
    let pending = false;
    const pricedMods = mods.map((m) => {
      if (!isVolumeModule(m)) {
        return { ...m, computedFee: Number(m.priceValue) || 0 };
      }
      const r = feeFromVolume(m, salesByScope);
      if (r.pending) pending = true;
      volumeSum += r.fee;
      return { ...m, computedFee: r.fee, pending: r.pending };
    });

    const total = fixedDiscounted + volumeSum;
    const scopes = [...new Set(variable.map((m) => m.volumeScope).filter(Boolean))];
    let priceLabel = window.formatServicePrice(total);
    if (pending && !fixedDiscounted && !volumeSum) {
      priceLabel = window.DAOITH_getLocale?.() === 'en' ? 'Enter sales to estimate' : '填写销售额后计算';
    } else if (pending) {
      priceLabel = `${window.formatServicePrice(total)}+`;
    }

    return {
      ...item,
      bundleSelection: pricedMods,
      priceValue: total,
      priceLabel,
      volumePending: pending,
      volumeScopes: scopes,
      fixedSubtotal: fixedDiscounted,
      volumeSubtotal: volumeSum,
    };
  }

  window.DAOITH_pricing = {
    enrichModulePricing,
    isVolumeModule,
    feeFromVolume,
    repriceCartItem,
    volumeRule(serviceId) {
      return window.DAOITH_VOLUME_RULES[serviceId] || null;
    },
  };
})();
'''


def main():
    products = parse_docx(DOCX)
    JSON_OUT.parent.mkdir(parents=True, exist_ok=True)
    JSON_OUT.write_text(json.dumps(products, ensure_ascii=False, indent=2), encoding="utf-8")

    blocks: list[str] = []
    for p in products:
        blocks.extend(build_from_product(p))

    # Desired display order: consult → compliance → hongkong → asia → europe → other
    order = [
        "consult-1v1",
        "domestic-diagnosis",
        "consult-annual",
        "consult-ai-finance-coach",
        "consult-hnte",
        "consult-software-enterprise",
        "consult-atas",
        "domestic-compliance-bookkeeping",
        "domestic-arch-0110-hk",
        "domestic-arch-1039-hk",
        "domestic-setup",
        "domestic-1039-sole",
        "domestic-1039-export",
        "domestic-trade-license",
        "domestic-rebate-first",
        "domestic-rebate",
        "domestic-rebate-1210-9610",
        "domestic-rebate-9810",
        "hk-company",
        "hk-annual",
        "hk-audit-tax",
        "hk-bank",
        "hk-change",
        "hk-deregister",
        "asia-my-setup",
        "asia-my-bookkeeping",
        "asia-my-audit",
        "asia-sg-setup",
        "asia-sg-bookkeeping",
        "asia-sg-audit",
        "europe-uk-setup",
        "europe-uk-vat",
        "europe-uk-bookkeeping",
        "europe-de-setup",
        "europe-de-vat",
        "europe-de-bookkeeping",
        "europe-fr-setup",
        "europe-fr-vat",
        "europe-fr-bookkeeping",
        "other-us-setup",
        "other-us-bookkeeping",
    ]

    by_id = {}
    for b in blocks:
        m = re.search(r"id: '([^']+)'", b)
        if m:
            by_id[m.group(1)] = b

    missing = [i for i in order if i not in by_id]
    if missing:
        print("MISSING IDS:", missing)
    extras = [i for i in by_id if i not in order]
    if extras:
        print("EXTRA IDS:", extras)

    ordered = [by_id[i] for i in order if i in by_id]
    text = HEADER + ",\n".join(ordered) + FOOTER
    OUT.write_text(text, encoding="utf-8")
    print(f"Wrote {OUT} with {len(ordered)} services")


if __name__ == "__main__":
    main()
