import type { DefaultSession } from "next-auth";

import type { InternalRole } from "@/lib/domain/roles";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role?: InternalRole;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    internalUserId?: string;
    role?: InternalRole;
  }
}
