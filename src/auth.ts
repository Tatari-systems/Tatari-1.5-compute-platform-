import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

import { findActiveInternalUserByEmail } from "@/lib/auth/internal-users";
import { canReview, isInternalRole } from "@/lib/domain/roles";

function isGoogleEmailVerified(profile: unknown): boolean {
  if (!profile || typeof profile !== "object") {
    return false;
  }

  if (!("email_verified" in profile)) {
    return true;
  }

  return profile.email_verified === true;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [Google],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    authorized({ auth, request }) {
      if (!request.nextUrl.pathname.startsWith("/quotes")) {
        return true;
      }

      return Boolean(auth?.user);
    },
    async signIn({ user, profile }) {
      if (!user.email || !isGoogleEmailVerified(profile)) {
        return false;
      }

      const internal = await findActiveInternalUserByEmail(user.email);
      return Boolean(internal);
    },
    async jwt({ token, user }) {
      if (user?.email) {
        const internal = await findActiveInternalUserByEmail(user.email);

        if (internal && canReview(internal.role)) {
          token.internalUserId = internal.id;
          token.role = isInternalRole(internal.role)
            ? internal.role
            : undefined;
          token.email = internal.email;
          token.name = internal.displayName ?? user.name;
        }
      }

      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id =
          typeof token.internalUserId === "string" ? token.internalUserId : "";
        const role = token.role;
        session.user.role =
          typeof role === "string" && isInternalRole(role) ? role : undefined;
      }

      return session;
    },
  },
});
