"""Export rebate (出口退税率) lookup via Dify Dataset Retrieve API + local chapter files."""

from __future__ import annotations

import json
import re
import time
import urllib.error
import urllib.request
from pathlib import Path

_NO_PROXY_OPENER = urllib.request.build_opener(urllib.request.ProxyHandler({}))

ROOT = Path(__file__).resolve().parent
LOCAL_HS_DIR = ROOT / "data" / "dify-hs-codes"
_CHAPTER_BLOCK = re.compile(r"(?=^## 商品编码 \d{8,10})", re.M)

# In-process cache: identical HS lookups should not re-hit Dify every time
_LOOKUP_CACHE: dict[str, tuple[float, dict]] = {}
_LOOKUP_CACHE_TTL_SEC = 6 * 60 * 60
_LOOKUP_CACHE_MAX = 500

CODE_PATTERNS = [
    re.compile(r"【商品编码】\s*(\d{8,10})"),
    re.compile(r"##\s*商品编码\s+(\d{8,10})"),
    re.compile(r"\*\*商品编码\*\*\s*[:：]\s*(\d{8,10})"),
    re.compile(r"商品编码\s*[:：]\s*(\d{8,10})"),
    re.compile(r"\bHS\s*(\d{8,10})\b", re.IGNORECASE),
]

RATE_PATTERNS = [
    re.compile(r"出口退税率（仅此字段作答）\*?\*?\s*[:：]\s*([\d.]+)\s*%"),
    re.compile(r"\*\*出口退税率（仅此字段作答）\*\*\s*[:：]\s*([\d.]+)\s*%"),
    re.compile(r"\*\*出口退税率\*\*\s*[:：]\s*([\d.]+)\s*%"),
    re.compile(r"出口退税率\*?\*?\s*[:：]\s*([\d.]+)\s*%"),
    re.compile(r"出口退税率\s*=\s*([\d.]+)\s*%"),
    re.compile(r"答：\s*([\d.]+)\s*%"),
]

SPECIAL_FLAG_PATTERNS = [
    re.compile(r"特殊商品标识\*?\*?\s*[:：]\s*([12])"),
    re.compile(r"\*\*特殊商品标识\*\*\s*[:：]\s*([12])"),
    re.compile(r"特殊标志\*?\*?\s*[:：]\s*([12])"),
    re.compile(r"\*\*特殊标志\*\*\s*[:：]\s*([12])"),
]

PRODUCT_NAME_PATTERNS = [
    re.compile(r"\*\*商品名称\*\*\s*[:：]\s*(.+)"),
    re.compile(r"商品名称\s*[:：]\s*(.+)"),
    re.compile(r"问：\s*\d{8,10}[、,，]\s*(.+?)\s*的出口退税率"),
]

SPECIAL_FLAG_MEANING = {
    "1": "出口征税，视同内销计提销项，对应进项可以抵扣",
    "2": "出口免税，只免销项不退税，对应进项转出",
}


def digits_only(hs: str) -> str:
    return re.sub(r"\D", "", str(hs or ""))


def extract_codes(content: str) -> list[str]:
    codes: list[str] = []
    for pat in CODE_PATTERNS:
        for m in pat.finditer(content or ""):
            code = m.group(1)
            if code not in codes:
                codes.append(code)
    return codes


def extract_special_goods_flag(content: str) -> str | None:
    text = content or ""
    for pat in SPECIAL_FLAG_PATTERNS:
        m = pat.search(text)
        if m:
            return m.group(1)
    return None


def special_goods_flag_label(flag: str | None) -> str | None:
    if not flag:
        return None
    meaning = SPECIAL_FLAG_MEANING.get(flag)
    return f"{flag}（{meaning}）" if meaning else flag


def _sanitize_flag_fields(row: dict) -> dict:
    """Only keep special-goods flag when it is 1 or 2; never emit 未收录."""
    if not isinstance(row, dict):
        return row
    flag = str(row.get("special_goods_flag") or "").strip()
    label = str(row.get("special_goods_flag_label") or "").strip()
    if flag not in ("1", "2") or re.search(r"未收录|not\s*listed", label, re.I):
        row["special_goods_flag"] = None
        row["special_goods_flag_label"] = None
    return row


