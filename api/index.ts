import serverless from 'serverless-http'
import express from 'express'
import cors from 'cors'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import {PrismaClient} from "@prisma/client";
import 'dotenv/config'
import { requireAuth, AuthReq } from './lib/auth';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET
const TOKEN_EXPIRES = process.env.TOKEN_EXPIRES

const app = express();
app.use(cors({ origin: process.env.ORIGIN || '*' }));
app.use(express.json());

app.get('/health', (_, res) => res.json({ ok: true }));

//POST /api/auth/register - Register
app.post('/api/auth/register', async (req, res) => {
    const { firstName, lastName, email, password } = req.body;
    if(!email || !password || !firstName || !lastName) {
        return res.status(400).json({
            error: 'All fields are required',
        });
    }

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
        return res.status(400).json({
            error: 'Email already in use',
        });
    }

    const user = await prisma.user.create({
        data: {
            firstName,
            lastName,
            email,
            passwordHash: await bcrypt.hash(password, 12)
        }
    });

    const token = jwt.sign({ sub: user.id}, JWT_SECRET, { expiresIn: TOKEN_EXPIRES });
    res.json({ token })
})

//POST /api/auth/login - Login
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
        return res.status(401).json({
            error: 'Invalid Credentials',
        });
    }

    const token = jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: TOKEN_EXPIRES });
    res.json({ token })
})

//POST /api/chat/start - Start a chat session
app.post('/api/chat/start', requireAuth, async (req: AuthReq, res) => {
    const session = await prisma.chatSession.create({
        data: {
            userId: req.userId!,
            startedAt: new Date(),
        }
    });

    const root = await prisma.question.findUnique({
        where: {
            id: 'root'
        },
        include: {
            choices: true
        },
    });

    if (!root) {
        console.error('Root question NOT found – check seed & DB!');  // <— debug
        return res
            .status(500)
            .json({ error: 'Root question not found – did you run the seed script?' });
    }

    await prisma.chatMessage.create({
        data: {
            sessionId: session.id,
            sender: 'SYSTEM',
            questionId: root!.id,
            content: root!.prompt,
        },
    });

    res.json({
        sessionId: session.id,
        question: root,
    });
})

//POST /api/chat/:sessionId/answer - Answer a question
app.post('/api/chat/:sessionId/answer', requireAuth, async (req: AuthReq, res) => {
    const { sessionId } = req.params;
    const { choiceId, freeText } = req.body as {
        choiceId?: string;
        freeText?: string;
    };

    const choice = choiceId ? await prisma.choice.findUnique({
        where: {
            id: choiceId
        },
        include: {
            nextQuestion: {
                include: {
                    choices: true
                }
            }
        },
    }) : null;

    await prisma.chatMessage.create({
        data: {
            sessionId,
            sender: 'USER',
            content: freeText ?? choice?.label ?? '',
            choiceId,
            questionId: choice?.questionId ?? undefined,
        },
    });

    const nextQuestion = choice.nextQuestion ?? null;

    if(nextQuestion) {
        await prisma.chatMessage.create({
            data: {
                sessionId,
                sender: 'SYSTEM',
                content: nextQuestion.prompt,
                questionId: nextQuestion.id,
            },
        });
    }
    res.json({
        nextQuestion: nextQuestion,
    });
});

//GET /api/chat/:sessionId - Return all messages ascending
app.get('/api/chat/:sessionId', requireAuth, async (req: AuthReq, res) => {
    const messages = await prisma.chatMessage.findMany({
        where: { sessionId: req.params.sessionId },
        orderBy: { createdAt: 'asc' },
    });
    res.json(messages);
});

//POST /api/auth/logout - Log out the user
app.post("/api/auth/logout", requireAuth, async (_req, res) => {
    return res.json({ ok: true, message: "Logged out" });
});

// GET /api/auth/me  → returns { firstName, lastName, email, id }
app.get('/api/auth/me', requireAuth, async (req: AuthReq, res) => {
    // requireAuth has already verified the JWT and set req.userId
    const user = await prisma.user.findUnique({ where: { id: req.userId! } });
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    // Only send back the fields we need on the frontend
    return res.json({
        id:        user.id,
        firstName: user.firstName,
        lastName:  user.lastName,
        email:     user.email,
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));


export default serverless(app);