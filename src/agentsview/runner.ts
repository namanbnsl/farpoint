import { spawn } from "node:child_process";

type CommandResult = {
  command: string;
  args: string[];
  stdout: string;
  stderr: string;
  exitCode: number | null;
};

export type AgentsViewInvocation = {
  command: string;
  args: string[];
  source: "binary" | "uvx";
};

export type AgentsViewAvailability = {
  installed: boolean;
  invocation?: AgentsViewInvocation;
  recommendedInstallMethod: "uvx" | "pip" | "official-installer" | "unavailable";
  detail: string;
};

const MAX_OUTPUT_BYTES = 5 * 1024 * 1024;
const DEFAULT_TIMEOUT_MS = 120_000;
let activeInvocation: AgentsViewInvocation | undefined;

function appendBounded(current: string, chunk: Buffer): string {
  if (Buffer.byteLength(current) >= MAX_OUTPUT_BYTES) return current;
  const remaining = MAX_OUTPUT_BYTES - Buffer.byteLength(current);
  return current + chunk.subarray(0, remaining).toString("utf8");
}

function runCommand(
  command: string,
  args: string[],
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<CommandResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });
    let stdout = "";
    let stderr = "";
    let settled = false;

    const timer = setTimeout(() => {
      child.kill();
      if (!settled) {
        settled = true;
        reject(new Error(`${command} timed out after ${Math.round(timeoutMs / 1000)} seconds.`));
      }
    }, timeoutMs);

    child.stdout.on("data", (chunk: Buffer) => {
      stdout = appendBounded(stdout, chunk);
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderr = appendBounded(stderr, chunk);
    });
    child.once("error", (error) => {
      clearTimeout(timer);
      if (!settled) {
        settled = true;
        reject(error);
      }
    });
    child.once("close", (exitCode) => {
      clearTimeout(timer);
      if (!settled) {
        settled = true;
        resolve({ command, args, stdout, stderr, exitCode });
      }
    });
  });
}

async function commandWorks(command: string, args: string[]): Promise<boolean> {
  try {
    return (await runCommand(command, args, 15_000)).exitCode === 0;
  } catch {
    return false;
  }
}

async function findPip(): Promise<{ command: string; args: string[] } | undefined> {
  const candidates = [
    { command: "python3", args: ["-m", "pip"] },
    { command: "python", args: ["-m", "pip"] },
    { command: "pip3", args: [] },
    { command: "pip", args: [] },
  ];

  for (const candidate of candidates) {
    if (await commandWorks(candidate.command, [...candidate.args, "--version"])) return candidate;
  }
  return undefined;
}

export async function getAgentsViewAvailability(): Promise<AgentsViewAvailability> {
  if (activeInvocation) {
    return {
      installed: true,
      invocation: activeInvocation,
      recommendedInstallMethod: activeInvocation.source === "uvx" ? "uvx" : "pip",
      detail:
        activeInvocation.source === "uvx"
          ? "AgentsView is available through uvx."
          : "The agentsview executable is installed.",
    };
  }

  if (await commandWorks("agentsview", ["version"])) {
    activeInvocation = { command: "agentsview", args: [], source: "binary" };
    return {
      installed: true,
      invocation: activeInvocation,
      recommendedInstallMethod: "pip",
      detail: "The agentsview executable is installed.",
    };
  }

  if (await commandWorks("uvx", ["--version"])) {
    return {
      installed: false,
      recommendedInstallMethod: "uvx",
      detail:
        "AgentsView is not installed as a command. uvx is available and is the preferred way to run it without a permanent install.",
    };
  }

  if (await findPip()) {
    return {
      installed: false,
      recommendedInstallMethod: "pip",
      detail: "AgentsView is not installed. A Python package installer is available.",
    };
  }

  const hasOfficialInstallerPrerequisite =
    process.platform === "win32"
      ? await commandWorks("powershell", ["-NoProfile", "-Command", "$PSVersionTable.PSVersion"])
      : await commandWorks("curl", ["--version"]);

  return {
    installed: false,
    recommendedInstallMethod: hasOfficialInstallerPrerequisite
      ? "official-installer"
      : "unavailable",
    detail: hasOfficialInstallerPrerequisite
      ? "AgentsView is not installed. The official AgentsView installer can be used."
      : "AgentsView is not installed, and Farpoint could not find uvx, pip, or an official-installer prerequisite.",
  };
}

