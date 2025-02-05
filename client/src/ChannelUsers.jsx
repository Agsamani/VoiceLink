import { useEffect, useState } from "react";

const ChannelUsers = ({ channelId, usersUpdated, setUsersUpdated }) => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_SERVER_ADDRESS}/channels/${channelId}/users`);
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
    <div className="card mt-3">
      <div className="card-header bg-secondary text-white">
        <h6 className="mb-0">Users in Channel {channelId}</h6>
      </div>
      <div className="card-body">
        <ul className="list-group">
          {users.map(user => (
            <li key={user.id} className="list-group-item">
              {user.username}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ChannelUsers;
