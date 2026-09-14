#!/usr/bin/env python3
"""Rebuild js/services.js from 服务产品汇总表_260912.xlsx (verbatim product copy)."""
from __future__ import annotations

import re
import sys
from pathlib import Path

from openpyxl import load_workbook

ROOT = Path(__file__).resolve().parents[1]
EXCEL = Path("/Users/cheryl/Desktop/服务管理/服务产品汇总表_260912.xlsx")
OUT = ROOT / "js" / "services.js"
BACKUP = ROOT / "js" / "services.js"

# Excel name → (id, category)
NAME_MAP = {
    "专家1v1咨询": ("consult-1v1", "consult"),
    "跨境电商财税合规诊断": ("domestic-diagnosis", "consult"),
    "财税合规陪跑": ("consult-annual", "consult"),
    "企业财务管理AI落地陪跑": ("consult-ai-finance-coach", "consult"),
    "合规代账": ("domestic-compliance-bookkeeping", "domestic"),
    "公司注册服务（公司设立）": ("domestic-setup", "domestic"),
    "个体户注册核定及税务申报": ("domestic-1039-sole", "domestic"),
    "1039市场采购出口": ("domestic-1039-export", "domestic"),
    "进出口权办理": ("domestic-trade-license", "domestic"),
    "首单退税辅导": ("domestic-rebate-first", "domestic"),
    "代理退税申报": ("domestic-rebate", "domestic"),
    "1210/9610出口退税首单陪跑服务": ("domestic-rebate-1210-9610", "domestic"),
    "9810出口退税首单陪跑服务": ("domestic-rebate-9810", "domestic"),
    "香港公司注册": ("hk-company", "hongkong"),
    "香港公司年审": ("hk-annual", "hongkong"),
    "香港公司审计报税": ("hk-audit-tax", "hongkong"),
    "香港公司开立银行账户": ("hk-bank", "hongkong"),
    "香港公司变更服务": ("hk-change", "hongkong"),
    "香港公司注销": ("hk-deregister", "hongkong"),
    "0110出口退税+香港公司合规全托管": ("domestic-arch-0110-hk", "domestic"),
    "1039出口免税+香港公司合规全托管": ("domestic-arch-1039-hk", "domestic"),
    "高新技术企业申请": ("consult-hnte", "consult"),
    "软件企业申请": ("consult-software-enterprise", "consult"),
    "技术先进型服务企业申请": ("consult-atas", "consult"),
    "马来西亚公司设立": ("asia-my-setup", "asia"),
    "马来西亚公司做账报税": ("asia-my-bookkeeping", "asia"),
    "马来西亚公司年审": ("asia-my-audit", "asia"),
    "新加坡公司设立": ("asia-sg-setup", "asia"),
    "新加坡公司做账报税": ("asia-sg-bookkeeping", "asia"),
    "新加坡公司审计服务": ("asia-sg-audit", "asia"),
    "迪拜公司设立": ("other-ae-setup", "other"),
    "迪拜公司做账报税": ("other-ae-bookkeeping", "other"),
    "迪拜公司审计": ("other-ae-audit", "other"),
    "英国公司设立": ("europe-uk-setup", "europe"),
    "英国VAT注册及申报": ("europe-uk-vat", "europe"),
    "英国国公司做账报税（不含VAT）": ("europe-uk-bookkeeping", "europe"),
    "德国公司设立": ("europe-de-setup", "europe"),
    "德国VAT注册及申报": ("europe-de-vat", "europe"),
    "德国公司做账报税（不含VAT）": ("europe-de-bookkeeping", "europe"),
    "法国公司设立": ("europe-fr-setup", "europe"),
    "法国VAT税号注册": ("europe-fr-vat", "europe"),
    "法国公司做账报税（不含VAT）": ("europe-fr-bookkeeping", "europe"),
    "美国公司设立": ("other-us-setup", "other"),
    "美国公司做账报税": ("other-us-bookkeeping", "other"),
}

KEEP_FROM_BACKUP = []


def js_str(s: str) -> str:
    s = str(s or "").replace("\r\n", "\n").replace("\r", "\n")
    return "`" + s.replace("\\", "\\\\").replace("`", "\\`") + "`"


