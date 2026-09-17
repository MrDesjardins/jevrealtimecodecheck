import * as vscode from "vscode";

const SECRET_KEY = "jevCodeCheck.apiKey";
const ENV_VAR = "TYPESAFE_API_KEY";

export async function getApiKey(
  secrets: vscode.SecretStorage
): Promise<string | undefined> {
  const stored = await secrets.get(SECRET_KEY);
  if (stored) {
    return stored;
  }
  return process.env[ENV_VAR];
}

export async function setApiKey(
  secrets: vscode.SecretStorage,
  value: string
): Promise<void> {
  await secrets.store(SECRET_KEY, value);
}

export async function clearApiKey(secrets: vscode.SecretStorage): Promise<void> {
  await secrets.delete(SECRET_KEY);
}
