# Function Size
Function should always be under 20 lines of code

# Variable name
All variables must be short, the shorter the better
``
const a = 1; // VERY good
const a_b_c_d_e = 34 // Not so much
const a_b_d_d_e_f_g_h_i // Too long
`` 

# Usage of const and let
The code must use const as much as possible, then let.

# No console statements
Code must not contain `console.log`, `console.debug`, or `console.info`
calls. Use a proper logger, or remove them before committing.

# No explicit any type
TypeScript code must not use the `any` type. Use a specific type, `unknown`,
or a generic parameter instead.

# No commented-out code
Do not leave blocks of commented-out code. Delete code that is no longer
used instead of commenting it out.

# TODO comments need a reference
Any `TODO` or `FIXME` comment must include a ticket/issue reference, for
example `TODO(JIRA-123): ...`. A bare `TODO` or `FIXME` with no reference is
a violation.

# No empty catch blocks
A `catch` block must not be empty. It must handle the error, log it, or
rethrow it.

# No unreachable code
Code that can never execute (after a `return`, `throw`, `break`, or
`continue`, or behind a condition that is always false) must be removed.

# No unused variables
Declared variables that are never read must be removed. A variable that is
only ever assigned to, never used, is a violation.

# No unused imports
Imported symbols that are never referenced in the file must be removed.

# Avoid duplicate object keys
An object literal must not define the same key twice; the earlier one is
silently discarded and almost always a mistake.

# No shadowing of outer-scope variables
An inner variable, parameter, or function must not reuse the name of a
variable already in scope from an enclosing function or block.

# Off-by-one loop bounds must be verified
Loop conditions over arrays or ranges must not read or write one element
past the intended end (or stop one short). Check boundary conditions
against the actual collection length.

# No implicit type coercion in comparisons
Use `===`/`!==` instead of `==`/`!=`, except for the idiomatic
`== null` check that also matches `undefined`.

# Switch statements must have a default case
Every `switch` statement must include a `default` case, even if it only
throws or logs on an unexpected value.

# Errors must not be swallowed silently
An error must not be caught and discarded without logging, rethrowing, or
otherwise surfacing it. A `catch` that only calls something like
`ignore()` or has a comment such as `// ignore` is still a violation.

# Promise rejections must be handled
A Promise-returning call must either be awaited inside a try/catch, or have
a `.catch()` attached. A bare `somePromise()` with no error handling is a
violation.

# Custom errors must extend Error
A custom error class must extend the built-in `Error` (or a subclass of
it), not be a plain object or plain class.

# Do not throw non-Error values
`throw` must only throw `Error` instances (or subclasses), never strings,
numbers, or plain objects.

# Async functions must not leave unhandled rejections
An `async` function called without `await` and without a `.catch()` or
surrounding try/catch at the call site is a violation.

# Retry logic must have a maximum attempt limit
Any retry loop or recursive retry must have an explicit maximum number of
attempts; unbounded retries are a violation.

# Avoid unnecessary await in return statements
`return await someAsyncCall();` inside a function is unnecessary unless it
is inside a try/catch that needs to catch that call's rejection; otherwise
prefer `return someAsyncCall();`.

# Do not use async without await
A function declared `async` that contains no `await` expression is a
violation; drop the `async` keyword or use the await.

# Parallelizable awaits must use Promise.all
Two or more independent `await` calls in sequence that do not depend on
each other's results should be run concurrently with `Promise.all`
instead of awaited one after another.

# No floating promises
A Promise-returning expression used as a standalone statement (not
returned, awaited, or assigned) is a violation.

# setTimeout/setInterval must be cleared
A `setTimeout` or `setInterval` started inside a function/effect with a
lifetime (e.g. a component, a class instance) must have its handle cleared
via `clearTimeout`/`clearInterval` when that lifetime ends.

# Avoid nested callbacks deeper than 2 levels
Callback functions nested more than two levels deep are a violation;
prefer async/await, named functions, or Promise chaining.

