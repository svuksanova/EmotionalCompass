// ── src/pages/ChatPage.tsx ──
import { useState, useEffect, useRef, useCallback } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import "../css/Chat.css";
import { logout } from "../lib/auth"; // make sure this points to your helper

interface Choice   { id: string; label: string }
interface Question { id: string; prompt: string; choices: Choice[] }
interface Message  { from: "user" | "bot"; text: string }

const API = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export default function ChatPage() {
    // ── 1) Route-guard: if no token, redirect to /login ──
    const token = localStorage.getItem("token");
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    // ── 2) Local state ──
    const [sessionId, setSessionId]     = useState<string | null>(null);
    const [currentQ, setCurrentQ]       = useState<Question | null>(null);
    const [chat, setChat]               = useState<Message[]>([]);
    const [firstName, setFirstName]     = useState<string>(""); // ← store real first name
    const [closingMessage, setClosingMessage] = useState<string | null>(null);
    const [suggestions, setSuggestions]     = useState<string[]>([]);
    const chatEndRef = useRef<HTMLDivElement | null>(null);
    const nav = useNavigate();

    // Always send the latest token in our headers:
    const authHeaders = {
        "Content-Type": "application/json",
        Authorization : `Bearer ${token}`,
    };

    // ── 3) Fetch “who am I?” on mount ──
    useEffect(() => {
        async function fetchMe() {
            try {
                const res = await fetch(`${API}/api/auth/me`, {
                    method:  "GET",
                    headers: authHeaders,
                });
                if (!res.ok) {
                    throw new Error("Failed to fetch user profile");
                }
                const data = (await res.json()) as { firstName: string };
                setFirstName(data.firstName); // now we know their name
            } catch (err) {
                console.error("Could not load /api/auth/me:", err);
                // If you want to force-logout on 401, you could do:
                // localStorage.removeItem("token");
                // nav("/login", { replace: true });
            }
        }
        fetchMe();
    }, []); // run once on mount

    // ── 4) “Start chat” helper ──
    const startChat = useCallback(async () => {
        try {
            const r = await fetch(`${API}/api/chat/start`, {
                method:  "POST",
                headers: authHeaders,
            });
            if (!r.ok) throw new Error(await r.text());

            const { sessionId, question } = (await r.json()) as {
                sessionId: string;
                question:   Question;
            };
            setSessionId(sessionId);
            setCurrentQ(question);
            setChat([{ from: "bot", text: question.prompt }]);
        } catch (err) {
            console.error(err);
            setChat([{ from: "bot", text: "Could not start the chat. 🛑" }]);
        }
    }, []); // no dependencies other than authHeaders/string constants

    const sendChoice = async (choice: Choice) => {
        if (!sessionId) return;

        // 1) Immediately show the user’s selection
        setChat((c) => [...c, { from: "user", text: choice.label }]);

        try {
            const r = await fetch(`${API}/api/chat/${sessionId}/answer`, {
                method:  "POST",
                headers: authHeaders,
                body:    JSON.stringify({ choiceId: choice.id }),
            });
            if (!r.ok) throw new Error(await r.text());

            // 2) The server returns either nextQuestion or (closingMessage  suggestions).
            const data = await r.json() as {
                nextQuestion: Question | null;
                closingMessage?: string;
                suggestions?: string[];
            };

            if (data.nextQuestion) {
                // Still mid‐conversation: push the next prompt and update state
                setChat((c) => [...c, { from: "bot", text: data.nextQuestion!.prompt }]);
                setCurrentQ(data.nextQuestion);
            } else {
                // Leaf node: show one closingMessage  each suggestion as a bot message
                const msg = data.closingMessage || "Thank you for sharing!";
                const tips = data.suggestions || [];
                        setChat((c) => {
                              // Combine them all into one update so "msg" only appears once.
                                  const updated = [
                                    ...c,
                                    { from: "bot", text: msg },
                                    // Now append each tip in order:
                                        ...tips.map((tip) => ({ from: "bot", text: tip })),
                                  ];
                              return updated;
                            });
                        setCurrentQ(null);
            }
        } catch (err) {
            console.error(err);
            setChat((c) => [...c, { from: "bot", text: "Oops, try again?" }]);
        }
    };

    // ── 6) Kick off the conversation when component mounts ──
    useEffect(() => {
        startChat();
    }, [startChat]);

    // ── 7) Auto-scroll when new chat arrives ──
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chat]);

    // ── 8) Render UI ──
    //    • Show the fetched firstName in the navbar
    //    • Render the “Log out” link as a plain <button> styled like text
    return (
        <div className="chat-wrapper">
            {/* ─────────────── Navbar ─────────────── */}
            <div className="navbar">
                <div className="navbar-left">Emotional Compass</div>
                <div className="user-bar">
                    {/* Show actual firstName (or fallback "User") */}
                    <span>Welcome {firstName || "User"}!</span>
                    {/* Log out as a plain link (we’ll add CSS to make it look like one) */}
                    <button
                        className="logout-link"
                        onClick={() => logout(nav)}
                    >
                        Log out
                    </button>
                </div>
            </div>

            {/* ─────────── Animated background ─────────── */}
            <svg
                className="animated-bg"
                width="100%"
                height="100%"
                preserveAspectRatio="none"
            >
                <circle cx="20%" cy="30%" r="60" fill="#a8d0f0">
                    <animate
                        attributeName="r"
                        values="60;80;60"
                        dur="6s"
                        repeatCount="indefinite"
                    />
                    <animate
                        attributeName="cx"
                        values="20%;25%;20%"
                        dur="8s"
                        repeatCount="indefinite"
                    />
                </circle>
                <circle cx="70%" cy="50%" r="40" fill="#d0f0ff">
                    <animate
                        attributeName="r"
                        values="40;55;40"
                        dur="7s"
                        repeatCount="indefinite"
                    />
                    <animate
                        attributeName="cy"
                        values="50%;55%;50%"
                        dur="10s"
                        repeatCount="indefinite"
                    />
                </circle>
                <circle cx="40%" cy="70%" r="30" fill="#b0e0f0">
                    <animate
                        attributeName="r"
                        values="30;45;30"
                        dur="5s"
                        repeatCount="indefinite"
                    />
                    <animate
                        attributeName="cx"
                        values="40%;45%;40%"
                        dur="6s"
                        repeatCount="indefinite"
                    />
                </circle>
                <circle cx="85%" cy="20%" r="25" fill="#cceeff">
                    <animate
                        attributeName="r"
                        values="25;35;25"
                        dur="6s"
                        repeatCount="indefinite"
                    />
                    <animate
                        attributeName="cy"
                        values="20%;25%;20%"
                        dur="9s"
                        repeatCount="indefinite"
                    />
                </circle>
                <circle cx="10%" cy="80%" r="35" fill="#bae8ff">
                    <animate
                        attributeName="r"
                        values="35;50;35"
                        dur="8s"
                        repeatCount="indefinite"
                    />
                    <animate
                        attributeName="cx"
                        values="10%;15%;10%"
                        dur="7s"
                        repeatCount="indefinite"
                    />
                </circle>
                <circle cx="50%" cy="15%" r="20" fill="#e0f7ff">
                    <animate
                        attributeName="r"
                        values="20;30;20"
                        dur="6s"
                        repeatCount="indefinite"
                    />
                    <animate
                        attributeName="cy"
                        values="15%;18%;15%"
                        dur="8s"
                        repeatCount="indefinite"
                    />
                </circle>
                <circle cx="60%" cy="85%" r="45" fill="#d4f1ff">
                    <animate
                        attributeName="r"
                        values="45;60;45"
                        dur="10s"
                        repeatCount="indefinite"
                    />
                    <animate
                        attributeName="cx"
                        values="60%;65%;60%"
                        dur="9s"
                        repeatCount="indefinite"
                    />
                </circle>
            </svg>

            {/* ─────────── Chat box ─────────── */}
            <div className="chat-box">
                {chat.map((m, i) => (
                    <div key={i} className={`chat-message ${m.from}`}>
                        {m.text}
                    </div>
                ))}
                <div ref={chatEndRef} />
            </div>

            {/* ───────── Choice buttons ───────── */}
            {currentQ && (
                <div className="popup-form">
                    <div className="popup-title">Choose a reply:</div>
                    {currentQ.choices.map((c) => (
                        <button key={c.id} onClick={() => sendChoice(c)}>
                            {c.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}