---
applies_to: **/*.py
---

# Use snake_case for functions and variables
Function and variable names should follow `snake_case`, per PEP 8, not camelCase.

Good:
```py
def parse_count(raw: str) -> int: ...
```

Bad:
```py
def parseCount(raw: str) -> int: ...
```

# Do not use mutable default arguments
A function parameter default must not be a mutable object (`def f(x=[])`); use `None` and initialize inside the function.

Good:
```py
def add_item(item, items=None):
    items = items or []
    items.append(item)
```

Bad:
```py
def add_item(item, items=[]):
    items.append(item)
```

# Prefer comprehensions over manual loops when clear
Use list/dict/set comprehensions instead of a manual loop + append when the logic stays readable.

Good:
```py
squares = [n * n for n in range(10)]
```

Bad:
```py
squares = []
for n in range(10):
    squares.append(n * n)
```

# Avoid bare except clauses
`except:` with no exception type catches everything including `KeyboardInterrupt`; catch a specific exception type.

Good:
```py
try:
    connect()
except ConnectionError:
    retry()
```

Bad:
```py
try:
    connect()
except:
    retry()
```

# Use f-strings instead of % formatting or .format()
Prefer f-strings for string interpolation over the older `%` or `.format()` styles.

Good:
```py
msg = f"Hello, {name}!"
```

Bad:
```py
msg = "Hello, %s!" % name
```

# Do not shadow built-in names
Do not name variables `list`, `dict`, `type`, `id`, etc., shadowing Python built-ins.

Good:
```py
user_list = fetch_users()
```

Bad:
```py
list = fetch_users()
```

# Avoid wildcard imports
`from module import *` pollutes the namespace and hides where names come from; import explicitly.

Good:
```py
from math import sqrt, floor
```

Bad:
```py
from math import *
```

# Use context managers for resource handling
File handles, locks, and connections should be acquired with `with`, not manual open/close pairs.

Good:
```py
with open(path) as f:
    data = f.read()
```

Bad:
```py
f = open(path)
data = f.read()
f.close()
```

# Do not compare types with equality
Use `isinstance(x, T)` instead of `type(x) == T` for type checks.

Good:
```py
if isinstance(x, int): ...
```

Bad:
```py
if type(x) == int: ...
```

# Avoid the global statement inside functions
Mutating module-level state via `global` inside a function is a sign the design should pass state explicitly instead.

Good:
```py
def make_counter():
    count = 0
    def inc():
        nonlocal count
        count += 1
    return inc
```

Bad:
```py
count = 0
def inc():
    global count
    count += 1
```

# Use dataclasses for simple data containers
A class that is mostly fields with no real behavior should be a `@dataclass`, not hand-written boilerplate.

Good:
```py
@dataclass
class Point:
    x: int
    y: int
```

Bad:
```py
class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y
```

# Do not use assert for input validation in production code
`assert` is stripped when Python runs with `-O`; validate real inputs with explicit checks that raise exceptions.

Good:
```py
if age < 0:
    raise ValueError("age must be non-negative")
```

Bad:
```py
assert age >= 0
```

# Avoid deeply nested list comprehensions
A comprehension nested more than two levels deep should be rewritten as an explicit loop for readability.

Good:
```py
flat = []
for row in matrix:
    for cell in row:
        flat.append(cell)
```

Bad:
```py
flat = [cell for row in matrix for cell in row if all(c > 0 for c in row)]
```

# Prefer pathlib over os.path for new code
Use `pathlib.Path` instead of `os.path` string manipulation in new code.

Good:
```py
config_path = Path(base_dir) / "config.json"
```

Bad:
```py
config_path = os.path.join(base_dir, "config.json")
```

# Do not catch Exception broadly without handling or logging
A broad `except Exception` must either meaningfully handle the error or log it; never silently pass.

Good:
```py
except ValueError as err:
    logger.error("Invalid input: %s", err)
    raise
```

Bad:
```py
except Exception:
    pass
```

# Use type hints on public function signatures
Exported/public functions should declare parameter and return type hints.

Good:
```py
def parse_count(raw: str) -> int: ...
```

Bad:
```py
def parse_count(raw): ...
```

# Avoid mutable class-level attributes for instance state
A mutable default (e.g. a list) assigned at class level is shared across all instances; initialize it in `__init__`.

Good:
```py
class Cart:
    def __init__(self):
        self.items = []
```

Bad:
```py
class Cart:
    items = []
```

# Do not use eval or exec on untrusted input
`eval`/`exec` must never be called on data that originates from user input.

Good:
```py
value = json.loads(user_input)
```

Bad:
```py
value = eval(user_input)
```

# Prefer enumerate over manual index tracking
Use `enumerate(items)` instead of manually incrementing an index variable in a loop.

Good:
```py
for index, item in enumerate(items):
    process(index, item)
```

Bad:
```py
index = 0
for item in items:
    process(index, item)
    index += 1
```

# Avoid single-letter variable names except loop counters
Variable names should be descriptive except for conventional loop counters (`i`, `j`).

Good:
```py
user = find_user(user_id)
```

Bad:
```py
u = find_user(uid)
```

# Do not leave print statements for debugging
Debug `print()` calls must be removed or replaced with `logging` before committing.

Good:
```py
logger.debug("loaded config: %s", config)
```

Bad:
```py
print("DEBUG:", config)
```

# Use logging instead of print for diagnostics
Application diagnostic output should go through the `logging` module, not `print`.

Good:
```py
logger.info("Server started on port %s", port)
```

Bad:
```py
print("Server started on port", port)
```

# Avoid circular imports between modules
Module A importing from Module B which imports back from Module A must be restructured to avoid the cycle.

Good:
```py
# orders.py imports from models.py only
```

Bad:
```py
# users.py imports from orders.py
# orders.py imports from users.py
```

# Prefer explicit relative imports within a package
Use explicit relative imports (`from . import foo`) within a package rather than implicit or absolute imports that break on refactor.

Good:
```py
from . import validators
```

Bad:
```py
import validators
```

# Avoid multiple inheritance without a clear rationale
Multiple inheritance should only be used when the MRO and responsibility split is clearly documented.

Good:
```py
class Cache(LRUCacheMixin):
    ...
```

Bad:
```py
class Cache(LRUMixin, TTLMixin, LoggingMixin, MetricsMixin):
    ...
```

# Use __all__ to declare a module's public API
A module intended for `from module import *` usage should declare `__all__` explicitly.

Good:
```py
__all__ = ["parse_rules", "Rule"]
```

Bad:
```py
# no __all__, every name is importable via *
```

# Avoid magic numbers
A numeric literal with unclear meaning should be assigned to a named constant.

Good:
```py
MAX_LOGIN_ATTEMPTS = 5
if attempts > MAX_LOGIN_ATTEMPTS:
    lock_account()
```

Bad:
```py
if attempts > 5:
    lock_account()
```

# Do not silently ignore error-indicating return values
A function's return value that signals success/failure must be checked, not discarded.

Good:
```py
result = save(record)
if not result.ok:
    raise SaveError(result.error)
```

Bad:
```py
save(record)  # return value ignored
```

# Prefer generators over building large in-memory lists
When only iterating once, prefer a generator over materializing a large list.

Good:
```py
def read_lines(path):
    with open(path) as f:
        for line in f:
            yield line
```

Bad:
```py
def read_lines(path):
    with open(path) as f:
        return f.readlines()
```

# Use is/is not for None comparisons
Compare to `None` with `is`/`is not`, not `==`/`!=`.

Good:
```py
if value is None: ...
```

Bad:
```py
if value == None: ...
```

# Avoid deeply nested try/except blocks
Nesting try/except more than two levels deep should be flattened or refactored into helper functions.

Good:
```py
def load():
    try:
        return parse(read())
    except (IOError, ValueError) as err:
        raise LoadError(err)
```

Bad:
```py
def load():
    try:
        try:
            data = read()
        except IOError:
            try:
                data = read_backup()
            except IOError:
                raise
    except ValueError:
        raise
```

# Do not modify a list while iterating over it
Mutating a list (append/remove) during iteration over it produces undefined/surprising behavior; iterate over a copy or build a new list.

Good:
```py
items = [i for i in items if not i.expired]
```

Bad:
```py
for i in items:
    if i.expired:
        items.remove(i)
```

# Avoid overly broad type: ignore comments
A `# type: ignore` comment must specify the error code and briefly explain why, not blanket-suppress.

Good:
```py
value = legacy_api()  # type: ignore[no-untyped-call] -- legacy_api has no stubs yet
```

Bad:
```py
value = legacy_api()  # type: ignore
```

# Do not use lambda beyond a trivial one-liner
A `lambda` with nontrivial logic should be a named function instead, for readability and tracebacks.

Good:
```py
def is_active(user):
    return user.status == "active" and not user.suspended
active_users = filter(is_active, users)
```

Bad:
```py
active_users = filter(lambda u: u.status == "active" and not u.suspended, users)
```

# Prefer functools.lru_cache over hand-rolled memoization
Use `functools.lru_cache` instead of manually maintaining a memoization dict, unless custom eviction is needed.

Good:
```py
@lru_cache(maxsize=128)
def fib(n): ...
```

Bad:
```py
_cache = {}
def fib(n):
    if n in _cache:
        return _cache[n]
    ...
```

# Use frozen dataclasses for immutable value objects
A dataclass representing an immutable value should set `frozen=True`.

Good:
```py
@dataclass(frozen=True)
class Money:
    cents: int
```

Bad:
```py
@dataclass
class Money:
    cents: int
```

# Avoid star-args when explicit parameters are clearer
`*args, **kwargs` should not be used to avoid writing out a clear, explicit parameter list, when the signature is known.

Good:
```py
def create_user(name: str, email: str, role: str = "member"): ...
```

Bad:
```py
def create_user(*args, **kwargs): ...
```

# Do not commit __pycache__ or .pyc files
Compiled Python artifacts must be gitignored, not committed to the repository.

Good:
```py
# .gitignore
__pycache__/
*.pyc
```

Bad:
```py
# __pycache__/module.cpython-311.pyc committed to the repo
```

# Avoid mutable global configuration objects
Configuration should be loaded into an immutable structure, not a mutable module-level dict that's edited at runtime.

Good:
```py
CONFIG = types.MappingProxyType({"retries": 3})
```

Bad:
```py
CONFIG = {"retries": 3}
CONFIG["retries"] = 5  # mutated at runtime from anywhere
```

# Prefer raising specific exception subclasses
Raise a specific, meaningful exception class rather than the bare `Exception`.

Good:
```py
raise ValueError("age must be non-negative")
```

Bad:
```py
raise Exception("age must be non-negative")
```