# Long-running loops must not block the event loop
A loop performing heavy synchronous work over a large or unbounded
collection on the main thread (in a server or UI context) should yield
control periodically or move the work off the main thread.

# Avoid type assertions with `as` unless justified
A type assertion (`as SomeType`) must not be used to silence a real type
mismatch. It is acceptable only when the assertion is genuinely narrowing a
known-wider type (e.g. narrowing `unknown` after a runtime check).

# Exported functions must have explicit return types
Every exported function or method must declare its return type explicitly
rather than relying on inference.

# Avoid non-null assertion operator
The non-null assertion operator (`!`) must not be used to bypass a
legitimate possibility of `null`/`undefined`; handle the case explicitly
instead.

# Interfaces over type aliases for object shapes
Object shapes should be declared with `interface`, not `type`, unless a
union, intersection, or mapped type is required.

# No implicit any in function parameters
Every function parameter must have an explicit type; none may rely on
implicit `any`.

# Generic type parameters must be constrained when possible
A generic type parameter that is only ever used in ways that assume a
particular shape (e.g. calling `.length`) should have an `extends`
constraint reflecting that assumption.

# Avoid `Function` and `Object` as types
The bare `Function` and `Object` types must not be used; specify a precise
function signature or object shape instead.

# Discriminated unions must have exhaustive switch handling
A `switch` over a discriminated union's tag must handle every member of
the union (or have a default that fails loudly, e.g. an
exhaustiveness-check helper), so a newly added union member cannot be
silently ignored.

# Boolean variables must be prefixed with is/has/should/can
A variable or property of boolean type should be named starting with
`is`, `has`, `should`, `can`, or a similarly clear predicate prefix.

# Constants must be named in SCREAMING_SNAKE_CASE
Module-level constants that represent fixed configuration values (not
derived at runtime) should be named in `SCREAMING_SNAKE_CASE`.

# No single-letter variable names except loop counters
Variable names must be at least two characters and descriptive, except for
conventional loop counters (`i`, `j`, `k`) in simple `for` loops.

# Function names must be verbs describing the action
A function's name should start with a verb (e.g. `get`, `create`,
`parse`, `validate`) that describes what it does, not a noun alone.

# Avoid abbreviations in identifiers
Identifiers should spell out words rather than using unclear abbreviations
(e.g. prefer `configuration` or `config` over `cfg`, `userIdentifier` over
`usrId`), unless the abbreviation is a well-known industry term (e.g. `id`,
`url`, `html`).

# File names must match their default export
A file whose primary export is a single class, function, or component
should be named after that export (case-insensitively), not a generic name
like `index2.ts` or `helper.ts`.

# Avoid magic numbers
A numeric literal used in a conditional or calculation (other than 0, 1,
or -1) should be assigned to a named constant that explains its meaning,
instead of appearing inline.

# No hardcoded credentials or API keys
Source code must not contain hardcoded passwords, API keys, tokens, or
other secrets; these must come from configuration or a secrets manager.

# No use of eval or new Function
`eval()` and the `new Function(...)` constructor must not be used to
execute dynamically constructed code.

# User input must be validated before use
Data coming from a user, request body, query string, or other external
input must be validated (type, range, format) before being used in logic,
storage, or output.

# SQL queries must use parameterized queries
Database queries must use parameterized queries or an ORM's query builder;
string concatenation or template literals to build SQL with untrusted
input is a violation.

# No console logging of sensitive data
`console.log` and similar calls must not print secrets, tokens,
passwords, or other sensitive user data, even for debugging.

# Avoid insecure random number generation for security purposes
`Math.random()` must not be used to generate tokens, IDs used for
security purposes, or cryptographic material; use a cryptographically
secure random source instead.

# External URLs must be validated before navigation
A URL that comes from user input or an external source must be validated
(e.g. protocol allow-list) before being used for navigation, redirects, or
opening in a new window.

# Dependencies must not be dynamically required from user input
A `require(...)` or dynamic `import(...)` call must not use a path derived
from user-controllable input.

