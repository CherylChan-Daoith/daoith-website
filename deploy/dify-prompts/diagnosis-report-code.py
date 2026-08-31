# Paste ONLY this file into Dify Workflow Code node (Python3).
# Do NOT paste DIFY-DIAGNOSIS-REPORT-WORKFLOW.md or markdown headings here.

import json
import re


def _strip_think(raw: str) -> str:
    s = str(raw or "")
    s = re.sub(
        r"<\s*redacted_thinking\b[^>]*>[\s\S]*?<\s*/\s*redacted_thinking\s*>",
        "",
        s,
        flags=re.I,
    )
    s = re.sub(r"<\s*think\b[^>]*>[\s\S]*?<\s*/\s*think\s*>", "", s, flags=re.I)
    s = re.sub(r"```(?:thinking|thought|reasoning)[\s\S]*?```", "", s, flags=re.I)
    return s.strip()


def _is_stage_fragment(obj) -> bool:
    if not isinstance(obj, dict):
        return False
    keys = set(obj.keys())
    if not {"num", "title", "items"}.issubset(keys):
        return False
    return not (obj.get("risk") or obj.get("plan") or obj.get("actions"))


def _is_full_report(obj) -> bool:
    if not isinstance(obj, dict):
        return False
    if _is_stage_fragment(obj):
        return False
    return bool(
        (obj.get("risk") and obj.get("plan"))
        or (obj.get("version") and (obj.get("risk") or obj.get("plan")))
    )


def _report_score(obj) -> int:
    if not isinstance(obj, dict):
        return -1
    score = 0
    if obj.get("version") is not None:
        score += 10
    if isinstance(obj.get("risk"), dict):
        score += 5
    if isinstance(obj.get("plan"), dict):
        score += 5
    if isinstance(obj.get("actions"), list):
        score += 3
    if isinstance(obj.get("notes"), list):
        score += 2
    if _is_stage_fragment(obj):
        score -= 100
    return score


def _unwrap(obj):
    if not isinstance(obj, dict):
        return obj
    for _ in range(5):
        if isinstance(obj.get("structured_output"), dict):
            obj = obj["structured_output"]
            continue
        if isinstance(obj.get("report_json"), str) and obj["report_json"].strip():
            try:
                inner = json.loads(obj["report_json"])
                if isinstance(inner, dict):
                    obj = inner
                    continue
            except Exception:
                pass
        if isinstance(obj.get("report_json"), dict):
            obj = obj["report_json"]
            continue
        if isinstance(obj.get("data"), dict) and (
            obj["data"].get("risk") or obj["data"].get("plan")
        ):
            obj = obj["data"]
            continue
        break
    return obj


def _deep_find_report(node):
    best = None
    best_score = -1

    def walk(n):
        nonlocal best, best_score
        if isinstance(n, dict):
            score = _report_score(n)
            if score > best_score:
                best = n
                best_score = score
            for value in n.values():
                walk(value)
        elif isinstance(n, list):
            for item in n:
                walk(item)

    walk(node)
    if best_score >= 10:
        return best
    return None


def _extract_json_objects(raw: str):
    text = _strip_think(raw)
    if not text:
        return []

    if text.startswith("```"):
        for part in text.split("```"):
            p = part.strip()
            if p.startswith("json"):
                p = p[4:].strip()
            if p.startswith("{"):
                text = p
                break

    objects = []
    i = 0
    while i < len(text):
        if text[i] != "{":
            i += 1
            continue
        depth = 0
        in_str = False
        esc = False
        end = None
        for j in range(i, len(text)):
            c = text[j]
            if in_str:
                if esc:
                    esc = False
                elif c == "\\":
                    esc = True
                elif c == '"':
                    in_str = False
                continue
            if c == '"':
                in_str = True
            elif c == "{":
                depth += 1
            elif c == "}":
                depth -= 1
                if depth == 0:
                    end = j + 1
                    break
        if end is None:
            i += 1
            continue
        chunk = text[i:end]
        try:
            obj = json.loads(chunk)
            objects.append(obj)
        except Exception:
            pass
        i = end

    return objects


def _collect_candidates(node):
    found = []
    if node is None:
        return found
    if isinstance(node, str) and node.strip():
        for obj in _extract_json_objects(node):
            found.extend(_collect_candidates(obj))
        return found
    if isinstance(node, dict):
        found.append(_unwrap(node))
        for value in node.values():
            found.extend(_collect_candidates(value))
        return found
    if isinstance(node, list):
        for item in node:
            found.extend(_collect_candidates(item))
        return found
    return found


def _pick_best_report(candidates):
    best = None
    best_score = -1
    seen = set()
    for raw in candidates:
        if not isinstance(raw, dict):
            continue
        obj = _unwrap(raw)
        if not isinstance(obj, dict):
            continue
        deep = obj if _is_full_report(obj) else _deep_find_report(obj)
        if not isinstance(deep, dict):
            continue
        key = json.dumps(deep, ensure_ascii=False, sort_keys=True)[:400]
        if key in seen:
            continue
        seen.add(key)
        score = _report_score(deep)
        if score > best_score:
            best = deep
            best_score = score
    if best_score >= 10:
        return best
    return None


