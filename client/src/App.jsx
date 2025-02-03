import { useState } from 'react';
import VoiceChat from './VoiceChat';
import Login from './Login';
import Channels from './Channels';

function App() {
  const [username, setUsername] = useState(null);

  return (
    <div className="App">
      {username ? (
        <Channels/>//<VoiceChat username={username} setUsername={setUsername} />
      ) : (
        <Login setUsername={setUsername} />
      )}
    </div>
  );
}

export default App;