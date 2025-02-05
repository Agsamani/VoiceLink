import React, { useState } from 'react'

const User = ({userid, username, onMuteUser, volume}) => {

  const [muted, setMuted] = useState(false);
  const selfid = localStorage.getItem("userid");
  return (
    <div className={"user-boxes d-flex w-100 align-items-center justify-content-between border p-2 rounded bg-light " + (volume > 7.0 ? "is-talking" : "")} >
      <span className="fw-bold text-primary">{username}</span>
      
      {selfid != userid && (
        <button className="btn btn-warning btn-sm ms-2" onClick={() => {
          onMuteUser(userid);
          setMuted(!muted);
        }}>
          {!muted ? "mute" : "unmute"}
        </button>
      )}

    </div>

  )
}

export default User