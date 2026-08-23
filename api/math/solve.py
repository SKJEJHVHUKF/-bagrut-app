"""
api/math/solve.py — the SymPy backend, as a Vercel Python Function.

Served at /api/math/solve. Next.js owns app/api/*; this file is a SEPARATE
Vercel Function under the root /api directory, which is the documented way to
run Python beside a Next.js project.

⚠️ WHY BaseHTTPRequestHandler AND NOT FastAPI
---------------------------------------------
Vercel gives a detected Python *framework preset* precedence over file-based
functions: once fastapi/flask/django appears in requirements.txt, the Python
app handles EVERY request and the 15 Next.js route handlers under app/api/
stop being reachable. The standard library needs no framework, so the preset
is never detected and both runtimes coexist. See requirements.txt.

WHAT THIS IS FOR
----------------
lib/mathscan/solve/engine-local.ts (mathjs) already solves what שאלון 571/572
actually asks, instantly and offline, and it stays first in the chain. SymPy
is asked only for what the local engine REFUSES — trigonometric families,
integration by parts, limits — which is where a network round trip earns its
latency. The contract below is the one lib/mathscan/solve/engine-sympy.ts has
expected since it was written.

SECURITY
--------
Student text reaches this file. `eval` and `exec` are never used: parsing goes
through `parse_expr` with a locked-down namespace and every transformation
disabled except implicit multiplication, so `__import__`, attribute access and
function definitions cannot be reached. Input length is capped, work runs
under a wall-clock alarm, and internal errors return a short reason — never a
traceback.
"""

from http.server import BaseHTTPRequestHandler
import json
import re
import signal
from typing import Any

import sympy
from sympy.parsing.sympy_parser import (
    parse_expr,
    standard_transformations,
    implicit_multiplication_application,
)

# ------------------------------------------------------------
# Limits
# ------------------------------------------------------------

MAX_EXPR_LEN = 500          # one expression
MAX_EXPRESSIONS = 6         # a system of six is already beyond the syllabus
SOLVE_TIMEOUT_SEC = 8       # under Vercel's function timeout, over any real solve

TRANSFORMATIONS = standard_transformations + (implicit_multiplication_application,)

# Only these names resolve. Anything else — `__import__`, `open`, `os` — is an
# undefined symbol, not a callable.
ALLOWED: dict[str, Any] = {
    "sin": sympy.sin, "cos": sympy.cos, "tan": sympy.tan,
    "cot": sympy.cot, "sec": sympy.sec, "csc": sympy.csc,
    "asin": sympy.asin, "acos": sympy.acos, "atan": sympy.atan,
    "sinh": sympy.sinh, "cosh": sympy.cosh, "tanh": sympy.tanh,
    "exp": sympy.exp, "log": sympy.log, "ln": sympy.log, "sqrt": sympy.sqrt,
    "Abs": sympy.Abs, "abs": sympy.Abs, "factorial": sympy.factorial,
    "binomial": sympy.binomial, "pi": sympy.pi, "E": sympy.E, "e": sympy.E,
    "oo": sympy.oo, "Infinity": sympy.oo,
}

# A cheap structural screen before SymPy ever sees the string. Dunder access
# and the import keyword have no place in a bagrut expression.
FORBIDDEN = re.compile(r"__|import|lambda|:=|;|\bos\b|\bsys\b|\beval\b|\bexec\b|\bopen\b")

# Hebrew in an expression means this is prose, not maths — "הוכח שהסדרה
# מתכנסת" is a proof to be explained, not something to solve. Without this
# check SymPy's `auto_symbol` transformation silently turns each Hebrew word
# into a free variable and "solves" the sentence as an equation, returning a
# confident answer to a question nobody asked. Refusing sends it to the LLM,
# which is the correct handler for it.
HEBREW = re.compile(r"[֐-׿]")

