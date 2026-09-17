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

