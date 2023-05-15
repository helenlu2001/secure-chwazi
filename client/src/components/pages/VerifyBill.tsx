import React from "react";
import Entry from "../modules/Entry"
import "./VerifyBill.css"

import { RouteComponentProps } from "@reach/router";
import {socket} from "../../client-socket";
import {useNavigate} from "react-router-dom";

type VerifyBillProps = RouteComponentProps & {bills : any, uid: string, cid: string, setChosen: React.Dispatch<React.SetStateAction<string>>};

const VerifyBill = (props: VerifyBillProps) => {
    console.log(props.bills);

    const navigate = useNavigate();

    const accept = () => {
        socket.on("p2Response", (req: { choice: string, }) => {
            props.setChosen(req.choice);
            navigate("/result")
        })
        console.log("clicked! name=", props.uid, "cid=", props.cid);
        socket.emit("p2Confirm", { name: props.uid, cid: props.cid, })
        // Wait for everyone to accept and navigate to the next screen?
    }

    const reject = () => {
        socket.on("rejected", (req) => {
            navigate("/");
        })
        socket.emit("p2Reject", {});
    }
  return (
    <div className="VerifyBill-body">
        <div className="VerifyBill-title">
            Verify the Transaction
        </div>
        <div className="VerifyBill-bill">
            {props.bills.map(([username, amount], i) => (<Entry key={i} username={username} amount={amount}/>))}
        </div>
        <div className="VerifyBill-buttonContainer">
          <div className="VerifyBill-button" onClick={() => accept()}>
            ACCEPT
          </div>
          <div className="VerifyBill-button" onClick={() => reject()}>
            REJECT
          </div>
        </div>
    </div>
  );
};

export default VerifyBill;