def _sanitize_lookup_result(result: dict) -> dict:
    if not isinstance(result, dict):
        return result
    _sanitize_flag_fields(result)
    matches = result.get("matches")
    if isinstance(matches, list):
        result["matches"] = [_sanitize_flag_fields(dict(m)) for m in matches if isinstance(m, dict)]
    return result


def extract_product_name(content: str) -> str | None:
    text = content or ""
    for i, pat in enumerate(PRODUCT_NAME_PATTERNS):
        m = pat.search(text)
        if not m:
            continue
        name = re.sub(r"\*+", "", m.group(1)).splitlines()[0].strip()
        if i == 2:
            name = _first_name_outside_parens(name)
        if name:
            return name[:80]
    return None


def _first_name_outside_parens(text: str) -> str:
    depth = 0
    buf: list[str] = []
    for ch in text or "":
        if ch in "(（":
            depth += 1
        elif ch in ")）":
            depth = max(0, depth - 1)
        elif depth == 0 and ch in "、,":
            break
        buf.append(ch)
    return "".join(buf).strip()


def extract_refund_rate(content: str) -> float | None:
    text = content or ""
    # Never treat VAT / provisional rate lines as export rebate.
    for line in text.splitlines():
        if re.search(r"增值税|暂定税率|进口/内销", line):
            continue
        for pat in RATE_PATTERNS:
            m = pat.search(line)
            if m:
                try:
                    return float(m.group(1))
                except ValueError:
                    continue
    for pat in RATE_PATTERNS:
        m = pat.search(text)
        if m:
            try:
                return float(m.group(1))
            except ValueError:
                continue
    return None


def segment_matches_hs(content: str, hs: str) -> bool:
    if not hs:
        return False
    codes = extract_codes(content)
    if hs in codes:
        return True
    # Exact field forms commonly used in the HS markdown KB
    markers = (
        f"【商品编码】{hs}",
        f"## 商品编码 {hs}",
        f"**商品编码**：{hs}",
        f"商品编码：{hs}",
        f"商品编码:{hs}",
        f"HS{hs}",
        f"海关编码{hs}",
    )
    compact = (content or "").replace(" ", "")
    return any(m in compact for m in markers)


def codes_matching_prefix(content: str, prefix: str) -> list[str]:
    """Return HS codes in content that equal or start with the given prefix (usually 8 digits)."""
    p = digits_only(prefix)
    if len(p) < 8:
        return []
    p8 = p[:8]
    out: list[str] = []
    for code in extract_codes(content):
        if code == p or code.startswith(p8) or (len(code) >= 8 and code[:8] == p8):
            if code not in out:
                out.append(code)
    # Also accept marker forms that only embed the 8-digit stem
    if not out and segment_matches_hs(content, p8):
        out.append(p8)
    if not out and len(p) >= 10 and segment_matches_hs(content, p[:10]):
        out.append(p[:10])
    return out


def _record_hit(rec: dict, hs_code: str, content: str, rate: float, flag: str | None, name: str | None) -> dict:
    doc = ((rec.get("segment") or {}).get("document") or {}).get("name") or ""
    return {
        "ok": True,
        "rate": rate,
        "display": f"{rate:g}%",
        "hs_code": hs_code,
        "product_name": name,
        "special_goods_flag": flag,
        "special_goods_flag_label": special_goods_flag_label(flag),
        "message": f"按商品编码「{hs_code}」匹配出口退税率",
        "document": doc,
        "snippet": (content or "")[:280],
    }


def _hit_from_block(code: str, block: str, document: str = "") -> dict | None:
    rate = extract_refund_rate(block)
    if rate is None:
        return None
    flag = extract_special_goods_flag(block)
    name = extract_product_name(block)
    return {
        "ok": True,
        "rate": rate,
        "display": f"{rate:g}%",
        "hs_code": code,
        "product_name": name,
        "special_goods_flag": flag,
        "special_goods_flag_label": special_goods_flag_label(flag),
        "message": f"按商品编码「{code}」匹配出口退税率",
        "document": document,
        "snippet": (block or "")[:280],
    }


