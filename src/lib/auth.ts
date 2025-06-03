const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export async function logout(navigate?: (path: string, opts?: any) => void) {
    const token = localStorage.getItem("token");
    if (token) {
        await fetch(`${API}/api/auth/logout`, {
            method : "POST",
            headers: { Authorization: `Bearer ${token}` },
        }).catch(() => {});
    }
    localStorage.removeItem("token");

    if (navigate) {
        navigate("/login", { replace: true });
    } else {
        window.location.href = "/login";
    }
}
