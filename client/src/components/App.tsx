import React, { useState, useEffect } from "react";
import jwt_decode from "jwt-decode";
import { CredentialResponse } from "@react-oauth/google";

import { get, post } from "../utilities";
import NotFound from "./pages/NotFound";
import Homepage from "./pages/Homepage";
import Join from "./pages/Join"
import Lobby from "./pages/Lobby"
import InputChwazi from "./pages/InputChwazi"
import VerifyBill from "./pages/VerifyBill"
import Result from "./pages/Result"

import { BrowserRouter as Router, Routes, Route} from 'react-router-dom';


import { socket } from "../client-socket";
import User from "../../../shared/User";
import "../utilities.css";

const App = () => {
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const [chwazi, setChwazi] = useState<string>('');
  const [lobby, setLobby] = useState({users: ['jay', 'helen', 'joyce']});


  useEffect(() => {
    let id = ''
    for(let i = 0; i < 6; i++) {
      id += Math.floor(Math.random() * 10).toString();
    }
    setUserId(id);


    socket.on("connect", () => {
      post("/api/initsocket", { socketid: socket.id });
    })
  }, []);


  return (
    <Router>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/join" element={<Join setChwazi={setChwazi} uid={userId} setLobby={setLobby}/>} />
        <Route path="/lobby" element={<Lobby code={chwazi} lobby={lobby} setLobby={setLobby}/>} />
        <Route path="/input" element={<InputChwazi />} />
      </Routes>
      {/* // <Homepage path="/" />
      // <VerifyBill path="/verify" bills={[{username: 'test1', amount: 10}, {username: 'test2', amount: 15}]}/>
      // <Result path="/result" chosen={"helen"}/>
      // <NotFound default={true} /> */}
    </Router>
  );
};

export default App;