def _coerce_report(structured_output=None, report_text: str = ""):
    # Prefer LLM/text: Dify Structured Output often returns a stage fragment only.
    candidates = []
    candidates.extend(_collect_candidates(report_text or ""))
    if not _is_stage_fragment(structured_output if isinstance(structured_output, dict) else {}):
        candidates.extend(_collect_candidates(structured_output))

    best = _pick_best_report(candidates)
    if best:
        return best

    so_keys = list(structured_output.keys()) if isinstance(structured_output, dict) else []
    text_len = len(_strip_think(report_text or ""))
    if _is_stage_fragment(structured_output if isinstance(structured_output, dict) else {}):
        raise ValueError(
            "Dify structured_output is only a stage {num,title,items} (wiring OK). "
            f"LLM/text length={text_len}. "
            "Fix: LLM node → turn OFF Structured Output, add to System「只输出纯JSON，version=1」; "
            "or increase Max Tokens to 8192; then re-run."
        )
    raise ValueError(
        f"no full report JSON found; structured_output keys={so_keys}; text_len={text_len}"
    )


def _normalize_version(obj: dict) -> None:
    ver = obj.get("version")
    if ver is None or ver == "":
        if obj.get("risk") or obj.get("plan"):
            obj["version"] = 1
            return
        raise ValueError(f"version missing; keys={list(obj.keys())}")
    if isinstance(ver, str):
        ver = ver.strip()
    if ver in (1, "1", 1.0, "1.0", "1.00"):
        obj["version"] = 1
        return
    try:
        if int(float(ver)) == 1:
            obj["version"] = 1
            return
    except Exception:
        pass
    raise ValueError(
        f"version must be 1, got {repr(obj.get('version'))}; keys={list(obj.keys())}"
    )


def _ensure_list_field(obj: dict, key: str) -> list:
    val = obj.get(key)
    if isinstance(val, list):
        return val
    if isinstance(val, str) and val.strip():
        return [val.strip()]
    obj[key] = []
    return obj[key]


def _pad_actions_notes(obj: dict) -> None:
    """LLM sometimes omits actions/notes; pad so Code does not fail the whole run."""
    actions = _ensure_list_field(obj, "actions")
    notes = _ensure_list_field(obj, "notes")

    details = (obj.get("plan") or {}).get("details") or []
    for d in details:
        if len(actions) >= 3:
            break
        title = ""
        if isinstance(d, dict):
            title = str(d.get("title") or "").strip()
        if title and title not in actions:
            actions.append(f"落地落实：{title}")

    fallback_actions = [
        "按本案档案核对供应商发票与出口单据是否齐全",
        "确认报关抬头与店铺主体、销售链路是否一致",
        "需要时预约专家1v1复核退税与信息报送口径",
    ]
    for a in fallback_actions:
        if len(actions) >= 3:
            break
        if a not in actions:
            actions.append(a)

    fallback_notes = [
        "本报告为一般性合规参考，不构成法律意见；落地前请结合主管税局口径核实。",
        "单次诊断仅针对当前档案中的平台与模式；条件变化后请重新诊断。",
        "各地税局审核要点有差异，搭建前可咨询专家。",
    ]
    for n in fallback_notes:
        if len(notes) >= 2:
            break
        if n not in notes:
            notes.append(n)

    obj["actions"] = actions
    obj["notes"] = notes


def main(structured_output=None, report_text: str = "") -> dict:
    obj = _coerce_report(structured_output, report_text)
    if not isinstance(obj, dict):
        raise ValueError(f"expected JSON object, got {type(obj).__name__}")
    _normalize_version(obj)
    for key in ("risk", "plan"):
        if key not in obj:
            raise ValueError(f"missing {key}; keys={list(obj.keys())}")
    _pad_actions_notes(obj)
    if not obj.get("plan", {}).get("intro"):
        # Soft-fill intro so a nearly-complete plan still ships.
        overview = obj.get("plan", {}).get("overview") or {}
        bits = []
        for col in ("supplier", "export", "sales"):
            col_obj = overview.get(col) if isinstance(overview, dict) else None
            if isinstance(col_obj, dict) and col_obj.get("title"):
                bits.append(str(col_obj.get("title")))
        obj.setdefault("plan", {})["intro"] = (
            "结合您的档案，建议按以下合规要点推进：" + "；".join(bits[:3])
            if bits
            else "结合您的档案，建议优先核对发票、报关与销售主体一致性后再定架构。"
        )
    if len(obj.get("actions") or []) < 2:
        raise ValueError("actions too few")
    if len(obj.get("notes") or []) < 2:
        raise ValueError("notes too few")
    cjk = sum(
        1 for ch in json.dumps(obj, ensure_ascii=False) if "\u4e00" <= ch <= "\u9fff"
    )
    if cjk < 120:
        raise ValueError(f"report too short (cjk={cjk})")
    return {"report_json": json.dumps(obj, ensure_ascii=False)}
