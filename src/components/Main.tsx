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

    useEffect(() => {
        // Add the first word immediately
        const addWord = () => {
            const text = words[Math.floor(Math.random() * words.length)];
            const id = Math.random().toString(36).substr(2, 9);
            const top = `${Math.random() * 80 + 10}%`;
            const left = `${Math.random() * 80 + 10}%`;

            const newWord: WordItem = { id, text, top, left };
            setFloatingWords(prev => [...prev, newWord]);

            // Remove it after animation duration
            setTimeout(() => {
                setFloatingWords(prev => prev.filter(w => w.id !== id));
            }, 6500);
        };

        // Start with one word immediately
        addWord();

        // Then continue at intervals
        intervalRef.current = setInterval(() => {
            addWord();
        }, 1200);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);


    const handleStart = () => {
        if (intervalRef.current) clearInterval(intervalRef.current); // stop loop
        navigate("/chat");
    };

    return (
        <div className="index-container">
            {floatingWords.map(({ id, text, top, left }) => (
                <span
                    key={id}
                    className="floating-word"
                    style={{
                        top,
                        left,
                        animation: `fadeInOut 6s ease-in-out forwards`
                    }}
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
