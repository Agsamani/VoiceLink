import { Routes, Route } from "react-router-dom";
import Login from "./Login";
import Home from "./Home";

function App() {
  console.log(import.meta.env.VITE_SERVER_ADDRESS)
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/home" element={<Home />} />
      </Routes>
    </div>
  );
}

export default App;
