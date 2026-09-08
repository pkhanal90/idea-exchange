import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import Nodemailer from "next-auth/providers/nodemailer";
import { prisma } from "@/lib/prisma";
import type { UserRole, UserStatus } from "@prisma/client";

const hasEmailServer = Boolean(process.env.EMAIL_SERVER_HOST);

const providers: NextAuthConfig["providers"] = [];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  );
}

providers.push(
  Nodemailer({
    from: process.env.EMAIL_FROM ?? "Idea Exchange <no-reply@idea-exchange.test>",
    server: hasEmailServer
      ? {
          host: process.env.EMAIL_SERVER_HOST,
          port: Number(process.env.EMAIL_SERVER_PORT ?? 587),
          auth: {
            user: process.env.EMAIL_SERVER_USER,
            pass: process.env.EMAIL_SERVER_PASSWORD,
          },
        }
      : { jsonTransport: true }, // dev fallback: no SMTP configured
    // Dev fallback: without SMTP configured, log the magic link instead of sending it.
    ...(!hasEmailServer && {
      sendVerificationRequest: async ({ identifier, url }) => {
        console.log(`\n[dev] Magic sign-in link for ${identifier}:\n${url}\n`);
      },
    }),
  }),
);

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/signin",
    verifyRequest: "/auth/verify-request",
  },
  providers,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      // Re-read role/status from the DB on every request (not just at sign-in
      // or an explicit `update()` trigger) so a role change or a ban/suspend
      // takes effect on the user's very next request instead of waiting for
      // the JWT to expire — this is what makes RBAC enforcement real rather
      // than just a snapshot taken at login.
      if (token.id) {
        const fresh = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true, status: true },
        });
        if (fresh) {
          token.role = fresh.role;
          token.status = fresh.status;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.status = token.status as UserStatus;
      }
      return session;
    },
  },
});
