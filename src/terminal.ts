import { spawn } from "node:child_process";

function clipboardCommand(): { command: string; args: string[] } {
  if (process.platform === "darwin") return { command: "pbcopy", args: [] };
  if (process.platform === "win32" || process.env.WSL_DISTRO_NAME) {
    return { command: "clip.exe", args: [] };
  }
  if (process.env.WAYLAND_DISPLAY) return { command: "wl-copy", args: [] };
  return { command: "xclip", args: ["-selection", "clipboard"] };
}

export function copyToClipboard(value: string): Promise<void> {
  const { command, args } = clipboardCommand();
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["pipe", "ignore", "ignore"] });
    child.once("error", reject);
    child.once("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Clipboard command exited with code ${code ?? "unknown"}.`));
    });
    child.stdin.end(value);
  });
}
