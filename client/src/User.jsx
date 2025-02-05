import React, { useState } from 'react'

const User = ({userid, username, onMuteUser, volume}) => {

  const [muted, setMuted] = useState(false);
  const selfid = localStorage.getItem("userid");
  return (
    <div className={"user-boxes channel-header align-items-center border rounded border-0 width-100"} >
      <div className="user-info">
        <div>
          <svg className={(volume > 7.0 ? "is-talking" : "")} xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="currentColor" class="bi bi-person-circle" viewBox="0 0 16 16">
            <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0"/>
            <path fill-rule="evenodd" d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8m8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1"/>
          </svg>
        </div>
        <span className="fw-bold text-primary user-channel">{username}</span>
      </div>
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