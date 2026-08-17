#!/usr/bin/env bash
# Regression: diagnosis post-report follow-up query wrapping & fact diffs.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MAIN="$ROOT/js/main.js"
TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT

python3 - "$MAIN" "$TMP" <<'PY'
import sys
from pathlib import Path
main = Path(sys.argv[1]).read_text()
out = Path(sys.argv[2])
start = main.index("/** --- diag-followup-helpers start --- */")
end = main.index("/** --- diag-followup-helpers end --- */")
chunk = main[start:end]
out.write_text(
    r"""
const store = Object.create(null);
globalThis.localStorage = {
  getItem: (k) => (Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: (k) => { delete store[k]; },
};
function isPlatformDomesticWarehouseShipping(text) {
  const t = String(text || '');
  return /(全托管（国内仓）|半托管（国内仓）|发货到平台国内仓|平台国内仓|供货\s*SHEIN（国内仓）|平台商家·发国内仓)/.test(t);
}
function normalizeDiagnosisModeQuery(text) {
  return String(text || '').trim();
}
const DIAG_SLOTS_KEY = 'daoith_diagnosis_ui_slots';
function getDiagSlots() {
  try {
    const raw = localStorage.getItem(DIAG_SLOTS_KEY);
    const obj = raw ? JSON.parse(raw) : {};
    return obj && typeof obj === 'object' ? obj : {};
  } catch {
    return {};
  }
}
function setDiagSlot(key, value) {
  const slots = getDiagSlots();
  slots[key] = String(value || '').trim();
  localStorage.setItem(DIAG_SLOTS_KEY, JSON.stringify(slots));
  return slots;
}
"""
    + chunk
    + r"""
const userQ =
  'Amazon平台销售商品，注册主体为中国境内公司，发货模式国内直发，货物通过正式报关出口，上游供应商能开具普通发票，产品属于13%退税率产品，年销售5000万';

const overrides = extractDiagnosisFactOverrides(userQ);
const cases = [];
function check(name, cond) {
  cases.push({ name, ok: !!cond });
}

check('platform-amazon', overrides.platform === '亚马逊 Amazon');
check('entity-cn', overrides.entity === '中国大陆公司');
check('shipping-direct', overrides.shipping === '自发货（国内直发）');
check('export-formal', overrides.exportMode === '正式报关出口（0110/9710）');
check('invoice-general', overrides.invoice === '只能提供增值税普通发票');
check('product-positive-rebate', overrides.productCategory === '普货，能正常报关出口和退税');
check('product-note-13', overrides.productCategoryNote === '用户声明退税率13%');
check('revenue-50m', overrides.revenue === '5000万-1亿');
check('scenario-restate', looksLikeDiagnosisScenarioRestate(userQ) === true);
check('vat-13-not-rebate', extractDiagnosisFactOverrides('供应商增值税是13%').productCategory == null);

const baseline = {
  platform: '亚马逊 Amazon',
  entity: '中国大陆公司',
  shipping: '自发货（国内直发）',
  exportMode: '正式报关出口（0110/9710）',
  invoice: '只能提供增值税普通发票',
  productCategory: '0退税率产品（如贵重金属、珠宝玉石、钢材、铝材、木材）',
  revenue: '2000-5000万',
};
const merged = { ...baseline, ...overrides };
const changes = diffDiagSlots(baseline, merged);
check('diff-has-product', changes.some((c) => c.key === 'productCategory' && /0退税/.test(c.from) && /普货/.test(c.to)));
check('diff-has-revenue', changes.some((c) => c.key === 'revenue'));

const follow = buildDiagnosisApiQuery(userQ, 'diagnosis', 8, '亚马逊 Amazon', {
  isPostReportFollowUp: true,
  baselineSlots: baseline,
  changes,
});
check('followup-not-archive-lock', !/请基于【诊断档案】检索知识库并输出诊断报告/.test(follow));
check('followup-has-compare', /诊断已完成·后续追问/.test(follow) && /本轮用户新问题/.test(follow));
check('followup-keeps-user-13', /13%退税率产品/.test(follow));
check('followup-old-zero-as-baseline', /0退税率产品/.test(follow));
check('followup-cover-rule', /用户本轮明确给出的新事实优先于旧档案/.test(follow));

const firstReport = buildDiagnosisApiQuery('5000万-1亿', 'diagnosis', 8, '亚马逊 Amazon');
check('first-report-still-locked', /第1-7步已齐/.test(firstReport));

check('short-13-rebate-followup', extractDiagnosisFactOverrides('如果改成13%退税呢？').productCategory === '普货，能正常报关出口和退税');
check('unrelated-not-restate', looksLikeDiagnosisScenarioRestate('德国VAT怎么注册？') === false);

let failed = 0;
for (const c of cases) {
  if (!c.ok) failed += 1;
  print((c.ok ? 'OK  ' : 'FAIL') + ' ' + c.name);
}
if (failed) throw new Error('FAILED ' + failed);
print('ALL PASSED ' + cases.length);
"""
)
PY

if command -v node >/dev/null 2>&1; then
  node -e "global.print=(...a)=>console.log(...a); eval(require('fs').readFileSync(process.argv[1],'utf8'))" "$TMP"
else
  echo "Need node to run tests" >&2
  exit 1
fi
