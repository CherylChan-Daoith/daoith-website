#!/usr/bin/env python3
"""Upload Markdown files into a Dify knowledge base via Dataset API.

Requires a Dataset API key (dataset-...), not an App key (app-...).

Env / flags:
  DIFY_API_BASE          default http://47.107.136.37/v1
  DIFY_DATASET_API_KEY   Bearer token
  DIFY_DATASET_ID        default from Deloitte Tax Highlights KB URL

Usage:
  DIFY_DATASET_API_KEY=dataset-xxx \\
    .venv-pdf/bin/python scripts/dify_upload_md.py \\
    --dir data/deloitte-tax-highlights-md
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import time
from pathlib import Path

import urllib.error
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_BASE = "http://47.107.136.37/v1"
DEFAULT_DATASET_ID = "c1130cfb-827a-401c-8e93-37718135d1ce"
DEFAULT_DIR = ROOT / "data" / "deloitte-tax-highlights-md"

PREPROCESS_KEEP_URLS = [
    {"id": "remove_extra_spaces", "enabled": True},
    {"id": "remove_urls_emails", "enabled": False},
]

# Automatic mode: split by heading / paragraph; good for tax highlight MD.
PROCESS_RULE_AUTO = {
    "indexing_technique": "high_quality",
    "process_rule": {
        "mode": "automatic",
    },
}

# Custom separator mode: good for HS packs that use `---` between codes.
def process_rule_separator(
    separator: str = "---", max_tokens: int = 1200, chunk_overlap: int = 1
) -> dict:
    return {
        "indexing_technique": "high_quality",
        "process_rule": {
            "mode": "custom",
            "rules": {
                "pre_processing_rules": PREPROCESS_KEEP_URLS,
                "segmentation": {
                    "separator": separator,
                    "max_tokens": max_tokens,
                    "chunk_overlap": chunk_overlap,
                },
            },
        },
    }


def process_rule_hierarchical(
    parent_mode: str = "full-doc",
    separator: str = "\n",
    max_tokens: int = 8000,
    child_separator: str = "\n",
    child_max_tokens: int = 400,
    chunk_overlap: int = 0,
) -> dict:
    """Parent-child indexing so retrieval can return a complete parent.

    parent_mode:
      - full-doc: whole file is one parent (must-read playbooks)
      - paragraph: split parents by `separator` (e.g. ## sections)
    """
    return {
        "indexing_technique": "high_quality",
        "doc_form": "hierarchical_model",
        "doc_language": "Chinese",
        "process_rule": {
            "mode": "hierarchical",
            "rules": {
                "pre_processing_rules": PREPROCESS_KEEP_URLS,
                "segmentation": {
                    "separator": separator,
                    "max_tokens": max_tokens,
                    "chunk_overlap": chunk_overlap,
                },
                "parent_mode": parent_mode,
                "subchunk_segmentation": {
                    "separator": child_separator,
                    "max_tokens": child_max_tokens,
                    "chunk_overlap": chunk_overlap,
                },
            },
        },
    }


def load_env_file() -> None:
    env_path = ROOT / ".env"
    if not env_path.exists():
        return
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        k, v = k.strip(), v.strip().strip('"').strip("'")
        if k and k not in os.environ:
            os.environ[k] = v


def multipart_encode(
    fields: dict[str, str], files: list[tuple[str, str, bytes, str]]
) -> tuple[bytes, str]:
    boundary = f"----DifyBoundary{int(time.time() * 1000)}"
    parts: list[bytes] = []
    for name, value in fields.items():
        parts.append(
            (
                f"--{boundary}\r\n"
                f'Content-Disposition: form-data; name="{name}"\r\n\r\n'
                f"{value}\r\n"
            ).encode("utf-8")
        )
    for field, filename, content, mime in files:
        parts.append(
            (
                f"--{boundary}\r\n"
                f'Content-Disposition: form-data; name="{field}"; '
                f'filename="{filename}"\r\n'
                f"Content-Type: {mime}\r\n\r\n"
            ).encode("utf-8")
            + content
            + b"\r\n"
        )
    parts.append(f"--{boundary}--\r\n".encode("utf-8"))
    body = b"".join(parts)
    return body, f"multipart/form-data; boundary={boundary}"


def api_request(
    method: str,
    url: str,
    api_key: str,
    data: bytes | None = None,
    content_type: str | None = None,
    timeout: int = 120,
) -> tuple[int, dict | str]:
    headers = {"Authorization": f"Bearer {api_key}"}
    if content_type:
        headers["Content-Type"] = content_type
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            raw = resp.read().decode("utf-8", errors="replace")
            try:
                return resp.status, json.loads(raw) if raw else {}
            except json.JSONDecodeError:
                return resp.status, raw
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8", errors="replace")
        try:
            return e.code, json.loads(raw) if raw else {"error": str(e)}
        except json.JSONDecodeError:
            return e.code, raw


def list_documents(base: str, dataset_id: str, api_key: str) -> list[dict]:
    docs: list[dict] = []
    page = 1
    while True:
        url = f"{base.rstrip('/')}/datasets/{dataset_id}/documents?page={page}&limit=100"
        status, body = api_request("GET", url, api_key)
        if status != 200 or not isinstance(body, dict):
            raise SystemExit(f"List documents failed ({status}): {body}")
        batch = body.get("data") or []
        docs.extend(batch)
        if not body.get("has_more"):
            break
        page += 1
    return docs


def delete_document(base: str, dataset_id: str, api_key: str, doc_id: str) -> None:
    url = f"{base.rstrip('/')}/datasets/{dataset_id}/documents/{doc_id}"
    status, body = api_request("DELETE", url, api_key)
    if status not in (200, 204):
        print(f"  warn: delete {doc_id} -> {status} {body}")


def upload_file(
    base: str,
    dataset_id: str,
    api_key: str,
    path: Path,
    replace_existing: dict[str, str],
    process_rule: dict | None = None,
) -> tuple[bool, str]:
    # If same name exists, delete first so we get a clean re-upload.
    old_id = replace_existing.get(path.name)
    if old_id:
        delete_document(base, dataset_id, api_key, old_id)

    data_json = json.dumps(process_rule or PROCESS_RULE_AUTO, ensure_ascii=False)
    body, ctype = multipart_encode(
        {"data": data_json},
        [("file", path.name, path.read_bytes(), "text/markdown")],
    )
    url = f"{base.rstrip('/')}/datasets/{dataset_id}/document/create-by-file"
    status, resp = api_request("POST", url, api_key, data=body, content_type=ctype)
    if status in (200, 201):
        doc = (resp or {}).get("document") if isinstance(resp, dict) else None
        name = (doc or {}).get("name") or path.name
        return True, name
    return False, f"{status}: {resp}"


def main() -> None:
    load_env_file()
    ap = argparse.ArgumentParser()
    ap.add_argument("--dir", type=Path, default=DEFAULT_DIR)
    ap.add_argument("--base", default=os.environ.get("DIFY_API_BASE", DEFAULT_BASE))
    ap.add_argument(
        "--dataset-id",
        default=os.environ.get("DIFY_DATASET_ID", DEFAULT_DATASET_ID),
    )
    ap.add_argument(
        "--api-key",
        default=os.environ.get("DIFY_DATASET_API_KEY", ""),
        help="Dataset API key (dataset-...)",
    )
    ap.add_argument("--limit", type=int, default=0, help="Upload only first N files")
    ap.add_argument(
        "--replace",
        action="store_true",
        help="Delete existing docs with the same filename before upload",
    )
    ap.add_argument(
        "--recursive",
        action="store_true",
        help="Include .md files in subfolders (e.g. batch-01/)",
    )
    ap.add_argument(
        "--files",
        nargs="*",
        default=[],
        help="Optional specific .md filenames (relative to --dir) instead of all files",
    )
    ap.add_argument(
        "--separator",
        default="",
        help="If set, use custom segmentation with this separator (e.g. ---)",
    )
    ap.add_argument("--max-tokens", type=int, default=1200)
    ap.add_argument(
        "--parent-mode",
        choices=["", "full-doc", "paragraph"],
        default="",
        help="If set, use parent-child indexing (hierarchical_model)",
    )
    ap.add_argument("--child-max-tokens", type=int, default=400)
    ap.add_argument("--chunk-overlap", type=int, default=1)
    ap.add_argument("--sleep", type=float, default=0.4, help="Pause between uploads")
    args = ap.parse_args()

    api_key = (args.api_key or "").strip()
    if not api_key:
        raise SystemExit(
            "Missing Dataset API key. Set DIFY_DATASET_API_KEY or pass --api-key."
        )
    if not api_key.startswith("dataset-") and not api_key.startswith("Bearer"):
        print(
            "warn: key does not start with 'dataset-'; "
            "App keys (app-...) cannot upload to knowledge bases.",
            file=sys.stderr,
        )

    md_dir: Path = args.dir
    skip_names = {"readme.md", "index.md", "readme上传说明.md"}
    pattern = "**/*.md" if args.recursive else "*.md"
    files = sorted(
        p
        for p in md_dir.glob(pattern)
        if p.is_file() and p.name.lower() not in skip_names
    )
    if args.files:
        wanted = {name.strip() for name in args.files if name.strip()}
        files = [p for p in files if p.name in wanted]
        missing = wanted - {p.name for p in files}
        if missing:
            raise SystemExit(f"Files not found in {md_dir}: {sorted(missing)}")
    if args.limit:
        files = files[: args.limit]
    if not files:
        raise SystemExit(f"No .md files in {md_dir}")

    if args.parent_mode:
        rule = process_rule_hierarchical(
            parent_mode=args.parent_mode,
            separator=args.separator or ("\n##" if args.parent_mode == "paragraph" else "\n"),
            max_tokens=args.max_tokens if args.max_tokens != 1200 else (4000 if args.parent_mode == "paragraph" else 10000),
            child_max_tokens=args.child_max_tokens,
        )
        seg_label = f"hierarchical parent={args.parent_mode}"
    elif args.separator:
        rule = process_rule_separator(
            args.separator, args.max_tokens, chunk_overlap=args.chunk_overlap
        )
        seg_label = f"custom {args.separator!r} max={args.max_tokens}"
    else:
        rule = PROCESS_RULE_AUTO
        seg_label = "automatic"

    print(f"API base: {args.base}")
    print(f"Dataset:  {args.dataset_id}")
    print(f"Files:    {len(files)} from {md_dir}")
    print(f"Seg mode: {seg_label}")

    existing_by_name: dict[str, str] = {}
    if args.replace:
        print("Listing existing documents…")
        existing = list_documents(args.base, args.dataset_id, api_key)
        for d in existing:
            name = d.get("name") or ""
            doc_id = d.get("id") or ""
            if name and doc_id:
                existing_by_name[name] = doc_id
        print(f"  existing: {len(existing_by_name)}")

    ok = fail = 0
    failures: list[str] = []
    for i, path in enumerate(files, 1):
        success, detail = upload_file(
            args.base,
            args.dataset_id,
            api_key,
            path,
            existing_by_name,
            process_rule=rule,
        )
        if success:
            ok += 1
            print(f"  [{i}/{len(files)}] OK  {path.relative_to(md_dir)}")
        else:
            fail += 1
            failures.append(f"{path}: {detail}")
            print(f"  [{i}/{len(files)}] FAIL {path.relative_to(md_dir)} -> {detail}")
        if args.sleep:
            time.sleep(args.sleep)

    print(f"Done. ok={ok} fail={fail}")
    if failures:
        print("Failures:")
        for line in failures[:20]:
            print(" ", line)
        if len(failures) > 20:
            print(f"  … and {len(failures) - 20} more")
        raise SystemExit(1)


if __name__ == "__main__":
    main()
