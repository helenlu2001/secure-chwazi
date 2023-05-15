import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import "./Lobby.css";
import { RouteComponentProps } from "@reach/router";
import { socket } from "../../client-socket";


type LobbyProps = RouteComponentProps & {code: any, lobby: any, setLobby: any}
const Join = (props: LobbyProps) => {
    const navigate = useNavigate();

    useEffect(() => {
        socket.on('lobby data', (res) => {
            props.setLobby(res.lobby)
        });
        socket.on('chwazi started', () => {
            navigate('/input')
        })
    }, [])

    const handleStart = () => {
        socket.emit('start', {cid: props.code})
        navigate('/input')
    }

    return (
        <div className="Lobby-body">
            <div className="Lobby-heading">
                Chwazi Code
            </div>
            <div className="Lobby-flex">
                <div className="Lobby-code">
                    {props.code}
                </div>
                <div className="Lobby-people">
                    {props.lobby.users.map((person) => {return <div className="Lobby-person"> {person} </div>})}
                </div>
                <div className="Join-button" onClick={handleStart}> 
                    S T A R T
                </div>
            </div>
        </div>

    );
}

export default Join;