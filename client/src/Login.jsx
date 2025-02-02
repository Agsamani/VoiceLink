import { useState } from 'react';
import PropTypes from 'prop-types';

const Login = ({ setUsername }) => {
    const [input, setInput] = useState("");

    const handleLogin = async () => {
        if (!input.trim()) return alert("Enter a username");

        try {
            const response = await fetch("http://localhost:3000/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: input.trim() }),
            });

            const data = await response.json(); // Ensure response is parsed

            if (response.ok && data.success) {
                setUsername(input.trim());
            } else {
                alert(data.error || "Login failed");
            }
        } catch (error) {
            console.error("Login error:", error);
        }
    };

    return (
        <div>
            <h2>Enter your username</h2>
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
            />
            <button onClick={handleLogin}>Join</button>
        </div>
    );
};

Login.propTypes = {
    setUsername: PropTypes.func.isRequired
};

export default Login;
