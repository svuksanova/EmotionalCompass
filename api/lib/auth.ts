// api/lib/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

export interface AuthReq extends Request {
    userId?: string;
}

/** Express middleware: verifies Bearer token and adds req.userId */
export function requireAuth(req: AuthReq, res: Response, next: NextFunction) {
    const header = req.headers.authorization;          // "Bearer <token>"
    const token  = header?.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'No token' });

    try {
        const payload = jwt.verify(token, JWT_SECRET) as { sub: string };
        req.userId = payload.sub;
        next();
    } catch {
        return res.status(401).json({ error: 'Invalid token' });
    }
}
