# Functions must not return null

Functions should never return `null` to signal absence. Use an explicit
result type instead (e.g. a discriminated union, an `Option`/`Maybe`-style
wrapper, or throwing a descriptive error), so callers cannot forget to
handle the "nothing" case.

Example of a violation:

```ts
function findUser(id: string): User | null {
  return users.get(id) ?? null;
}
```

# Event listeners acquired inside React effects must have corresponding cleanup

Any listener registered with `addEventListener`, a subscription, an
interval, or a timeout that is started inside a `useEffect` must be
removed/cleared in that effect's cleanup function (the function the effect
returns). Effects that add a listener without returning a cleanup function
are a violation.

# User-facing error messages must describe a recovery action

Any string shown to the end user that communicates an error must tell the
user what to do next (e.g. "try again", "check your connection", "contact
support"). A bare error description with no next step is a violation.
