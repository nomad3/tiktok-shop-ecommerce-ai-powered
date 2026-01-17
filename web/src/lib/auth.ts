import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

// List of allowed admin emails
const ALLOWED_ADMINS = (process.env.ALLOWED_ADMIN_EMAILS || "").split(",").map(e => e.trim().toLowerCase());

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      // Only allow specific emails to sign in
      if (!user.email) return false;

      // If no allowed admins configured, allow all (for development)
      if (ALLOWED_ADMINS.length === 0 || ALLOWED_ADMINS[0] === "") {
        return true;
      }

      return ALLOWED_ADMINS.includes(user.email.toLowerCase());
    },
    async session({ session, token }) {
      // Add user id to session
      if (session.user && token.sub) {
        (session.user as { id?: string }).id = token.sub;
      }
      return session;
    },
  },
  pages: {
    signIn: "/admin/login",
    error: "/admin/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
};