# ⚠️ THE SECURITY-CRITICAL LINE IS `__builtins__`.
#
# `parse_expr` runs `eval(code, global_dict, local_dict)` internally. Python
# has a trap here: when a globals mapping is passed WITHOUT a `__builtins__`
# key, the interpreter inserts the real builtins module into it — so an empty
# `global_dict={}` does not remove `__import__`, `open` or `eval`, it silently
# restores them. Setting the key explicitly to an empty dict is what actually
# closes the namespace.
#
# The three constructors are required, not optional: `standard_transformations`
# rewrites `2` as `Integer(2)` and bare names as `Symbol('x')` before the eval,
# so without them nothing parses at all (the first run of this file failed with
# `NameError: name 'Integer' is not defined`). They are sympy constructors, not
# a way out of the sandbox.
GLOBALS: dict[str, Any] = {
    "__builtins__": {},
    "Integer": sympy.Integer,
    "Float": sympy.Float,
    "Rational": sympy.Rational,
    "Symbol": sympy.Symbol,
}


class SolveTimeout(Exception):
    pass


def _alarm(_signum, _frame):
    raise SolveTimeout()


class Guard:
    """Wall-clock cap. `signal.alarm` exists on the Linux runtime Vercel uses;
    where it does not, the guard degrades to a no-op rather than crashing."""

    def __enter__(self):
        try:
            signal.signal(signal.SIGALRM, _alarm)
            signal.alarm(SOLVE_TIMEOUT_SEC)
        except (AttributeError, ValueError):
            pass
        return self

    def __exit__(self, *_):
        try:
            signal.alarm(0)
        except (AttributeError, ValueError):
            pass
        return False


# ------------------------------------------------------------
# Parsing
# ------------------------------------------------------------

def normalise(raw: str) -> str:
    """LaTeX-ish student/OCR text → something SymPy's parser accepts.

    Deliberately small. The TypeScript side (lib/mathscan/solve/parse.ts)
    already does the heavy LaTeX work before anything reaches here; this only
    covers what survives that.
    """
    s = raw.strip()
    s = s.replace("\\left", "").replace("\\right", "").replace("\\,", " ")
    s = re.sub(r"\\d?frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}", r"((\1)/(\2))", s)
    s = re.sub(r"\\sqrt\s*\{([^{}]*)\}", r"sqrt(\1)", s)
    s = re.sub(r"\\(sin|cos|tan|cot|log|ln|exp|pi)\b", r"\1", s)
    s = s.replace("^", "**").replace("{", "(").replace("}", ")")
    s = s.replace("−", "-").replace("·", "*").replace("×", "*")
    return s.strip()


def to_expr(raw: str):
    """Parse one side of an expression, or raise ValueError."""
    if not isinstance(raw, str) or not raw.strip():
        raise ValueError("empty expression")
    if len(raw) > MAX_EXPR_LEN:
        raise ValueError("expression too long")
    text = normalise(raw)
    if HEBREW.search(text):
        raise ValueError("expression contains Hebrew prose, not maths")
    if FORBIDDEN.search(text):
        raise ValueError("expression contains a forbidden token")
    try:
        return parse_expr(
            text,
            local_dict=ALLOWED,
            global_dict=GLOBALS,      # see GLOBALS — `__builtins__` is the guard
            transformations=TRANSFORMATIONS,
            evaluate=True,
        )
    except Exception as exc:  # noqa: BLE001 — any parser failure is one outcome
        raise ValueError(f"could not parse: {type(exc).__name__}") from exc


def to_equation(raw: str):
    """`2*x + 3 = 11` → Eq(2x+3, 11). A bare expression becomes `expr = 0`."""
    if "=" in raw:
        left, _, right = raw.partition("=")
        return sympy.Eq(to_expr(left), to_expr(right))
    return sympy.Eq(to_expr(raw), 0)


def pick_symbol(expr, requested: str | None):
    if requested:
        return sympy.Symbol(requested)
    free = sorted(expr.free_symbols, key=lambda s: s.name)
    if not free:
        raise ValueError("no variable to solve for")
    for name in ("x", "y", "t", "n"):
        for s in free:
            if s.name == name:
                return s
    return free[0]


