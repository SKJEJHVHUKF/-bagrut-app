"""
test_solve.py — the SymPy function's own gate.

    python api/math/test_solve.py

FREE and offline. Imports `dispatch` directly, so it tests the maths and the
routing without an HTTP server or a deployment.

The security cases are not decoration. This file parses text a student typed,
on a server, and `parse_expr` with a permissive namespace is a code-execution
primitive — the assertions below are what prove the namespace is closed.
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import sympy  # noqa: E402
from solve import dispatch, to_expr, normalise  # noqa: E402

checks = 0
failures = 0


def ok(cond: bool, label: str) -> None:
    global checks, failures
    checks += 1
    if not cond:
        failures += 1
        print(f"FAIL  {label}")


def equals(got: str, expected: str, label: str) -> None:
    """Compare as MATHS, not as strings: `1/3`, `2/6` and `0.333…` are one
    answer, and asserting on latex spelling would make the test brittle in a
    way the product is not."""
    global checks, failures
    checks += 1
    try:
        same = sympy.simplify(to_expr(got) - to_expr(expected)) == 0
    except Exception as exc:  # noqa: BLE001
        same = False
        got = f"{got} ({type(exc).__name__})"
    if not same:
        failures += 1
        print(f"FAIL  {label}: got {got!r}, expected {expected!r}")


print("\n— linear equation --")
r = dispatch({"action": "solve", "expression": "2*x + 3 = 11", "variable": "x"})
ok(r["status"] == "solved", "2x+3=11 solves")
equals(r["answerValues"][0], "4", "2x+3=11 → x=4")
ok(r["verified"] is True, "the root is substituted back and checked")
ok(any(s["kind"] == "restate" for s in r["steps"]), "steps open with a restatement")
ok(any(s["kind"] == "conclude" for s in r["steps"]), "steps end with a conclusion")

print("\n— quadratic --")
r = dispatch({"action": "solve", "expression": "x^2 - 5*x + 6 = 0", "variable": "x"})
ok(r["status"] == "solved", "quadratic solves")
ok(len(r["answerValues"]) == 2, "two roots")
ok({str(sympy.simplify(to_expr(v))) for v in r["answerValues"]} == {"2", "3"}, "roots are 2 and 3")
ok(r["verified"] is True, "both roots verified by substitution")

print("\n— a quadratic with irrational roots stays EXACT --")
r = dispatch({"action": "solve", "expression": "x^2 - 2 = 0", "variable": "x"})
ok(r["status"] == "solved", "x²-2=0 solves")
ok(any("sqrt" in v for v in r["answerValues"]), f"roots kept as surds, not decimals: {r['answerValues']}")

print("\n— system of two equations --")
r = dispatch({"action": "solve", "expressions": ["x + y = 10", "x - y = 2"]})
ok(r["status"] == "solved", "system solves")
ok(r["verified"] is True, "the solution is substituted back into both equations")
ok("6" in r["answerLatex"] and "4" in r["answerLatex"], f"x=6, y=4: {r['answerLatex']}")

print("\n— simplify --")
r = dispatch({"action": "simplify", "expression": "(x^2 - 1)/(x - 1)"})
ok(r["status"] == "solved", "simplify runs")
equals(r["answerValues"][0], "x + 1", "(x²-1)/(x-1) → x+1")

print("\n— calculus: what the local engine is asked to hand over --")
r = dispatch({"action": "derivative", "expression": "x^3 - 3*x", "variable": "x"})
equals(r["answerValues"][0], "3*x**2 - 3", "d/dx (x³-3x)")
r = dispatch({"action": "integral", "expression": "2*x", "variable": "x"})
ok("C" in r["answerLatex"], "an indefinite integral carries + C")
ok(r["verified"] is True, "the antiderivative is differentiated back to check")
r = dispatch({"action": "integral", "expression": "2*x", "variable": "x",
              "bounds": {"lower": "0", "upper": "3"}})
equals(r["answerValues"][0], "9", "∫₀³ 2x dx = 9")

print("\n— validating a student's answer --")
r = dispatch({"action": "validate", "expression": "2*x + 3 = 11", "studentAnswer": "4", "variable": "x"})
ok(r.get("isCorrect") is True, "4 is accepted")
r = dispatch({"action": "validate", "expression": "2*x + 3 = 11", "studentAnswer": "x = 4", "variable": "x"})
ok(r.get("isCorrect") is True, "'x = 4' is accepted — the name is not the value")
r = dispatch({"action": "validate", "expression": "2*x + 3 = 11", "studentAnswer": "8/2", "variable": "x"})
ok(r.get("isCorrect") is True, "8/2 is accepted — equivalence, not spelling")
r = dispatch({"action": "validate", "expression": "2*x + 3 = 11", "studentAnswer": "4.0", "variable": "x"})
ok(r.get("isCorrect") is True, "4.0 is accepted")
r = dispatch({"action": "validate", "expression": "2*x + 3 = 11", "studentAnswer": "5", "variable": "x"})
ok(r.get("isCorrect") is False, "5 is rejected")

print("\n— the adapter's own request shape (engine-sympy.ts) --")
r = dispatch({"kind": "equation", "expressions": ["2*x + 3 = 11"], "variables": ["x"], "bounds": None})
ok(r["status"] == "solved", "the {kind, expressions, variables} shape works unchanged")
r = dispatch({"kind": "definite-integral", "expressions": ["2*x"], "variables": ["x"],
              "bounds": {"lower": "0", "upper": "3"}})
equals(r["answerValues"][0], "9", "definite-integral kind maps to the bounded integral")

print("\n— malformed input is an outcome, not a crash --")
for bad, label in [
    ("", "empty"), ("2*x +", "dangling operator"), ("((((", "unbalanced"),
    ("x " * 400, "too long"),
]:
    r = dispatch({"action": "solve", "expression": bad})
    ok(r["status"] in ("unsupported", "error"), f"{label} → {r['status']}")
    ok("Traceback" not in str(r.get("reason", "")), f"{label} leaks no traceback")

print("\n— security: the namespace is closed --")
# ⚠️ ASSERT THE REFUSAL, NOT "IT DID NOT THROW". The first version of this
# loop set `blocked = True` in both the try and the except, so it passed no
# matter what happened — including if the payload had executed and returned
# normally. A security test that cannot fail is worse than none, because it
# reads as proof.
for attack in [
    "__import__('os').system('ls')",
    "().__class__.__bases__[0].__subclasses__()",
    "eval('1+1')",
    "exec('x=1')",
    "open('/etc/passwd')",
    "lambda: 1",
    "os.getcwd()",
    "sympy.__loader__",
]:
    r = dispatch({"action": "solve", "expression": attack})
    ok(r["status"] in ("unsupported", "error"),
       f"refused (status={r['status']}): {attack[:38]}")
    ok("Traceback" not in str(r.get("reason", "")), f"no traceback leaked for {attack[:24]}")

# The screen must be positive as well as negative — a namespace that refuses
# everything would pass every line above while being useless.
ok(dispatch({"action": "simplify", "expression": "sqrt(16)"})["status"] == "solved", "sqrt still works")
ok(dispatch({"action": "simplify", "expression": "sin(pi/2)"})["status"] == "solved", "sin still works")
ok(dispatch({"action": "simplify", "expression": "log(exp(3))"})["status"] == "solved", "log still works")
ok(normalise("x^2") == "x**2", "caret becomes a power")

print("\n— a question that must fall through to the LLM --")
r = dispatch({"action": "solve", "expression": "הוכח שהסדרה מתכנסת"})
ok(r["status"] in ("unsupported", "error"), "a proof in Hebrew is not solvable here")

print(f"\n{'✅' if failures == 0 else '❌'}  {checks - failures}/{checks} passed")
sys.exit(0 if failures == 0 else 1)