# Avoid unnecessary re-renders from inline literals in JSX props
Passing a newly created object, array, or arrow function literal as a prop
on every render (e.g. `<Child options={{ x: 1 }} />`) should be avoided
when it causes a memoized child to re-render unnecessarily; hoist or
memoize the value instead.

# Avoid O(n^2) operations on large collections
Nested iteration over the same large collection (e.g. `.find()` inside a
`.map()` over the same array) should be replaced with a lookup structure
(e.g. a `Map`) when a linear-time approach is available.

# Expensive computations in render must be memoized
A computation that is expensive relative to a component's render frequency
(e.g. sorting or filtering a large list) must be memoized (e.g.
`useMemo`) rather than recomputed on every render.

# Avoid re-creating regular expressions inside loops
A regular expression literal used inside a loop body should be hoisted
outside the loop instead of being constructed on every iteration.

# Large lists must use keys for efficient reconciliation
Rendering a list of elements (e.g. in React) must supply a stable, unique
`key` per item; using the array index as the key when the list can be
reordered or filtered is a violation.

# Avoid synchronous file I/O on the main thread
Synchronous file system calls (e.g. `readFileSync`) must not be used on a
request-handling or UI-rendering hot path; use the asynchronous equivalent.

# New exported functions must have at least one corresponding test
A newly added exported function or class should be accompanied by at least
one test exercising its main behavior.

# Tests must not depend on execution order
A test must not rely on state left behind by a previous test running
first; each test should set up and tear down its own state.

# Test descriptions must state the expected behavior
A test's name/description should state the expected behavior being
verified (e.g. "returns null when input is empty"), not a vague label like
"test 1" or "works".

# Mocks must be reset between tests
Mocks, spies, or stubs must be reset or restored between tests so that
behavior from one test cannot leak into another.

# No skipped tests left committed
`it.skip`, `xit`, `describe.skip`, or equivalent must not be left in
committed code without an accompanying explanation of why it's skipped.

# Assertions must not be commented out
An assertion (e.g. `expect(...)`) must not be commented out in a test; a
disabled assertion silently weakens the test's coverage.

# Public functions must have a doc comment describing purpose
An exported function or class intended for use by other modules should
have a short doc comment describing what it does, its parameters, and its
return value.

# Comments must explain why, not what
A comment should explain the reasoning behind non-obvious code (a
constraint, a workaround, a subtle invariant), not restate what
well-named code already makes obvious.

# No misleading or outdated comments
A comment must accurately describe the code next to it; a comment that
contradicts the code it annotates (e.g. describing removed behavior) is a
violation.

# Deprecated code must be marked with a deprecation notice
Code being kept temporarily for backward compatibility must be marked with
a `@deprecated` tag or equivalent comment explaining what to use instead.

# Commits must not include debug-only code
Debug-only scaffolding (temporary console output, hardcoded test values,
commented-out feature flags used only for local debugging) must not be
part of the change.

# No large binary files committed to source control
Large binary assets (e.g. multi-megabyte images, archives, compiled
binaries) should not be added directly to the repository; use an external
asset store or Git LFS instead.

# Config files must not contain environment-specific secrets
Committed configuration files must not contain secrets or
environment-specific values (API keys, database URLs with credentials);
these belong in environment variables or a secrets manager.

# Feature flags must have a clear rollback path
Code gated behind a new feature flag must be structured so the flag can be
turned off to fully restore the previous behavior, without requiring a
code change.

# Functions should have a single responsibility
A function should do one identifiable thing. A function that performs
several unrelated responsibilities (e.g. fetching data, transforming it,
and rendering UI all in one function) should be split up.

# Avoid deeply nested conditionals
Conditional logic should not nest more than three levels deep; prefer
early returns, guard clauses, or extracting helper functions.

# Duplicate logic should be extracted into a shared function
Near-identical logic repeated in more than one place in the same change
should be extracted into a shared, named function instead of copy-pasted.

# Circular dependencies between modules are not allowed
A module must not import (directly or transitively) from a module that
imports back from it.

# Barrel files must not re-export internal-only symbols
An `index.ts` barrel file must only re-export a module's public API, not
internal helpers meant to stay private to that module.