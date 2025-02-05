import { useEffect, useState } from "react";

const ChannelUsers = ({ channelId, usersUpdated, setUsersUpdated }) => {
  const [users, setUsers] = useState([]);
  const [isVisible, setIsVisible] = useState(false);

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

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  return (
    <div className="channel-users-div">
      <div className="flex-end">
        <button className="btn btn-primary btn-sm mt-2 mb-2 users-btn" onClick={toggleVisibility}>
          {isVisible ? "Hide Users" : "Show Users"}
        </button>
      </div>
      {isVisible && (
        <div className="card ">
        <ul className="list-group list-group-flush mx-auto justify-content-center">
          {users.map((user) => (
            <li key={user.id} className="list-group-item border-0 m-0 py-1 px-2">
              {user.username}
            </li>
          ))}
        </ul>
        </div>
      )}
    </div>
  );
};

export default ChannelUsers;
