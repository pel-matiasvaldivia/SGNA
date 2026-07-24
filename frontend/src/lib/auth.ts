import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const getBackendUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl && !envUrl.includes("localhost") && !envUrl.includes("127.0.0.1")) {
    return envUrl;
  }
  return process.env.NODE_ENV === "development" ? "http://localhost:8000" : "http://api:8000";
};

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "2FA Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        code: { label: "2FA Code", type: "text" },
        impersonationToken: { label: "Impersonation Token", type: "text" },
      },
      async authorize(credentials) {
        // Superadmin impersonation: a backend-signed, tenant-scoped token issued by
        // the superadmin-only /admin/tenants/{id}/impersonate endpoint. We decode the
        // payload only to populate the session; every API call still re-verifies the
        // token signature server-side, so a forged token loads no data.
        if (credentials?.impersonationToken) {
          try {
            const token = credentials.impersonationToken;
            const payload = JSON.parse(
              Buffer.from(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8")
            );
            return {
              id: payload.sub,
              email: payload.sub,
              accessToken: token,
              tenantSlug: payload.tenant,
              role: payload.role,
            } as any;
          } catch (error) {
            console.error("Impersonation token decode error:", error);
            return null;
          }
        }

        if (!credentials?.email || !credentials?.code) {
          return null;
        }

        try {
          const backendUrl = getBackendUrl();
          const res = await fetch(`${backendUrl}/api/v1/auth/verify-2fa`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials.email,
              code: credentials.code,
            }),
          });

          const data = await res.json();

          if (res.ok && data.access_token) {
            return {
              id: credentials.email,
              email: credentials.email,
              accessToken: data.access_token,
              tenantSlug: data.tenant_slug,
              role: data.role,
            };
          }
          return null;
        } catch (error) {
          console.error("NextAuth authorize error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = (user as any).accessToken;
        token.tenantSlug = (user as any).tenantSlug;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session as any).accessToken = token.accessToken;
        (session as any).tenantSlug = token.tenantSlug;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