def lookup_local_prefix(prefix: str) -> list[dict]:
    """All chapter-file entries whose code equals or starts with the first 8 digits."""
    p = digits_only(prefix)
    if len(p) < 8:
        return []
    p8 = p[:8]
    path = LOCAL_HS_DIR / f"hs-chapter-{p8[:2]}.md"
    if not path.is_file():
        return []
    text = path.read_text(encoding="utf-8", errors="replace")
    hits: list[dict] = []
    for raw in _CHAPTER_BLOCK.split(text):
        block = raw.strip()
        if not block:
            continue
        m = re.match(r"^## 商品编码 (\d{8,10})", block)
        if not m:
            continue
        code = m.group(1)
        if code != p8 and not code.startswith(p8):
            continue
        hit = _hit_from_block(code, block, path.name)
        if hit:
            hits.append(hit)
    hits.sort(key=lambda h: str(h.get("hs_code") or ""))
    return hits


def lookup_local_exact(code: str) -> dict | None:
    """Single chapter-file entry for an exact 8/10-digit HS code."""
    digits = digits_only(code)
    if len(digits) < 8:
        return None
    path = LOCAL_HS_DIR / f"hs-chapter-{digits[:2]}.md"
    if not path.is_file():
        return None
    text = path.read_text(encoding="utf-8", errors="replace")
    for raw in _CHAPTER_BLOCK.split(text):
        block = raw.strip()
        if not block:
            continue
        m = re.match(r"^## 商品编码 (\d{8,10})", block)
        if not m:
            continue
        if m.group(1) != digits and m.group(1) != digits[:10]:
            continue
        if m.group(1) != digits:
            # Prefer exact length match when both 8 and 10 exist
            if digits != m.group(1):
                if not (len(digits) >= 10 and m.group(1) == digits[:10]):
                    continue
        hit = _hit_from_block(m.group(1), block, path.name)
        if hit and hit.get("hs_code") == digits:
            return hit
        if hit and len(digits) >= 10 and hit.get("hs_code") == digits[:10]:
            return hit
    # Second pass: exact string equality only
    for raw in _CHAPTER_BLOCK.split(text):
        block = raw.strip()
        m = re.match(r"^## 商品编码 (\d{8,10})", block or "")
        if m and m.group(1) == digits:
            return _hit_from_block(digits, block, path.name)
    return None


_EXCLUSION_CLAUSE = re.compile(
    r"[（(][^)）]*不(?:包括|含|计)[^)）]*[)）]"
    r"|不(?:包括|含|计)[^,，;；。）)\n]*"
)


def _name_core(name: str) -> str:
    """Product name with exclusion notes stripped (e.g. 不包括杯子)."""
    return _EXCLUSION_CLAUSE.sub("", re.sub(r"\s+", "", str(name or "")))


def _keyword_variants(keyword: str) -> list[str]:
    """杯子→杯；keep original first. Allow single CJK stem."""
    kw = re.sub(r"\s+", "", str(keyword or "").strip())
    if not kw:
        return []
    out = [kw]
    if len(kw) >= 2 and kw.endswith("子"):
        stem = kw[:-1]
        if stem and stem not in out:
            out.append(stem)
    return out


