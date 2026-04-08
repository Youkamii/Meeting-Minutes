import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { getPrisma } from "@/lib/prisma";

const prisma = getPrisma();

const PASSWORD_USER_ID = "password-shared-user";

export const { handlers, auth, signIn, signOut } = NextAuth({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adapter: PrismaAdapter(prisma as any),
  debug: process.env.NODE_ENV !== "production",
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    Credentials({
      name: "Password",
      credentials: {
        password: { label: "비밀번호", type: "password" },
      },
      async authorize(credentials) {
        const appPassword = process.env.APP_PASSWORD;
        if (!appPassword) return null;
        if (credentials?.password !== appPassword) return null;
        return {
          id: PASSWORD_USER_ID,
          name: "공유 사용자",
          email: "shared@local",
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user }) {
      if (user.id === PASSWORD_USER_ID) return true;
      if (user.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { status: true },
        });
        if (dbUser?.status === "rejected") return false;
      }
      return true;
    },
    async jwt({ token, user }) {
      // First sign-in: set user id
      if (user?.id) {
        token.id = user.id;
      }
      // Password user: skip DB lookup
      if (token.id === PASSWORD_USER_ID) {
        token.role = "admin";
        token.status = "approved";
        return token;
      }
      // Always fetch latest role/status from DB
      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true, status: true },
        });
        if (dbUser) {
          token.role = dbUser.role;
          token.status = dbUser.status;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "admin" | "user";
        session.user.status = token.status as "pending" | "approved" | "rejected";
      }
      return session;
    },
  },
});

export async function isAdmin(): Promise<boolean> {
  const session = await auth();
  return session?.user?.role === "admin";
}

export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) {
    throw new Error("Forbidden: admin role required");
  }
}
