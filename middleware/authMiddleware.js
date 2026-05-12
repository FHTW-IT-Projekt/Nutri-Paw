import jwt from 'jsonwebtoken';

function requireAuth(req, res, next) {
    const token = req.cookies?.nutripaw_token;

    if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch {
        return res.status(401).json({ error: 'Session expired, please log in again' });
    }
}

export { requireAuth };
