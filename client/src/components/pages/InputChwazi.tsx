import React, {useState} from "react";
import "./InputChwazi.css";
import Input from "../modules/Input"
import { RouteComponentProps } from "@reach/router";
import {socket} from "../../client-socket";
import {useNavigate} from "react-router-dom";

type InputChwaziProps = RouteComponentProps & {uid: any, cid: any, setBill: React.Dispatch<React.SetStateAction<[string, number][]>>}
const InputChwazi = (props: InputChwaziProps) => {
    const [share, setShare] = useState('$0.00');
    const [error, setError] = useState('');
    const [submit, setSubmit] = useState(false)
    const [submitted, setSubmitted] = useState(false);
    const navigate = useNavigate();

    const updateShare = (value) => {
        if (value.length > 0 && value[0] === "$") {
            setShare(value);
        }
    }

    const submitShare = (event) => {
        if (event.keyCode !== 13) {
            return
        }

        const float = parseFloat(share.slice(1)).toFixed(2)
        console.log(float.toString(), "submitting to test socket")
        socket.on("test", (req: { bill: Array<[string, number]>, counts: Array<[string, number]>}) => {
            props.setBill(req.bill);
            navigate("/verify");
        });
        socket.emit("submit-share", {cid: props.cid, uid: props.uid, amount: float.toString()})
        setSubmitted(true)
    }

    return (
        <div className="InputChwazi-body">
            {submitted ?
                <div className={"InputChwazi-title"}> Waiting... </div>
            :
                <Input
                    share={share}
                    updateShare={updateShare}
                    submitShare={submitShare}
                    error={error}
                />

            }
        </div>


    );
}

export default InputChwazi;