import React from "react";
import Entry from "../modules/Entry"

import { RouteComponentProps } from "@reach/router";

type ResultProps = RouteComponentProps & {chosen: string};

const VerifyBill = (props: ResultProps) => {
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

export default VerifyBill;
