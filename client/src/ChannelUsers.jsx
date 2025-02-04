import { useEffect, useState } from "react";

const ChannelUsers = ({ channelId, usersUpdated, setUsersUpdated }) => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch(`http://localhost:3000/channels/${channelId}/users`);
        if (!response.ok) {
          throw new Error("Failed to fetch users");
        }
        const data = await response.json();

        setUsers(data);
      } catch (err) {
        console.error(err.message);
      } 
    };
    
    fetchUsers();

    setUsersUpdated(false);
  }, [usersUpdated]);

  if (users.length === 0) return <p>No users in this channel.</p>;

  return (
    <div>
      <h3>Users in Channel {channelId}</h3>
      <ul>
        {users.map(user => (
          <li key={user.id}>{user.username}</li>
        ))}
      </ul>
    </div>
  );
};

export default ChannelUsers;
