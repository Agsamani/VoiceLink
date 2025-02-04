import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [name, setName] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) return alert("Enter a username");


    try {
        const response = await fetch("http://localhost:3000/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: name.trim() }),
        });

        const data = await response.json();
        if (response.ok) {
            localStorage.setItem("username", data.username);
            localStorage.setItem("userid", data.user_id);
            navigate("/home");
        } else {
            alert(data.error || "Login failed");
            navigate("/");
        }
    } catch (error) {
        console.error("Login error:", error);
        navigate("/");
    }

  };

  return (
    <div>
      <h2>Enter Your Name</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your Name"
          required
        />
        <button type="submit">Join</button>
      </form>
    </div>
  );
};

export default Login;
