import { useState } from 'react';
import VoiceChat from './VoiceChat';
import Login from './Login';

function App() {
  const [username, setUsername] = useState(null);

  return (
    <div className="App">
      {username ? (
        <VoiceChat username={username} setUsername={setUsername} />
      ) : (
        <Login setUsername={setUsername} />
      )}
    </div>
  );
}

export default App;