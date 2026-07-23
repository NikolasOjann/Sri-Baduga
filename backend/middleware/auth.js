const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.JWT_SECRET || 'sribaduga_rahasia_super_aman_123';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: Bearer <token>

  if (!token) return res.status(401).json({ error: 'Akses ditolak. Token tidak ditemukan.' });

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token tidak valid atau sudah kadaluarsa.' });
    req.user = user;
    next();
  });
}

module.exports = authenticateToken;