def parse_price(fee: str) -> tuple[str, int, str]:
    """Return (priceLabel, priceValue, unit)."""
    fee = str(fee or "").strip().replace("100.000", "100,000")
    if not fee:
        return ("询价", 0, "")
    # percent styles
    if "0.4%" in fee or "0.1%" in fee:
        if "0.4%" in fee:
            return ("0.4%", 0, "/报关金额")
        return ("0.1%", 5000, "/年起")
    if "组合" in fee or "选项" in fee or "9折" in fee or "9折" in fee:
        return ("全托管计价", 0, "/3项起9折")

    # collect first money-like number
    m = re.search(r"[¥￥]?\s*([\d,]+(?:\.\d+)?)\s*万?", fee)
    # also 28,000元 / 48000
    if not m:
        m = re.search(r"([\d,]+)", fee.replace(",", ""))
        if m:
            val = int(float(m.group(1)))
            label = f"¥{val:,}"
            unit = ""
            if "起" in fee:
                unit = "起"
            elif "/年" in fee or "元/年" in fee:
                unit = "/年起" if "起" in fee else "/年"
            elif "/次" in fee or "元/次" in fee:
                unit = "/次"
            elif "/小时" in fee:
                unit = "/小时"
            return (label, val, unit)

    raw = fee.split("\n")[0].strip()
    nums = re.findall(r"([\d,]+(?:\.\d+)?)", fee.replace("¥", "").replace("￥", ""))
    val = 0
    if nums:
        # prefer larger meaningful first line number
        first_line_nums = re.findall(r"([\d,]+(?:\.\d+)?)", raw.replace("¥", "").replace("￥", ""))
        pick = first_line_nums[0] if first_line_nums else nums[0]
        val = int(float(pick.replace(",", "")))
        if "万" in raw and val < 1000:
            val *= 10000

    if val <= 0:
        return (raw[:40] or "询价", 0, "")

    label = f"¥{val:,}"
    unit = ""
    if "小时" in fee:
        unit = "/小时"
    elif "起" in fee:
        unit = "起"
    elif "/年" in fee or "元/年" in fee:
        unit = "/年"
    elif "/次" in fee or "元/次" in fee:
        unit = "/次"
    elif "个月内" in fee:
        unit = "起"
    return (label, val, unit)


def hk_audit_table() -> str:
    return """{
          headers: ["营业额分档", "一般贸易", "电商"],
          rows: [
            ["无运营", "2,200元/年", "2,200元/年"],
            ["≤200万港币", "普通≤3,200元/年", "电商≤4,800元/年"],
            ["≤600万港币", "普通≤4,000元/年", "电商≤6,000元/年"],
            ["≤1,000万港币", "普通≤4,800元/年", "电商≤7,200元/年"],
            ["≤2,000万港币", "普通≤6,600元/年", "电商≤10,000元/年"],
            ["≤4,000万港币", "普通≤8,500元/年", "电商≤13,000元/年"],
            ["≤6,000万港币", "普通≤9,800元/年", "电商≤14,800元/年"],
            ["≤8,000万港币", "普通≤11,600元/年", "电商≤17,800元/年"],
            ["≤1亿港币", "普通≤13,600元/年", "电商≤20,500元/年"],
            ["≤1.5亿港币", "普通≤16,600元/年", "电商≤25,000元/年"],
            ["≤2亿港币", "普通≤20,600元/年", "电商≤31,000元/年"],
          ],
        }"""


def coaching_table() -> str:
    return """{
          headers: ["线下上门", "服务费", "说明"],
          rows: [
            ["4次/年", "¥38,000", "线上不限次 + 线下上门4次"],
            ["6次/年", "¥48,000", "线上不限次 + 线下上门6次"],
            ["8次/年", "¥56,000", "线上不限次 + 线下上门8次"],
            ["12次/年", "¥70,000", "线上不限次 + 线下上门12次"],
          ],
        }"""


def ai_coach_table() -> str:
    return """{
          headers: ["交付期", "服务费", "说明"],
          rows: [
            ["2个月内", "¥60,000", "调研后确认可在2个月内完成约定范围落地"],
            ["4个月内", "¥100,000", "调研后确认可在4个月内完成约定范围落地"],
            ["6个月内", "¥150,000", "调研后确认可在6个月内完成约定范围落地"],
          ],
        }"""


def us_setup_table(fee: str) -> str:
    rows = []
    for line in str(fee).split("\n"):
        line = line.strip()
        if not line:
            continue
        m = re.match(r"(.+?)\s+(\d[\d,]*)\s*$", line)
        if m:
            rows.append(f'            [{js_str(m.group(1).strip())}, {js_str(m.group(2) + "元")}]')
    if not rows:
        return "null"
    return "{\n          headers: [\"方案\", \"服务费\"],\n          rows: [\n" + ",\n".join(rows) + "\n          ],\n        }"


