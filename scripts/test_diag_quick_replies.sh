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
  { name: "welcome-modeSelect-stale-step3", text: "请选择：开启专属合规诊断，还是我有特定问题想直接提问？", mode: "diagnosis", step: 3, platform: "亚马逊 Amazon", expect: "modeSelect" },
  { name: "welcome-modeSelect-fresh", text: "请选择：开启专属合规诊断，还是我有特定问题想直接提问？", mode: "", step: 0, platform: "", expect: "modeSelect" },
  { name: "step3-entity-with-fba-echo", text: "明白了，FBA发货。第三步：您平台店铺的注册主体是大陆公司、香港公司还是其他？", mode: "diagnosis", step: 3, platform: "亚马逊 Amazon", expect: "entity" },
  { name: "step2-amazon-shipping", text: "第二步：您的发货方式是亚马逊FBA还是自发货？", mode: "diagnosis", step: 2, platform: "亚马逊 Amazon", expect: "shippingAmazon" },
  { name: "step1-platform-shein-example", text: "您在哪个电商平台上销售商品？（例如：亚马逊、TikTok Shop、eBay、速卖通、Temu、阿里国际站、SHEIN）", mode: "diagnosis", step: 1, platform: "", expect: "platform" },
  { name: "step2-generic-shipping", text: "好的。请问您的发货方式是以下哪一种？选项：发货到平台海外仓、发货到平台国内仓、自发货（国内直发）、自发货（海外仓发货）", mode: "diagnosis", step: 2, platform: "eBay", expect: "shipping" },
  { name: "step2-temu-by-platform", text: "请问您的发货方式是以下哪一种？", mode: "diagnosis", step: 2, platform: "Temu", expect: "shippingTemu" },
  { name: "step2-shein-by-platform", text: "请问您的发货方式是以下哪一种？", mode: "diagnosis", step: 2, platform: "SHEIN", expect: "shippingShein" },
  { name: "step2-alibaba-by-platform", text: "请问您的发货方式是以下哪一种？选项：自营出口、一达通代理出口、市场采购出口、便捷发货出口", mode: "diagnosis", step: 2, platform: "阿里国际站", expect: "shippingAlibaba" },
  { name: "step4-export", text: "第四步：您目前货物的出口方式是怎么样的？是0110一般贸易出口、委托货代出口、小包快递出口，还是其他？", mode: "diagnosis", step: 4, platform: "亚马逊 Amazon", expect: "exportMode" },
  { name: "step5-invoice", text: "第五步：您目前供应商是否能够配合提供增值税专用发票？还是只能提供增值税普通发票，或者无法提供发票？", mode: "diagnosis", step: 5, platform: "亚马逊 Amazon", expect: "invoice" },
  { name: "step6-revenue", text: "第六步：您目前年销售额大概多少？", mode: "diagnosis", step: 6, platform: "亚马逊 Amazon", expect: "revenue" },
  { name: "step3-atypical-fallback", text: "好的，那请问主体方面您怎么安排呢？", mode: "diagnosis", step: 3, platform: "亚马逊 Amazon", expect: "entity" },
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
