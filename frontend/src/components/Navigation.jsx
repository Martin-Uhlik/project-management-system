import React from "react";
import {NavigationItem} from "./utils/NavigationItem";
import {useRecoilState} from "recoil";
import {showNavAtom} from "../state/atoms";

function Navigation() {
    const menuItems = [
        {key: 0, to: "/auth/overview", icon: "/icons/home.svg", text: "Přehled"},
        {key: 2, to: "/auth/projects", icon: "/icons/folder-multiple.svg", text: "Projekty"},
        {key: 3, to: "/auth/inventory", icon: "/icons/package-variant.svg", text: "Sklad"},
        {key: 4, to: "/auth/machines", icon: "/icons/robot-industrial.svg", text: "Stroje"},
        {key: 5, to: "/auth/users", icon: "/icons/account-multiple.svg", text: "Uživatelé"},
        {key: 6, to: "/auth/settings", icon: "/icons/cog.svg", text: "Nastavení"}
    ];
    const createItem = (item) => {
        return (
            <div key={item.key}>
                <hr className="nav_spacer"/>
                <NavigationItem to={item.to} icon={item.icon} text={item.text}/>
            </div>
        );
    };
    const [showNav, setShowNav] = useRecoilState(showNavAtom);

    return (
        <>
            {showNav && <div className="nav__background" onClick={() => {
                setShowNav(!showNav);
            }}></div>}
            <div className={"nav" + (showNav ? " nav__visible" : "")}>
                <div className="d-flex flex-column justify-content-center align-items-center flex-grow-1">
                    <NavigationItem key={menuItems[0].key} to={menuItems[0].to} icon={menuItems[0].icon}
                                    text={menuItems[0].text}/>
                    {menuItems.slice(1, -1).map(createItem)}
                </div>
                {createItem(menuItems[menuItems.length - 1])}
            </div>
        </>
    );
}

export default Navigation;