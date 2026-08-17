#!/usr/bin/env bash
# Regression: diagnosis quick-reply chip resolution (macOS jsc or node).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MAIN="$ROOT/js/main.js"
JSC="/System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc"
TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT

python3 - "$MAIN" "$TMP" <<'PY'
import sys
from pathlib import Path
main = Path(sys.argv[1]).read_text()
out = Path(sys.argv[2])
start = main.index("/** Split bot text into question sentences")
end = main.index("function initAiChatbot()")
chunk = main[start:end]
out.write_text(
    """
function looksLikeFullDiagnosisPlan(text) {
  return /【核心风险诊断】|【合规方案】/.test(String(text || ""));
}
"""
    + chunk
    + r"""
const cases = [
  { name: "welcome-modeSelect-stale-step3", text: "请在下方选择：开启专属合规诊断（需微信登录，按步骤生成诊断报告），或 我有特定问题想直接提问（基于知识库即时解答）。", mode: "diagnosis", step: 3, platform: "亚马逊 Amazon", expect: "modeSelect" },
  { name: "welcome-modeSelect-fresh", text: "请在下方选择：开启专属合规诊断（需微信登录，按步骤生成诊断报告），或 我有特定问题想直接提问（基于知识库即时解答）。", mode: "", step: 0, platform: "", expect: "modeSelect" },
  { name: "step2-entity-with-shipping-echo", text: "好的，已记录发货方式为「全托管（国内仓）」。接下来第二步：您平台店铺的注册主体是中国大陆公司、中国个人、个体户、中国香港公司、外籍个人、其他境外公司？", mode: "diagnosis", step: 2, platform: "速卖通", expect: "entity" },
  { name: "step3-amazon-shipping", text: "第三步：您的发货方式是亚马逊FBA还是自发货？", mode: "diagnosis", step: 3, platform: "亚马逊 Amazon", expect: "shippingAmazon" },
  { name: "step1-platform-shein-example", text: "您在哪个电商平台上销售商品？（例如：亚马逊、TikTok Shop、eBay、速卖通、Temu、阿里国际站、SHEIN）", mode: "diagnosis", step: 1, platform: "", expect: "platform" },
  { name: "step3-alibaba-shipping", text: "第三步：请问您的发货方式是以下哪一种？\n- 自营出口\n- 一达通代理出口3+N\n- 一达通代理出口2+N\n- 市场采购出口\n- 便捷发货出口", mode: "diagnosis", step: 3, platform: "阿里国际站", expect: "shippingAlibaba" },
  { name: "step3-generic-shipping", text: "好的。请问您的发货方式是以下哪一种？选项：发货到平台海外仓、发货到平台国内仓、自发货（国内直发）、自发货（海外仓发货）", mode: "diagnosis", step: 3, platform: "eBay", expect: "shipping" },
  { name: "step3-temu-by-platform", text: "请问您的发货方式是以下哪一种？", mode: "diagnosis", step: 3, platform: "Temu", expect: "shippingTemu" },
  { name: "step3-shein-by-platform", text: "请问您的发货方式是以下哪一种？", mode: "diagnosis", step: 3, platform: "SHEIN", expect: "shippingShein" },
  { name: "step3-shopee-by-platform", text: "请问您的发货方式是以下哪一种？", mode: "diagnosis", step: 3, platform: "Shopee", expect: "shippingShopee" },
  { name: "step3-lazada-by-platform", text: "请问您的发货方式是以下哪一种？", mode: "diagnosis", step: 3, platform: "Lazada", expect: "shippingLazada" },
  { name: "step3-shopee-by-options", text: "发货方式？选项：全托管（国内仓）、Shopee海外仓、自发货（国内直发）、自发货（海外仓发货）", mode: "diagnosis", step: 3, platform: "Shopee", expect: "shippingShopee" },
  { name: "step3-lazada-by-options", text: "发货方式？选项：全托管（国内仓）、FBL海外仓、自发货（国内直发）、自发货（海外仓发货）", mode: "diagnosis", step: 3, platform: "Lazada", expect: "shippingLazada" },
  { name: "step2-entity", text: "第二步：您平台店铺的注册主体是中国大陆公司、中国个人、个体户、中国香港公司、外籍个人、其他境外公司？", mode: "diagnosis", step: 2, platform: "速卖通", expect: "entity" },
  { name: "step2-entity-shopee-regional", text: "2. 您平台店铺的注册主体是中国大陆公司、中国个人、个体户、中国香港公司、东南亚本土公司、外籍个人、其他境外公司？", mode: "diagnosis", step: 2, platform: "Shopee", expect: "entity" },
  { name: "step2-entity-mercadolibre-regional", text: "2. 您平台店铺的注册主体是中国大陆公司、中国个人、个体户、中国香港公司、南美洲本土公司、外籍个人、其他境外公司？", mode: "diagnosis", step: 2, platform: "美客多", expect: "entity" },
  { name: "step4-export", text: "第四步：您目前货物的出口方式是怎么样的？选项：正式报关出口（0110/9710）、正式报关出口（9810）、小包快递出口（9610/1210）、小包快递出口（未报关）、市场采购出口（1039）、委托货代出口、由平台安排出口、其他。", mode: "diagnosis", step: 4, platform: "亚马逊 Amazon", expect: "exportMode" },
  { name: "step5-invoice", text: "第五步：您目前供应商是否能够配合提供增值税专用发票？还是只能提供增值税普通发票，或者无法提供发票？", mode: "diagnosis", step: 5, platform: "亚马逊 Amazon", expect: "invoice" },
  { name: "step6-product-category", text: "6. 您的产品属于以下哪种类别？", mode: "diagnosis", step: 6, platform: "亚马逊 Amazon", expect: "productCategory" },
  { name: "step6-product-by-options", text: "产品类别？选项：普货，能正常报关出口和退税、0退税率产品（如贵重金属、珠宝玉石、钢材、铝材、木材）", mode: "diagnosis", step: 6, platform: "Temu", expect: "productCategory" },
  { name: "step7-revenue", text: "第七步：您目前年销售额约多少人民币？", mode: "diagnosis", step: 7, platform: "亚马逊 Amazon", expect: "revenue" },
  { name: "step2-entity-atypical-fallback", text: "好的，那请问主体方面您怎么安排呢？", mode: "diagnosis", step: 2, platform: "亚马逊 Amazon", expect: "entity" },
  { name: "qa-mode-no-export-chips", text: "Temu商家能否使用9610出口?\n有条件可以，关键取决于您的Temu经营模式：\n- 可以走 9610 的情况：POP模式（国内直发）", mode: "qa", step: 0, platform: "", expect: null },
  { name: "empty-mode-no-export-chips", text: "有条件可以走9610出口，正式报关或小包快递均可评估。", mode: "", step: 0, platform: "", expect: null },
  { name: "diagnosis-step8-no-chips", text: "【核心风险诊断】\n【合规方案】走9610", mode: "diagnosis", step: 8, platform: "Temu", expect: null },
];
let failed = 0;
for (const c of cases) {
  const got = resolveDiagQuickReplySet(c.text, c.mode, c.step, c.platform);
  const ok = got === c.expect;
  if (!ok) failed++;
  print((ok ? "OK  " : "FAIL") + " " + c.name + " expect=" + c.expect + " got=" + got);
}
if (failed) throw new Error("FAILED " + failed);
print("ALL PASSED " + cases.length);
"""
)
PY

if [[ -x "$JSC" ]]; then
  "$JSC" "$TMP"
elif command -v node >/dev/null 2>&1; then
  # node lacks print(); shim it
  node -e "global.print=console.log; require('fs').readFileSync(process.argv[1],'utf8');" 2>/dev/null || true
  node -e "global.print=(...a)=>console.log(...a); eval(require('fs').readFileSync(process.argv[1],'utf8'))" "$TMP"
else
  echo "Need jsc or node to run tests" >&2
  exit 1
fi
