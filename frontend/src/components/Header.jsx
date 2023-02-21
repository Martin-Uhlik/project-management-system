import {useNavigate} from "react-router-dom";
import React, {useEffect} from "react";
import {useRecoilState, useSetRecoilState} from "recoil";
import {dialogAtom, notificationsAtom, showNavAtom, userAtom} from "../state/atoms";
import {Timer} from "./Timer";
import axios from "axios";
import {getAuthHeader, getUserID, setAuthCookie} from "../Auth";
import {getBackendAddress} from "../index";
import {handleAxiosError} from "../errorHandler";

export const Header = () => {
    const [user, setUser] = useRecoilState(userAtom);
    const [showNav, setShowNav] = useRecoilState(showNavAtom);
    const navigate = useNavigate();
    const setDialog = useSetRecoilState(dialogAtom);
    const [notifications, setNotifications] = useRecoilState(notificationsAtom);


    useEffect(() => {
        axios.get(
            getBackendAddress(`/auth/users/${getUserID()}`),
            getAuthHeader()
        )
        .then((response) => {
            setUser(response.data);
        })
        .catch((error) => {
            handleAxiosError(error, [notifications, setNotifications]);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    const logout = () => {
        axios.post(
            getBackendAddress("/auth/logout"),
            {},
            getAuthHeader()
        )
        .then((response) => {
            setAuthCookie(response.data.cookie);
            setAuthCookie(response.data.userId);
            navigate("/");
        });
    };

    const handleLogout = () => {
        if (user.WorkStartTime) {
            setDialog({
                type: "ConfirmDialog",
                data: {
                    title: "Časovač stále spuštěn!",
                    description: "Chcete se odhlásit i přes to, že je časovač stále spuštěn?",
                    handleSuccess: logout,
                    handleCancel: () => {
                    }
                }
            });
        } else {
            logout();
        }
    };

    const handleShowMenu = () => {
        setShowNav(!showNav);
    };

    return (
        <div className="bg-dark header">
            <button className="header_show-menu" onClick={handleShowMenu}>
                <img className="logo-a" src="/images/logo-a.svg" alt="logo-a"/>
            </button>
            <Timer/>
            <div className="logout">
                <span className="menu-text menu-text-md">{`${user?.FirstName} ${user?.LastName}`}</span>
                <button onClick={handleLogout}>
                    <img className="menu-icon" src="/icons/logout.svg" alt="Odhlásit se"/>
                </button>
            </div>
        </div>
    );
};
