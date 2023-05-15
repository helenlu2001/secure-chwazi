import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import "./Lobby.css";
import { RouteComponentProps } from "@reach/router";

type LobbyProps = RouteComponentProps & {code: any, lobby: any}
const Join = (props: LobbyProps) => {
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
                <div className="Join-button"> 
                    S T A R T
                </div>
            </div>
        </div>

    );
}

export default Join;