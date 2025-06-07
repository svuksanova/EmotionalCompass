import serverless from 'serverless-http'
import express from 'express'
import cors from 'cors'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import {PrismaClient} from "@prisma/client";
import 'dotenv/config'
import { requireAuth, AuthReq } from './lib/auth';
import path from "node:path";

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

      const nextQuestion = choice?.nextQuestion ?? null;

      if (nextQuestion) {
            // 1) Record the SYSTEM message for this follow-up
                await prisma.chatMessage.create({
                      data: {
                    sessionId,
                        sender: 'SYSTEM',
                        content: nextQuestion.prompt,
                        questionId: nextQuestion.id,
                      },
            });
            // 2) Return only the nextQuestion, since there is still more branching
                return res.json({ nextQuestion });
          }

      //
          // ── If we reach here, `nextQuestion === null` ──
              // That means the user clicked a leaf choice. Time to send closingMessage  suggestions.
                  //

                      // (a) Look up the original question’s forScale to know which mood we’re closing for
                          //     choice.questionId is “root” only for the first pick; for Level 2 branches, it’ll be “excellentQ”, “goodQ”, etc.
                              const parentQuestion = await prisma.question.findUnique({
            where: { id: choice!.questionId! },
        select: { forScale: true },
      });
      const moodScale = parentQuestion?.forScale ?? null;

      // (b) Build a generic closing message  suggestions array based on moodScale
    let closingMessage = 'Thank you for sharing!';
      let suggestions: string[] = [];

       if (moodScale === 5) {
             closingMessage = "That’s wonderful to hear! Keep up these healthy habits:";
             suggestions = [
                   "💧 Stay hydrated: aim for 8 glasses of water today.",
                   "🧘‍♀️ Continue mindfulness: try a 5-minute breathing exercise.",
                   "🚶‍♂️ Keep moving: consider a short walk to maintain this energy.",
                   "📔 Reflect: write down what you did well in your journal.",
                   "🎧 Listen to uplifting music: here’s a quick playlist: <https://www.youtube.com/watch?v=uk-DSogtQRo>",
                 ];
           }
       else if (moodScale === 4) {
             // Instead of one generic block for all "Good" choices, switch on which choiceId was picked:
                 switch (choiceId) {
                   case 'good_stress':
                         closingMessage = "You mentioned minor stress from work/school. A few ideas:";
                         suggestions = [
                               "🧘 Take 5 minutes of guided breathing to release stress.",
                               "☕ Step away for a short coffee or tea break to reset.",
                               "📝 Write down one small task you can finish right now to ease the pressure.",
                               "👂 Talk to a colleague/friend for 5 minutes about how you feel.",
                               "🚶 Take a quick 5-minute walk around the block.",
                             ];
                         break;
                
                           case 'good_argument':
                         closingMessage = "Arguments can be draining. Here are some ways to rebound:";
                         suggestions = [
                               "🤝 Apologize or clarify your side—sometimes a quick chat fixes it.",
                               "📝 Write a short note to yourself about what you would’ve said.",
                               "📱 Take a 5-minute break on your phone to clear your head.",
                               "🎵 Listen to a relaxing song or playlist to calm your nerves.",
                               "🌳 Step outside briefly and take a few deep breaths of fresh air.",
                             ];
                         break;
                
                           case 'good_tired':
                         closingMessage = "Lack of sleep can hold you back. Try one of these:";
                         suggestions = [
                               "😴 Plan to get an extra 30 minutes of rest tonight.",
                               "🚰 Drink a full glass of water to refresh your mind.",
                               "☕ If you need caffeine, limit it to one small cup early in the day.",
                               "🧘‍♀️ Do a 2-minute desk stretch to wake up your body.",
                               "👀 Look away from screens every 20 minutes to reduce eye strain.",
                             ];
                         break;
                
                           case 'good_overwhelmed':
                         closingMessage = "Feeling overwhelmed but managing—here’s what might help:";
                         suggestions = [
                               "🗒️ List out your top 3 tasks; focus on one at a time.",
                               "⏲️ Try the Pomodoro Technique: 25 minutes on, 5 minutes off.",
                               "📞 Call a friend for a 5-minute vent session.",
                               "🚶‍♂️ Take a brisk 10-minute walk to reset your mind.",
                               "🧘‍♂️ Do a quick 3-minute mindfulness exercise.",
                             ];
                         break;
                
                           case 'good_social':
                         closingMessage = "Social media can drain you. Try this next:";
                         suggestions = [
                               "📵 Take a 15-minute break from all social apps right now.",
                               "📚 Read one chapter of a book instead of scrolling.",
                               "👯‍♀️ Plan an in-person or video hangout with a friend.",
                               "✍️ Write down three things you enjoyed today—no screen involved.",
                               "🎧 Listen to a short podcast episode or some music you love.",
                             ];
                         break;
                
                           case 'good_insecure':
                         closingMessage = "Feeling slightly insecure? Here are some confidence boosters:";
                         suggestions = [
                               "📔 Write down one achievement you’re proud of this week.",
                               "🧘‍♀️ Spend 3 minutes repeating a positive affirmation.",
                               "🗣️ Tell someone one thing you like about yourself.",
                               "🎯 Set one small goal you know you can achieve today.",
                               "🎧 Listen to a motivational talk or playlist for 5 minutes.",
                             ];
                         break;
                
                           case 'good_bored':
                         closingMessage = "Nothing exciting happened. Let’s spark some creativity:";
                         suggestions = [
                               "✍️ Doodle or sketch for 5 minutes—not trying to be perfect.",
                               "📖 Read one short article on a random topic you’re curious about.",
                               "🎶 Put on a song you’ve never heard before and listen attentively.",
                               "🧩 Do a 3-minute puzzle or brain teaser to re-engage your mind.",
                               "📞 Call a friend and ask them for one fun movie recommendation.",
                             ];
                         break;
                
                           case 'good_bother':
                         closingMessage = "Something’s bothering you in the background. You could:";
                         suggestions = [
                               "📝 Jot down what’s on your mind for 5 minutes—just brain dump.",
                               "☕ Make a cup of tea or coffee and sip it mindfully.",
                               "🎵 Listen to a calming playlist while closing your eyes for 2 minutes.",
                               "🚶‍♀️ Stand up and stretch or walk around for a few minutes.",
                               "🤝 Share the thought with someone you trust (even briefly).",
                             ];
                         break;
                
                           case 'good_pms':
                         closingMessage = "Hormonal ups and downs can be tough. Consider:";
                         suggestions = [
                               "🥤 Drink a warm cup of herbal tea (chamomile, ginger, or peppermint).",
                               "🛁 Take a short, warm shower or bath to relax your muscles.",
                               "🧘‍♀️ Do a gentle 3-minute stretching routine focusing on shoulders/neck.",
                               "📓 Write down three things you’re grateful for to shift focus.",
                               "🎵 Listen to soothing music or a guided meditation for 5 minutes.",
                             ];
                         break;
                
                           default:
                         // Fallback if new/generic "forScale=4" info is needed:
                             closingMessage = "You’re doing well! Here are a few tips to maintain momentum:";
                         suggestions = [
                               "🛌 Try to add 15 minutes of extra sleep this week.",
                               "📵 Schedule a 15-minute “social‐media break” each day.",
                               "🍎 Snack on a piece of fruit or a handful of nuts between meals.",
                               "🤝 Reach out to a friend for a short check‐in call.",
                               "🎯 Keep tracking your progress in a simple to‐do list.",
                             ];
                     }
           }
       else if (moodScale === 3) {
           // ── NEW: tailor suggestions per `okay_*` choice ──
           switch (choiceId) {
               case 'okay_flat':
                   closingMessage = "Feeling emotionally flat? Let’s add a little spark:";
                   suggestions = [
                       "🎵 Put on a song that always lifts your mood.",
                       "🌿 Step outside for 5 minutes and notice something beautiful (a tree, the sky).",
                       "✍️ Jot down one thing you reacted to this morning—good or bad—to break the mental fog.",
                       "🧘‍♂️ Try a 2-minute breathing exercise: inhale for 4, exhale for 4.",
                       "📖 Read a short, funny article or quote to shift perspective.",
                   ];
                   break;

               case 'okay_motion':
                   closingMessage = "Just going through the motions? Let’s interrupt autopilot:";
                   suggestions = [
                       "🚶‍♀️ Stand up and stretch once every hour (even if just for 30 seconds).",
                       "📝 Write a quick “Today I’m grateful for…” list, even if it’s only one item.",
                       "🎯 Pick one tiny task (e.g., send that email) and spend 5 focused minutes on it.",
                       "🍵 Make a cup of tea or coffee and savor each sip, no rushing.",
                       "📞 Send a quick “Hey, how are you?” text to someone you care about.",
                   ];
                   break;

               case 'okay_nothing':
                   closingMessage = "Didn’t do much today? Let’s find a simple win:";
                   suggestions = [
                       "✍️ Write down one small thing you *did*—even if it was making your bed.",
                       "📚 Read one short paragraph of an article on a topic you like.",
                       "🎶 Put on your favorite song and do absolutely nothing but listen.",
                       "💦 Drink a full glass of water and notice how it feels.",
                       "🚶 Take a 5-minute walk around your living space—even pacing counts.",
                   ];
                   break;

               case 'okay_disconnected':
                   closingMessage = "Feeling disconnected from others? Try reconnecting:";
                   suggestions = [
                       "📞 Call a friend or family member for a 2-minute check-in.",
                       "👀 Look at an old photo of someone you miss and smile.",
                       "🤝 If you can, send a quick “I’m thinking of you” message to one person.",
                       "📝 Write a letter (even if you don’t send it) about how you feel.",
                       "🎵 Play a song that reminds you of someone you care about.",
                   ];
                   break;

               case 'okay_unsure':
                   closingMessage = "Not sure what you’re feeling? Let’s do a mini‐check-in:";
                   suggestions = [
                       "🧘‍♀️ Close your eyes for 1 minute and just notice how your body feels.",
                       "📝 Write three words that describe your mood, even if they seem random.",
                       "🍵 Sip a warm drink and pay attention to the taste and temperature.",
                       "🚶 Take three deep breaths, counting to four on each inhale/exhale.",
                       "👂 Listen to a short guided meditation or spoken‐word clip (30–60 seconds).",
                   ];
                   break;

               case 'okay_avoid':
                   closingMessage = "You’re avoiding something. Let’s face it gently:";
                   suggestions = [
                       "📝 Write down exactly what you’re avoiding and one small step you could take.",
                       "📞 Talk for 2 minutes with someone you trust about that thing you’re avoiding.",
                       "🎯 Choose a 5-minute time block today to think through just that one issue.",
                       "🧘‍♂️ Do a quick grounding exercise: name 5 things you see, 4 things you feel.",
                       "🚶 Step outside and mentally rehearse how you might approach it.",
                   ];
                   break;

               case 'okay_zoning':
                   closingMessage = "Zoning out all day? Let’s re‐engage your mind:";
                   suggestions = [
                       "🧩 Solve one tiny puzzle or brain teaser (crossword clue, Sudoku cell).",
                       "🎧 Put on a brief podcast or interesting Ted Talk snippet (2–3 minutes).",
                       "✍️ Doodle something on a scrap of paper—no skill needed.",
                       "📵 Take a 5-minute break from all screens and look around you deliberately.",
                       "🚶‍♂️ Walk for 2 minutes, counting each step up to 50.",
                   ];
                   break;

               case 'okay_miss':
                   closingMessage = "Missing someone? Let’s send that thought their way:";
                   suggestions = [
                       "📞 Give them a quick call or voice note just to say you miss them.",
                       "✉️ Write a short message or email expressing that you’re thinking of them.",
                       "📷 Look at a photo that reminds you of a happy moment together.",
                       "🎵 Play a song that you both enjoyed and remember why.",
                       "📝 Jot down one memory you cherish about them.",
                   ];
                   break;

               case 'okay_smallwin':
                   closingMessage = "You had a small win but also a setback. Let’s build on that win:";
                   suggestions = [
                       "🎉 Celebrate your small win—say it out loud or write it down.",
                       "📝 Identify one tiny next step that feels achievable after that setback.",
                       "🗣️ Tell someone about that win, however small it felt.",
                       "📈 If you have a planner or notepad, record it as progress for today.",
                       "🎵 Listen to an upbeat song to keep that momentum going.",
                   ];
                   break;

               case 'okay_productive':
                   closingMessage = "You were productive but not satisfied. Let’s reframe it:";
                   suggestions = [
                       "📔 Write down what *did* go well instead of focusing on what didn’t.",
                       "🎯 Pick one small task to finish today—complete it fully, then pause.",
                       "📝 Acknowledge that productivity has value, even if expectations are high.",
                       "🧘‍♀️ Take a 3-minute break: close your eyes, breathe, and let thoughts settle.",
                       "📞 Share your feelings with a friend: sometimes verbalizing helps reframe.",
                   ];
                   break;

               default:
                   // Fallback if some new `okay_*` appears:
                   closingMessage = "Let’s lean into some simple self‐care suggestions:";
                   suggestions = [
                       "🌳 Take a 10-minute walk outside today.",
                       "📝 Write down one small win you had this week.",
                       "🧩 Try a quick puzzle or game to re‐engage your mind.",
                       "📖 Read a short article or watch a brief how‐to video.",
                       "📞 Call someone you trust and say “I could use a friend right now.”",
                   ];
           }
       }
       else if (moodScale === 2) {
           // ── NEW: tailor suggestions per `low_*` choice ──
           switch (choiceId) {
               case 'low_leftout':
                   closingMessage = "Feeling left out can hurt. A few ways to reconnect:";
                   suggestions = [
                       "🤝 Reach out to one person you trust—send a quick “How are you?” message.",
                       "🎵 Listen to a song that reminds you of better times with friends.",
                       "✍️ Write down three qualities you like about yourself to boost self-worth.",
                       "📚 Read one short uplifting article or story about friendship.",
                       "🌳 Step outside for 5 minutes—sometimes a change of scenery helps.",
                   ];
                   break;

               case 'low_comparison':
                   closingMessage = "Stuck in comparison? Let’s anchor back to you:";
                   suggestions = [
                       "📝 List 3 things you’ve accomplished this week—no matter how small.",
                       "🙏 Practice gratitude: write down one thing you’re grateful for right now.",
                       "📵 Take a 10-minute break from social media or news feeds.",
                       "🎨 Do a simple creative activity (doodle, color, craft) to shift focus.",
                       "👂 Talk to a friend/family member about how comparisons affect you.",
                   ];
                   break;

               case 'low_mind':
                   closingMessage = "When your mind won’t slow down, try grounding:";
                   suggestions = [
                       "🌬️ Practice 5 deep breaths: inhale for 4 counts, exhale for 4 counts.",
                       "🤲 Notice five things you can touch, three things you can hear, and one thing you can smell.",
                       "📓 Write down whatever comes to mind for 5 minutes—no judgment.",
                       "🧘‍♂️ Do a quick 2-minute guided meditation (find one on YouTube).",
                       "🚶 Take a short walk—focus on the sound of your footsteps and surroundings.",
                   ];
                   break;

               case 'low_enough':
                   closingMessage = "Feeling like you’re not doing enough? Let’s reframe:";
                   suggestions = [
                       "✍️ Write down one small task you completed today, even if it felt minor.",
                       "🎯 Set a tiny, achievable goal for the next hour—then celebrate when done.",
                       "📔 Reflect: remind yourself that progress is progress, however small.",
                       "🧘‍♀️ Take a 3-minute mindfulness break—observe thoughts without judgment.",
                       "🌿 Step outside and notice one thing in nature that feels calming.",
                   ];
                   break;

               case 'low_miss':
                   closingMessage = "Missing someone badly can weigh on you. Consider:";
                   suggestions = [
                       "📞 Send that person a quick text or voice note saying you miss them.",
                       "🎵 Play a song that reminds you of a good memory together.",
                       "✉️ Write a letter to them—even if you don’t send it, it can help you process.",
                       "📷 Look at a favorite photo of you two and smile at that moment.",
                       "🤝 Plan a small gesture: maybe send them something thoughtful tomorrow.",
                   ];
                   break;

               case 'low_misunderstood':
                   closingMessage = "Feeling misunderstood is painful. You could:";
                   suggestions = [
                       "📝 Write down exactly what you wish others understood about you.",
                       "🗣️ Talk to a friend who knows you well—share what’s on your mind for 5 minutes.",
                       "🤝 If it feels safe, have a brief conversation to clarify your feelings.",
                       "📚 Read a short article or watch a video about communication techniques.",
                       "🎧 Listen to a calming playlist and let the music soothe any frustration.",
                   ];
                   break;

               case 'low_failing':
                   closingMessage = "Feeling like you’re failing? Remember setbacks happen:";
                   suggestions = [
                       "📝 Make two columns on paper: ‘What Went Well’ and ‘What I Learned.’",
                       "🎯 Choose one tiny next step you can do in the next 10 minutes.",
                       "📔 Remind yourself: failure is a step toward growth—list one past success.",
                       "🤝 Reach out to someone who can give you encouragement—even a 5-minute chat.",
                       "🧘 Do a quick 2-minute breathing exercise focusing on releasing tension.",
                   ];
                   break;

               case 'low_anxious':
                   closingMessage = "Anxiety about the future can be overwhelming. Try:";
                   suggestions = [
                       "🌬️ Breathe deeply: inhale for 4 counts, hold for 2, exhale for 4 counts.",
                       "📓 Write down one worry—then write one action you CAN take right now.",
                       "🚶 Take a brief walk focusing on each step and your surroundings.",
                       "🧘 Use a guided meditation app for a 5-minute anxiety relief session.",
                       "📞 Talk for 3 minutes to someone you trust about how you feel.",
                   ];
                   break;

               case 'low_exhausted':
                   closingMessage = "Feeling emotionally exhausted can drain you. Consider:";
                   suggestions = [
                       "😴 If possible, take a 10–15 minute power nap to recharge.",
                       "☕ Have a small cup of tea or coffee—stay mindful of how it feels.",
                       "🧘‍♀️ Do a gentle 3-minute stretch focusing on neck and shoulders.",
                       "🚰 Drink a full glass of water to rehydrate and refresh your body.",
                       "🎵 Listen to calming music or nature sounds to soothe your mind.",
                   ];
                   break;

               case 'low_online':
                   closingMessage = "Something upset you online. Let’s shift focus:";
                   suggestions = [
                       "📵 Turn off notifications for 30 minutes and step away from the screen.",
                       "📔 Write down your reaction: What exactly about it bothered you?",
                       "🔍 Take a break: Google a fun fact or random trivia to lighten your mood.",
                       "🚶‍♂️ Walk around for 5 minutes—pay attention to your surroundings.",
                       "🎵 Play a favorite upbeat song and focus on the rhythm for a couple minutes.",
                   ];
                   break;

               case 'low_explain':
                   closingMessage = "Not sure how to explain—let’s simplify:";
                   suggestions = [
                       "✍️ Write one sentence: “Right now, I feel … because ….”",
                       "🗣️ Say that sentence out loud, even if only to yourself, to clarify your mind.",
                       "🎧 Listen to a short guided reflection or journaling prompt (1–2 minutes).",
                       "🚰 Drink a full glass of water—sometimes physical cues help mental clarity.",
                       "☁️ Close your eyes for 30 seconds and just observe any thought that comes.",
                   ];
                   break;

               default:
                   // Fallback if a new `low_*` ID appears
                   closingMessage = "I’m sorry you’re going through a tough spot. Consider:";
                   suggestions = [
                       "🙏 Try 5 minutes of deep breathing or meditation.",
                       "🚰 Drink a full glass of water and pause for a moment.",
                       "🗣️ If you can, share how you feel with a close friend or family member.",
                       "🛏️ Focus on a short rest or a quick nap if possible.",
                       "💬 Look at these basic coping tips: <https://blog.calm.com/blog/coping-strategies>",
                   ];
           }
       }
       else if (moodScale === 1) {
           // ── NEW: tailor suggestions per `bad_*` choice ──
           switch (choiceId) {
               case 'bad_numb':
                   closingMessage = "Feeling numb can be confusing. You might:";
                   suggestions = [
                       "🎵 Play a song you loved when you felt more connected to your emotions.",
                       "✍️ Write down anything—no matter how small—about what you’re thinking.",
                       "🚶 Take a 5-minute walk, paying attention to your senses (sights, sounds).",
                       "📞 Reach out to someone you trust, even if just to say you’re feeling off.",
                       "🧘 Try a quick 2-minute guided grounding exercise (search online for “grounding”).",
                   ];
                   break;

               case 'bad_panic':
                   closingMessage = "Having a panic attack is terrifying. Consider:";
                   suggestions = [
                       "🌬️ Practice 4-7-8 breathing: inhale 4, hold 7, exhale 8.",
                       "🏷️ Name 5 things you can see, 4 things you can touch, 3 things you can hear, 2 things you can smell, 1 thing you can taste.",
                       "💧 Splash cold water on your face to help reset your nervous system.",
                       "📝 If you can, write down what triggered the panic—sometimes labeling it helps.",
                       "🤝 If you’re able, call/text a friend or hotline: “I’m having a panic attack.”",
                   ];
                   break;

               case 'bad_hurt':
                   closingMessage = "Someone hurt your feelings. Here are a few steps:";
                   suggestions = [
                       "✍️ Journal for 3 minutes about what happened—no edits, just flow.",
                       "🤝 If it feels safe, have a calm conversation or send a message expressing your perspective.",
                       "📝 Write down three qualities you like about yourself, reminding you you matter.",
                       "📚 Read a short self-compassion article or watch a 2-minute clip on forgiveness.",
                       "🎵 Listen to a comforting song or playlist that makes you feel understood.",
                   ];
                   break;

               case 'bad_burden':
                   closingMessage = "Feeling like a burden is painful. Try these ideas:";
                   suggestions = [
                       "📝 Write down one way you’ve positively impacted someone recently—big or small.",
                       "🤝 Reach out to someone you trust and share, “I feel like a burden right now.”",
                       "📓 Write a short list of things you appreciate about yourself and your abilities.",
                       "🎧 Listen to an uplifting talk on self-worth or self-esteem (search online).",
                       "🧘 Take a brief 2-minute breathing break focusing on the sensation of your breath.",
                   ];
                   break;

               case 'bad_stuck':
                   closingMessage = "Feeling stuck in your head can be overwhelming. You could:";
                   suggestions = [
                       "🚶 Take a short walk focusing on each step rather than your thoughts.",
                       "📝 Write down what you’re stuck on—and then jot one small step forward.",
                       "🔊 Play calming nature sounds or white noise to break the loop.",
                       "🤝 Call a friend for a 2-minute chat, admitting “I feel stuck right now.”",
                       "✍️ Write one sentence starting “Right now I feel stuck because …” and read it back.",
                   ];
                   break;

               case 'bad_disappointed':
                   closingMessage = "Feeling disappointed in yourself can cut deep. Consider:";
                   suggestions = [
                       "📝 List one thing you did achieve this week—no matter how minor.",
                       "🤝 Share with someone: “I feel disappointed because …,” and let them listen.",
                       "🎯 Set a tiny, specific goal you know you can accomplish in the next hour.",
                       "🧘 Practice a 2-minute loving-kindness meditation: “May I be gentle with myself.”",
                       "🎵 Listen to a song that reminds you you’re not alone in imperfection.",
                   ];
                   break;

               case 'bad_rough':
                   closingMessage = "You had a rough day at school/work. Let’s reset:";
                   suggestions = [
                       "📝 Write 3 sentences describing what went wrong—get it out of your head.",
                       "🎵 Put on an upbeat song and do a simple movement (tap foot, sway).",
                       "🚶 Take a 5-minute walk away from your workspace or room.",
                       "🤝 If you trust someone there, say: “I had a rough day; I need 2 minutes.”",
                       "🍵 Make a warm drink (tea, coffee) and sip it mindfully for a minute.",
                   ];
                   break;

               case 'bad_thoughts':
                   closingMessage = "When your thoughts feel too loud, try this:";
                   suggestions = [
                       "📓 Write down whatever thought is repeating—just get it on paper.",
                       "🎶 Put on noise-cancelling headphones or calming music for 2 minutes.",
                       "🧘‍♀️ Close your eyes and focus on one word (like “peace”) for 30 seconds.",
                       "🚶 Walk around and count your steps up to 50, focusing only on each step.",
                       "🤝 If possible, talk to someone: “My thoughts feel really loud right now.”",
                   ];
                   break;

               case 'bad_overthinking':
                   closingMessage = "Overthinking can trap you. Consider:";
                   suggestions = [
                       "⌛ Set a 5-minute timer: journal everything on your mind until it stops.",
                       "✍️ Write two columns: “What I Can Control” vs. “What I Can’t Control.”",
                       "📵 Put your phone on Do Not Disturb and close your eyes for 1 minute.",
                       "🌬️ Take 5 deep belly breaths, counting each inhale/exhale slowly.",
                       "🎧 Listen to a guided “thought-stopping” exercise (search online).",
                   ];
                   break;

               case 'bad_look':
                   closingMessage = "Hating how you look can hurt self-esteem. Try:";
                   suggestions = [
                       "📝 Write down three things you like about your appearance (hair, smile, etc.).",
                       "📷 Find one photo where you felt confident—look at it for 30 seconds.",
                       "🤝 Compliment yourself out loud: “I appreciate my [feature] because ….”",
                       "🎨 Experiment with a small style change (hair, clothes) to boost confidence.",
                       "📚 Read one short piece on body positivity—remind yourself it’s a journey.",
                   ];
                   break;

               case 'bad_heavy':
                   closingMessage = "Everything feels heavy. You might consider:";
                   suggestions = [
                       "🚶 Go for a slow 5-minute walk focusing on your breath and steps.",
                       "📝 Write down the heaviest thought; then write one thing you can do in the next 5 minutes.",
                       "☕ Make a warm drink; hold the mug and notice the warmth in your hands.",
                       "🤝 Share with someone: “I feel like everything’s heavy—can we talk for 2 min?”",
                       "🧘 Do a 1-minute grounding exercise: name 5 things you can see right now.",
                   ];
                   break;

               default:
                   // Fallback if a new `bad_*` ID appears
                   closingMessage = "I hear you. It can help to reach out. Maybe try:";
                   suggestions = [
                       "📞 Call a mental health hotline or a trusted family member.",
                       "🧸 Take 5 deep breaths: inhale for 4 counts, exhale for 4 counts.",
                       "📓 Jot down one hope you have for tomorrow—even if it’s small.",
                       "💻 Watch a short guided relaxation video: <https://www.youtube.com/watch?v=ztTexqGQ0VI>",
                       "💬 Here’s a list of local resources: <https://www.who.int/news-room/feature-stories/mental-well-being-resources-for-the-public>",
                   ];
           }
       }
       else if (moodScale === 0) {
             closingMessage = "I’m really sorry you feel this way. You’re not alone. Consider:";
             suggestions = [
                   "📞 If you ever think you might harm yourself, call emergency services immediately.",
                   "☎️ National suicide hotline: 15-315 (MKD), or find other helplines in Macedonia: <https://www.therapyroute.com/article/suicide-hotlines-and-crisis-lines-in-macedonia>",
                   "🧘‍♂️ Try a 2-minute grounding exercise: stare at one object, list five qualities of it.",
                   "🤝 Reach out to a trusted person and say, “I need help right now.”",
                   "📝 Write one sentence about why you matter, then keep it somewhere visible.",
                 ];
           }

      // (c) Record the SYSTEM closing message in the chat transcript
          await prisma.chatMessage.create({
                data: {
              sessionId,
                  sender: 'SYSTEM',
                  content: closingMessage,
                  questionId: null, // this is a generic message, not tied to a question
                },
      });

      // (d) Return JSON with nextQuestion: null, closingMessage, suggestions
          return res.json({
            nextQuestion: null,
            closingMessage,
            suggestions,
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

const staticDir = path.resolve("dist");
app.use(express.static(staticDir));
app.get(/.*/, (_, res) => res.sendFile(path.join(staticDir, "index.html")));


export default serverless(app);