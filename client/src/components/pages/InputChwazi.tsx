import React, { useState } from "react";
import "./InputChwazi.css";
import Input from "../modules/Input"
import { RouteComponentProps } from "@reach/router";

type InputChwaziProps = RouteComponentProps & {}
const InputChwazi = (props: InputChwaziProps) => {
    const [share, setShare] = useState('$0.00');
    const [error, setError] = useState('');
    const [submit, setSubmit] = useState(false)

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
        console.log(float.toString)
    }

    return (
        <div className="InputChwazi-body">
            <Input 
                share={share}
                updateShare={updateShare}
                submitShare={submitShare}
                error={error}
            />
        </div>


    );
}

export default InputChwazi;