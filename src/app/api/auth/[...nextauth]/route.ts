import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

const handler = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Hardcoded for demo; replace with DB check
        if (
          credentials?.username === "testuser" &&
          credentials?.password === "testuser-0022"
        ) {
          return {
            id: "1",
            name: "Test User",
            email: "testuser@useimagini.ai",
          };
        }
        return null;
      },
    }),
  ],
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.user = user;
      return token;
    },
    async session({ session, token }) {
      if (token.user) session.user = token.user;
      return session;
    },
  },
});

export { handler as GET, handler as POST };
