import React from "react";
import "./Result.css"

import { RouteComponentProps } from "@reach/router";

type ResultProps = RouteComponentProps & {chosen: string};

const Result = (props: ResultProps) => {
  return (
    <div className="Result-body">
        <div className="Result-text">
            The user that got chosen is...
        </div>
        <div className="Result-chosen">
            {props.chosen}
        </div>
    </div>
  );
};

export default Result;
