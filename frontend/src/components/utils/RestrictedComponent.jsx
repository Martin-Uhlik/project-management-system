import {useRecoilValue} from "recoil";
import {userAtom} from "../../state/atoms";

export const RestrictedComponent = ({children, types=[], ids= []}) => {
    const user = useRecoilValue(userAtom)
    if (types.includes(user?.UserType) || ids.includes(user?.ID)) {
        return children
    }
    return null
};