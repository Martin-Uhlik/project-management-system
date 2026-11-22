import { useAtomValue } from 'jotai';
import { userAtom } from '../../state/atoms';
import type { ReactNode } from 'react';
import type { UserType } from '../../types';

export const RestrictedComponent = ({ children, types = [], ids = [] }: { children: ReactNode; types?: UserType[]; ids?: number[] }) => {
    const user = useAtomValue(userAtom);
    if (user && (types.includes(user.UserType) || ids.includes(user.ID))) {
        return children;
    }
    return null;
};
