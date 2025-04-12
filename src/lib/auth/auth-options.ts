import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/db";
import { compare } from "bcryptjs";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    signOut: "/",
    error: "/login",
    newUser: "/dashboard",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Find user by email
        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
          include: {
            retailerProfile: true,
          },
        });

        // If no user found or password doesn't match
        if (!user || !(await compare(credentials.password, user.password))) {
          return null;
        }

        // Return user data for JWT
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          image: user.image,
          emailVerified: user.emailVerified?.toISOString() || null,
          retailerId: user.retailerProfile?.id || undefined,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Add user data to token when signed in
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.emailVerified = user.emailVerified;
        token.retailerId = user.retailerId;
      }
      return token;
    },
    async session({ session, token }) {
      // Add user data to session
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as any;
        session.user.emailVerified = token.emailVerified as string | null;
        if (token.retailerId) {
          session.user.retailerId = token.retailerId as string;
        }
      }
      return session;
    },
  },
};