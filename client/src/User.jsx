import React from 'react'

const User = ({userid, username, onMuteUser, volume}) => {
    const selfid = localStorage.getItem("userid");
    console.log(volume)
  return (
    <div className="d-flex align-items-center justify-content-between border p-2 rounded bg-light">
      <span className="fw-bold text-primary">{username}</span>
      
      {selfid !== userid && (
        <button className="btn btn-warning btn-sm ms-2" onClick={() => onMuteUser(userid)}>
          Mute
        </button>
      )}

      {volume > 1.0 && <span className="badge bg-danger ms-2">Loud</span>}    </div>

  )
}

export default User