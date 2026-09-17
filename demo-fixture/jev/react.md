---
applies_to: **/*.tsx
---

# Event listeners acquired inside React effects must have corresponding cleanup

Any listener registered with `addEventListener`, a subscription, an
interval, or a timeout that is started inside a `useEffect` must be
removed/cleared in that effect's cleanup function (the function the effect
returns). Effects that add a listener without returning a cleanup function
are a violation.

Good:
```tsx
useEffect(() => {
  const onChange = () => setOnline(navigator.onLine);
  window.addEventListener("online", onChange);
  return () => window.removeEventListener("online", onChange);
}, []);
```

Bad:
```tsx
useEffect(() => {
  const onChange = () => setOnline(navigator.onLine);
  window.addEventListener("online", onChange);
  // no cleanup returned — listener leaks on every unmount/remount
}, []);
```
