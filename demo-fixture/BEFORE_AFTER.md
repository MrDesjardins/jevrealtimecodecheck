# Demo script

This folder is its own small Git repository (separate from the extension's
repo) with one clean commit. Open **this folder** (`demo-fixture`) as the
workspace root in Cursor/VS Code, then use it to see the sidebar change live.

The baseline commit is compliant with all three rules in `jev-rules.md`.
For each rule below: make the edit, save, run **Jev: Analyze changes**
(or wait for auto-analyze if enabled), observe the badge, then revert the
edit, save again, and watch it go back to compliant.

## 1. Functions must not return null — `src/api.ts`

Change:

```ts
export function findUser(id: string): FindUserResult {
  const user = users.get(id);
  return user ? { found: true, user } : { found: false };
}
```

to:

```ts
export function findUser(id: string): User | null {
  const user = users.get(id);
  return user ?? null;
}
```

Save → expect **violation**. Revert → expect **compliant**.

## 2. Event listeners need cleanup — `src/UserProfile.tsx`

Remove the `return () => { ... }` cleanup block from the `useEffect`, so it
adds listeners but never removes them. Save → expect **violation**.
Restore the cleanup block, save → expect **compliant**.

## 3. Error messages must describe a recovery action — `src/errors.ts`

Change:

```ts
return "Could not load your profile. Please check your connection and try again.";
```

to:

```ts
return "Could not load your profile.";
```

Save → expect **violation** (no recovery action). Revert → expect **compliant**.

## Notes

- If no API key is configured, the sidebar clearly labels results as
  **OFFLINE MOCK** and uses simple keyword heuristics instead of a live
  Jev call — good enough to see the UI flow, not a substitute for the
  real model.
- With a key set (`Jev: Set Jev API key`), the same edits go to the live
  `jev-latest` model via `https://api.typesafe.ai/v1/systemone`.
