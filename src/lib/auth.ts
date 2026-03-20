import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";

function buildAdapter() {
  const adapter = PrismaAdapter(prisma);
  const originalLinkAccount = adapter.linkAccount!.bind(adapter);
  // Strip non-standard fields PCO sends (e.g. created_at) that aren't in the NextAuth Account schema
  adapter.linkAccount = (account: unknown) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { created_at, ...cleanAccount } = account as any;
    return originalLinkAccount(cleanAccount as any);
  };
  return adapter;
}

export const authOptions: AuthOptions = {
  adapter: buildAdapter(),
  providers: [
    // Local fallback admin login — credentials stored in .env
    CredentialsProvider({
      id: "credentials",
      name: "Local Admin",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const validUser = process.env.LOCAL_ADMIN_USERNAME;
        const validPass = process.env.LOCAL_ADMIN_PASSWORD;
        if (
          credentials?.username === validUser &&
          credentials?.password === validPass
        ) {
          return {
            id: "local-admin",
            name: "Local Admin",
            email: "admin@local",
            isLocalAdmin: true,
          } as unknown as any;
        }
        return null;
      },
    }),
    // Planning Center OAuth
    {
      id: "planning-center",
      name: "Planning Center",
      type: "oauth",
      checks: ["state"],
      issuer: "https://api.planningcenteronline.com",
      authorization: {
        url: "https://api.planningcenteronline.com/oauth/authorize",
        params: { scope: "people", response_type: "code" },
      },
      token: {
        url: "https://api.planningcenteronline.com/oauth/token",
      },
      userinfo: {
        url: "https://api.planningcenteronline.com/people/v2/me",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async request({ tokens, provider }: { tokens: any, provider: any }) {
          const response = await fetch(provider.userinfo.url, {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
          });
          return response.json();
        },
      },
      profile(profile: any) {
        const attributes = profile.data?.attributes || {};
        const email = attributes.primary_email_address || null;
        const name =
          attributes.name ||
          `${attributes.first_name || ""} ${attributes.last_name || ""}`.trim() ||
          "PCO User";

        return {
          id: String(profile.data?.id || "unknown"),
          name,
          email,
          image: attributes.avatar || null,
        };
      },
      clientId: process.env.PLANNING_CENTER_CLIENT_ID!,
      clientSecret: process.env.PLANNING_CENTER_CLIENT_SECRET!,
      client: {
        token_endpoint_auth_method: "client_secret_post",
      },
    } as any,
  ],
  callbacks: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async jwt({ token, user }: { token: any, user: any }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image;
        // Flag local admin sessions so we can grant full access
        if (user.isLocalAdmin) {
          token.isLocalAdmin = true;
          token.role = "GLOBAL_ADMIN";
        }
      }
      // For PCO users, load role from DB on every token refresh
      if (token.id && !token.isLocalAdmin) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { role: true },
          });
          if (dbUser) token.role = dbUser.role;
        } catch {}
      }
      return token;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async session({ session, token }: { session: any, token: any }) {
      if (session?.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.isLocalAdmin = token.isLocalAdmin ?? false;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/admin/login",
  },
};
