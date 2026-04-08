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
    CredentialsProvider({
      id: "member-otp",
      name: "OTP",
      credentials: {
        email: { label: "Email", type: "email" },
        code: { label: "Code", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.code) return null;
        
        const normalizedEmail = credentials.email.toLowerCase().trim();
        const record = await prisma.memberOtp.findFirst({
          where: { email: normalizedEmail, code: credentials.code },
        });

        if (!record || record.expiresAt < new Date()) {
          return null;
        }

        // OTP valid, delete it so it can't be reused
        await prisma.memberOtp.delete({ where: { id: record.id } });

        // Ensure user exists in the main User table so they show up in Admin > Members
        const user = await prisma.user.upsert({
          where: { email: normalizedEmail },
          update: { name: record.name || "Verified Member" },
          create: {
            id: normalizedEmail, // Use email as ID for OTP users to keep things unique
            email: normalizedEmail,
            name: record.name || "Verified Member",
            role: "USER"
          }
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        } as any;
      },
    }),
    {
      id: "planningcenter",
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
        
        // PCO can return email in multiple places depending on account settings
        const email = (
          attributes.login_identifier || 
          attributes.primary_email_address || 
          null
        )?.toLowerCase().trim();

        const name =
          attributes.name ||
          `${attributes.first_name || ""} ${attributes.last_name || ""}`.trim() ||
          "PCO User";

        // Planning Center typically uses 'avatar_url' in its JSON API responses
        const image = attributes.avatar_url || attributes.avatar || attributes.photo_thumbnail_url || null;

        console.log("[Auth] PCO Profile mapping:", { id: profile.data?.id, name, email, image });

        return {
          id: String(profile.data?.id || "unknown"),
          name,
          email,
          image,
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
    async jwt({ token, user, profile }: { token: any, user: any, profile?: any }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email || (profile as any)?.data?.attributes?.login_identifier || (profile as any)?.data?.attributes?.primary_email_address;
        token.picture = user.image;
        token.phoneNumber = user.phoneNumber;

        console.log("[Auth] JWT callback - user identified:", { id: token.id, email: token.email });

        // Flag local admin sessions so we can grant full access
        if (user.isLocalAdmin) {
          token.isLocalAdmin = true;
          token.role = "GLOBAL_ADMIN";
        } else if (user.role) {
          token.role = user.role;
        }
      }
      // For PCO users, load role from DB on every token refresh
      if (token.id && !token.isLocalAdmin && token.role !== "MEMBER") {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { role: true, phoneNumber: true },
          });
          if (dbUser) {
            token.role = dbUser.role;
            token.phoneNumber = dbUser.phoneNumber;
          }
        } catch {}
      }
      return token;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async session({ session, token }: { session: any, token: any }) {
      if (session?.user) {
        session.user.id = token.id;
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.phoneNumber = token.phoneNumber;
        session.user.role = token.role;
        session.user.image = token.picture; // Synchronize with token.picture
        session.user.isLocalAdmin = token.isLocalAdmin ?? false;
      }
      return session;
    },
    async signIn({ user, account, profile }: { user: any, account: any, profile?: any }) {
      if (account?.provider === "planningcenter" && user?.id && profile) {
        // Planning Center typically uses 'avatar_url'
        const attributes = profile?.data?.attributes || {};
        const image = attributes.avatar_url || attributes.avatar || attributes.photo_thumbnail_url;
        
        if (image) {
          try {
            await prisma.user.update({
              where: { id: user.id },
              data: { image },
            });
            console.log("[Auth] Updated user profile picture from PCO:", user.id);
          } catch (e) {
            console.error("[Auth] Failed to update profile picture:", e);
          }
        }
      }
      return true;
    },
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
};
