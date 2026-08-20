"""Map CMCODE TSFLAG to 出口退税率文库「特殊商品标识」."""

from __future__ import annotations

SPECIAL_GOODS_FLAG_MEANING = {
    "1": "出口征税，视同内销计提销项，对应进项可以抵扣",
    "2": "出口免税，只免销项不退税，对应进项转出",
}


def _clean(val) -> str:
    if val is None:
        return ""
    return str(val).replace("\x00", "").strip()


def special_goods_flag_raw(cm: dict | None) -> str:
    if not isinstance(cm, dict):
        return ""
    val = _clean(cm.get("TSFLAG"))
    if not val or val in ("False", "True"):
        return ""
    return val


def special_goods_flag_display(val) -> str | None:
    text = _clean(val)
    if not text or text in ("False", "True"):
        return None
    meaning = SPECIAL_GOODS_FLAG_MEANING.get(text)
    return f"{text}（{meaning}）" if meaning else text


def special_goods_flag_line(cm: dict | None, *, markdown: bool = True) -> str | None:
    display = special_goods_flag_display(special_goods_flag_raw(cm))
    if not display:
        return None
    if markdown:
        return f"- **特殊商品标识**：{display}"
    return f"特殊商品标识：{display}"


def special_goods_flag_keyword(cm: dict | None) -> str:
    raw = special_goods_flag_raw(cm)
    return f"特殊商品标识{raw}" if raw else ""