BUNDLE_0110 = """{
          id: '0110',
          discountFrom: 3,
          discountRate: 0.9,
          discountLabel: '3项及以上全托管可享受9折',
          modules: [
            { label: `①出口公司设立`, serviceId: 'domestic-setup', priceValue: 500, priceLabel: `¥500` },
            { label: `②进出口权办理`, serviceId: 'domestic-trade-license', priceValue: 2000, priceLabel: `¥2,000` },
            { label: `③首单退税辅导`, serviceId: 'domestic-rebate-first', priceValue: 10000, priceLabel: `¥10,000` },
            {
              label: `④代理退税申报`,
              serviceId: 'domestic-rebate',
              priceValue: 0,
              priceLabel: `按出口额0.1%`,
              pricingModel: 'percent',
              volumeScope: 'mainland',
              rate: 0.001,
              minFee: 5000,
              maxFee: 30000,
            },
            { label: `⑤退税公司记账报税`, serviceId: 'domestic-compliance-bookkeeping', priceValue: 5000, priceLabel: `¥5,000起` },
            { label: `⑥香港公司年审`, serviceId: 'hk-annual', priceValue: 3000, priceLabel: `¥3,000` },
            {
              label: `⑦香港公司审计报税`,
              serviceId: 'hk-audit-tax',
              priceValue: 0,
              priceLabel: `按营业额分级`,
              pricingModel: 'tier',
              volumeScope: 'hk',
              tiers: 'hk-audit-ecom',
            },
          ],
        }"""

BUNDLE_1039 = """{
          id: '1039',
          discountFrom: 3,
          discountRate: 0.9,
          discountLabel: '3项及以上全托管可享受9折',
          modules: [
            { label: `①个体户注册核定及税务申报`, serviceId: 'domestic-1039-sole', priceValue: 4500, priceLabel: `¥4,500起` },
            {
              label: `②1039市场采购出口`,
              serviceId: 'domestic-1039-export',
              priceValue: 0,
              priceLabel: `按报关金额0.4%`,
              pricingModel: 'percent',
              volumeScope: 'mainland',
              rate: 0.004,
              minFee: 0,
            },
            { label: `③香港公司年审`, serviceId: 'hk-annual', priceValue: 3000, priceLabel: `¥3,000` },
            {
              label: `④香港公司审计报税`,
              serviceId: 'hk-audit-tax',
              priceValue: 0,
              priceLabel: `按营业额分级`,
              pricingModel: 'tier',
              volumeScope: 'hk',
              tiers: 'hk-audit-ecom',
            },
          ],
        }"""


def emit_service(sid: str, cat: str, p: dict) -> str:
    title = str(p["服务产品名称"]).strip()
    desc = str(p["服务简介"]).strip()
    content = str(p["服务内容/范围"]).strip()
    process = str(p["服务流程"]).strip()
    fee = str(p["服务收费"]).strip().replace("100.000", "100,000")
    note = str(p["服务收费说明"]).strip()
    adv = str(p["核心优势"]).strip()
    aud = str(p["适合对象"]).strip()
    label, value, unit = parse_price(fee)

    # overrides for clearer card labels
    if sid == "consult-annual":
        label, value, unit = "¥38,000", 38000, "/年起"
    elif sid == "consult-ai-finance-coach":
        label, value, unit = "¥60,000", 60000, "起"
    elif sid == "hk-bank":
        label, value, unit = "¥5,000", 5000, "起"
    elif sid == "hk-change":
        label, value, unit = "¥800", 800, "起"
    elif sid == "hk-deregister":
        label, value, unit = "¥3,500", 3500, "/次"
    elif sid == "other-us-setup":
        label, value, unit = "¥2,500", 2500, "起"
    elif sid == "domestic-rebate":
        label, value, unit = "0.1%", 5000, "/年起"
    elif sid == "domestic-1039-export":
        label, value, unit = "0.4%", 0, "/报关金额"
    elif sid in ("domestic-arch-0110-hk", "domestic-arch-1039-hk"):
        label, value, unit = "全托管计价", 0, "/3项起9折"

    pricing_table = "null"
    bundle = "null"
    if sid == "hk-audit-tax":
        pricing_table = hk_audit_table()
    elif sid == "consult-annual":
        pricing_table = coaching_table()
    elif sid == "consult-ai-finance-coach":
        pricing_table = ai_coach_table()
    elif sid == "other-us-setup":
        pricing_table = us_setup_table(fee)
    elif sid == "domestic-arch-0110-hk":
        bundle = BUNDLE_0110
        # enrich content from excel short list is fine
    elif sid == "domestic-arch-1039-hk":
        bundle = BUNDLE_1039

    pricing = fee if fee else label
    return f"""    {{
      id: '{sid}',
      category: '{cat}',
      title: {js_str(title)},
      desc: {js_str(desc)},
      priceLabel: {js_str(label)},
      priceValue: {value},
      unit: {js_str(unit)},
      details: excelBlocks({{
        content: {js_str(content)},
        process: {js_str(process)},
        pricing: {js_str(pricing)},
        pricingNote: {js_str(note)},
        advantages: {js_str(adv)},
        audience: {js_str(aud)},
        pricingTable: {pricing_table},
        bundle: {bundle},
      }}),
    }}"""


