import { DefaultSession, DefaultUser } from "next-auth";
import { Role } from "@prisma/client";

// Extend the Session type to include the user's role
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: Role;
      retailerId?: string;
    } & DefaultSession["user"];
  }

  // Extend the User type to include the role and retailerId
  interface User extends DefaultUser {
    role: Role;
    retailerId?: string;
  }
}

// Extend the JWT type to include the user's role
declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    retailerId?: string;
  }
}