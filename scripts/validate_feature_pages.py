#!/usr/bin/env python3
"""Validate the canonical human-facing Feature catalog.

This compatibility entry point validates or regenerates the developer manifest
and derived catalog from the current canonical Feature Pages.
"""
from __future__ import annotations

import argparse
import sys

import build_developer_feature_catalog as builder


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--write", action="store_true", help="regenerate the developer catalog and index")
    args = parser.parse_args()
    try:
        changed, paths = builder.build_pages(check=not args.write)
    except (OSError, ValueError) as error:
        print(f"Feature catalog: FAIL ({error})", file=sys.stderr)
        return 1
    if changed:
        print("Feature catalog: FAIL (out of date)", file=sys.stderr)
        for path in paths:
            print(f"  {path}", file=sys.stderr)
        return 1
    print("Feature catalog: PASS (103 canonical detail pages)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