def extract_service_block(src: str, sid: str) -> str:
    key = f"id: '{sid}'"
    i = src.find(key)
    if i < 0:
        raise KeyError(sid)
    # walk back to opening {
    start = src.rfind("{", 0, i)
    depth = 0
    for j in range(start, len(src)):
        if src[j] == "{":
            depth += 1
        elif src[j] == "}":
            depth -= 1
            if depth == 0:
                block = src[start : j + 1]
                # normalize indent to 4 spaces base
                return "    " + block.strip()
    raise RuntimeError(f"unclosed {sid}")


def extract_footer(src: str) -> str:
    m = re.search(r"\n  const LEGACY_SERVICE_IDS = \{", src)
    if not m:
        raise RuntimeError("LEGACY_SERVICE_IDS not found")
    footer = src[m.start() + 1 :]  # keep from const...
    # update HK tiers inside footer
    new_tiers = """  const HK_AUDIT_ECOM_TIERS = [
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
  ];"""
    footer = re.sub(
        r"  const HK_AUDIT_ECOM_TIERS = \[[\s\S]*?\];",
        new_tiers,
        footer,
        count=1,
    )
    # ensure new legacy ids
    if "'hk-change'" not in footer:
        footer = footer.replace(
            "    'bundle-1039': 'domestic-arch-1039-hk',\n  };",
            "    'bundle-1039': 'domestic-arch-1039-hk',\n"
            "    'hk-bank-account': 'hk-bank',\n"
            "    'hk-alteration': 'hk-change',\n"
            "    'hk-cancel': 'hk-deregister',\n"
            "  };",
        )
    return footer


def read_excel():
    wb = load_workbook(EXCEL, data_only=True)
    ws = wb["服务产品汇总表"]
    headers = [ws.cell(2, c).value for c in range(1, 11)]
    products = []
    for r in range(3, ws.max_row + 1):
        name = ws.cell(r, 3).value
        if not name:
            continue
        products.append({headers[i]: (ws.cell(r, i + 1).value if ws.cell(r, i + 1).value is not None else "") for i in range(10)})
    return products


