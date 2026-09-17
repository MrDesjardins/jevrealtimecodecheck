---
applies_to: **/*.tsx
---

# Avoid unnecessary re-renders from inline literals in JSX props
Passing a newly created object, array, or arrow function literal as a prop
on every render (e.g. `<Child options={{ x: 1 }} />`) should be avoided
when it causes a memoized child to re-render unnecessarily; hoist or
memoize the value instead.

Good:
```tsx
const options = useMemo(() => ({ x: 1 }), []);
return <Child options={options} />;
```

Bad:
```tsx
return <Child options={{ x: 1 }} />; // new object identity every render
```

# Expensive computations in render must be memoized
A computation that is expensive relative to a component's render frequency
(e.g. sorting or filtering a large list) must be memoized (e.g.
`useMemo`) rather than recomputed on every render.

Good:
```tsx
const sorted = useMemo(() => [...items].sort(byDate), [items]);
```

Bad:
```tsx
const sorted = [...items].sort(byDate); // resorted on every render
```

# Large lists must use keys for efficient reconciliation
Rendering a list of elements (e.g. in React) must supply a stable, unique
`key` per item; using the array index as the key when the list can be
reordered or filtered is a violation.

Good:
```tsx
{items.map((item) => <Row key={item.id} item={item} />)}
```

Bad:
```tsx
{items.map((item, index) => <Row key={index} item={item} />)}
```

# Components must not define new component types in render
Do not declare a new component function inside another component's render body; it remounts on every render.

Good:
```tsx
function Row({ item }: RowProps) { return <li>{item.name}</li>; }
function List({ items }: ListProps) {
  return <ul>{items.map((i) => <Row key={i.id} item={i} />)}</ul>;
}
```

Bad:
```tsx
function List({ items }: ListProps) {
  function Row({ item }: RowProps) { return <li>{item.name}</li>; }
  return <ul>{items.map((i) => <Row key={i.id} item={i} />)}</ul>;
}
```

# Do not call hooks conditionally
Hooks must be called unconditionally, at the top level, in the same order on every render.

Good:
```tsx
const [value, setValue] = useState(0);
if (enabled) { doSomething(value); }
```

Bad:
```tsx
if (enabled) {
  const [value, setValue] = useState(0);
}
```

# Hooks must not be called inside loops
A hook must not be called inside a `for`/`while` loop; the hook call order must stay fixed across renders.

Good:
```tsx
const values = ids.map((id) => useSelector(id)); // still wrong; use one selector call
```

Bad:
```tsx
for (const id of ids) {
  const value = useSelector(id);
}
```

# Avoid useEffect when a value can be derived during render
Do not use `useEffect` + state just to compute a derived value; compute it directly during render instead.

Good:
```tsx
const fullName = `${first} ${last}`;
```

Bad:
```tsx
const [fullName, setFullName] = useState("");
useEffect(() => { setFullName(`${first} ${last}`); }, [first, last]);
```

# Do not mutate state directly
State must be updated via its setter (`setX(...)`) with a new value/object, never mutated in place.

Good:
```tsx
setItems((prev) => [...prev, newItem]);
```

Bad:
```tsx
items.push(newItem);
setItems(items);
```

# Avoid prop drilling beyond a few levels
Data passed through more than 2-3 levels of props with no intermediate use should go through context instead.

Good:
```tsx
const theme = useContext(ThemeContext);
```

Bad:
```tsx
<A theme={theme}><B theme={theme}><C theme={theme}><D theme={theme} /></C></B></A>
```

# Components must not perform side effects during render
Side effects (network calls, subscriptions, logging) belong in `useEffect`/event handlers, not the render body itself.

Good:
```tsx
useEffect(() => { analytics.track("viewed"); }, []);
```

Bad:
```tsx
analytics.track("viewed"); // called directly in the component body
```

# Avoid anonymous default-exported components
Export components as named functions (`export function Foo()`), not anonymous default exports, for better stack traces and Fast Refresh.

Good:
```tsx
export function UserProfile() { ... }
```

Bad:
```tsx
export default function () { ... }
```

# Do not use array indices as keys in reorderable lists
When a list can be reordered, filtered, or have items inserted, the `key` must be a stable id, not the array index.

Good:
```tsx
{items.map((item) => <Row key={item.id} item={item} />)}
```

Bad:
```tsx
{items.map((item, index) => <Row key={index} item={item} />)}
```

# Avoid overly large components
A component file growing beyond roughly 150 lines is a signal to extract subcomponents or hooks.

Good:
```tsx
function UserProfile() { return <><Header /><Details /><Actions /></>; }
```

Bad:
```tsx
function UserProfile() { /* 300+ lines mixing layout, data fetching, and business logic */ }
```

# Props interfaces should be named consistently
A component's props type should be named `<ComponentName>Props` for discoverability.

Good:
```tsx
interface UserCardProps { user: User; }
```

Bad:
```tsx
interface Props { user: User; }
```

# Do not use dangerouslySetInnerHTML with unsanitized content
Content passed to `dangerouslySetInnerHTML` must be sanitized; never pass raw, untrusted user input.

Good:
```tsx
<div dangerouslySetInnerHTML={{ __html: sanitize(html) }} />
```

Bad:
```tsx
<div dangerouslySetInnerHTML={{ __html: userInput }} />
```

# Avoid new object/array literals as context values every render
A Context Provider's `value` prop should be memoized, not a fresh object/array literal on every render.

Good:
```tsx
const value = useMemo(() => ({ theme, setTheme }), [theme]);
<ThemeContext.Provider value={value}>
```

Bad:
```tsx
<ThemeContext.Provider value={{ theme, setTheme }}>
```

# Avoid deep cross-feature imports between components
A component should not reach into another feature folder's internals directly; go through that feature's public exports.

Good:
```tsx
import { OrderSummary } from "@/features/orders";
```

Bad:
```tsx
import { OrderSummary } from "@/features/orders/components/internal/OrderSummary";
```

# useEffect should declare its dependency array intentionally
Omitting `useEffect`'s dependency array (so it runs every render) must be an explicit, documented choice, not an oversight.

Good:
```tsx
useEffect(() => { fetchData(id); }, [id]);
```

Bad:
```tsx
useEffect(() => { fetchData(id); });
```

# Do not call setState during render
State setters must not be called synchronously during the render phase outside of specific documented patterns; it can cause infinite loops.

Good:
```tsx
useEffect(() => { setCount(count + 1); }, []);
```

Bad:
```tsx
function Counter({ count, setCount }) {
  setCount(count + 1); // called during render
  return <span>{count}</span>;
}
```

# Avoid ambiguous negative boolean prop names
Prefer positive boolean prop names (`enabled`) over double-negatives (`notDisabled`) that are hard to reason about at call sites.

Good:
```tsx
<Button enabled={true} />
```

Bad:
```tsx
<Button notDisabled={true} />
```

# Custom hooks must be prefixed with use
A function that calls other hooks must be named starting with `use` so React's rules-of-hooks linting can apply.

Good:
```tsx
function useOnlineStatus() { ... }
```

Bad:
```tsx
function getOnlineStatus() { const [state] = useState(false); return state; }
```

# Avoid returning JSX conditionally with inconsistent hook calls
Do not put an early `return` before hook calls; all hooks must run before any conditional return.

Good:
```tsx
const [value] = useState(0);
if (!ready) return null;
return <div>{value}</div>;
```

Bad:
```tsx
if (!ready) return null;
const [value] = useState(0);
return <div>{value}</div>;
```

# Do not spread unknown props onto DOM elements
Spreading an untyped props object directly onto a native DOM element can leak invalid HTML attributes; filter or type it explicitly.

Good:
```tsx
const { className, ...rest } = props;
<button className={className} onClick={rest.onClick} />
```

Bad:
```tsx
<button {...props} />
```
