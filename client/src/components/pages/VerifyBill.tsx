import React from "react";
import Entry from "../modules/Entry"

import { RouteComponentProps } from "@reach/router";

type VerifyBillProps = RouteComponentProps & {bills : any};

const VerifyBill = (props: VerifyBillProps) => {
  return (
    <div className="VerifyBill-body">
        <div className="VerifyBill-title">
            Verify the Transaction
        </div>
        <div className="VerifyBill-bill">
            {props.bills.map((bill) => (<Entry username={bill.username} amount={bill.amount}/>))}
        </div>
    </div>
  );
};

export default VerifyBill;
