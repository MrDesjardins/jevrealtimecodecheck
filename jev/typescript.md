---
applies_to: **/*.ts
---

# Function Size
Function should always be under 20 lines of code

Good:
```ts
function parseCount(raw: string): number {
  const value = Number(raw);
  return Number.isFinite(value) ? value : 0;
}
```

Bad:
```ts
function processOrder(order: Order): Receipt {
  // ...25+ lines mixing validation, pricing, tax, discounts,
  // inventory updates, and email notification all in one function...
  validate(order);
  const price = computePrice(order);
  const tax = computeTax(price);
  const discount = computeDiscount(order, price);
  updateInventory(order);
  sendConfirmationEmail(order);
  return buildReceipt(order, price, tax, discount);
}
```


# Variable name
All variables must be short, the shorter the better

Good:
```ts
const a = 1;
```

Bad:
```ts
const a_b_c_d_e = 34;
const a_b_d_d_e_f_g_h_i = 100;
```


# Usage of const and let
The code must use const as much as possible, then let.

Good:
```ts
const total = items.reduce((sum, i) => sum + i.price, 0);
let retries = 0;
```

Bad:
```ts
let total = 0;
for (const item of items) {
  total += item.price; // never reassigned elsewhere, should be const-friendly design
}
var retries = 0;
```


# No console statements
Code must not contain `console.log`, `console.debug`, or `console.info`
calls. Use a proper logger, or remove them before committing.

Good:
```ts
logger.info("Config loaded", { path });
```

Bad:
```ts
console.log("Config loaded", path);
```


# No explicit any type
TypeScript code must not use the `any` type. Use a specific type, `unknown`,
or a generic parameter instead.

Good:
```ts
function parseJson(text: string): unknown {
  return JSON.parse(text);
}
```

Bad:
```ts
function parseJson(text: string): any {
  return JSON.parse(text);
}
```


# No commented-out code
Do not leave blocks of commented-out code. Delete code that is no longer
used instead of commenting it out.

Good:
```ts
const total = computeTotal(items);
```

Bad:
```ts
const total = computeTotal(items);
// const total = items.reduce((sum, i) => sum + i.price, 0);
// console.log(total);
```


# TODO comments need a reference
Any `TODO` or `FIXME` comment must include a ticket/issue reference, for
example `TODO(JIRA-123): ...`. A bare `TODO` or `FIXME` with no reference is
a violation.

Good:
```ts
// TODO(JIRA-482): remove this fallback once the v2 API is fully rolled out.
return legacyFetch(url);
```

Bad:
```ts
// TODO: fix this later
return legacyFetch(url);
```


# No empty catch blocks
A `catch` block must not be empty. It must handle the error, log it, or
rethrow it.

Good:
```ts
try {
  await save(record);
} catch (err) {
  logger.error("Failed to save record", err);
  throw err;
}
```

Bad:
```ts
try {
  await save(record);
} catch (err) {}
```


# No unreachable code
Code that can never execute (after a `return`, `throw`, `break`, or
`continue`, or behind a condition that is always false) must be removed.

Good:
```ts
function greet(name: string): string {
  return `Hello, ${name}`;
}
```

Bad:
```ts
function greet(name: string): string {
  return `Hello, ${name}`;
  console.log("done"); // never runs
}
```


# No unused variables
Declared variables that are never read must be removed. A variable that is
only ever assigned to, never used, is a violation.

Good:
```ts
const total = computeTotal(items);
return total;
```

Bad:
```ts
const total = computeTotal(items);
const unusedFlag = true;
return total;
```


# No unused imports
Imported symbols that are never referenced in the file must be removed.

Good:
```ts
import { parseRules } from "./rulesParser";
parseRules(text);
```

Bad:
```ts
import { parseRules } from "./rulesParser";
import { readFile } from "node:fs/promises"; // never used
parseRules(text);
```


# Avoid duplicate object keys
An object literal must not define the same key twice; the earlier one is
silently discarded and almost always a mistake.

Good:
```ts
const config = { retries: 3, timeout: 1000 };
```

Bad:
```ts
const config = { retries: 3, timeout: 500, timeout: 1000 };
```


# No shadowing of outer-scope variables
An inner variable, parameter, or function must not reuse the name of a
variable already in scope from an enclosing function or block.

Good:
```ts
function processUsers(users: User[]): void {
  for (const currentUser of users) {
    handle(currentUser);
  }
}
```

Bad:
```ts
function processUsers(users: User[]): void {
  for (const users of users) { // shadows the outer `users` parameter
    handle(users);
  }
}
```


# Off-by-one loop bounds must be verified
Loop conditions over arrays or ranges must not read or write one element
past the intended end (or stop one short). Check boundary conditions
against the actual collection length.

Good:
```ts
for (let i = 0; i < items.length; i++) {
  process(items[i]);
}
```

Bad:
```ts
for (let i = 0; i <= items.length; i++) {
  process(items[i]); // reads items[items.length] === undefined
}
```


# No implicit type coercion in comparisons
Use `===`/`!==` instead of `==`/`!=`, except for the idiomatic
`== null` check that also matches `undefined`.

Good:
```ts
if (status === "active") { ... }
if (value == null) { ... } // intentionally matches null and undefined
```

Bad:
```ts
if (status == "active") { ... }
if (count != 0) { ... }
```


# Switch statements must have a default case
Every `switch` statement must include a `default` case, even if it only
throws or logs on an unexpected value.

Good:
```ts
switch (status) {
  case "active": return handleActive();
  case "closed": return handleClosed();
  default: throw new Error(`Unhandled status: ${status}`);
}
```

Bad:
```ts
switch (status) {
  case "active": return handleActive();
  case "closed": return handleClosed();
}
```


# Errors must not be swallowed silently
An error must not be caught and discarded without logging, rethrowing, or
otherwise surfacing it. A `catch` that only calls something like
`ignore()` or has a comment such as `// ignore` is still a violation.

Good:
```ts
try {
  await sync();
} catch (err) {
  logger.warn("Sync failed, will retry later", err);
}
```

Bad:
```ts
try {
  await sync();
} catch (err) {
  // ignore
}
```


# Promise rejections must be handled
A Promise-returning call must either be awaited inside a try/catch, or have
a `.catch()` attached. A bare `somePromise()` with no error handling is a
violation.

Good:
```ts
sendAnalyticsEvent(event).catch((err) => logger.warn("Analytics failed", err));
```

Bad:
```ts
sendAnalyticsEvent(event);
```


# Custom errors must extend Error
A custom error class must extend the built-in `Error` (or a subclass of
it), not be a plain object or plain class.

Good:
```ts
class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}
```

Bad:
```ts
class ValidationError {
  constructor(public message: string) {}
}
```


# Do not throw non-Error values
`throw` must only throw `Error` instances (or subclasses), never strings,
numbers, or plain objects.

Good:
```ts
throw new Error("Invalid configuration: missing apiKey");
```

Bad:
```ts
throw "Invalid configuration: missing apiKey";
```


# Async functions must not leave unhandled rejections
An `async` function called without `await` and without a `.catch()` or
surrounding try/catch at the call site is a violation.

Good:
```ts
await refreshCache();
```

Bad:
```ts
refreshCache(); // async function called and forgotten
```


# Retry logic must have a maximum attempt limit
Any retry loop or recursive retry must have an explicit maximum number of
attempts; unbounded retries are a violation.

Good:
```ts
for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
  if (await tryConnect()) return true;
}
return false;
```

Bad:
```ts
while (true) {
  if (await tryConnect()) return true;
}
```


# Avoid unnecessary await in return statements
`return await someAsyncCall();` inside a function is unnecessary unless it
is inside a try/catch that needs to catch that call's rejection; otherwise
prefer `return someAsyncCall();`.

Good:
```ts
async function loadUser(id: string): Promise<User> {
  return fetchUser(id);
}
```

Bad:
```ts
async function loadUser(id: string): Promise<User> {
  return await fetchUser(id); // no surrounding try/catch, await is redundant
}
```


# Do not use async without await
A function declared `async` that contains no `await` expression is a
violation; drop the `async` keyword or use the await.

Good:
```ts
function double(n: number): number {
  return n * 2;
}
```

Bad:
```ts
async function double(n: number): Promise<number> {
  return n * 2; // no await anywhere in the body
}
```


# Parallelizable awaits must use Promise.all
Two or more independent `await` calls in sequence that do not depend on
each other's results should be run concurrently with `Promise.all`
instead of awaited one after another.

Good:
```ts
const [user, settings] = await Promise.all([fetchUser(id), fetchSettings(id)]);
```

Bad:
```ts
const user = await fetchUser(id);
const settings = await fetchSettings(id); // independent of user, but run sequentially
```


# No floating promises
A Promise-returning expression used as a standalone statement (not
returned, awaited, or assigned) is a violation.

Good:
```ts
void logAnalytics(event);
```

Bad:
```ts
logAnalytics(event); // Promise result silently discarded, not even `void`-marked
```


# setTimeout/setInterval must be cleared
A `setTimeout` or `setInterval` started inside a function/effect with a
lifetime (e.g. a component, a class instance) must have its handle cleared
via `clearTimeout`/`clearInterval` when that lifetime ends.

Good:
```ts
useEffect(() => {
  const id = setInterval(poll, 1000);
  return () => clearInterval(id);
}, []);
```

Bad:
```ts
useEffect(() => {
  setInterval(poll, 1000); // never cleared
}, []);
```


# Avoid nested callbacks deeper than 2 levels
Callback functions nested more than two levels deep are a violation;
prefer async/await, named functions, or Promise chaining.

Good:
```ts
const user = await fetchUser(id);
const orders = await fetchOrders(user.id);
const total = await computeTotal(orders);
```

Bad:
```ts
fetchUser(id, (user) => {
  fetchOrders(user.id, (orders) => {
    computeTotal(orders, (total) => {
      console.log(total);
    });
  });
});
```


# Long-running loops must not block the event loop
A loop performing heavy synchronous work over a large or unbounded
collection on the main thread (in a server or UI context) should yield
control periodically or move the work off the main thread.

Good:
```ts
for (const batch of chunk(items, 1000)) {
  processBatch(batch);
  await new Promise((r) => setImmediate(r));
}
```

Bad:
```ts
for (const item of millionsOfItems) {
  processHeavy(item); // blocks the event loop for the entire run
}
```


# Avoid type assertions with `as` unless justified
A type assertion (`as SomeType`) must not be used to silence a real type
mismatch. It is acceptable only when the assertion is genuinely narrowing a
known-wider type (e.g. narrowing `unknown` after a runtime check).

Good:
```ts
function isUser(x: unknown): x is User {
  return typeof x === "object" && x !== null && "id" in x;
}
if (isUser(data)) { use(data); }
```

Bad:
```ts
const user = data as User; // no runtime check, just silences the type error
```


# Exported functions must have explicit return types
Every exported function or method must declare its return type explicitly
rather than relying on inference.

Good:
```ts
export function parseCount(raw: string): number {
  return Number(raw) || 0;
}
```

Bad:
```ts
export function parseCount(raw: string) {
  return Number(raw) || 0;
}
```


# Avoid non-null assertion operator
The non-null assertion operator (`!`) must not be used to bypass a
legitimate possibility of `null`/`undefined`; handle the case explicitly
instead.

Good:
```ts
const user = users.get(id);
if (!user) throw new Error(`User ${id} not found`);
use(user);
```

Bad:
```ts
const user = users.get(id)!;
use(user);
```


# Interfaces over type aliases for object shapes
Object shapes should be declared with `interface`, not `type`, unless a
union, intersection, or mapped type is required.

Good:
```ts
interface User {
  id: string;
  name: string;
}
```

Bad:
```ts
type User = {
  id: string;
  name: string;
};
```


# No implicit any in function parameters
Every function parameter must have an explicit type; none may rely on
implicit `any`.

Good:
```ts
function double(n: number): number {
  return n * 2;
}
```

Bad:
```ts
function double(n) {
  return n * 2;
}
```


# Generic type parameters must be constrained when possible
A generic type parameter that is only ever used in ways that assume a
particular shape (e.g. calling `.length`) should have an `extends`
constraint reflecting that assumption.

Good:
```ts
function firstOf<T extends { length: number }>(collection: T): number {
  return collection.length;
}
```

Bad:
```ts
function firstOf<T>(collection: T): number {
  return (collection as any).length;
}
```


# Avoid `Function` and `Object` as types
The bare `Function` and `Object` types must not be used; specify a precise
function signature or object shape instead.

Good:
```ts
function onClick(handler: (event: MouseEvent) => void): void {}
```

Bad:
```ts
function onClick(handler: Function): void {}
```


# Discriminated unions must have exhaustive switch handling
A `switch` over a discriminated union's tag must handle every member of
the union (or have a default that fails loudly, e.g. an
exhaustiveness-check helper), so a newly added union member cannot be
silently ignored.

Good:
```ts
switch (shape.kind) {
  case "circle": return Math.PI * shape.radius ** 2;
  case "square": return shape.side ** 2;
  default: return assertNever(shape);
}
```

Bad:
```ts
switch (shape.kind) {
  case "circle": return Math.PI * shape.radius ** 2;
  // "square" silently falls through to undefined if added later
}
```


# Boolean variables must be prefixed with is/has/should/can
A variable or property of boolean type should be named starting with
`is`, `has`, `should`, `can`, or a similarly clear predicate prefix.

Good:
```ts
const isReady = queue.length === 0;
const hasPermission = user.role === "admin";
```

Bad:
```ts
const ready = queue.length === 0;
const permission = user.role === "admin";
```


# Constants must be named in SCREAMING_SNAKE_CASE
Module-level constants that represent fixed configuration values (not
derived at runtime) should be named in `SCREAMING_SNAKE_CASE`.

Good:
```ts
const MAX_RETRIES = 3;
const DEFAULT_TIMEOUT_MS = 5000;
```

Bad:
```ts
const maxRetries = 3;
const defaultTimeoutMs = 5000;
```


# No single-letter variable names except loop counters
Variable names must be at least two characters and descriptive, except for
conventional loop counters (`i`, `j`, `k`) in simple `for` loops.

Good:
```ts
const user = users.find((u) => u.id === id);
for (let i = 0; i < items.length; i++) { ... }
```

Bad:
```ts
const u = users.find((x) => x.id === id);
```


# Function names must be verbs describing the action
A function's name should start with a verb (e.g. `get`, `create`,
`parse`, `validate`) that describes what it does, not a noun alone.

Good:
```ts
function parseConfig(text: string): Config { ... }
```

Bad:
```ts
function config(text: string): Config { ... }
```


# Avoid abbreviations in identifiers
Identifiers should spell out words rather than using unclear abbreviations
(e.g. prefer `configuration` or `config` over `cfg`, `userIdentifier` over
`usrId`), unless the abbreviation is a well-known industry term (e.g. `id`,
`url`, `html`).

Good:
```ts
const configuration = loadConfiguration();
const userId = getCurrentUserId();
```

Bad:
```ts
const cfg = loadCfg();
const usrId = getCurUsrId();
```


# File names must match their default export
A file whose primary export is a single class, function, or component
should be named after that export (case-insensitively), not a generic name
like `index2.ts` or `helper.ts`.

Good:
```ts
// file: UserProfile.tsx
export default function UserProfile() { ... }
```

Bad:
```ts
// file: helper.ts
export default function UserProfile() { ... }
```


# Avoid magic numbers
A numeric literal used in a conditional or calculation (other than 0, 1,
or -1) should be assigned to a named constant that explains its meaning,
instead of appearing inline.

Good:
```ts
const MAX_LOGIN_ATTEMPTS = 5;
if (attempts > MAX_LOGIN_ATTEMPTS) { lockAccount(); }
```

Bad:
```ts
if (attempts > 5) { lockAccount(); }
```


# No hardcoded credentials or API keys
Source code must not contain hardcoded passwords, API keys, tokens, or
other secrets; these must come from configuration or a secrets manager.

Good:
```ts
const apiKey = process.env.TYPESAFE_API_KEY;
```

Bad:
```ts
const apiKey = "sk_live_51Hxyz...";
```


# No use of eval or new Function
`eval()` and the `new Function(...)` constructor must not be used to
execute dynamically constructed code.

Good:
```ts
const result = JSON.parse(input);
```

Bad:
```ts
const result = eval(input);
```


# User input must be validated before use
Data coming from a user, request body, query string, or other external
input must be validated (type, range, format) before being used in logic,
storage, or output.

Good:
```ts
const age = Number(req.body.age);
if (!Number.isInteger(age) || age < 0 || age > 150) {
  return res.status(400).send("Invalid age");
}
```

Bad:
```ts
const age = req.body.age;
saveUser({ age }); // used directly with no validation
```


# SQL queries must use parameterized queries
Database queries must use parameterized queries or an ORM's query builder;
string concatenation or template literals to build SQL with untrusted
input is a violation.

Good:
```ts
db.query("SELECT * FROM users WHERE email = $1", [email]);
```

Bad:
```ts
db.query(`SELECT * FROM users WHERE email = '${email}'`);
```


# No console logging of sensitive data
`console.log` and similar calls must not print secrets, tokens,
passwords, or other sensitive user data, even for debugging.

Good:
```ts
logger.debug("Login attempt", { userId: user.id });
```

Bad:
```ts
console.log("Login attempt", { password: user.password, token });
```


# Avoid insecure random number generation for security purposes
`Math.random()` must not be used to generate tokens, IDs used for
security purposes, or cryptographic material; use a cryptographically
secure random source instead.

Good:
```ts
import { randomBytes } from "node:crypto";
const token = randomBytes(32).toString("hex");
```

Bad:
```ts
const token = Math.random().toString(36).slice(2);
```


# External URLs must be validated before navigation
A URL that comes from user input or an external source must be validated
(e.g. protocol allow-list) before being used for navigation, redirects, or
opening in a new window.

Good:
```ts
const url = new URL(redirectTarget);
if (!["https:", "http:"].includes(url.protocol)) throw new Error("Blocked redirect");
window.location.href = url.toString();
```

Bad:
```ts
window.location.href = redirectTarget; // unvalidated, could be javascript:...
```


# Dependencies must not be dynamically required from user input
A `require(...)` or dynamic `import(...)` call must not use a path derived
from user-controllable input.

Good:
```ts
const handlers = { pdf: pdfHandler, csv: csvHandler };
const handler = handlers[requestedType];
```

Bad:
```ts
const handler = require(`./handlers/${req.query.type}`);
```


# Avoid O(n^2) operations on large collections
Nested iteration over the same large collection (e.g. `.find()` inside a
`.map()` over the same array) should be replaced with a lookup structure
(e.g. a `Map`) when a linear-time approach is available.

Good:
```ts
const byId = new Map(orders.map((o) => [o.id, o]));
const enriched = ids.map((id) => byId.get(id));
```

Bad:
```ts
const enriched = ids.map((id) => orders.find((o) => o.id === id));
```


# Avoid re-creating regular expressions inside loops
A regular expression literal used inside a loop body should be hoisted
outside the loop instead of being constructed on every iteration.

Good:
```ts
const emailPattern = /^[^@]+@[^@]+$/;
for (const line of lines) {
  if (emailPattern.test(line)) matches.push(line);
}
```

Bad:
```ts
for (const line of lines) {
  if (/^[^@]+@[^@]+$/.test(line)) matches.push(line);
}
```


# Avoid synchronous file I/O on the main thread
Synchronous file system calls (e.g. `readFileSync`) must not be used on a
request-handling or UI-rendering hot path; use the asynchronous equivalent.

Good:
```ts
app.get("/config", async (req, res) => {
  const data = await readFile("config.json", "utf8");
  res.send(data);
});
```

Bad:
```ts
app.get("/config", (req, res) => {
  const data = readFileSync("config.json", "utf8");
  res.send(data);
});
```


# New exported functions must have at least one corresponding test
A newly added exported function or class should be accompanied by at least
one test exercising its main behavior.

Good:
```ts
export function parseCount(raw: string): number { ... }

// parseCount.test.ts
test("parseCount returns 0 for non-numeric input", () => {
  assert.equal(parseCount("abc"), 0);
});
```

Bad:
```ts
export function parseCount(raw: string): number { ... }
// no test file added for this new export
```


# Tests must not depend on execution order
A test must not rely on state left behind by a previous test running
first; each test should set up and tear down its own state.

Good:
```ts
test("adds an item", () => {
  const cart = new Cart();
  cart.add(item);
  assert.equal(cart.items.length, 1);
});
```

Bad:
```ts
const cart = new Cart(); // shared across tests
test("adds an item", () => { cart.add(item); assert.equal(cart.items.length, 1); });
test("cart has one item", () => { assert.equal(cart.items.length, 1); }); // depends on prior test running first
```


# Test descriptions must state the expected behavior
A test's name/description should state the expected behavior being
verified (e.g. "returns null when input is empty"), not a vague label like
"test 1" or "works".

Good:
```ts
test("returns 0 when the input string is not a number", () => { ... });
```

Bad:
```ts
test("test 1", () => { ... });
```


# Mocks must be reset between tests
Mocks, spies, or stubs must be reset or restored between tests so that
behavior from one test cannot leak into another.

Good:
```ts
afterEach(() => {
  jest.restoreAllMocks();
});
```

Bad:
```ts
test("a", () => { jest.spyOn(api, "fetch").mockReturnValue(ok); ... });
test("b", () => { /* no reset — still returns the mocked value from test "a" */ ... });
```


# No skipped tests left committed
`it.skip`, `xit`, `describe.skip`, or equivalent must not be left in
committed code without an accompanying explanation of why it's skipped.

Good:
```ts
// Skipped: flaky on CI due to timing, tracked in JIRA-991.
it.skip("retries on timeout", () => { ... });
```

Bad:
```ts
it.skip("retries on timeout", () => { ... });
```


# Assertions must not be commented out
An assertion (e.g. `expect(...)`) must not be commented out in a test; a
disabled assertion silently weakens the test's coverage.

Good:
```ts
test("computes total", () => {
  expect(computeTotal(items)).toBe(30);
});
```

Bad:
```ts
test("computes total", () => {
  const total = computeTotal(items);
  // expect(total).toBe(30);
});
```


# Public functions must have a doc comment describing purpose
An exported function or class intended for use by other modules should
have a short doc comment describing what it does, its parameters, and its
return value.

Good:
```ts
/** Parses a raw rules Markdown file into a list of Rule objects. */
export function parseRules(markdown: string): Rule[] { ... }
```

Bad:
```ts
export function parseRules(markdown: string): Rule[] { ... }
```


# Comments must explain why, not what
A comment should explain the reasoning behind non-obvious code (a
constraint, a workaround, a subtle invariant), not restate what
well-named code already makes obvious.

Good:
```ts
// Floored at 1s so rapid edits can never trigger more than one request/sec.
const delay = Math.max(1000, configuredDelay);
```

Bad:
```ts
// set delay to the max of 1000 and configuredDelay
const delay = Math.max(1000, configuredDelay);
```


# No misleading or outdated comments
A comment must accurately describe the code next to it; a comment that
contradicts the code it annotates (e.g. describing removed behavior) is a
violation.

Good:
```ts
// Retries up to 3 times with exponential backoff.
for (let attempt = 0; attempt < 3; attempt++) { ... }
```

Bad:
```ts
// Retries up to 3 times with exponential backoff.
for (let attempt = 0; attempt < 10; attempt++) { ... } // comment no longer matches
```


# Deprecated code must be marked with a deprecation notice
Code being kept temporarily for backward compatibility must be marked with
a `@deprecated` tag or equivalent comment explaining what to use instead.

Good:
```ts
/** @deprecated Use fetchUserV2 instead. Will be removed after 2026-Q2. */
export function fetchUser(id: string): User { ... }
```

Bad:
```ts
export function fetchUser(id: string): User { ... } // kept around with no notice it's obsolete
```


# Commits must not include debug-only code
Debug-only scaffolding (temporary console output, hardcoded test values,
commented-out feature flags used only for local debugging) must not be
part of the change.

Good:
```ts
const userId = req.params.userId;
```

Bad:
```ts
const userId = "test-user-123"; // hardcoded for local debugging, left in by mistake
console.log("DEBUG", userId);
```


# No large binary files committed to source control
Large binary assets (e.g. multi-megabyte images, archives, compiled
binaries) should not be added directly to the repository; use an external
asset store or Git LFS instead.

Good:
```
assets/logo.svg          (4 KB, vector, tracked normally)
```

Bad:
```
assets/product-demo.mp4  (85 MB, committed directly to git)
```


# Config files must not contain environment-specific secrets
Committed configuration files must not contain secrets or
environment-specific values (API keys, database URLs with credentials);
these belong in environment variables or a secrets manager.

Good:
```json
{ "databaseUrl": "${DATABASE_URL}", "apiKey": "${TYPESAFE_API_KEY}" }
```

Bad:
```json
{ "databaseUrl": "postgres://admin:hunter2@prod-db:5432/app" }
```


# Feature flags must have a clear rollback path
Code gated behind a new feature flag must be structured so the flag can be
turned off to fully restore the previous behavior, without requiring a
code change.

Good:
```ts
const checkout = flags.newCheckoutFlow ? renderNewCheckout() : renderLegacyCheckout();
```

Bad:
```ts
if (flags.newCheckoutFlow) {
  removeLegacyCheckoutCode(); // old path deleted, flag can no longer be turned off safely
}
renderNewCheckout();
```


# Functions should have a single responsibility
A function should do one identifiable thing. A function that performs
several unrelated responsibilities (e.g. fetching data, transforming it,
and rendering UI all in one function) should be split up.

Good:
```ts
const raw = await fetchOrders(userId);
const orders = normalizeOrders(raw);
renderOrders(orders);
```

Bad:
```ts
async function loadAndRenderOrders(userId: string) {
  const res = await fetch(`/orders?user=${userId}`);
  const raw = await res.json();
  const normalized = raw.map((o) => ({ ...o, total: o.price * o.qty }));
  document.getElementById("orders")!.innerHTML = normalized.map(renderRow).join("");
}
```


# Avoid deeply nested conditionals
Conditional logic should not nest more than three levels deep; prefer
early returns, guard clauses, or extracting helper functions.

Good:
```ts
function canCheckout(user: User): boolean {
  if (!user.isVerified) return false;
  if (user.cart.length === 0) return false;
  return user.paymentMethod != null;
}
```

Bad:
```ts
function canCheckout(user: User): boolean {
  if (user.isVerified) {
    if (user.cart.length > 0) {
      if (user.paymentMethod != null) {
        return true;
      }
    }
  }
  return false;
}
```


# Duplicate logic should be extracted into a shared function
Near-identical logic repeated in more than one place in the same change
should be extracted into a shared, named function instead of copy-pasted.

Good:
```ts
function formatCurrency(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
const priceLabel = formatCurrency(order.price);
const taxLabel = formatCurrency(order.tax);
```

Bad:
```ts
const priceLabel = `$${(order.price / 100).toFixed(2)}`;
const taxLabel = `$${(order.tax / 100).toFixed(2)}`; // same formatting logic copy-pasted
```


# Circular dependencies between modules are not allowed
A module must not import (directly or transitively) from a module that
imports back from it.

Good:
```ts
// types.ts exports shared types only
// userService.ts imports from types.ts
// orderService.ts imports from types.ts
// (no module imports back from userService.ts or orderService.ts)
```

Bad:
```ts
// userService.ts
import { getOrders } from "./orderService";

// orderService.ts
import { getUser } from "./userService"; // creates a cycle with userService.ts
```


# Barrel files must not re-export internal-only symbols
An `index.ts` barrel file must only re-export a module's public API, not
internal helpers meant to stay private to that module.

Good:
```ts
// index.ts
export { AnalysisController } from "./analysisController";
export type { AnalysisStatus } from "./analysisController";
```

Bad:
```ts
// index.ts
export * from "./analysisController"; // also leaks internal helpers not meant for consumers
```
