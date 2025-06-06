import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

async function main() {
    //
    // ── 1️⃣ Define follow‐up QUESTIONS & CHOICES (Level 1 and Level 2 for “Excellent”) ──
    //
    // Note: We have removed ALL exc_*Q free‐text questions. Instead, excellentQ is
    // a two‐level multiple‐choice node: once the user picks one of these 10 choices,
    // “nextQuestion” will be null and the chat will close.
    //
    const followUps = [
        {
            // ── Level 2 (multiple-choice) under “Excellent” ──
            id: 'excellentQ',
            prompt: 'Nice! Keep it up! ✨ What made your day so great?',
            forScale: 5,
            choices: [
                // Each of these has next: null → so after the user picks one, flow ends.
                { id: 'exc_praise',  label: 'I got recognition or praise',          next: null },
                { id: 'exc_avoid',   label: 'I did something I’ve been avoiding',   next: null },
                { id: 'exc_conf',    label: 'I felt really confident today',        next: null },
                { id: 'exc_people',  label: 'I spent time with people I love',      next: null },
                { id: 'exc_goal',    label: 'I reached a personal goal',            next: null },
                { id: 'exc_travel',  label: 'I traveled or explored something new', next: null },
                { id: 'exc_create',  label: 'My creativity flowed today',           next: null },
                { id: 'exc_help',    label: 'I helped someone',                     next: null },
                { id: 'exc_grade',   label: 'I got good grades/work feedback',      next: null },
                { id: 'exc_happy',   label: 'I felt truly happy without a reason',  next: null },
            ],
        },

        {
            id: 'goodQ',
            prompt: 'That’s great! What’s holding it back from being excellent?',
            forScale: 4,
            choices: [
                // ←─ Notice next: null on each item so that "choice.nextQuestion" is always null:
                { id: 'good_stress',      label: 'Minor stress from work/school',         next: null },
                { id: 'good_argument',    label: 'A small argument with someone',         next: null },
                { id: 'good_tired',       label: "I'm a little tired / not enough sleep", next: null },
                { id: 'good_overwhelmed', label: "I'm overwhelmed but managing",          next: null },
                { id: 'good_social',      label: 'Social media drained me a bit',         next: null },
                { id: 'good_insecure',    label: 'Feeling slightly insecure today',       next: null },
                { id: 'good_bored',       label: 'Just nothing exciting happened',         next: null },
                { id: 'good_bother',      label: 'Something is bothering me in the background', next: null },
                { id: 'good_pms',         label: 'I’m PMS-ing / hormonal',                next: null },
            ],
        },

        {
            id: 'okayQ',
            prompt: 'Hmm, seems like an average day. Let’s reflect a bit.',
            forScale: 3,
            choices: [
                { id: 'okay_flat',        label: 'I feel emotionally flat',             next: null },
                { id: 'okay_motion',      label: 'I’m just going through the motions',  next: null },
                { id: 'okay_nothing',     label: 'I didn’t do much today',               next: null },
                { id: 'okay_disconnected',label: 'I feel disconnected from others',      next: null },
                { id: 'okay_unsure',      label: 'I’m not sure what I’m feeling',       next: null },
                { id: 'okay_avoid',       label: 'I’m avoiding something',              next: null },
                { id: 'okay_zoning',      label: 'I’m kind of zoning out all day',      next: null },
                { id: 'okay_miss',        label: 'I miss someone',                       next: null },
                { id: 'okay_smallwin',    label: 'I had a small win, but also a setback', next: null },
                { id: 'okay_productive',  label: 'I was productive but not satisfied',  next: null },
            ],
        },

        {
            id: 'lowQ',
            prompt: 'Sorry to hear that. What’s weighing on you?',
            forScale: 2,
            choices: [
                { id: 'low_leftout',       label: 'I feel left out',                           next: null },
                { id: 'low_comparison',    label: 'I’m stuck in comparison',                    next: null },
                { id: 'low_mind',          label: 'My mind won’t slow down',                   next: null },
                { id: 'low_enough',        label: 'I feel like I’m not doing enough',          next: null },
                { id: 'low_miss',          label: 'I miss someone badly',                       next: null },
                { id: 'low_misunderstood', label: 'I feel misunderstood',                      next: null },
                { id: 'low_failing',       label: 'I feel like I’m failing',                   next: null },
                { id: 'low_anxious',       label: "I'm feeling anxious or unsure about the future", next: null },
                { id: 'low_exhausted',     label: 'I’m emotionally exhausted',                 next: null },
                { id: 'low_online',        label: 'Something upset me online',                 next: null },
                { id: 'low_explain',       label: "I don't know how to explain",                next: null },
            ],
        },

        {
            id: 'badQ',
            prompt: 'That sounds really hard 💔 You’re not alone.',
            forScale: 1,
            choices: [
                { id: 'bad_numb',         label: 'I feel numb',                     next: null },
                { id: 'bad_panic',        label: 'I had a panic attack',            next: null },
                { id: 'bad_hurt',         label: 'Someone hurt my feelings',         next: null },
                { id: 'bad_burden',       label: 'I feel like a burden',             next: null },
                { id: 'bad_stuck',        label: 'I feel stuck in my head',          next: null },
                { id: 'bad_disappointed', label: 'I feel disappointed in myself',    next: null },
                { id: 'bad_rough',        label: 'I had a rough day at school/work', next: null },
                { id: 'bad_thoughts',     label: 'My thoughts are too loud',         next: null },
                { id: 'bad_overthinking', label: 'I can’t stop overthinking',        next: null },
                { id: 'bad_look',         label: 'I hate how I look',                next: null },
                { id: 'bad_heavy',        label: 'Everything feels heavy',           next: null },
            ],
        },

        {
            id: 'awfulQ',
            prompt: 'I’m really sorry you’re feeling like this. Please know that you matter 💙',
            forScale: 0,
            choices: [
                { id: 'awful_invisible',   label: 'I feel invisible or ignored',            next: null },
                { id: 'awful_spiral',      label: 'I’m mentally spiraling',                 next: null },
                { id: 'awful_belong',      label: 'I feel like I don’t belong',             next: null },
                { id: 'awful_hopeless',    label: 'I don’t want to be here',                next: null },
                { id: 'awful_alone',       label: 'I feel completely alone',                next: null },
                { id: 'awful_help',        label: 'I don’t know how to ask for help',       next: null },
                { id: 'awful_scared',      label: "I'm overwhelmed and scared",            next: null },
                { id: 'awful_broken',      label: 'I feel broken',                         next: null },
                { id: 'awful_angry',       label: "I'm angry at everything",               next: null },
                { id: 'awful_nothing',     label: 'I feel like nothing matters',           next: null },
                { id: 'awful_notice',      label: 'I want someone to notice I’m not okay', next: null },
            ],
        },
    ];

    //
    // ── 2️⃣ Upsert each follow‐up QUESTION (Level 2 nodes) ──
    //     (includes “excellentQ”, “goodQ”, “okayQ”, “lowQ”, “badQ”, “awfulQ”)
    //
    for (const q of followUps) {
        await db.question.upsert({
            where: { id: q.id },
            update: {
                prompt: q.prompt,
                forScale: q.forScale,
                // no "choices" here; we'll upsert them next
            },
            create: {
                id: q.id,
                prompt: q.prompt,
                forScale: q.forScale,
            },
        });
    }

    //
    // ── 3️⃣ Create all the FREE-TEXT sub‐questions for “Good” / “Okay” / “Low” / “Bad” / “Awful” ──
    //     (unchanged from your original code)
    //

    await db.question.createMany({
        data: [
            // Okay sub-questions:
            { id: 'okay_flatQ',        prompt: 'What does “emotionally flat” feel like for you?',         forScale: 3 },
            { id: 'okay_motionQ',      prompt: 'When do you notice these motions happening?',               forScale: 3 },
            { id: 'okay_nothingQ',     prompt: 'Why do you think nothing much happened today?',             forScale: 3 },
            { id: 'okay_disconnectedQ',prompt: 'Who or what makes you feel disconnected from others?',     forScale: 3 },
            { id: 'okay_unsureQ',      prompt: 'What’s on your mind when you’re unsure how you feel?',     forScale: 3 },
            { id: 'okay_avoidQ',       prompt: 'What are you avoiding and why?',                            forScale: 3 },
            { id: 'okay_zoningQ',      prompt: 'When did you start feeling zoned out today?',               forScale: 3 },
            { id: 'okay_missQ',        prompt: 'Who do you miss and what do you miss about them?',          forScale: 3 },
            { id: 'okay_smallwinQ',    prompt: 'Tell me more about that small win and setback.',            forScale: 3 },
            { id: 'okay_productiveQ',  prompt: 'What made you feel productive but still unsatisfied?',      forScale: 3 },

            // Low sub-questions:
            { id: 'low_leftoutQ',       prompt: 'When do you most feel left out?',                          forScale: 2 },
            { id: 'low_comparisonQ',    prompt: 'What triggers your comparison feelings?',                     forScale: 2 },
            { id: 'low_mindQ',          prompt: 'What thoughts won’t let your mind slow down?',                forScale: 2 },
            { id: 'low_enoughQ',        prompt: 'What makes you feel like you’re not doing enough?',         forScale: 2 },
            { id: 'low_missQ',          prompt: 'Who do you miss, and why do you miss them?',                forScale: 2 },
            { id: 'low_misunderstoodQ', prompt: 'When did you last feel truly understood?',                   forScale: 2 },
            { id: 'low_failingQ',       prompt: 'What area feels like a failure to you right now?',             forScale: 2 },
            { id: 'low_anxiousQ',       prompt: 'What’s making you anxious about the future?',                 forScale: 2 },
            { id: 'low_exhaustedQ',     prompt: 'What leaves you feeling emotionally exhausted?',              forScale: 2 },
            { id: 'low_onlineQ',        prompt: 'What upset you online, and how did it feel?',                forScale: 2 },
            { id: 'low_explainQ',       prompt: 'Take your time—describe what’s hard to explain.',             forScale: 2 },

            // Bad sub-questions:
            { id: 'bad_numbQ',         prompt: 'When do you usually feel numb?',                        forScale: 1 },
            { id: 'bad_panicQ',        prompt: 'What triggered that panic attack?',                      forScale: 1 },
            { id: 'bad_hurtQ',         prompt: 'Who hurt your feelings and what happened?',              forScale: 1 },
            { id: 'bad_burdenQ',       prompt: 'Why do you feel like a burden right now?',                forScale: 1 },
            { id: 'bad_stuckQ',        prompt: 'What thoughts make you feel stuck in your head?',        forScale: 1 },
            { id: 'bad_disappointedQ', prompt: 'What was the disappointing event?',                      forScale: 1 },
            { id: 'bad_roughQ',        prompt: 'Tell me more about your rough day at school or work.',     forScale: 1 },
            { id: 'bad_thoughtsQ',     prompt: 'Which thoughts feel the loudest right now?',               forScale: 1 },
            { id: 'bad_overthinkingQ', prompt: 'What are you overthinking about the most?',                 forScale: 1 },
            { id: 'bad_lookQ',         prompt: 'What about your appearance bothers you?',                   forScale: 1 },
            { id: 'bad_heavyQ',        prompt: 'What feels the heaviest today?',                           forScale: 1 },

            // Awful sub-questions:
            { id: 'awful_invisibleQ', prompt: 'When do you feel most invisible or ignored?',      forScale: 0 },
            { id: 'awful_spiralQ',    prompt: 'What thoughts are causing you to spiral?',           forScale: 0 },
            { id: 'awful_belongQ',    prompt: 'Where or with whom do you feel you don’t belong?',   forScale: 0 },
            { id: 'awful_hopelessQ',  prompt: 'What makes you not want to be here right now?',       forScale: 0 },
            { id: 'awful_aloneQ',     prompt: 'What does “completely alone” feel like for you?',     forScale: 0 },
            { id: 'awful_helpQ',      prompt: 'What stops you from asking for help?',                  forScale: 0 },
            { id: 'awful_scaredQ',    prompt: 'What are you most scared of right now?',                forScale: 0 },
            { id: 'awful_brokenQ',    prompt: 'Why do you feel broken?',                               forScale: 0 },
            { id: 'awful_angryQ',     prompt: 'What is making you feel angry about everything?',       forScale: 0 },
            { id: 'awful_nothingQ',   prompt: 'When did “nothing matters” feel strongest for you?',    forScale: 0 },
            { id: 'awful_noticeQ',    prompt: 'Who would you like to notice you are not okay?',         forScale: 0 },
        ],
        skipDuplicates: true,
    });

    //
    // ── 4️⃣ Upsert all CHOICES for each follow-up question in `followUps` ──
    //
    for (const q of followUps) {
        for (const c of q.choices || []) {
            // only proceed when this choice object has an `id`
            if (typeof c !== 'object' || c === null) {
                continue;
            }

            await db.choice.upsert({
                where: { id: c.id },
                update: {
                    label:          c.label,
                    nextQuestionId: c.next ?? undefined,
                    questionId:     q.id,
                },
                create: {
                    id:             c.id,
                    questionId:     q.id,
                    label:          c.label,
                    nextQuestionId: c.next ?? undefined,
                },
            });
        }
    }

    //
    // ── 5️⃣ Finally, upsert the `root` question with its immediate six choices ──
    //
    await db.question.upsert({
        where: { id: 'root' },
        update: {},
        create: {
            id: 'root',
            prompt: 'How are you feeling today?',
            forScale: -1,
            choices: {
                create: [
                    // Root-level node: “Excellent” now points to our new 'excellentQ'
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
