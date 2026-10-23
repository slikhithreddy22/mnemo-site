# tools/make_demo_js.py
# Turn the JSON written by the code repo's `python -m evaluation.export_demo` into assets/data/demo.js,
# the file the demo section reads (a .js file, so the site also works when opened straight from disk).
#
#   python3 tools/make_demo_js.py /path/to/demo_data.json

import json
import os
import sys

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets", "data", "demo.js")


def main(src: str):
    with open(src) as f:
        d = json.load(f)
    out = {
        "example": d["example"],
        "questions": d["questions"],
        "when": d["when"],
        "morning": {"start": d["morning"]["start"], "log": d["morning"]["log"]},
        "numbers": d["numbers"],
    }
    with open(OUT, "w") as f:
        f.write("// Real outputs of the final benchmark run (Kaggle T4, Qwen3-VL-4B, prompt lines-v3).\n"
                "// Regenerate: see README.md (python -m evaluation.export_demo in the code repo).\n")
        f.write("window.MNEMO_DATA = " + json.dumps(out, ensure_ascii=False, separators=(",", ":")) + ";\n")
    print(f"wrote {os.path.normpath(OUT)}: {len(out['morning']['log'])} diary rows, {len(out['questions'])} questions")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit("usage: python3 tools/make_demo_js.py demo_data.json")
    main(sys.argv[1])
