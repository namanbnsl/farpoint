import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import type { Credential, CredentialStore } from "@earendil-works/pi-ai";

const authPath = join(homedir(), ".farpoint", "auth.json");
type AuthFile = Record<string, Credential>;

async function readAuthFile(): Promise<AuthFile> {
  try {
    return JSON.parse(await readFile(authPath, "utf8")) as AuthFile;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return {};
    throw error;
  }
}

async function writeAuthFile(credentials: AuthFile): Promise<void> {
  await mkdir(dirname(authPath), { recursive: true, mode: 0o700 });
  const temporaryPath = `${authPath}.${process.pid}.tmp`;
  await writeFile(temporaryPath, `${JSON.stringify(credentials, null, 2)}\n`, {
    mode: 0o600,
  });
  await rename(temporaryPath, authPath);
}

export function createCredentialStore(): CredentialStore {
  let pendingWrite = Promise.resolve();

  async function serializeWrite<T>(operation: () => Promise<T>): Promise<T> {
    const currentWrite = pendingWrite.then(operation);
    pendingWrite = currentWrite.then(
      () => undefined,
      () => undefined,
    );
    return currentWrite;
  }

  return {
    read: async (providerId) => (await readAuthFile())[providerId],
    list: async () =>
      Object.entries(await readAuthFile()).map(([providerId, credential]) => ({
        providerId,
        type: credential.type,
      })),
    modify: (providerId, update) =>
      serializeWrite(async () => {
        const credentials = await readAuthFile();
        const nextCredential = await update(credentials[providerId]);
        if (!nextCredential) return credentials[providerId];
        credentials[providerId] = nextCredential;
        await writeAuthFile(credentials);
        return nextCredential;
      }),
    delete: (providerId) =>
      serializeWrite(async () => {
        const credentials = await readAuthFile();
        delete credentials[providerId];
        if (Object.keys(credentials).length > 0) {
          await writeAuthFile(credentials);
          return;
        }
        await unlink(authPath).catch((error: NodeJS.ErrnoException) => {
          if (error.code !== "ENOENT") throw error;
        });
      }),
  };
}

export { authPath };