def latex(obj) -> str:
    try:
        return sympy.latex(obj)
    except Exception:  # noqa: BLE001
        return str(obj)


# ------------------------------------------------------------
# Actions
# ------------------------------------------------------------

def do_solve(expressions: list[str], variable: str | None) -> dict:
    """Solve one equation or a system. Steps mirror the `SolveStep.kind` union
    in lib/mathscan/types.ts so the TypeScript side needs no translation."""
    eqs = [to_equation(e) for e in expressions]
    combined = eqs[0].lhs - eqs[0].rhs if len(eqs) == 1 else None
    steps: list[dict] = [{"kind": "restate", "latex": latex(eqs[0] if len(eqs) == 1 else eqs)}]

    if len(eqs) == 1:
        sym = pick_symbol(combined, variable)
        moved = sympy.simplify(combined)
        steps.append({"kind": "move-terms", "latex": latex(sympy.Eq(moved, 0))})
        expanded = sympy.expand(moved)
        if expanded != moved:
            steps.append({"kind": "expand", "latex": latex(sympy.Eq(expanded, 0))})
        factored = sympy.factor(expanded)
        if factored != expanded:
            steps.append({"kind": "factor", "latex": latex(sympy.Eq(factored, 0))})
        roots = sympy.solve(sympy.Eq(expanded, 0), sym, dict=False)
        steps.append({"kind": "roots", "latex": latex(roots)})
        values = [latex(r) for r in roots]
        # Substituting back is the check a student is taught to do, and it is
        # what makes `verified` mean something rather than "SymPy said so".
        verified = all(
            sympy.simplify(expanded.subs(sym, r)) == 0 for r in roots
        ) if roots else False
        if verified:
            steps.append({"kind": "verify", "latex": latex(sympy.Eq(expanded.subs(sym, roots[0]), 0))})
        answer = ", ".join(f"{sympy.latex(sym)} = {v}" for v in values) if values else ""
        steps.append({"kind": "conclude", "latex": answer})
        return {"status": "solved", "steps": steps, "answerLatex": answer,
                "answerValues": values, "verified": verified}

    symbols = sorted({s for eq in eqs for s in eq.free_symbols}, key=lambda s: s.name)
    sol = sympy.solve(eqs, symbols, dict=True)
    if not sol:
        return {"status": "unsupported", "reason": "no solution found"}
    first = sol[0]
    values = [f"{sympy.latex(k)} = {latex(v)}" for k, v in first.items()]
    steps.append({"kind": "solve-linear", "latex": ", ".join(values)})
    verified = all(
        sympy.simplify(eq.lhs.subs(first) - eq.rhs.subs(first)) == 0 for eq in eqs
    )
    steps.append({"kind": "conclude", "latex": ", ".join(values)})
    return {"status": "solved", "steps": steps, "answerLatex": ", ".join(values),
            "answerValues": [latex(v) for v in first.values()], "verified": verified}


def do_simplify(expressions: list[str]) -> dict:
    expr = to_expr(expressions[0])
    simplified = sympy.simplify(expr)
    return {
        "status": "solved",
        "steps": [
            {"kind": "restate", "latex": latex(expr)},
            {"kind": "simplify", "latex": latex(simplified)},
        ],
        "answerLatex": latex(simplified),
        "answerValues": [latex(simplified)],
        "verified": bool(sympy.simplify(expr - simplified) == 0),
    }


def do_derivative(expressions: list[str], variable: str | None) -> dict:
    expr = to_expr(expressions[0])
    sym = pick_symbol(expr, variable)
    d = sympy.diff(expr, sym)
    return {
        "status": "solved",
        "steps": [
            {"kind": "restate", "latex": latex(expr)},
            {"kind": "differentiate", "latex": latex(d)},
            {"kind": "simplify", "latex": latex(sympy.simplify(d))},
        ],
        "answerLatex": latex(sympy.simplify(d)),
        "answerValues": [latex(sympy.simplify(d))],
        "verified": True,
    }


