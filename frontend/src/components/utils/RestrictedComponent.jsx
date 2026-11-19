import { useAtomValue } from 'jotai';
import { userAtom } from '../../state/atoms';

export const RestrictedComponent = ({ children, types = [], ids = [] }) => {
    const user = useAtomValue(userAtom);
    if (types.includes(user?.UserType) || ids.includes(user?.ID)) {
        return children;
    }
    return null;
};
