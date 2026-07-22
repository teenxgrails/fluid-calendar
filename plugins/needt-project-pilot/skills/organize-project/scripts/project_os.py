#!/usr/bin/env python3
"""Initialize and inspect the lightweight Project Pilot state directory."""

from __future__ import annotations

import argparse
import datetime as dt
import json
import re
import subprocess
import sys
from pathlib import Path


STATE_DIR = ".project-pilot"
REQUIRED_FILES = ("PROJECT.md", "ROADMAP.md", "STATE.md", "BACKLOG.md")


def resolve_root(value: str) -> Path:
    root = Path(value).expanduser().resolve()
    if not root.is_dir():
        raise ValueError(f"Project root is not a directory: {root}")
    return root


def asset_dir() -> Path:
    return Path(__file__).resolve().parent.parent / "assets"


def render_template(source: Path, project_name: str) -> str:
    return (
        source.read_text(encoding="utf-8")
        .replace("{{PROJECT_NAME}}", project_name)
        .replace("{{DATE}}", dt.date.today().isoformat())
    )


def init_state(root: Path, project_name: str) -> int:
    target = root / STATE_DIR
    target.mkdir(exist_ok=True)
    created: list[str] = []
    preserved: list[str] = []
    for filename in REQUIRED_FILES:
        destination = target / filename
        if destination.exists():
            preserved.append(filename)
            continue
        source = asset_dir() / filename
        destination.write_text(render_template(source, project_name), encoding="utf-8")
        created.append(filename)
    print(json.dumps({"root": str(root), "created": created, "preserved": preserved}, indent=2))
    return 0


def git_branch(root: Path) -> str | None:
    if not (root / ".git").exists():
        return None
    result = subprocess.run(
        ["git", "branch", "--show-current"],
        cwd=root,
        check=False,
        capture_output=True,
        text=True,
    )
    return result.stdout.strip() or None


def status(root: Path) -> int:
    target = root / STATE_DIR
    present = {name: (target / name).is_file() for name in REQUIRED_FILES}
    roadmap = target / "ROADMAP.md"
    text = roadmap.read_text(encoding="utf-8") if roadmap.is_file() else ""
    payload = {
        "root": str(root),
        "branch": git_branch(root),
        "initialized": all(present.values()),
        "files": present,
        "roadmap": {
            "done": len(re.findall(r"^- \[x\]", text, flags=re.MULTILINE | re.IGNORECASE)),
            "open": len(re.findall(r"^- \[ \]", text, flags=re.MULTILINE)),
        },
        "integrations": {
            "openspec": (root / "openspec").is_dir(),
            "architecture": (root / "ARCHITECTURE.md").is_file(),
            "decisions": (root / "DECISIONS.md").is_file(),
            "agents": (root / "AGENTS.md").is_file(),
        },
    }
    print(json.dumps(payload, indent=2))
    return 0


def check(root: Path) -> int:
    target = root / STATE_DIR
    errors: list[str] = []
    for filename in REQUIRED_FILES:
        path = target / filename
        if not path.is_file():
            errors.append(f"missing {path}")
            continue
        text = path.read_text(encoding="utf-8")
        if not re.search(r"^#\s+\S", text, flags=re.MULTILINE):
            errors.append(f"missing H1 in {path}")
        if re.search(r"\{\{[^}]+\}\}", text):
            errors.append(f"unresolved template value in {path}")
    print(json.dumps({"ok": not errors, "errors": errors}, indent=2))
    return 0 if not errors else 1


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    subparsers = parser.add_subparsers(dest="command", required=True)
    for command in ("status", "check"):
        child = subparsers.add_parser(command)
        child.add_argument("--root", default=".")
    init = subparsers.add_parser("init")
    init.add_argument("--root", default=".")
    init.add_argument("--name")
    return parser


def main() -> int:
    args = build_parser().parse_args()
    try:
        root = resolve_root(args.root)
    except ValueError as error:
        print(str(error), file=sys.stderr)
        return 2
    if args.command == "init":
        return init_state(root, args.name or root.name)
    if args.command == "status":
        return status(root)
    return check(root)


if __name__ == "__main__":
    raise SystemExit(main())
