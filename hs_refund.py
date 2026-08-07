"""Export rebate (出口退税率) lookup via Dify Dataset Retrieve API."""

from __future__ import annotations

import json
import re
import urllib.error
import urllib.request

_NO_PROXY_OPENER = urllib.request.build_opener(urllib.request.ProxyHandler({}))

CODE_PATTERNS = [
    re.compile(r"【商品编码】\s*(\d{8,10})"),
    re.compile(r"商品编码\s*[:：]\s*(\d{8,10})"),
    re.compile(r"\bHS\s*(\d{8,10})\b", re.IGNORECASE),
]

RATE_PATTERNS = [
    re.compile(r"出口退税率（仅此字段作答）\s*[:：]\s*([\d.]+)\s*%"),
    re.compile(r"出口退税率\s*[:：]\s*([\d.]+)\s*%"),
    re.compile(r"出口退税率\s*=\s*([\d.]+)\s*%"),
    re.compile(r"答：\s*([\d.]+)\s*%"),
]


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
        f"商品编码：{hs}",
        f"商品编码:{hs}",
        f"HS{hs}",
        f"海关编码{hs}",
    )
    compact = (content or "").replace(" ", "")
    return any(m in compact for m in markers)


def pick_best_record(records: list[dict], hs: str) -> dict | None:
    exact: list[tuple[float, dict, str, float]] = []
    for rec in records or []:
        seg = rec.get("segment") or {}
        content = seg.get("content") or ""
        if not segment_matches_hs(content, hs):
            continue
        rate = extract_refund_rate(content)
        if rate is None:
            continue
        score = float(rec.get("score") or 0)
        exact.append((score, rec, content, rate))
    if not exact:
        return None
    exact.sort(key=lambda x: x[0], reverse=True)
    _score, rec, content, rate = exact[0]
    doc = ((rec.get("segment") or {}).get("document") or {}).get("name") or ""
    return {
        "ok": True,
        "rate": rate,
        "display": f"{rate:g}%",
        "hs_code": hs,
        "message": f"按商品编码「{hs}」匹配知识库出口退税率",
        "source": "Dify 出口退税率知识库",
        "document": doc,
        "snippet": content[:280],
    }


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
            "message": "请至少输入 8 位海关编码（建议 8–10 位）以便知识库精确匹配",
            "source": "Dify 出口退税率知识库",
        }

    targets = []
    for key in (digits[:10] if len(digits) >= 10 else "", digits[:8]):
        if key and key not in targets:
            targets.append(key)

    methods = ("full_text_search", "hybrid_search", "semantic_search")
    queries_for = lambda hs: (hs, f"【商品编码】{hs}", f"商品编码：{hs} 出口退税率")

    last_error = ""
    for hs in targets:
        for method in methods:
            for query in queries_for(hs):
                try:
                    records = retrieve_dataset(
                        api_base=api_base,
                        api_key=api_key,
                        dataset_id=dataset_id,
                        query=query,
                        search_method=method,
                    )
                except urllib.error.HTTPError as e:
                    detail = e.read().decode("utf-8", errors="replace")[:300]
                    last_error = f"HTTP {e.code}: {detail}"
                    continue
                except Exception as e:
                    last_error = str(e)
                    continue
                hit = pick_best_record(records, hs)
                if hit:
                    hit["search_method"] = method
                    hit["query"] = query
                    return hit

    return {
        "ok": False,
        "rate": None,
        "display": "—",
        "message": "知识库未命中该商品编码，将尝试本地参考表"
        + (f"（{last_error}）" if last_error else ""),
        "source": "Dify 出口退税率知识库",
    }