def _name_relevance(keyword: str, name: str, block: str) -> int:
    """Higher is better. 0 = no match. Prefers dense name hits; ignores exclusion-only hits."""
    kw = re.sub(r"\s+", "", str(keyword or "").strip())
    if not kw:
        return 0
    core = _name_core(name)
    raw_n = re.sub(r"\s+", "", str(name or ""))
    # Keyword only appears inside「不包括…」→ not a real product hit
    if kw in raw_n and kw not in core:
        return 0
    n = core
    if n == kw:
        return 1000
    if kw in n:
        density = len(kw) / max(len(n), 1)
        pos = n.index(kw)
        return int(520 + density * 420 - min(pos, 50) - min(len(n) // 6, 40))
    body = _EXCLUSION_CLAUSE.sub("", re.sub(r"\s+", "", str(block or "")))
    if kw in body and kw not in raw_n:
        return 200 if n else 120
    return 0


def _adjust_cup_score(variants: list[str], name: str, code: str, score: int) -> int:
    """Boost drinking-cup rows; demote machinery '杯' (气流杯/转杯纺纱机)."""
    if score <= 0:
        return score
    if not any(v == "杯" or v.endswith("杯") for v in variants):
        return score
    core = _name_core(name)
    if re.search(r"(纺纱|气流|转杯|轴承|机器)", core) or str(code).startswith("84"):
        return 0
    if re.search(r"(玻璃杯|高脚杯|纸杯|其他杯|杯及类似品)", core):
        return score + 120
    return score


# When keyword only names the *use* of another product (盖板玻璃、零件等), drop the hit.
_ACCESSORY_MARKERS = re.compile(
    r"(盖板|原板玻璃|平板玻璃|零件|配件|组件|天线除外|后盖|前盖|"
    r"保护膜|贴膜|壳套|电池|充电器|数据线|显示屏|摄像头|扬声器|听筒|中框)"
)


def _keyword_is_usage_only(kw: str, core: str) -> bool:
    """True if kw appears only as usage/context, not as the goods themselves."""
    if not kw or kw not in core:
        return False
    # 手机或平板电脑盖板… / 手机用原板玻璃…
    if re.search(
        rf"{re.escape(kw)}(?:或[^，,、]{{0,16}})?(?:用)?(?:的)?(?:"
        rf"盖板|原板|玻璃|零件|配件|组件|壳|膜|电池|屏)",
        core,
    ):
        return True
    # …盖板（包括…）用…手机… already covered by accessory + 用
    if _ACCESSORY_MARKERS.search(core) and not re.search(
        rf"^(?:智能)?{re.escape(kw)}$|^(?:智能)?{re.escape(kw)}(?:及其他)?$",
        core,
    ):
        # Name is primarily accessory/material that mentions kw
        if re.search(rf"(?:供|给)?{re.escape(kw)}.{{0,24}}用|{re.escape(kw)}.{{0,12}}用", core):
            return True
        if re.search(r"(盖板|原板玻璃|平板玻璃)", core):
            return True
    return False


def _adjust_product_role_score(variants: list[str], name: str, code: str, score: int) -> int:
    """Prefer the goods themselves over 'for use with X' accessories (e.g. 手机盖板玻璃)."""
    if score <= 0:
        return score
    primary = variants[0]
    core = _name_core(name)
    for v in variants:
        if _keyword_is_usage_only(v, core):
            return 0

    # 手机 / 智能手机：核心整机加分；「…电话机用」零件降权
    if primary in ("手机", "智能手机") or "手机" in variants:
        if re.match(r"^(?:智能)?手机$", core) or core == "智能手机":
            return score + 220
        if core.startswith("智能手机") and not _ACCESSORY_MARKERS.search(core):
            # 整机类；若是「…用（天线除外）」则是零件
            if re.search(r"用[（(]|电话机用", core):
                return max(0, score - 180)
            return score + 160
        if re.search(r"无线电话机|手持电话", core) and not _ACCESSORY_MARKERS.search(core):
            if re.search(r"用[（(]|电话机用", core):
                return max(0, score - 180)
            return score + 40
    return score


def lookup_local_by_name(keyword: str, *, limit: int = 40) -> list[dict]:
    """Keyword search over local chapter product names, ranked by relevance."""
    variants = _keyword_variants(keyword)
    if not variants:
        return []
    primary = variants[0]
    if len(primary) < 2 and not re.search(r"[\u4e00-\u9fff]", primary):
        return []
    scored: list[tuple[int, dict]] = []
    for path in sorted(LOCAL_HS_DIR.glob("hs-chapter-*.md")):
        try:
            text = path.read_text(encoding="utf-8", errors="replace")
        except OSError:
            continue
        if not any(v in text for v in variants):
            continue
        for raw in _CHAPTER_BLOCK.split(text):
            block = raw.strip()
            if not block or not any(v in block for v in variants):
                continue
            m = re.match(r"^## 商品编码 (\d{8,10})", block)
            if not m:
                continue
            name = extract_product_name(block) or ""
            score = 0
            for v in variants:
                score = max(score, _name_relevance(v, name, block))
            if primary in _name_core(name):
                score += 15
            score = _adjust_cup_score(variants, name, m.group(1), score)
            score = _adjust_product_role_score(variants, name, m.group(1), score)
            if score <= 0:
                continue
            hit = _hit_from_block(m.group(1), block, path.name)
            if not hit:
                continue
            hit["relevance"] = score
            hit["message"] = f"按商品名称关键词「{primary}」匹配"
            scored.append((score, hit))
    scored.sort(key=lambda x: (-x[0], str(x[1].get("hs_code") or "")))
    seen: set[str] = set()
    out: list[dict] = []
    for _score, hit in scored:
        code = str(hit.get("hs_code") or "")
        if not code or code in seen:
            continue
        seen.add(code)
        out.append(hit)
        if len(out) >= limit:
            break
    return out


def lookup_by_product_name(
    keyword: str,
    *,
    api_base: str = "",
    api_key: str = "",
    dataset_id: str = "",
    limit: int = 40,
) -> dict:
    kw = str(keyword or "").strip()
    if len(re.sub(r"\s+", "", kw)) < 1 or (
        len(re.sub(r"\s+", "", kw)) < 2
        and not re.search(r"[\u4e00-\u9fff]", kw)
    ):
        return {
            "ok": False,
            "rate": None,
            "display": "—",
            "message": "请输入商品名称关键词（至少 1 个汉字或 2 个字母）",
            "matches": [],
            "query_type": "name",
        }

    cache_key = f"name:{kw}:v4"
    cached = _cache_get(cache_key)
    if cached is not None:
        cached = dict(cached)
        cached["cached"] = True
        return cached

    matches = lookup_local_by_name(kw, limit=limit)

    # Optional Dataset enrich when local is thin — add more name hits
    if len(matches) < 5 and api_base and api_key and dataset_id:
        try:
            records = retrieve_dataset(
                api_base=api_base,
                api_key=api_key,
                dataset_id=dataset_id,
                query=f"{kw} 出口退税率 商品名称",
                search_method="hybrid_search",
                top_k=12,
            )
        except Exception:
            records = []
        by_code = {str(m.get("hs_code")): m for m in matches if m.get("hs_code")}
        for rec in records or []:
            seg = rec.get("segment") or {}
            content = seg.get("content") or ""
            rate = extract_refund_rate(content)
            if rate is None:
                continue
            name = extract_product_name(content) or ""
            variants = _keyword_variants(kw)
            score = 0
            for v in variants:
                score = max(score, _name_relevance(v, name, content))
            codes = extract_codes(content)
            if not codes:
                continue
            code0 = codes[0]
            score = _adjust_cup_score(variants, name, code0, score)
            score = _adjust_product_role_score(variants, name, code0, score)
            if score <= 0:
                continue
            flag = extract_special_goods_flag(content)
            for code in codes:
                if code in by_code:
                    continue
                hit = _record_hit(rec, code, content, rate, flag, name)
                hit["relevance"] = score
                hit["message"] = f"按商品名称关键词「{kw}」匹配"
                by_code[code] = hit
        matches = sorted(
            by_code.values(),
            key=lambda h: (-int(h.get("relevance") or 0), str(h.get("hs_code") or "")),
        )[:limit]

    # Always overlay Dataset rates: local chapter files often mislabel 出口退税率 as 0%
    if matches and api_base and api_key and dataset_id:
        matches = _enrich_matches_rates_from_dataset(
            matches,
            api_base=api_base,
            api_key=api_key,
            dataset_id=dataset_id,
        )

    if not matches:
        return {
            "ok": False,
            "rate": None,
            "display": "—",
            "message": f"未查到与「{kw}」相关的商品出口退税率，请换个关键词或改用海关编码查询",
            "matches": [],
            "query_type": "name",
            "keyword": kw,
        }

    primary = matches[0]
    result = dict(primary)
    result["ok"] = True
    result["matches"] = matches
    result["match_count"] = len(matches)
    result["query_type"] = "name"
    result["keyword"] = kw
    result["message"] = f"按商品名称「{kw}」匹配到 {len(matches)} 条，已按相关性排序"
    result.pop("source", None)
    result = _sanitize_lookup_result(result)
    _cache_set(cache_key, result)
    return result


def collect_matching_records(records: list[dict], prefix: str) -> list[dict]:
    """All distinct HS hits under an 8-digit (or longer) prefix, sorted by score then code."""
    p = digits_only(prefix)
    if len(p) < 8:
        return []
    p8 = p[:8]
    by_code: dict[str, tuple[float, dict]] = {}
    for rec in records or []:
        seg = rec.get("segment") or {}
        content = seg.get("content") or ""
        rate = extract_refund_rate(content)
        if rate is None:
            continue
        score = float(rec.get("score") or 0)
        flag = extract_special_goods_flag(content)
        name = extract_product_name(content)
        codes = codes_matching_prefix(content, p8)
        if not codes and segment_matches_hs(content, p8):
            codes = [p8]
        for code in codes:
            hit = _record_hit(rec, code, content, rate, flag, name)
            prev = by_code.get(code)
            if prev is None or score > prev[0]:
                by_code[code] = (score, hit)
    hits = [hit for _code, (_score, hit) in sorted(by_code.items(), key=lambda kv: (-kv[1][0], kv[0]))]
    return hits


def pick_best_record(records: list[dict], hs: str) -> dict | None:
    hits = collect_matching_records(records, hs)
    if not hits:
        return None
    digits = digits_only(hs)
    # Prefer exact 10-digit / full input when present
    for h in hits:
        if h.get("hs_code") == digits or h.get("hs_code") == digits[:10]:
            return h
    return hits[0]


def retrieve_dataset(
    *,
    api_base: str,
    api_key: str,
    dataset_id: str,
    query: str,
    search_method: str = "full_text_search",
    top_k: int = 8,
) -> list[dict]:
    url = f"{api_base.rstrip('/')}/datasets/{dataset_id}/retrieve"
    body = {
        "query": query,
        "retrieval_model": {
            "search_method": search_method,
            "reranking_enable": False,
            "top_k": top_k,
            "score_threshold_enabled": False,
        },
    }
    req = urllib.request.Request(
        url,
        data=json.dumps(body).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    with _NO_PROXY_OPENER.open(req, timeout=45) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    return data.get("records") or []


def _cache_get(cache_key: str) -> dict | None:
    item = _LOOKUP_CACHE.get(cache_key)
    if not item:
        return None
    ts, payload = item
    if time.time() - ts > _LOOKUP_CACHE_TTL_SEC:
        _LOOKUP_CACHE.pop(cache_key, None)
        return None
    return dict(payload)


def _cache_set(cache_key: str, payload: dict) -> None:
    if len(_LOOKUP_CACHE) >= _LOOKUP_CACHE_MAX:
        # Drop oldest ~20%
        oldest = sorted(_LOOKUP_CACHE.items(), key=lambda kv: kv[1][0])[
            : max(1, _LOOKUP_CACHE_MAX // 5)
        ]
        for k, _ in oldest:
            _LOOKUP_CACHE.pop(k, None)
    _LOOKUP_CACHE[cache_key] = (time.time(), dict(payload))


def _enrich_matches_rates_from_dataset(
    matches: list[dict],
    *,
    api_base: str,
    api_key: str,
    dataset_id: str,
    max_enrich: int = 15,
) -> list[dict]:
    """Prefer Dataset (税局文库) rates over local chapter files that often mis-write 0%."""
    out: list[dict] = []
    for i, hit in enumerate(matches):
        row = dict(hit)
        code = str(row.get("hs_code") or "").strip()
        if code and i < max_enrich:
            dify = _dify_exact_hit(
                api_base=api_base,
                api_key=api_key,
                dataset_id=dataset_id,
                code=code,
            )
            if dify and dify.get("rate") is not None:
                row["rate"] = dify.get("rate")
                row["display"] = dify.get("display") or (
                    f"{dify['rate']:g}%" if dify.get("rate") is not None else row.get("display")
                )
                # Sync flag from dataset; clear when Dataset has no 1/2
                row["special_goods_flag"] = dify.get("special_goods_flag")
                row["special_goods_flag_label"] = dify.get("special_goods_flag_label")
                if not row.get("product_name") and dify.get("product_name"):
                    row["product_name"] = dify.get("product_name")
                row["rate_source"] = "dataset"
        _sanitize_flag_fields(row)
        out.append(row)
    return out


def _dify_exact_hit(
    *,
    api_base: str,
    api_key: str,
    dataset_id: str,
    code: str,
) -> dict | None:
    """Best-effort exact code retrieve; returns None if Dataset has no usable hit."""
    queries = (
        code,
        f"## 商品编码 {code}",
        f"【商品编码】{code}",
        f"商品编码：{code} 出口退税率",
    )
    last_error = ""
    for method in ("full_text_search", "hybrid_search"):
        for query in queries:
            try:
                records = retrieve_dataset(
                    api_base=api_base,
                    api_key=api_key,
                    dataset_id=dataset_id,
                    query=query,
                    search_method=method,
                    top_k=8,
                )
            except urllib.error.HTTPError as e:
                detail = e.read().decode("utf-8", errors="replace")[:200]
                last_error = f"HTTP {e.code}: {detail}"
                continue
            except Exception as e:
                last_error = str(e)
                continue
            for hit in collect_matching_records(records, code):
                if hit.get("hs_code") == code:
                    hit["search_method"] = method
                    hit["query"] = query
                    if last_error:
                        hit["_last_error"] = last_error
                    return hit
    return None


def lookup_refund_rate(
    hs_code: str,
    *,
    api_base: str,
    api_key: str,
    dataset_id: str,
) -> dict:
    digits = digits_only(hs_code)
    if len(digits) < 8:
        return {
            "ok": False,
            "rate": None,
            "display": "—",
            "message": "请填写8或10位海关编码以查询出口退税率",
            "matches": [],
            "query_type": "hs_code",
        }

    # ——— 10-digit: exact code only (no 8-digit sibling expansion) ———
    if len(digits) >= 10:
        full10 = digits[:10]
        cache_key = f"{dataset_id}:exact10:{full10}:v1"
        cached = _cache_get(cache_key)
        if cached is not None:
            cached = dict(cached)
            cached["cached"] = True
            return cached

        hit = lookup_local_exact(full10)
        dify_hit = _dify_exact_hit(
            api_base=api_base,
            api_key=api_key,
            dataset_id=dataset_id,
            code=full10,
        )
        if dify_hit:
            hit = dify_hit
        if not hit or hit.get("rate") is None:
            # Last resort: retrieve by exact code queries only
            last_error = ""
            for method in ("full_text_search", "hybrid_search"):
                for query in (full10, f"## 商品编码 {full10}", f"商品编码：{full10} 出口退税率"):
                    try:
                        records = retrieve_dataset(
                            api_base=api_base,
                            api_key=api_key,
                            dataset_id=dataset_id,
                            query=query,
                            search_method=method,
                            top_k=8,
                        )
                    except Exception as e:
                        last_error = str(e)
                        continue
                    for cand in collect_matching_records(records, full10):
                        if cand.get("hs_code") == full10 and cand.get("rate") is not None:
                            hit = cand
                            break
                    if hit and hit.get("rate") is not None:
                        break
                if hit and hit.get("rate") is not None:
                    break
            if (not hit or hit.get("rate") is None) and last_error:
                return {
                    "ok": False,
                    "rate": None,
                    "display": "—",
                    "hs_code": full10,
                    "message": "未查到该10位商品编码对应的出口退税率，请核对编码或以国家税务总局出口退税率文库为准",
                    "matches": [],
                    "query_type": "hs_code",
                }

        if not hit or hit.get("rate") is None:
            return {
                "ok": False,
                "rate": None,
                "display": "—",
                "hs_code": full10,
                "message": "未查到该10位商品编码对应的出口退税率，请核对编码或以国家税务总局出口退税率文库为准",
                "matches": [],
                "query_type": "hs_code",
            }

        result = dict(hit)
        result["ok"] = True
        result["hs_code"] = full10
        result["input_hs_code"] = full10
        result["matches"] = [dict(result)]
        result["match_count"] = 1
        result["query_type"] = "hs_code"
        result["message"] = f"按商品编码「{full10}」匹配出口退税率"
        result.pop("source", None)
        result = _sanitize_lookup_result(result)
        _cache_set(cache_key, result)
        return result

    # ——— 8-digit: list siblings under the 8-digit stem ———
    prefix8 = digits[:8]
    cache_key = f"{dataset_id}:p8:{prefix8}:v4"
    cached = _cache_get(cache_key)
    if cached is not None:
        cached = dict(cached)
        matches = list(cached.get("matches") or [])
        primary = matches[0] if matches else None
        if primary:
            result = dict(primary)
            result["ok"] = True
            result["input_hs_code"] = prefix8
            result["matches"] = matches
            result["match_count"] = len(matches)
            result["query_type"] = "hs_code"
            if len(matches) > 1:
                result["message"] = (
                    f"按前8位「{prefix8}」匹配到 {len(matches)} 条出口退税率，请按完整编码核对"
                )
            else:
                result["message"] = (
                    f"按商品编码「{primary.get('hs_code')}」匹配出口退税率"
                    "（建议补足10位海关编码以便与申报编码一致）"
                )
            result["cached"] = True
            result.pop("source", None)
            return result
        cached["cached"] = True
        return cached

    local_hits = lookup_local_prefix(prefix8)
    all_hits: dict[str, dict] = {
        str(h.get("hs_code")): h for h in local_hits if h.get("hs_code")
    }

    codes_to_enrich = sorted(all_hits.keys())
    last_error = ""
    for code in codes_to_enrich[:20]:
        hit = _dify_exact_hit(
            api_base=api_base,
            api_key=api_key,
            dataset_id=dataset_id,
            code=code,
        )
        if hit:
            all_hits[code] = hit
        elif all_hits.get(code, {}).get("rate") is None:
            all_hits.pop(code, None)

    all_hits = {
        c: h
        for c, h in all_hits.items()
        if h.get("rate") is not None
    }

    if not all_hits:
        for method in ("full_text_search", "hybrid_search"):
            for query in (prefix8, f"商品编码：{prefix8} 出口退税率"):
                try:
                    records = retrieve_dataset(
                        api_base=api_base,
                        api_key=api_key,
                        dataset_id=dataset_id,
                        query=query,
                        search_method=method,
                        top_k=12,
                    )
                except Exception as e:
                    last_error = str(e)
                    continue
                for hit in collect_matching_records(records, prefix8):
                    code = str(hit.get("hs_code") or "")
                    if code and code not in all_hits:
                        hit["search_method"] = method
                        hit["query"] = query
                        all_hits[code] = hit
                if all_hits:
                    break
            if all_hits:
                break

    if not all_hits:
        return {
            "ok": False,
            "rate": None,
            "display": "—",
            "hs_code": prefix8,
            "message": "未查到该商品编码对应的出口退税率，请核对编码或以国家税务总局出口退税率文库为准"
            + (f"（{last_error}）" if last_error else ""),
            "matches": [],
            "query_type": "hs_code",
        }

    matches = sorted(all_hits.values(), key=lambda h: str(h.get("hs_code") or ""))
    primary = matches[0]
    result = dict(primary)
    result["ok"] = True
    result["input_hs_code"] = prefix8
    result["matches"] = matches
    result["match_count"] = len(matches)
    result["query_type"] = "hs_code"
    if len(matches) > 1:
        result["message"] = (
            f"按前8位「{prefix8}」匹配到 {len(matches)} 条出口退税率，请按完整编码核对"
        )
    else:
        result["message"] = (
            f"按商品编码「{primary.get('hs_code')}」匹配出口退税率"
            "（建议补足10位海关编码以便与申报编码一致）"
        )
    result.pop("source", None)
    result = _sanitize_lookup_result(result)
    _cache_set(cache_key, result)
    return result
