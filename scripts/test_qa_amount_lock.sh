#!/usr/bin/env bash
# Regression: Q&A must not drop a trailing zero from user-stated amounts (2000万→200万).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MAIN="$ROOT/js/main.js"

python3 - "$MAIN" <<'PY'
from pathlib import Path
import sys

main = Path(sys.argv[1]).read_text()

def extract_fn(name: str) -> str:
    start = main.index(f"function {name}(")
    i = main.index("{", start)
    depth = 0
    for j in range(i, len(main)):
        if main[j] == "{":
            depth += 1
        elif main[j] == "}":
            depth -= 1
            if depth == 0:
                return main[start : j + 1]
    raise SystemExit(f"unclosed {name}")

names = [
    "escapeRegExpLiteral",
    "amountUnitAlternates",
    "textHasAmountFigure",
    "extractUserAmountFigures",
    "scoreTextUserAmountHits",
    "extractAmountFigures",
    "scoreAmountDigitMass",
    "countAmountDownshifts",
    "detectAmountDownshift",
    "preferTextPreservingUserAmounts",
    "alignAnswerAmountsWithUserQuestion",
    "looksLikeLeadingHsCode",
    "stripLeadingListIndex",
]
chunks = [extract_fn(n) for n in names]
chunks.append(
    r"""
function sanitizeDiagnosisPlanText(text) {
  let t = String(text || '');
  t = t.replace(
    /^(\s*[-*•]\s+)\*\*\s*(\d{1,3})(?:\.\d+)*\s*[.、)）]?\s*\*\*(?!\s*(?:元|万元|万|千|%|％))/gm,
    '$1'
  );
  t = t.replace(
    /^(\s*[-*•]\s+)\*\*(\d{1,3})(?:\.\d+)*\*\*\s*[.、)）]?(?!\s*(?:元|万元|万|千|%|％))\s*/gm,
    '$1'
  );
  return t;
}
"""
)
Path("/tmp/qa_amount_lock_fns.js").write_text("\n".join(chunks))
print("extracted ok")
PY

node <<'NODE'
const fs = require('fs');
eval(fs.readFileSync('/tmp/qa_amount_lock_fns.js', 'utf8'));

const cases = [];
function check(name, cond) {
  cases.push({ name, ok: !!cond });
}

const q = '如果适用特殊性税务处理，深圳公司欠珠海公司的2000万，税务和会计上怎么处理';
const bad = [
  '**结论**：这 **200 万元**是珠海公司对深圳公司的应收款。',
  '',
  '**依据**：',
  '',
  '- **债权延续**：这 **200 万元**负债延续原有金额和性质。',
  '- **对冲**：其他应收款 **200 万元**与其他应付款 **200 万元**对冲。',
].join('\n');
const fixed = alignAnswerAmountsWithUserQuestion(q, bad);
check('restore-2000-wan', /2000\s*万/.test(fixed) && !/(?<![0-9])200\s*万/.test(fixed));
check('preserve-spacing-style', /2000\s+万元/.test(fixed));

const mixed = '结论：债权为2000万元；下文误写200万元也应纠正。';
const mixedFixed = alignAnswerAmountsWithUserQuestion(q, mixed);
check('fix-undercount-even-if-correct-present', /2000\s*万/.test(mixedFixed) && !/(?<![0-9])200\s*万/.test(mixedFixed));

const unrelated = '小微企业年应纳税所得额不超过200万元的部分减半征收。';
check('no-touch-unrelated-200', alignAnswerAmountsWithUserQuestion('请问小微优惠？', unrelated) === unrelated);

const prefer = preferTextPreservingUserAmounts(
  q,
  '结论：按200万处理。',
  '结论：按2000万处理。'
);
check('prefer-stream-with-user-amount', /2000/.test(prefer) && !/(?<![0-9])200\s*万/.test(prefer));

// Root cause: question has no amount → user-hit scores tie at 0; must NOT pick
// Annotation/final「100元」over stream「1000元」.
const noAmtQ = '小规模纳税人按次纳税的免征额是多少？';
const stream1000 = '按次纳税的免征额为每次（日）销售额1000元。';
const final100 = '按次纳税的免征额为每次（日）销售额100元。';
const preferNoUserAmt = preferTextPreservingUserAmounts(noAmtQ, final100, stream1000);
check('prefer-digit-mass-1000-over-100', /1000\s*元/.test(preferNoUserAmt) && !/(?<![0-9])100\s*元/.test(preferNoUserAmt));
check('downshift-detects-1000-to-100', detectAmountDownshift(stream1000, final100));
check('digit-mass-1000-gt-100', scoreAmountDigitMass(stream1000) > scoreAmountDigitMass(final100));

// Same for 2000/3000-style figures without the user repeating them
const stream2000 = '关联交易合计超过2000万元需准备本地文档。';
const final200 = '关联交易合计超过200万元需准备本地文档。';
check(
  'prefer-digit-mass-2000-over-200',
  /2000/.test(preferTextPreservingUserAmounts('本地文档门槛？', final200, stream2000))
);
const stream3000 = '单票货值上限3000元。';
const final300 = '单票货值上限300元。';
check(
  'prefer-digit-mass-3000-over-300',
  /3000/.test(preferTextPreservingUserAmounts('上限多少？', final300, stream3000))
);

// Full tie → keep stream (fallback), not Annotation/final
const same = '免征额为1000元。';
check(
  'tie-keeps-stream-fallback',
  preferTextPreservingUserAmounts(noAmtQ, '免征额为1000元（终稿）。', same) === same
);

const splitBold = alignAnswerAmountsWithUserQuestion(q, '欠款**200**0万元应抵消');
check('heal-bold-split-200-0', /2000/.test(splitBold) && !/\*\*200\*\*0/.test(splitBold));

const yuanQ = '9610单票货值上限是不是5000元？';
const yuanBad = '单票货值上限为500元。';
check('restore-5000-yuan', alignAnswerAmountsWithUserQuestion(yuanQ, yuanBad).includes('5000元'));

const bullet = '- **2000**万元是应收款';
check('sanitize-keeps-2000-bold', /2000/.test(sanitizeDiagnosisPlanText(bullet)));
const strippedOrd = sanitizeDiagnosisPlanText('- **1** 内容').replace(/\s+/g, ' ').trim();
check('sanitize-strips-ordinal-not-amount', strippedOrd === '- 内容' && !/\b1\b/.test(strippedOrd));
check('stripLeading-keeps-amount', /2000/.test(stripLeadingListIndex('**2000**万元是应收款')));
check('stripLeading-strips-numbered', stripLeadingListIndex('1. 内容') === '内容');

const failed = cases.filter((c) => !c.ok);
for (const c of cases) console.log(`${c.ok ? 'OK' : 'FAIL'}: ${c.name}`);
if (failed.length) {
  console.error('Failed:', failed.map((f) => f.name).join(', '));
  console.error('fixed sample:\n', fixed);
  process.exit(1);
}
console.log(`All ${cases.length} amount-lock checks passed.`);
NODE

# Root-cause fix: no statutory hard-correct patch that invents 1000 from 100
if grep -q 'correctChinaVatPerTimeThreshold' "$MAIN"; then
  echo "FAIL: correctChinaVatPerTimeThreshold patch still present in main.js"
  exit 1
fi
echo "OK: no-hardcode-100-to-1000"