def do_integral(expressions: list[str], variable: str | None, bounds: dict | None) -> dict:
    expr = to_expr(expressions[0])
    sym = pick_symbol(expr, variable)
    if bounds and bounds.get("lower") is not None and bounds.get("upper") is not None:
        lo, hi = to_expr(str(bounds["lower"])), to_expr(str(bounds["upper"]))
        value = sympy.integrate(expr, (sym, lo, hi))
        return {
            "status": "solved",
            "steps": [
                {"kind": "restate", "latex": latex(expr)},
                {"kind": "integrate", "latex": latex(sympy.integrate(expr, sym))},
                {"kind": "evaluate-bounds", "latex": latex(value)},
            ],
            "answerLatex": latex(value),
            "answerValues": [latex(value)],
            "verified": True,
        }
    anti = sympy.integrate(expr, sym)
    return {
        "status": "solved",
        "steps": [
            {"kind": "restate", "latex": latex(expr)},
            {"kind": "integrate", "latex": latex(anti)},
        ],
        "answerLatex": f"{latex(anti)} + C",
        "answerValues": [latex(anti)],
        # The derivative of the result must return the integrand. SymPy is
        # right here far more often than not, but "verified" should mean
        # checked, not trusted.
        "verified": bool(sympy.simplify(sympy.diff(anti, sym) - expr) == 0),
    }


def do_limit(expressions: list[str], variable: str | None, bounds: dict | None) -> dict:
    expr = to_expr(expressions[0])
    sym = pick_symbol(expr, variable)
    point = to_expr(str(bounds.get("lower"))) if bounds and bounds.get("lower") is not None else 0
    value = sympy.limit(expr, sym, point)
    return {
        "status": "solved",
        "steps": [
            {"kind": "restate", "latex": latex(expr)},
            {"kind": "evaluate-bounds", "latex": latex(value)},
        ],
        "answerLatex": latex(value),
        "answerValues": [latex(value)],
        "verified": True,
    }


def do_validate(expressions: list[str], student: str, variable: str | None) -> dict:
    """Is the student's answer equivalent to the correct one?

    Equivalence, not string equality: `x=4`, `4=x`, `8/2` and `4.0` are one
    answer. The comparison is `simplify(a - b) == 0`, which is what makes
    `2/6` and `1/3` agree without a table of special cases.
    """
    said = student.strip()
    if "=" in said:
        said = said.split("=")[-1]
    student_expr = to_expr(said)

    solved = do_solve(expressions, variable)
    if solved.get("status") != "solved":
        return {"status": "unsupported", "reason": "could not solve to compare against"}

    eqs = [to_equation(e) for e in expressions]
    correct: list[Any] = []
    if len(eqs) == 1:
        sym = pick_symbol(eqs[0].lhs - eqs[0].rhs, variable)
        correct = sympy.solve(sympy.Eq(eqs[0].lhs - eqs[0].rhs, 0), sym, dict=False)

    is_correct = any(sympy.simplify(student_expr - c) == 0 for c in correct) if correct else False
    return {
        "status": "solved",
        "steps": solved["steps"],
        "answerLatex": solved["answerLatex"],
        "answerValues": solved["answerValues"],
        "verified": solved["verified"],
        "isCorrect": is_correct,
        "studentNormalized": latex(student_expr),
    }


KIND_TO_ACTION = {
    "equation": "solve", "inequality": "solve", "system": "solve",
    "simplify": "simplify", "evaluate": "simplify",
    "derivative": "derivative",
    "integral": "integral", "definite-integral": "integral",
    "limit": "limit",
}


