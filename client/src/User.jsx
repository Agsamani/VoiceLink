import React from 'react'

const User = ({userid, username, onMuteUser, volume}) => {
    const selfid = localStorage.getItem("userid");
    console.log(volume)
  return (
    <div>
        <span>{username}</span>
        {selfid != userid && <button onClick={() => {onMuteUser(userid)}}>mute</button>}
        {volume > 1.0 && <p>loud</p>}
    </div>
  )
}

export default User