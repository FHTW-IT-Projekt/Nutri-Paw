import express from 'express';
<<<<<<< HEAD
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from '../db/db.js';

const router = express.Router();

const ACCESS_COOKIE  = 'nutripaw_token';
const REFRESH_COOKIE = 'nutripaw_refresh';
const GENERIC_AUTH_ERROR = 'Invalid email or password';

const cookieBase = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
};

// POST /api/auth/login
router.post('/login', async (req, res) => {
    const { email, password, rememberMe } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: GENERIC_AUTH_ERROR });
    }

    try {
        const [rows] = await db.execute(
            'SELECT user_id, name, email, password_hash FROM users WHERE email = ?',
            [email]
        );

        const user = rows[0];
        const passwordMatch = user && await bcrypt.compare(password, user.password_hash);

        if (!passwordMatch) {
            return res.status(401).json({ error: GENERIC_AUTH_ERROR });
        }

        const payload = { userId: user.user_id, email: user.email };

        const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });
        const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
            expiresIn: rememberMe ? '30d' : '1d',
        });

        res.cookie(ACCESS_COOKIE, accessToken, {
            ...cookieBase,
            maxAge: 15 * 60 * 1000,
        });

        res.cookie(REFRESH_COOKIE, refreshToken, {
            ...cookieBase,
            ...(rememberMe ? { maxAge: 30 * 24 * 60 * 60 * 1000 } : {}),
        });

        res.json({ userId: user.user_id, name: user.name, email: user.email });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/auth/refresh
router.post('/refresh', (req, res) => {
    const token = req.cookies?.[REFRESH_COOKIE];

    if (!token) {
        return res.status(401).json({ error: 'No refresh token' });
    }

    try {
        const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
        const accessToken = jwt.sign(
            { userId: payload.userId, email: payload.email },
            process.env.JWT_SECRET,
            { expiresIn: '15m' }
        );

        res.cookie(ACCESS_COOKIE, accessToken, {
            ...cookieBase,
            maxAge: 15 * 60 * 1000,
        });

        res.json({ ok: true });
    } catch {
        res.status(401).json({ error: 'Session expired, please log in again' });
    }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
    res.clearCookie(ACCESS_COOKIE,  cookieBase);
    res.clearCookie(REFRESH_COOKIE, cookieBase);
    res.json({ message: 'Logged out successfully' });
});

export default router;
=======
const router = express.Router();
import bcrypt from 'bcrypt';
import db from '../db/db.js';

router.post('/register', async (req, res) => 
{
    try{
        const {firstName, lastName, email, confirm_email, password, confirm_password } = req.body;
        
        if(!firstName.trim() || !lastName.trim() || !email.trim() || !confirm_email.trim() || !password.trim() || !confirm_password.trim())
        {
          return res.status(400).json({message: "Input missing!"});
        }
        if(email !== confirm_email)
        {
          return res.status(400).json({
            message: "Email adresses do not match!",
          field: "email"});
        }
        if(password !== confirm_password)
        {
          return res.status(400).json({message: "Passwords don't match!"});
        }
        if(password.length < 8)
        {
          return res.status(400).json({message: "Password must be at least characters long!"});
        }
        
        
        
        const hashedPassword = await bcrypt.hash(password, 10); // 10: der Verschlüsselungsalgorithmus wird 2 hoch 10 mal durchlaufen

        const sql = "INSERT INTO users (first_name, last_name, email, password_hash, created_at) VALUES (?, ?, ?, ?, NOW())";
        await db.execute(sql, [firstName, lastName, email, hashedPassword]);


         return res.status(201).json({message: "registration successful!"});
         
        } catch (e) {
          if(e.code === 'ER_DUP_ENTRY')
          {
            return res.status(400).json({message: "Email already exists!"});
          }
            console.error(e);
            return res.status(500).json({message: "Internal Server Error"});
    }
});

export default router;
>>>>>>> 26fd219dee6a046f7ed38d3e67dea9fa95252613
