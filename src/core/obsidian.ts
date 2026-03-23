import { App, FileSystemAdapter } from "obsidian";

export function getVaultBasePath(app: App): string {
  if (app.vault.adapter instanceof FileSystemAdapter) {
    return app.vault.adapter.getBasePath();
  } else {
    // not support mobile device
    throw new Error("Mobile device not supported");
  }
}
