import { StyledToggle } from './StyledToggle';
import { useColorMode } from './useColorMode';

const modes = ['light', 'dark', 'system'];

// Choosing the look in Settings: light, dark, or the same as the computer / phone
export const StyledThemeToggle = () => {
    const { mode, setMode } = useColorMode();
    return <StyledToggle options={['Světlý', 'Tmavý', 'Podle systému']} value={modes.indexOf(mode)} onChange={(index) => setMode(modes[index])} />;
};
