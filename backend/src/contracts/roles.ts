console.log("ROLES TS IS EXECUTING!");
export type Scope = string;
export type TopRole = "super_admin" | "admin" | "manager" | "owner" | "user" | "member" | "tcm";
export type UserStatus = "active" | "inactive" | "suspended" | "invited" | "deleted";

export const DEFAULT_SCOPES = {
  super_admin: ["*"],
  admin: ["*"],
  manager: ["read", "write"],
  owner: ["read"],
  user: ["read"],
  member: ["read"],
  tcm: ["read"]
};
