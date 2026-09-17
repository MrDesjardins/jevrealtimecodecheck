export interface User {
  id: string;
  name: string;
}

export type FindUserResult = { found: true; user: User } | { found: false };

const users = new Map<string, User>([["1", { id: "1", name: "Ada" }]]);

export function findUser(id: string): FindUserResult {
  const user = users.get(id);
  return user ? { found: true, user } : { found: false };
}
