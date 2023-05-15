import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import "./Join.css";
import { RouteComponentProps } from "@reach/router";
import { socket } from "../../client-socket";


type JoinProps = RouteComponentProps & {setChwazi: any, setLobby: any, uid: any}
const Join = (props: JoinProps) => {
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleChange = (code) => {
        if (code.length > 6) {
          code = code.substring(0, 6);
        }
        setCode(code);
    }

    const handleCreate = () => {
        console.log('creating chwazi, should console log on the other side')
        socket.emit('create', {uid: props.uid})
        socket.on('create-result', (res) => {
            console.log("resulting chwazi id is", res.chwazi, res.lobby)
            props.setChwazi(res.chwazi)
            props.setLobby(res.lobby)
            setError('')
            navigate("/lobby");
        })
    }

    const handleJoin = () => {
        console.log('joining chwazi, should console log on the other side')
        socket.emit('join', {uid: props.uid, cid: code})
        socket.on('join-result', (res) => {
            console.log('successfully joined chwazi', code, res.success)
            props.setChwazi(code);
            props.setLobby(res.lobby)
            setError('');
            navigate("/lobby");
        })
    }

    return (
        <div className="Join-body">
            <input
                className="Join-input"
                placeholder="enter chwazi code"
                value={code}
                onChange={(event) => {handleChange(event.target.value)}}
            />
            <div className="Join-button" onClick={handleJoin}> J O I N </div>
            <div className="Join-button" onClick={handleCreate}> C R E A T E </div>        
            <div className="Join-error"> {error} </div>
        </div>

    );
}

export default Join;