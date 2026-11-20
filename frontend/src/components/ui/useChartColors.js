import { chartColors, graphColors } from './theme';
import { useColorMode } from './useColorMode';

// The chart / graph colours for the colour mode shown now; components using them redraw when it changes
export const useChartColors = () => chartColors[useColorMode().scheme];

export const useGraphColors = () => graphColors[useColorMode().scheme];
