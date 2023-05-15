import React, { useState, useEffect } from "react";
import { Router } from "@reach/router";
import jwt_decode from "jwt-decode";
import { CredentialResponse } from "@react-oauth/google";

import { get, post } from "../utilities";
import NotFound from "./pages/NotFound";
import Homepage from "./pages/Homepage";
import Join from "./pages/Join"
import Lobby from "./pages/Lobby"

import { socket } from "../client-socket";
import User from "../../../shared/User";
import "../utilities.css";

const App = () => {
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const [chwazi, setChwazi] = useState<string>('');
  const [lobby, setLobby] = useState({users: ['jay', 'helen', 'joyce']});


  useEffect(() => {
    get("/api/whoami")
      .then((user: User) => {
        if (user._id) {
          // TRhey are registed in the database and currently logged in.
          setUserId(user._id);
        }
      })
      .then(() =>
        socket.on("connect", () => {
          post("/api/initsocket", { socketid: socket.id });
        })
      );
  }, []);


  return (
    <Router>
      <Homepage path="/" />
      <Join path="/join" setChwazi={setChwazi}/>
      <Lobby path="/lobby" code={chwazi} lobby={lobby} />
      <NotFound default={true} />
    </Router>
  );
};

export default App;
