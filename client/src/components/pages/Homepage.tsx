import React from "react";
import "./Homepage.css";
import { RouteComponentProps } from "@reach/router";
import {useNavigate} from "react-router-dom";

type HomepageProps = RouteComponentProps & {}
const Homepage = (props: HomepageProps) => {
    const navigate = useNavigate();
    return (
        <div className="Homepage-body">
            <div className="Homepage-title" onClick={() => navigate("/join")}>
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