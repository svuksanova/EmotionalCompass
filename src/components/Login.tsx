// File: components/AuthForm.jsx
import { useState } from "react";
import "../css/Login.css";

export default function AuthForm() {
    const [isRegistering, setIsRegistering] = useState(false);
    const [darkMode, setDarkMode] = useState(false);

    const toggleMode = () => setIsRegistering(!isRegistering);
    const toggleTheme = () => setDarkMode(!darkMode);

    return (
        <div className={`auth-container ${darkMode ? "dark" : "light"}`}>
            <div className="form-toggle">

                <button className="theme-toggle" onClick={toggleTheme}>
                    🌓
                </button>
            </div>
            <form className="auth-form">
                <h2>{isRegistering ? "Register" : "Login"}</h2>

                {isRegistering && (
                    <>
                        <input type="text" placeholder="First Name" required />
                        <input type="text" placeholder="Last Name" required />
                    </>
                )}

                <input type="email" placeholder="Email" required />
                <input type="password" placeholder="Password" required />

                {isRegistering && (
                    <input type="password" placeholder="Confirm Password" required />
                )}

                <button type="submit">{isRegistering ? "Register" : "Login"}</button>
            </form>

            <div className="auth-footer">
                {isRegistering ? (
                    <>Already have an account?<a onClick={toggleMode}> Login</a></>
                ) : (
                    <>Don't have an account?<a onClick={toggleMode}> Register</a></>
                )}
            </div>
        </div>
    );
}
