---
applies_to: **/*.ts
---

# Functions must not return null

Functions should never return `null` to signal absence. Use an explicit
result type instead (e.g. a discriminated union, an `Option`/`Maybe`-style
wrapper, or throwing a descriptive error), so callers cannot forget to
handle the "nothing" case.

Good:
```ts
type FindUserResult = { found: true; user: User } | { found: false };

function findUser(id: string): FindUserResult {
  const user = users.get(id);
  return user ? { found: true, user } : { found: false };
}
```

Bad:
```ts
function findUser(id: string): User | null {
  return users.get(id) ?? null;
}
```

# User-facing error messages must describe a recovery action

Any string shown to the end user that communicates an error must tell the
user what to do next (e.g. "try again", "check your connection", "contact
support"). A bare error description with no next step is a violation.

Good:
```ts
return "Could not load your profile. Please check your connection and try again.";
```

Bad:
```ts
return "Could not load your profile.";
```
