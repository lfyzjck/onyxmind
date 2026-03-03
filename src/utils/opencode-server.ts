/**
 * Patched version of createOpencodeServer from @opencode-ai/sdk/v2/server
 *
 * Original implementation passes the entire config via OPENCODE_CONFIG_CONTENT env var.
 * This patch additionally extracts config.server.cors entries and injects them as
 * --cors=<origin> CLI arguments so the opencode binary applies CORS rules even if it
 * ignores the env-var config for that field.
 */

import { spawn } from "child_process";
import type { ServerOptions } from "@opencode-ai/sdk/v2/server";

export type PatchedServerOptions = ServerOptions;

export async function createOpencodeServerPatched(
  options?: PatchedServerOptions,
): Promise<{
  url: string;
  close(): void;
}> {
  const opts = Object.assign(
    {
      hostname: "127.0.0.1",
      port: 4096,
      timeout: 5000,
    },
    options ?? {},
  );

  const args: string[] = [
    "serve",
    `--hostname=${opts.hostname}`,
    `--port=${opts.port}`,
  ];

  if (opts.config?.logLevel) {
    args.push(`--log-level=${opts.config.logLevel}`);
  }

  // Patch: pass cors origins as individual --cors=<origin> args
  const corsOrigins = (opts.config as any)?.server?.cors;
  if (Array.isArray(corsOrigins)) {
    for (const origin of corsOrigins) {
      if (typeof origin === "string" && origin.length > 0) {
        args.push(`--cors=${origin}`);
      }
    }
  }

  const proc = spawn("opencode", args, {
    signal: opts.signal,
    env: {
      ...process.env,
      OPENCODE_CONFIG_CONTENT: JSON.stringify(opts.config ?? {}),
    },
  });

  const url = await new Promise<string>((resolve, reject) => {
    const id = setTimeout(() => {
      reject(
        new Error(
          `Timeout waiting for server to start after ${opts.timeout}ms`,
        ),
      );
    }, opts.timeout);

    let output = "";

    proc.stdout?.on("data", (chunk: Buffer) => {
      output += chunk.toString();
      for (const line of output.split("\n")) {
        if (line.startsWith("opencode server listening")) {
          const match = line.match(/on\s+(https?:\/\/[^\s]+)/);
          if (!match?.[1]) {
            throw new Error(`Failed to parse server url from output: ${line}`);
          }
          clearTimeout(id);
          resolve(match[1]);
          return;
        }
      }
    });

    proc.stderr?.on("data", (chunk: Buffer) => {
      output += chunk.toString();
    });

    proc.on("exit", (code: number | null) => {
      clearTimeout(id);
      let msg = `Server exited with code ${code}`;
      if (output.trim()) {
        msg += `\nServer output: ${output}`;
      }
      reject(new Error(msg));
    });

    proc.on("error", (error: Error) => {
      clearTimeout(id);
      reject(error);
    });

    if (opts.signal) {
      opts.signal.addEventListener("abort", () => {
        clearTimeout(id);
        reject(new Error("Aborted"));
      });
    }
  });

  return {
    url,
    close() {
      proc.kill();
    },
  };
}
