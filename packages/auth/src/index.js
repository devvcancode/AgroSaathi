import jwt from 'jsonwebtoken';

export const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'development-secret';

export function buildToken(payload) {
  return jwt.sign(
    {
      ...payload,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60 * 15,
    },
    JWT_SECRET,
    { algorithm: 'HS256' }
  );
}

export function decodeToken(token) {
  if (!token) return null;

  try {
    return jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
  } catch (error) {
    return null;
  }
}

export function mockVerifyKisaan({ kisaanId, mobile }) {
  const normalizedKisaanId = String(kisaanId || '').trim();
  const normalizedMobile = String(mobile || '').trim();

  if (!normalizedKisaanId || !normalizedMobile) {
    return {
      ok: false,
      status: 400,
      message: 'Kisaan ID and mobile number are required.'
    };
  }

  const validKisaanId = /^IN-[A-Z0-9-]{6,20}$/i.test(normalizedKisaanId);
  const validMobile = /^\d{10}$/.test(normalizedMobile);

  if (!validKisaanId || !validMobile) {
    return {
      ok: false,
      status: 400,
      message: 'Invalid Kisaan ID or mobile number format.'
    };
  }

  return {
    ok: true,
    status: 200,
    message: 'Kisaan ID validated and OTP dispatched.',
    profile: {
      kisaanId: normalizedKisaanId,
      mobile: normalizedMobile,
      name: 'Demo Farmer',
      state: 'Punjab',
      district: 'Ludhiana',
      verifiedAt: new Date().toISOString()
    }
  };
}

export function mockVerifyCompany({ companyId }) {
  const normalizedCompanyId = String(companyId || '').trim();

  if (!normalizedCompanyId) {
    return {
      ok: false,
      status: 400,
      message: 'Company ID is required.'
    };
  }

  const validCompanyId = /^COMP-[A-Z0-9-]{6,20}$/i.test(normalizedCompanyId);

  if (!validCompanyId) {
    return {
      ok: false,
      status: 400,
      message: 'Company registration ID is invalid.'
    };
  }

  return {
    ok: true,
    status: 200,
    message: 'Company is verified.',
    orgId: normalizedCompanyId
  };
}

export function getDefaultProfileForRole(role) {
  if (role === 'FARMER') {
    return { role: 'FARMER', dashboard: '/farmer' };
  }

  if (role === 'BUYER') {
    return { role: 'BUYER', dashboard: '/buyer' };
  }

  if (role === 'SELLER') {
    return { role: 'SELLER', dashboard: '/seller' };
  }

  return { role: 'USER', dashboard: '/' };
}
