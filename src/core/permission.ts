/**
 * Permission type definitions for OpenCode server configuration.
 */

export type PermissionAction = "allow" | "ask" | "deny";
export type PermissionRuleConfig =
  | PermissionAction
  | Record<string, PermissionAction>;