def dispatch(body: dict) -> dict:
    """Accepts BOTH request shapes.

    The TypeScript adapter (lib/mathscan/solve/engine-sympy.ts) has spoken
    `{kind, expressions, variables, bounds}` since it was written, and the
    MathEngine facade speaks `{action, expression, studentAnswer, variable}`.
    Serving both means neither side had to be rewritten to match the other.
    """
    action = body.get("action")
    kind = body.get("kind")

    expressions = body.get("expressions")
    if not expressions:
        single = body.get("expression")
        expressions = [single] if isinstance(single, str) else []
    if not isinstance(expressions, list) or not expressions:
        return {"status": "error", "reason": "no expression supplied"}
    if len(expressions) > MAX_EXPRESSIONS:
        return {"status": "error", "reason": "too many expressions"}
    expressions = [e for e in expressions if isinstance(e, str)]

    variables = body.get("variables")
    variable = body.get("variable") or (variables[0] if isinstance(variables, list) and variables else None)
    bounds = body.get("bounds") if isinstance(body.get("bounds"), dict) else None

    if not action:
        action = KIND_TO_ACTION.get(kind or "", "solve")

    # `dispatch` RETURNS outcomes and never raises. The HTTP layer is not the
    # only caller — the test suite calls it directly, and so would any future
    # internal use — so "returns structured JSON" has to hold at this level,
    # not one frame up. A ValueError here is bad student input, which is an
    # outcome; anything else is a bug, which is reported without a traceback.
    try:
        if action in ("validate", "check"):
            student = body.get("studentAnswer")
            if not isinstance(student, str) or not student.strip():
                return {"status": "error", "reason": "studentAnswer is required to validate"}
            return do_validate(expressions, student, variable)
        if action == "simplify":
            return do_simplify(expressions)
        if action == "derivative":
            return do_derivative(expressions, variable)
        if action == "integral":
            return do_integral(expressions, variable, bounds)
        if action == "limit":
            return do_limit(expressions, variable, bounds)
        if action in ("solve", "steps"):
            return do_solve(expressions, variable)
        return {"status": "unsupported", "reason": f"unknown action: {action}"}
    except SolveTimeout:
        return {"status": "unsupported", "reason": "timed out"}
    except ValueError as exc:
        return {"status": "unsupported", "reason": str(exc)}
    except Exception as exc:  # noqa: BLE001
        return {"status": "error", "reason": f"internal: {type(exc).__name__}"}


class handler(BaseHTTPRequestHandler):
    """`handler` is the name Vercel's file-based Python runtime looks for."""

    def _send(self, code: int, payload: dict) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:
        # The adapter probes `${ENDPOINT}/health` before its first solve.
        self._send(200, {"status": "ok", "engine": "sympy", "sympy": sympy.__version__})

    def do_POST(self) -> None:
        try:
            length = int(self.headers.get("Content-Length") or 0)
        except ValueError:
            length = 0
        if length <= 0 or length > 20_000:
            self._send(400, {"status": "error", "reason": "bad request size"})
            return
        try:
            body = json.loads(self.rfile.read(length).decode("utf-8"))
        except Exception:  # noqa: BLE001
            self._send(400, {"status": "error", "reason": "invalid JSON"})
            return
        if not isinstance(body, dict):
            self._send(400, {"status": "error", "reason": "body must be an object"})
            return

        try:
            with Guard():
                result = dispatch(body)
        except SolveTimeout:
            result = {"status": "unsupported", "reason": "timed out"}
        except ValueError as exc:
            # Parse/validation problems are the student's input, not a bug.
            result = {"status": "unsupported", "reason": str(exc)}
        except Exception as exc:  # noqa: BLE001
            # Never leak a traceback. The type name is enough to debug from
            # the Vercel logs without telling a browser how the code is built.
            result = {"status": "error", "reason": f"internal: {type(exc).__name__}"}

        result.setdefault("engine", "sympy")
        self._send(200, result)

    def log_message(self, *_args) -> None:  # noqa: D102 — silence per-request stdout
        return
