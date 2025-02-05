import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

const Login = () => {
  const [name, setName] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) return alert("Enter a username");

    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER_ADDRESS}/login`, {
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
    <div className="container d-flex justify-content-center align-items-center vh-100">
      <div className="card p-4 shadow-lg" style={{ width: "350px" }}>
        <h2 className="text-center mb-3">Enter Your Name</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <input
              type="text"
              className="form-control"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your Name"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary w-100">
            Join
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
