import { Routes, Route } from "react-router-dom";
import Login from "./Login";
import Home from "./Home";
import Channel from "./Channel";

function App() {
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
