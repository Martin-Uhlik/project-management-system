import {Outlet, useNavigate} from "react-router-dom";
import Navigation from "./components/Navigation";
import {Header} from "./components/Header";
import React from "react";
import {RecoilRoot, useSetRecoilState} from "recoil";
import {Notifications} from "./components/Notifications";
import {Dialogs} from "./components/Dialogs";
import Cookies from "js-cookie";
import {tickAtom} from "./state/atoms";
import moment from "moment";


export const getAuthHeader = () => {
    return {headers: {Authorization: `Bearer ${Cookies.get("auth")}`}};
};

export const getUserID = () => {
    return Cookies.get("user_id");
};

export const setAuthCookie = (cookie) => {
    Cookies.set(cookie.name, cookie.key, cookie.params);
};

const AuthUtils = () => {
    const navigate = useNavigate();
    const setTick = useSetRecoilState(tickAtom);

    React.useEffect(() => {

    });

    React.useEffect(() => {
        setInterval(() => {
                setTick(moment());
                if (!Cookies.get("auth")) {
                    navigate("/");
                }
            },
            60000
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return <></>;
};

export const Auth = () => {


    return (
        <RecoilRoot>
            <div className="wrapper">
                <Header/>
                <div className="d-flex flex-row h-100 w-100">
                    <Navigation/>
                    <div className="content-wrap">
                        <Outlet/>
                        <Notifications/>
                    </div>
                </div>
            </div>
            <Dialogs/>
            <AuthUtils/>
        </RecoilRoot>
    );
};
