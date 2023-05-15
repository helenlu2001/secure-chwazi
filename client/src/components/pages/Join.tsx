import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import "./Join.css";
import { RouteComponentProps } from "@reach/router";

type JoinProps = RouteComponentProps & {setChwazi: any}
const Join = (props: JoinProps) => {
    const [code, setCode] = useState('');
    const [error, setError] = useState('');

    const handleChange = (code) => {
        if (code.length > 6) {
          code = code.substring(0, 6);
        }
        setCode(code);
    }

    const handleCreate = () => {
        props.setChwazi('123456');
        setError('');
    }

    const handleJoin = () => {
        props.setChwazi('123456');
        setError('');
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