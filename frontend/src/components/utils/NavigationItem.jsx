import {useNavigate} from "react-router-dom";
import {useRecoilValue, useSetRecoilState} from "recoil";
import {selectedTabAtom, showNavAtom} from "../../state/atoms";

export const NavigationItem = (props) => {
    const setShowNav = useSetRecoilState(showNavAtom)
    const navigate = useNavigate();
    const handleClick = () => {
        setShowNav(false)
        navigate(props.to)
    }
    const selectedTab = useRecoilValue(selectedTabAtom)
    return(
        <button className={"nav_button" + ((props.text === selectedTab) ? " nav_button__active" : "")} onClick={handleClick}>
            <img className="menu-icon" src={props.icon} alt={props.text} />
        </button>
    )
}