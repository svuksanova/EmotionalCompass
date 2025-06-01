import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

async function main() {
    // richer follow-up definition (only excellentQ has extra choices for demo)
    const followUps = [
        {
            id: 'excellentQ',
            prompt: 'Nice! Keep it up! ✨ What made your day so great?',
            forScale: 5,
            choices: [
                'I got recognition or praise',
                'I did something I’ve been avoiding',
                'I felt really confident today',
                'I spent time with people I love',
                'I reached a personal goal',
                'I traveled or explored something new',
                'My creativity flowed today',
                'I helped someone',
                'I got good grades/work feedback',
                'I felt truly happy without a reason',
                'Other (let me write it)',
            ],
        },
        {
            id: 'goodQ',
            prompt: 'That’s great! What’s holding it back from being excellent?',
            forScale: 4,
            choices: [
                'Minor stress from work/school',
                'A small argument with someone',
                "I'm a little tired / not enough sleep",
                "I'm overwhelmed but managing",
                'Social media drained me a bit',
                'Feeling slightly insecure today',
                'Just nothing exciting happened',
                'Something is bothering me in the background',
                'I’m PMS-ing / hormonal',
                'Other',
            ],
        },
        {
            id: 'okayQ',
            prompt: 'Hmm, seems like an average day. Let’s reflect a bit.',
            forScale: 3,
            choices: [
                'I feel emotionally flat',
                'I’m just going through the motions',
                'I didn’t do much today',
                'I feel disconnected from others',
                'I’m not sure what I’m feeling',
                'I’m avoiding something',
                'I’m kind of zoning out all day',
                'I miss someone',
                'I had a small win, but also a setback',
                'I was productive but not satisfied',
                'Other',
            ],
        },
        {
            id: 'lowQ',
            prompt: 'Sorry to hear that. What’s weighing on you?',
            forScale: 2,
            choices: [
                'I feel left out',
                'I’m stuck in comparison',
                'My mind won’t slow down',
                'I feel like I’m not doing enough',
                'I miss someone badly',
                'I feel misunderstood',
                'I feel like I’m failing',
                "I'm feeling anxious or unsure about the future",
                'I’m emotionally exhausted',
                'Something upset me online',
                "I don't know how to explain",
                'Other',
            ],
        },
        {
            id: 'badQ',
            prompt: 'That sounds really hard 💔 You’re not alone.',
            forScale: 1,
            choices: [
                'I feel numb',
                'I had a panic attack',
                'Someone hurt my feelings',
                'I feel like a burden',
                'I feel stuck in my head',
                'I feel disappointed in myself',
                'I had a rough day at school/work',
                'My thoughts are too loud',
                'I can’t stop overthinking',
                'I hate how I look',
                'Everything feels heavy',
                'Other',
            ],
        },
        {
            id: 'awfulQ',
            prompt: 'I’m really sorry you’re feeling like this. Please know that you matter 💙',
            forScale: 0,
            choices: [
                'I feel invisible or ignored',
                'I’m mentally spiraling',
                'I feel like I don’t belong',
                'I don’t want to be here',
                'I feel completely alone',
                'I don’t know how to ask for help',
                "I'm overwhelmed and scared",
                'I feel broken',
                "I'm angry at everything",
                'I feel like nothing matters',
                'I want someone to notice I’m not okay',
                'Other',
            ],
        },
    ];

    // 1️⃣  upsert follow-ups
    for (const q of followUps) {
        await db.question.upsert({
            where: { id: q.id },
            update: {
                prompt: q.prompt,
                forScale: q.forScale,
                choices: q.choices
                    ? { create: q.choices.map((label) => ({ label })) }
                    : undefined,
            },
            create: {
                id: q.id,
                prompt: q.prompt,
                forScale: q.forScale,
                choices: q.choices
                    ? { create: q.choices.map((label) => ({ label })) }
                    : undefined,
            },
        });
    }

    // 2️⃣  root question (after follow-ups exist)
    await db.question.upsert({
        where: { id: 'root' },
        update: {},
        create: {
            id: 'root',
            prompt: 'How are you feeling today?',
            forScale: -1,
            choices: {
                create: [
                    { label: 'Excellent', nextQuestionId: 'excellentQ' },
                    { label: 'Good',      nextQuestionId: 'goodQ'      },
                    { label: 'Okay',      nextQuestionId: 'okayQ'      },
                    { label: 'Low',       nextQuestionId: 'lowQ'       },
                    { label: 'Bad',       nextQuestionId: 'badQ'       },
                    { label: 'Awful',     nextQuestionId: 'awfulQ'     },
                ],
            },
        },
    });
}

main()
    .then(() => db.$disconnect())
    .catch((e) => {
        console.error(e);
        db.$disconnect();
        process.exit(1);
    });
