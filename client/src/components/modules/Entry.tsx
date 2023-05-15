import React from "react";

import './Entry.css'
import { RouteComponentProps } from "@reach/router";

type EntryProps = RouteComponentProps & {username: any, amount: any};

const NotFound = (props: EntryProps) => {
  return (
    <div className="Entry-container">
        <div className="Entry-username">
            {props.username}
        </div>
        <div className="Entry-amount">
            {props.amount}
        </div>
    </div>
  );
};

export default NotFound;
