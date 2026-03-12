import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const credentialsSchema = z.object({
  email: z.string().min(3),
  password: z.string().min(6),
});
const authSecret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;

type SessionUserExtras = {
  id?: string;
  role?: string;
};

type TokenExtras = {
  userId?: string;
  role?: string;
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  secret: authSecret,
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/portal/login",
    error: "/portal/login",
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const identifier = email.trim();
        const isEmail = identifier.includes("@");
        const normalizedEmail = identifier.toLowerCase();

        const user = isEmail
          ? await prisma.user.findUnique({ where: { email: normalizedEmail } })
          : await prisma.user.findFirst({ where: { phone: identifier } });
        if (!user || !user.password) return null;
        if (user.suspended) return null;
        if (!user.emailVerified && user.role !== "ADMIN") return null;

        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return null;

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`.trim(),
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as SessionUserExtras;
        if (u.id) (token as TokenExtras).userId = u.id;
        if (u.role) (token as TokenExtras).role = u.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const s = session.user as SessionUserExtras;
        const t = token as TokenExtras;
        s.id = t.userId;
        s.role = t.role;
      }
      return session;
    },
  },
});
