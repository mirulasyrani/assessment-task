const sendAuthCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'None',
    maxAge: parseInt(process.env.COOKIE_MAX_AGE || '604800000'), // 7 days
    domain: process.env.COOKIE_DOMAIN || undefined, // optional
  });

  console.log('✅ Cookie sent to client ✅');
};

module.exports = sendAuthCookie;
