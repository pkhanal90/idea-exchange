import type { AdminRole, UserRole, UserStatus } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      status: UserStatus;
      // Whether the user has been through /onboarding — deliberately a
      // boolean rather than the underlying roleSelectedAt timestamp: a Date
      // doesn't survive next-auth's JWT type machinery cleanly, and nothing
      // outside auth.ts needs the actual timestamp, just yes/no.
      hasSelectedRole: boolean;
      twoFactorEnabled: boolean;
      // Only meaningful when role === "ADMIN" — null for every marketplace
      // account.
      adminRole: AdminRole | null;
    } & DefaultSession["user"];
  }

  interface User {
    role?: UserRole;
    status?: UserStatus;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: UserRole;
    status?: UserStatus;
    hasSelectedRole?: boolean;
    twoFactorEnabled?: boolean;
    adminRole?: AdminRole | null;
  }
}
