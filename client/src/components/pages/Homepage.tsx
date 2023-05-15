import React from "react";
import "./Homepage.css";
import { RouteComponentProps } from "@reach/router";

type HomepageProps = RouteComponentProps & {}
const Homepage = (props: HomepageProps) => {
    return (
        <div className="Homepage-body">
            <div className="Homepage-title">
                <span className="Homepage-head">SE</span>
                <span className="Homepage-C-shadow Homepage-C">C</span>
                <span className="Homepage-tail">HWAZI</span>
            </div>
            <div className="Homepage-authors">
                a secure bill paying application developed by Helen Lu, Jay Hilton, Joyce Yoon
            </div>
        </div>

    );
}

export default Homepage;