HEADER = '''/* DAOITH service marketplace catalog
 * Source of truth: 服务产品汇总表_260912.xlsx（全文收录，未精简）
 * Categories: consult | domestic | hongkong | asia | europe | other
 * Excel 260912 body copy preserved; catalog limited to Excel-listed products.
 */
(function () {
  function excelBlocks(p) {
    const out = [];
    const content = p.content || '';
    const process = p.process || '';
    const pricing = p.pricing || '';
    const pricingNote = p.pricingNote || '';
    const advantages = p.advantages || '';
    const audience = p.audience || '';
    const pricingTable = p.pricingTable || null;
    const bundle = p.bundle || null;

    out.push({ type: 'h2', text: '服务内容' });
    if (bundle) {
      out.push({ type: 'bundle-picker', bundle });
    } else if (content) {
      out.push({ type: 'rich', text: content });
    }

    out.push({ type: 'h2', text: '服务流程' });
    if (process) {
      const steps = String(process).split(/→|->|➡/).map((s) => s.replace(/[。．]+$/g, '').trim()).filter(Boolean);
      if (steps.length > 1) {
        out.push({ type: 'timeline', steps: steps.map((title) => ({ title })) });
      } else {
        out.push({ type: 'rich', text: process });
      }
    }

    out.push({ type: 'h2', text: '服务收费' });
    if (pricing) out.push({ type: 'p', text: pricing });
    if (pricingTable?.headers && pricingTable?.rows) {
      out.push({
        type: 'table',
        variant: 'pricing',
        firstColHeader: true,
        headers: pricingTable.headers,
        rows: pricingTable.rows,
      });
    }
    if (pricingNote) out.push({ type: 'rich', text: pricingNote });
    if (bundle) {
      out.push({ type: 'bundle-price', bundleId: bundle.id });
    }

    if (advantages) {
      out.push({ type: 'h2', text: '核心优势' });
      out.push({ type: 'rich', text: advantages });
    }
    if (audience) {
      out.push({ type: 'h2', text: '适合对象' });
      out.push({ type: 'rich', text: audience });
    }
    return out;
  }

  window.DAOITH_SERVICE_CATEGORIES = [
    { id: 'all', label: '全部', en: 'All' },
    { id: 'consult', label: '财税咨询', en: 'Advisory', blurb: '诊断陪跑、资质认定与AI落地辅导', blurbEn: 'Diagnosis, coaching, and qualification filings' },
    { id: 'domestic', label: '境内合规', en: 'Mainland China', blurb: '代账注册、出口合规、退税与全托管', blurbEn: 'Bookkeeping, export compliance, rebates and full-managed packs' },
    { id: 'hongkong', label: '中国香港', en: 'Hong Kong', blurb: '注册、年审、审计报税、开户与变更注销', blurbEn: 'Setup, annual return, audit & tax, banking, changes' },
    { id: 'asia', label: '亚洲', en: 'Asia', blurb: '马来西亚、新加坡公司与财税服务', blurbEn: 'Malaysia and Singapore' },
    { id: 'europe', label: '欧洲', en: 'Europe', blurb: '英国、德国、法国 VAT、公司设立与做账报税', blurbEn: 'UK, Germany and France VAT, setup and bookkeeping' },
    { id: 'other', label: '其他地区', en: 'Other regions', blurb: '美国、迪拜等跨境主体与合规', blurbEn: 'US, Dubai and more' },
  ];

  window.DAOITH_SERVICES = [
'''


def main():
    if not EXCEL.exists():
        print("Excel not found:", EXCEL, file=sys.stderr)
        sys.exit(1)
    backup = BACKUP.read_text() if BACKUP.exists() else OUT.read_text()
    products = read_excel()

    blocks = []
    seen = set()
    missing_map = []
    for p in products:
        name = str(p["服务产品名称"]).strip()
        mapped = NAME_MAP.get(name)
        if not mapped:
            missing_map.append(name)
            continue
        sid, cat = mapped
        if sid in seen:
            continue
        seen.add(sid)
        blocks.append(emit_service(sid, cat, p))

    if missing_map:
        print("WARNING unmapped Excel names:", missing_map)

    # append keep-only regional extras
    for sid in KEEP_FROM_BACKUP:
        blocks.append(extract_service_block(backup, sid))

    # preferred display order: follow categories roughly
    order_pref = [
        "consult-1v1",
        "domestic-diagnosis",
        "consult-annual",
        "consult-ai-finance-coach",
        "consult-hnte",
        "consult-software-enterprise",
        "consult-atas",
        "domestic-compliance-bookkeeping",
        "domestic-setup",
        "domestic-1039-sole",
        "domestic-1039-export",
        "domestic-trade-license",
        "domestic-rebate-first",
        "domestic-rebate-1210-9610",
        "domestic-rebate-9810",
        "domestic-rebate",
        "domestic-arch-0110-hk",
        "domestic-arch-1039-hk",
        "hk-company",
        "hk-annual",
        "hk-audit-tax",
        "hk-bank",
        "hk-change",
        "hk-deregister",
    ]

    by_id = {}
    for b in blocks:
        m = re.search(r"id: '([^']+)'", b)
        if m:
            by_id[m.group(1)] = b

    ordered = []
    for sid in order_pref:
        if sid in by_id:
            ordered.append(by_id.pop(sid))
    # remaining excel-backed then keep
    for sid, b in list(by_id.items()):
        if sid.startswith(("asia-", "europe-", "other-")):
            continue
        ordered.append(by_id.pop(sid))
    for sid in sorted(by_id.keys()):
        ordered.append(by_id[sid])

    footer = extract_footer(backup)
    # indent footer at 2 spaces already
    out = HEADER + ",\n".join(ordered) + "\n  ];\n\n" + footer
    # footer currently starts with "  const LEGACY..." but original had it inside IIFE after SERVICES.
    # Ensure closing of IIFE present
    if not out.rstrip().endswith("})();"):
        if "})();" not in out[-200:]:
            pass  # footer should include it

    OUT.write_text(out)
    print(f"Wrote {OUT} with {len(ordered)} services")
    print("IDs:", [re.search(r"id: '([^']+)'", b).group(1) for b in ordered])


if __name__ == "__main__":
    main()
