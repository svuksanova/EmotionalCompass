import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/Login.css";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export default function AuthForm() {
    const [isRegistering, setIsRegistering] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [form, setForm] = useState({
        firstName: "", lastName: "", email: "", password: "", confirm: "",
    });

    const nav = useNavigate();

    const toggleMode = () => {
        setIsRegistering(!isRegistering);
        setError("");
    };

    const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            if (isRegistering && form.password !== form.confirm) {
                throw new Error("Passwords do not match");
            }

            const url = isRegistering ? "/api/auth/register" : "/api/auth/login";
            const body = isRegistering
                ? {
                    firstName: form.firstName.trim(),
                    lastName: form.lastName.trim(),
                    email: form.email.trim(),
                    password: form.password,
                }
                : {
                    email: form.email.trim(),
                    password: form.password,
                };

            const res = await fetch(`${API}${url}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                const { error = res.statusText } = await res.json().catch(() => ({}));
                throw new Error(error);
            }

            const { token } = await res.json();
            localStorage.setItem("token", token);
            nav("/", { replace: true });
        } catch (err) {
            setError(err.message ?? "Something went wrong");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="auth-page">
            <svg className="animated-bg" width="100%" height="100%" preserveAspectRatio="none">
                <circle cx="20%" cy="30%" r="60" fill="#a8d0f0">
                    <animate attributeName="r" values="60;80;60" dur="6s" repeatCount="indefinite" />
                    <animate attributeName="cx" values="20%;25%;20%" dur="8s" repeatCount="indefinite" />
                </circle>
                <circle cx="70%" cy="50%" r="40" fill="#d0f0ff">
                    <animate attributeName="r" values="40;55;40" dur="7s" repeatCount="indefinite" />
                    <animate attributeName="cy" values="50%;55%;50%" dur="10s" repeatCount="indefinite" />
                </circle>
                <circle cx="40%" cy="70%" r="30" fill="#b0e0f0">
                    <animate attributeName="r" values="30;45;30" dur="5s" repeatCount="indefinite" />
                    <animate attributeName="cx" values="40%;45%;40%" dur="6s" repeatCount="indefinite" />
                </circle>
                <circle cx="85%" cy="20%" r="25" fill="#cceeff">
                    <animate attributeName="r" values="25;35;25" dur="6s" repeatCount="indefinite" />
                    <animate attributeName="cy" values="20%;25%;20%" dur="9s" repeatCount="indefinite" />
                </circle>
                <circle cx="10%" cy="80%" r="35" fill="#bae8ff">
                    <animate attributeName="r" values="35;50;35" dur="8s" repeatCount="indefinite" />
                    <animate attributeName="cx" values="10%;15%;10%" dur="7s" repeatCount="indefinite" />
                </circle>
                <circle cx="50%" cy="15%" r="20" fill="#e0f7ff">
                    <animate attributeName="r" values="20;30;20" dur="6s" repeatCount="indefinite" />
                    <animate attributeName="cy" values="15%;18%;15%" dur="8s" repeatCount="indefinite" />
                </circle>
                <circle cx="60%" cy="85%" r="45" fill="#d4f1ff">
                    <animate attributeName="r" values="45;60;45" dur="10s" repeatCount="indefinite" />
                    <animate attributeName="cx" values="60%;65%;60%" dur="9s" repeatCount="indefinite" />
                </circle>
            </svg>

            <div className="auth-container">
                <form className="auth-form" onSubmit={handleSubmit}>
                    <h2>{isRegistering ? "Register" : "Login"}</h2>

                    {isRegistering && (
                        <>
                            <input
                                placeholder="First Name"
                                value={form.firstName}
                                onChange={set("firstName")}
                                required
                            />
                            <input
                                placeholder="Last Name"
                                value={form.lastName}
                                onChange={set("lastName")}
                                required
                            />
                        </>
                    )}

                    <input
                        type="email"
                        placeholder="Email"
                        value={form.email}
                        onChange={set("email")}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={form.password}
                        onChange={set("password")}
                        required
                    />

                    {isRegistering && (
                        <input
                            type="password"
                            placeholder="Confirm Password"
                            value={form.confirm}
                            onChange={set("confirm")}
                            required
                        />
                    )}

                    <button type="submit" disabled={loading}>
                        {loading ? "Please wait…" : isRegistering ? "Register" : "Login"}
                    </button>

                    {error && <p className="error">{error}</p>}
                </form>

                <div className="auth-footer">
                    {isRegistering ? (
                        <>
                            Already have an account? <a onClick={toggleMode}>Login</a>
                        </>
                    ) : (
                        <>
                            Don’t have an account? <a onClick={toggleMode}>Register</a>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
