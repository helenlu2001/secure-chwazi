import React, { useState } from "react";

import { RouteComponentProps } from "@reach/router";

type InputProps = RouteComponentProps & {share: any, updateShare: any, submitShare: any, error: any}
const Input = (props: InputProps) => {

    return (
        <div>
            <div className="InputChwazi-title">
                INPUT YOUR SHARE
            </div>
            <input className="InputChwazi-share" 
                value={props.share} 
                onChange={(event)=>props.updateShare(event.target.value)}
                onKeyDown={props.submitShare}
            />
            <div className="InputChwazi-error">
                {props.error}
            </div>
        </div>

    );
}

export default Input;