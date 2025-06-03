import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../css/Index.css";

type WordItem = {
    id: string;
    text: string;
    top: string;
    left: string;
};

const words = [
    "Hope", "Healing", "Mindfulness", "Resilience", "Calm",
    "Anxiety", "Support", "Growth", "Balance", "Awareness"
];

const IndexPage = () => {
    const [floatingWords, setFloatingWords] = useState<WordItem[]>([]);
    const navigate = useNavigate();
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const addWord = () => {
        const text = words[Math.floor(Math.random() * words.length)];
        const id = Math.random().toString(36).substr(2, 9);
        const top = `${Math.random() * 80 + 10}%`;
        const left = `${Math.random() * 80 + 10}%`;

        const newWord: WordItem = { id, text, top, left };
        setFloatingWords(prev => [...prev, newWord]);

        setTimeout(() => {
            setFloatingWords(prev => prev.filter(w => w.id !== id));
        }, 6500);
    };

    useEffect(() => {
        // Preload 3 words instantly
        for (let i = 0; i < 3; i++) {
            addWord();
        }

        intervalRef.current = setInterval(addWord, 1200);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    const handleStart = () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        navigate("/chat");
    };

    return (
        <div className="index-container">

            <div className="navbar">
                <div className="navbar-left">
                    Emotional Compass
                </div>
            </div>

            <svg className="animated-bg" width="100%" height="100%" preserveAspectRatio="none">
                <circle cx="20%" cy="30%" r="60" fill="#a8d0f0">
                    <animate attributeName="r" values="60;80;60" dur="6s" repeatCount="indefinite" begin="0s"/>
                    <animate attributeName="cx" values="20%;25%;20%" dur="8s" repeatCount="indefinite" begin="0s"/>
                </circle>
                <circle cx="70%" cy="50%" r="40" fill="#d0f0ff">
                    <animate attributeName="r" values="40;55;40" dur="7s" repeatCount="indefinite" begin="0s"/>
                    <animate attributeName="cy" values="50%;55%;50%" dur="10s" repeatCount="indefinite" begin="0s"/>
                </circle>
                <circle cx="40%" cy="70%" r="30" fill="#b0e0f0">
                    <animate attributeName="r" values="30;45;30" dur="5s" repeatCount="indefinite" begin="0s"/>
                    <animate attributeName="cx" values="40%;45%;40%" dur="6s" repeatCount="indefinite" begin="0s"/>
                </circle>
                <circle cx="85%" cy="20%" r="25" fill="#cceeff">
                    <animate attributeName="r" values="25;35;25" dur="6s" repeatCount="indefinite" begin="0s"/>
                    <animate attributeName="cy" values="20%;25%;20%" dur="9s" repeatCount="indefinite" begin="0s"/>
                </circle>
                <circle cx="10%" cy="80%" r="35" fill="#bae8ff">
                    <animate attributeName="r" values="35;50;35" dur="8s" repeatCount="indefinite" begin="0s"/>
                    <animate attributeName="cx" values="10%;15%;10%" dur="7s" repeatCount="indefinite" begin="0s"/>
                </circle>
                <circle cx="50%" cy="15%" r="20" fill="#e0f7ff">
                    <animate attributeName="r" values="20;30;20" dur="6s" repeatCount="indefinite" begin="0s"/>
                    <animate attributeName="cy" values="15%;18%;15%" dur="8s" repeatCount="indefinite" begin="0s"/>
                </circle>
                <circle cx="60%" cy="85%" r="45" fill="#d4f1ff">
                    <animate attributeName="r" values="45;60;45" dur="10s" repeatCount="indefinite" begin="0s"/>
                    <animate attributeName="cx" values="60%;65%;60%" dur="9s" repeatCount="indefinite" begin="0s"/>
                </circle>
            </svg>

            {floatingWords.map(({id, text, top, left}) => (
                <span
                    key={id}
                    className="floating-word"
                    style={{top, left}}
                >
                    {text}
                </span>
            ))}

            <button className="start-button" onClick={handleStart}>
                Start
            </button>
        </div>
    );
};

export default IndexPage;
