import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getPrisma } from '@agrosaathi/db';

const hasGoogleCredentials = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

export const authOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt'
  },
  providers: [
    ...(hasGoogleCredentials ? [GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET
    })] : []),
    CredentialsProvider({
      id: 'kisaan-id',
      name: 'Kisaan ID',
      credentials: {
        kisaanId: { label: 'Kisaan ID', type: 'text' },
        mobile: { label: 'Mobile', type: 'text' },
        otp: { label: 'OTP', type: 'text' }
      },
      async authorize(credentials) {
        const kisaanId = credentials?.kisaanId || '';
        const mobile = credentials?.mobile || '';

        if (!kisaanId || !mobile) {
          return null;
        }

        return {
          id: `${kisaanId}-${mobile}`,
          email: `${kisaanId.toLowerCase()}@example.gov.in`,
          name: 'Demo Farmer',
          role: 'FARMER',
          kisaan_id: kisaanId,
          mobile
        };
      }
    })
  ],
  pages: {
    signIn: '/login'
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        user.role = 'BUYER';
        if (process.env.DATABASE_URL) {
          const prisma = getPrisma();
          await prisma.user.upsert({
            where: { email: user.email || undefined },
            create: { email: user.email, name: user.name, image: user.image, role: 'BUYER' },
            update: { name: user.name, image: user.image }
          });
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.role = user.role || token.role || 'SELLER';
        token.kisaan_id = user.kisaan_id || token.kisaan_id;
        token.org_id = user.org_id || token.org_id;
        token.sub = user.id || token.sub;
      }

      if (account?.provider === 'google') {
        token.role = token.role || 'SELLER';
      }

      return token;
    },
    async session({ session, token }) {
      session.user = {
        ...session.user,
        role: token.role,
        kisaan_id: token.kisaan_id,
        org_id: token.org_id,
        id: token.sub
      };
      return session;
    }
  }
};

export const handler = NextAuth(authOptions);

export { hasGoogleCredentials };