function commandFailure(result: CommandResult): Error {
  const detail = result.stderr.trim() || result.stdout.trim() || "No error output was returned.";
  return new Error(`${result.command} exited with code ${result.exitCode ?? "unknown"}: ${detail}`);
}

async function installWithUvx(): Promise<AgentsViewInvocation | undefined> {
  if (!(await commandWorks("uvx", ["--version"]))) return undefined;
  const result = await runCommand("uvx", ["agentsview", "version"], 180_000);
  if (result.exitCode !== 0) throw commandFailure(result);
  return { command: "uvx", args: ["agentsview"], source: "uvx" };
}

async function installWithPip(): Promise<AgentsViewInvocation | undefined> {
  const pip = await findPip();
  if (!pip) return undefined;
  const result = await runCommand(pip.command, [...pip.args, "install", "agentsview"], 300_000);
  if (result.exitCode !== 0) throw commandFailure(result);
  if (!(await commandWorks("agentsview", ["version"]))) {
    throw new Error("pip installed AgentsView, but the agentsview executable is not on PATH.");
  }
  return { command: "agentsview", args: [], source: "binary" };
}

async function installWithOfficialScript(): Promise<AgentsViewInvocation> {
  const result =
    process.platform === "win32"
      ? await runCommand(
          "powershell",
          ["-ExecutionPolicy", "ByPass", "-Command", "irm https://agentsview.io/install.ps1 | iex"],
          300_000,
        )
      : await runCommand("sh", ["-c", "curl -fsSL https://agentsview.io/install.sh | sh"], 300_000);

  if (result.exitCode !== 0) throw commandFailure(result);
  if (!(await commandWorks("agentsview", ["version"]))) {
    throw new Error(
      "The official installer completed, but the agentsview executable is not on PATH. Restart Farpoint and try again.",
    );
  }
  return { command: "agentsview", args: [], source: "binary" };
}

export async function installAgentsView(): Promise<{
  invocation: AgentsViewInvocation;
  method: "uvx" | "pip" | "official-installer";
}> {
  const existing = await getAgentsViewAvailability();
  if (existing.installed && existing.invocation) {
    return {
      invocation: existing.invocation,
      method: existing.invocation.source === "uvx" ? "uvx" : "pip",
    };
  }

  const failures: string[] = [];

  try {
    const invocation = await installWithUvx();
    if (invocation) {
      activeInvocation = invocation;
      return { invocation, method: "uvx" };
    }
  } catch (error) {
    failures.push(error instanceof Error ? error.message : String(error));
  }

  try {
    const invocation = await installWithPip();
    if (invocation) {
      activeInvocation = invocation;
      return { invocation, method: "pip" };
    }
  } catch (error) {
    failures.push(error instanceof Error ? error.message : String(error));
  }

  try {
    const invocation = await installWithOfficialScript();
    activeInvocation = invocation;
    return { invocation, method: "official-installer" };
  } catch (error) {
    failures.push(error instanceof Error ? error.message : String(error));
  }

  throw new Error(`AgentsView installation failed. ${failures.join(" ")}`);
}

export async function runAgentsView(args: string[]): Promise<unknown> {
  const availability = await getAgentsViewAvailability();
  if (!availability.installed || !availability.invocation) {
    throw new Error("AgentsView is not available. Ask the user before installing it.");
  }

  const invocation = availability.invocation;
  const result = await runCommand(invocation.command, [...invocation.args, ...args]);
  if (result.exitCode !== 0) throw commandFailure(result);

  try {
    return JSON.parse(result.stdout);
  } catch {
    throw new Error(
      `AgentsView returned invalid JSON for "${args.join(" ")}": ${result.stdout.slice(0, 300)}`,
    );
  }
}
