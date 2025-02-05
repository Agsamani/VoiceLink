import React from 'react'

const User = ({userid, username, onMuteUser}) => {
    const selfid = localStorage.getItem("userid");
  return (
    <div>
        <span>{username}</span>
        {selfid != userid && <button onClick={() => {onMuteUser(userid)}}>mute</button>}
    </div>
  )
}

export default User