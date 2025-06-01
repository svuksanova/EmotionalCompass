import { useState, useEffect, useRef } from "react";
import "../css/Chat.css";

const conversationFlow = [
    {
        bot: "Hi there! Welcome to the game.",
        choices: ["Hey!", "How are you?"]
    },
    {
        bot: "Glad you're here! Ready to begin?",
        choices: ["Yes!", "Wait, what is this?"]
    },
    {
        bot: "This is an interactive experience. Let's continue.",
        choices: ["Cool", "Okay"]
    }
];

const ChatPage = () => {
    const [step, setStep] = useState(0);
    const [chat, setChat] = useState<{ from: string; text: string }[]>([]);
    const [showForm, setShowForm] = useState(true);
    const chatEndRef = useRef<HTMLDivElement | null>(null);

    const handleChoice = (choice: string) => {
        setChat(prev => [
            ...prev,
            { from: "user", text: choice },
            { from: "bot", text: conversationFlow[step + 1]?.bot ?? "Thanks for playing!" }
        ]);
        setShowForm(false);
        setTimeout(() => {
            setStep(prev => prev + 1);
            setShowForm(true);
        }, 600);
    };

    useEffect(() => {
        if (step === 0) {
            setChat([{ from: "bot", text: conversationFlow[0].bot }]);
        }
    }, []);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chat]);

    const current = conversationFlow[step];

    return (
        <div className="chat-wrapper">
            <div className="chat-box">
                {chat.map((msg, i) => (
                    <div key={i} className={`chat-message ${msg.from}`}>
                        {msg.text}
                    </div>
                ))}
                <div ref={chatEndRef} />
            </div>

            {showForm && current?.choices && (
                <div className="popup-form">
                    <div className="popup-title">Choose a reply: </div>

                    {current.choices.map((choice, i) => (
                        <button key={i} onClick={() => handleChoice(choice)}>
                            {choice}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ChatPage;
