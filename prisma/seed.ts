import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

async function main() {
    // 1️⃣ Define follow-up questions and their choice metadata
    const followUps = [
        {
            id: 'excellentQ',
            prompt: 'Nice! Keep it up! ✨ What made your day so great?',
            forScale: 5,
            choices: [
                { id: 'exc_praise',  label: 'I got recognition or praise',          next: 'exc_praiseQ' },
                { id: 'exc_avoid',   label: 'I did something I’ve been avoiding',   next: 'exc_avoidQ'  },
                { id: 'exc_conf',    label: 'I felt really confident today',        next: 'exc_confQ'   },
                { id: 'exc_people',  label: 'I spent time with people I love',      next: 'exc_peopleQ' },
                { id: 'exc_goal',    label: 'I reached a personal goal',            next: 'exc_goalQ'   },
                { id: 'exc_travel',  label: 'I traveled or explored something new', next: 'exc_travelQ' },
                { id: 'exc_create',  label: 'My creativity flowed today',           next: 'exc_createQ' },
                { id: 'exc_help',    label: 'I helped someone',                     next: 'exc_helpQ'   },
                { id: 'exc_grade',   label: 'I got good grades/work feedback',      next: 'exc_gradeQ'  },
                { id: 'exc_happy',   label: 'I felt truly happy without a reason',  next: 'exc_happyQ'  },
            ],
        },
        {
            id: 'goodQ',
            prompt: 'That’s great! What’s holding it back from being excellent?',
            forScale: 4,
            choices: [
                { id: 'good_stress',      label: 'Minor stress from work/school',         next: 'good_stressQ'   },
                { id: 'good_argument',    label: 'A small argument with someone',         next: 'good_argumentQ' },
                { id: 'good_tired',       label: "I'm a little tired / not enough sleep", next: 'good_tiredQ'    },
                { id: 'good_overwhelmed', label: "I'm overwhelmed but managing",          next: 'good_overwhelmedQ' },
                { id: 'good_social',      label: 'Social media drained me a bit',         next: 'good_socialQ'   },
                { id: 'good_insecure',    label: 'Feeling slightly insecure today',       next: 'good_insecureQ' },
                { id: 'good_bored',       label: 'Just nothing exciting happened',         next: 'good_boredQ'    },
                { id: 'good_bother',      label: 'Something is bothering me in the background', next: 'good_botherQ' },
                { id: 'good_pms',         label: 'I’m PMS-ing / hormonal',                next: 'good_pmsQ'      },
            ],
        },
        {
            id: 'okayQ',
            prompt: 'Hmm, seems like an average day. Let’s reflect a bit.',
            forScale: 3,
            choices: [
                { id: 'okay_flat',      label: 'I feel emotionally flat',             next: 'okay_flatQ'     },
                { id: 'okay_motion',    label: 'I’m just going through the motions',  next: 'okay_motionQ'   },
                { id: 'okay_nothing',   label: 'I didn’t do much today',               next: 'okay_nothingQ'  },
                { id: 'okay_disconnected', label: 'I feel disconnected from others',  next: 'okay_disconnectedQ' },
                { id: 'okay_unsure',    label: 'I’m not sure what I’m feeling',       next: 'okay_unsureQ'   },
                { id: 'okay_avoid',     label: 'I’m avoiding something',              next: 'okay_avoidQ'    },
                { id: 'okay_zoning',    label: 'I’m kind of zoning out all day',      next: 'okay_zoningQ'   },
                { id: 'okay_miss',      label: 'I miss someone',                       next: 'okay_missQ'     },
                { id: 'okay_smallwin',  label: 'I had a small win, but also a setback', next: 'okay_smallwinQ' },
                { id: 'okay_productive', label: 'I was productive but not satisfied',  next: 'okay_productiveQ' },
            ],
        },
        {
            id: 'lowQ',
            prompt: 'Sorry to hear that. What’s weighing on you?',
            forScale: 2,
            choices: [
                { id: 'low_leftout',     label: 'I feel left out',                              next: 'low_leftoutQ'     },
                { id: 'low_comparison',  label: 'I’m stuck in comparison',                       next: 'low_comparisonQ'  },
                { id: 'low_mind',        label: 'My mind won’t slow down',                      next: 'low_mindQ'        },
                { id: 'low_enough',      label: 'I feel like I’m not doing enough',             next: 'low_enoughQ'      },
                { id: 'low_miss',        label: 'I miss someone badly',                         next: 'low_missQ'        },
                { id: 'low_misunderstood', label: 'I feel misunderstood',                       next: 'low_misunderstoodQ' },
                { id: 'low_failing',     label: 'I feel like I’m failing',                      next: 'low_failingQ'     },
                { id: 'low_anxious',     label: "I'm feeling anxious or unsure about the future", next: 'low_anxiousQ'   },
                { id: 'low_exhausted',   label: 'I’m emotionally exhausted',                   next: 'low_exhaustedQ'   },
                { id: 'low_online',      label: 'Something upset me online',                   next: 'low_onlineQ'      },
                { id: 'low_explain',     label: "I don't know how to explain",                 next: 'low_explainQ'     },
            ],
        },
        {
            id: 'badQ',
            prompt: 'That sounds really hard 💔 You’re not alone.',
            forScale: 1,
            choices: [
                { id: 'bad_numb',          label: 'I feel numb',                     next: 'bad_numbQ'          },
                { id: 'bad_panic',         label: 'I had a panic attack',            next: 'bad_panicQ'         },
                { id: 'bad_hurt',          label: 'Someone hurt my feelings',         next: 'bad_hurtQ'          },
                { id: 'bad_burden',        label: 'I feel like a burden',             next: 'bad_burdenQ'        },
                { id: 'bad_stuck',         label: 'I feel stuck in my head',          next: 'bad_stuckQ'         },
                { id: 'bad_disappointed',  label: 'I feel disappointed in myself',    next: 'bad_disappointedQ'  },
                { id: 'bad_rough',         label: 'I had a rough day at school/work', next: 'bad_roughQ'         },
                { id: 'bad_thoughts',      label: 'My thoughts are too loud',         next: 'bad_thoughtsQ'      },
                { id: 'bad_overthinking',  label: 'I can’t stop overthinking',        next: 'bad_overthinkingQ'  },
                { id: 'bad_look',          label: 'I hate how I look',                next: 'bad_lookQ'          },
                { id: 'bad_heavy',         label: 'Everything feels heavy',           next: 'bad_heavyQ'         },
            ],
        },
        {
            id: 'awfulQ',
            prompt: 'I’m really sorry you’re feeling like this. Please know that you matter 💙',
            forScale: 0,
            choices: [
                { id: 'awful_invisible',   label: 'I feel invisible or ignored',            next: 'awful_invisibleQ'   },
                { id: 'awful_spiral',      label: 'I’m mentally spiraling',                 next: 'awful_spiralQ'      },
                { id: 'awful_belong',      label: 'I feel like I don’t belong',             next: 'awful_belongQ'      },
                { id: 'awful_hopeless',    label: 'I don’t want to be here',                next: 'awful_hopelessQ'    },
                { id: 'awful_alone',       label: 'I feel completely alone',                next: 'awful_aloneQ'       },
                { id: 'awful_help',        label: 'I don’t know how to ask for help',       next: 'awful_helpQ'        },
                { id: 'awful_scared',      label: "I'm overwhelmed and scared",            next: 'awful_scaredQ'      },
                { id: 'awful_broken',      label: 'I feel broken',                         next: 'awful_brokenQ'      },
                { id: 'awful_angry',       label: "I'm angry at everything",               next: 'awful_angryQ'       },
                { id: 'awful_nothing',     label: 'I feel like nothing matters',           next: 'awful_nothingQ'     },
                { id: 'awful_notice',      label: 'I want someone to notice I’m not okay', next: 'awful_noticeQ'      },
            ],
        },
    ];

    //
    // 1️⃣ First pass: upsert each follow-up QUESTION (no choices yet)
    //
    for (const q of followUps) {
        await db.question.upsert({
            where: { id: q.id },
            update: {
                prompt: q.prompt,
                forScale: q.forScale,
                // DO NOT create choices yet
            },
            create: {
                id:       q.id,
                prompt:   q.prompt,
                forScale: q.forScale,
                // DO NOT create choices here
            },
        });
    }

    //
    // 2️⃣ Immediately create all exc_*Q free-text QUESTIONS
    //
    await db.question.createMany({
        data: [
            { id: 'exc_praiseQ',  prompt: 'Who praised you?',                       forScale: 5 },
            { id: 'exc_avoidQ',   prompt: 'What did you finally tackle?',           forScale: 5 },
            { id: 'exc_confQ',    prompt: 'What boosted your confidence?',          forScale: 5 },
            { id: 'exc_peopleQ',  prompt: 'Who did you hang out with?',             forScale: 5 },
            { id: 'exc_goalQ',    prompt: 'Which goal did you hit?',                forScale: 5 },
            { id: 'exc_travelQ',  prompt: 'Where did you go?',                      forScale: 5 },
            { id: 'exc_createQ',  prompt: 'What did you create today?',             forScale: 5 },
            { id: 'exc_helpQ',    prompt: 'How did you help them?',                 forScale: 5 },
            { id: 'exc_gradeQ',   prompt: 'What feedback did you receive?',         forScale: 5 },
            { id: 'exc_happyQ',   prompt: 'Describe that feeling!',                 forScale: 5 },
        ],
        skipDuplicates: true,
    });

    await db.question.createMany({
        data: [
            { id: 'good_stressQ',      prompt: 'What is causing that stress?',                forScale: 4 },
            { id: 'good_argumentQ',    prompt: 'Who did you argue with?',                       forScale: 4 },
            { id: 'good_tiredQ',       prompt: 'How many hours did you sleep?',                forScale: 4 },
            { id: 'good_overwhelmedQ', prompt: 'What’s making you feel overwhelmed?',            forScale: 4 },
            { id: 'good_socialQ',      prompt: 'Which platform drained you?',                   forScale: 4 },
            { id: 'good_insecureQ',    prompt: 'What’s making you feel insecure?',               forScale: 4 },
            { id: 'good_boredQ',       prompt: 'Is there something you wish you had done today?', forScale: 4 },
            { id: 'good_botherQ',      prompt: 'Can you describe what’s bothering you?',          forScale: 4 },
            { id: 'good_pmsQ',         prompt: 'Do you want some self-care tips for PMS?',         forScale: 4 },
        ],
        skipDuplicates: true,
    });

    await db.question.createMany({
        data: [
            { id: 'okay_flatQ',        prompt: 'What does “emotionally flat” feel like for you?',        forScale: 3 },
            { id: 'okay_motionQ',      prompt: 'When do you notice these motions happening?',              forScale: 3 },
            { id: 'okay_nothingQ',     prompt: 'Why do you think nothing much happened today?',            forScale: 3 },
            { id: 'okay_disconnectedQ',prompt: 'Who or what makes you feel disconnected from others?',    forScale: 3 },
            { id: 'okay_unsureQ',      prompt: 'What’s on your mind when you’re unsure how you feel?',    forScale: 3 },
            { id: 'okay_avoidQ',       prompt: 'What are you avoiding and why?',                           forScale: 3 },
            { id: 'okay_zoningQ',      prompt: 'When did you start feeling zoned out today?',              forScale: 3 },
            { id: 'okay_missQ',        prompt: 'Who do you miss and what do you miss about them?',         forScale: 3 },
            { id: 'okay_smallwinQ',    prompt: 'Tell me more about that small win and setback.',           forScale: 3 },
            { id: 'okay_productiveQ',  prompt: 'What made you feel productive but still unsatisfied?',     forScale: 3 },
        ],
        skipDuplicates: true,
    });

    await db.question.createMany({
        data: [
            { id: 'low_leftoutQ',       prompt: 'When do you most feel left out?',                         forScale: 2 },
            { id: 'low_comparisonQ',    prompt: 'What triggers your comparison feelings?',                    forScale: 2 },
            { id: 'low_mindQ',          prompt: 'What thoughts won’t let your mind slow down?',               forScale: 2 },
            { id: 'low_enoughQ',        prompt: 'What makes you feel like you’re not doing enough?',        forScale: 2 },
            { id: 'low_missQ',          prompt: 'Who do you miss, and why do you miss them?',               forScale: 2 },
            { id: 'low_misunderstoodQ', prompt: 'When did you last feel truly understood?',                  forScale: 2 },
            { id: 'low_failingQ',       prompt: 'What area feels like a failure to you right now?',            forScale: 2 },
            { id: 'low_anxiousQ',       prompt: 'What’s making you anxious about the future?',                forScale: 2 },
            { id: 'low_exhaustedQ',     prompt: 'What leaves you feeling emotionally exhausted?',             forScale: 2 },
            { id: 'low_onlineQ',        prompt: 'What upset you online, and how did it feel?',               forScale: 2 },
            { id: 'low_explainQ',       prompt: 'Take your time—describe what’s hard to explain.',            forScale: 2 },
        ],
        skipDuplicates: true,
    });

    await db.question.createMany({
        data: [
            { id: 'bad_numbQ',         prompt: 'When do you usually feel numb?',                       forScale: 1 },
            { id: 'bad_panicQ',        prompt: 'What triggered that panic attack?',                     forScale: 1 },
            { id: 'bad_hurtQ',         prompt: 'Who hurt your feelings and what happened?',             forScale: 1 },
            { id: 'bad_burdenQ',       prompt: 'Why do you feel like a burden right now?',               forScale: 1 },
            { id: 'bad_stuckQ',        prompt: 'What thoughts make you feel stuck in your head?',       forScale: 1 },
            { id: 'bad_disappointedQ', prompt: 'What was the disappointing event?',                     forScale: 1 },
            { id: 'bad_roughQ',        prompt: 'Tell me more about your rough day at school or work.',    forScale: 1 },
            { id: 'bad_thoughtsQ',     prompt: 'Which thoughts feel the loudest right now?',             forScale: 1 },
            { id: 'bad_overthinkingQ', prompt: 'What are you overthinking about the most?',               forScale: 1 },
            { id: 'bad_lookQ',         prompt: 'What about your appearance bothers you?',                  forScale: 1 },
            { id: 'bad_heavyQ',        prompt: 'What feels the heaviest today?',                          forScale: 1 },
        ],
        skipDuplicates: true,
    });

    await db.question.createMany({
        data: [
            { id: 'awful_invisibleQ', prompt: 'When do you feel most invisible or ignored?',      forScale: 0 },
            { id: 'awful_spiralQ',    prompt: 'What thoughts are causing you to spiral?',          forScale: 0 },
            { id: 'awful_belongQ',    prompt: 'Where or with whom do you feel you don’t belong?',  forScale: 0 },
            { id: 'awful_hopelessQ',  prompt: 'What makes you not want to be here right now?',      forScale: 0 },
            { id: 'awful_aloneQ',     prompt: 'What does “completely alone” feel like for you?',    forScale: 0 },
            { id: 'awful_helpQ',      prompt: 'What stops you from asking for help?',                 forScale: 0 },
            { id: 'awful_scaredQ',    prompt: 'What are you most scared of right now?',               forScale: 0 },
            { id: 'awful_brokenQ',    prompt: 'Why do you feel broken?',                              forScale: 0 },
            { id: 'awful_angryQ',     prompt: 'What is making you feel angry about everything?',      forScale: 0 },
            { id: 'awful_nothingQ',   prompt: 'When did “nothing matters” feel strongest for you?',     forScale: 0 },
            { id: 'awful_noticeQ',    prompt: 'Who would you like to notice you are not okay?',        forScale: 0 },
        ],
        skipDuplicates: true,
    });

    //
    // 3️⃣ Second pass: upsert all CHOICES for each follow-up
    //
    for (const q of followUps) {
        for (const c of q.choices || []) {
            // ── only proceed when this choice is the object form (has an `id`) ──
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
    // 4️⃣ Upsert the root question as before
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
