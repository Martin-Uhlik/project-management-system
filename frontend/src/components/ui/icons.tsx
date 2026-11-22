import type React from 'react';
import SvgIcon, { type SvgIconProps } from '@mui/material/SvgIcon';
import type { IconType } from 'react-icons';
import {
    MdAccountCircle,
    MdAdd,
    MdArrowBack,
    MdArrowForward,
    MdArticle,
    MdBarChart,
    MdBookmarkAdd,
    MdCalendarToday,
    MdCenterFocusStrong,
    MdCheck,
    MdCheckCircle,
    MdChevronRight,
    MdClose,
    MdCloudUpload,
    MdDarkMode,
    MdDelete,
    MdDescription,
    MdDownload,
    MdEdit,
    MdExpandMore,
    MdFolderCopy,
    MdFullscreen,
    MdFullscreenExit,
    MdGroups,
    MdHistory,
    MdHome,
    MdImage,
    MdInsertDriveFile,
    MdInventory2,
    MdLightMode,
    MdLinkOff,
    MdLock,
    MdLogout,
    MdMonitor,
    MdOutlineAccessTime,
    MdOutlineChat,
    MdOutlineTimer,
    MdPeople,
    MdPersonOff,
    MdPictureAsPdf,
    MdPlayArrow,
    MdPrecisionManufacturing,
    MdRadioButtonUnchecked,
    MdRefresh,
    MdRemove,
    MdSearch,
    MdSend,
    MdSettings,
    MdShoppingCart,
    MdStop,
    MdTableChart,
    MdUndo,
    MdVideoFile,
    MdViewInAr,
    MdWarning,
    MdWork,
    MdZoomIn,
    MdZoomOut,
} from 'react-icons/md';

// Every icon in the app comes from react-icons (Material Design set). They are wrapped in MUI's SvgIcon, so they
// take fontSize, color and sx like any MUI icon and follow the theme.
export type AppIcon = ((props: SvgIconProps) => React.JSX.Element) & { displayName?: string };

const icon = (ReactIcon: IconType): AppIcon => {
    const Icon = (props: SvgIconProps) => <SvgIcon component={ReactIcon} inheritViewBox {...props} />;
    Icon.displayName = ReactIcon.name;
    return Icon;
};

export const AccountIcon = icon(MdAccountCircle);
export const ChevronDownIcon = icon(MdExpandMore);
export const SunIcon = icon(MdLightMode);
export const MoonIcon = icon(MdDarkMode);
export const MonitorIcon = icon(MdMonitor);
export const CogIcon = icon(MdSettings);
export const LogoutIcon = icon(MdLogout);
export const ChevronRightIcon = icon(MdChevronRight);
export const CheckCircleIcon = icon(MdCheckCircle);
export const ClockOutlineIcon = icon(MdOutlineAccessTime);
export const LockIcon = icon(MdLock);
export const CircleOutlineIcon = icon(MdRadioButtonUnchecked);
export const TimerIcon = icon(MdOutlineTimer);
export const AccountCancelIcon = icon(MdPersonOff);
export const PencilIcon = icon(MdEdit);
export const PlayIcon = icon(MdPlayArrow);
export const StopIcon = icon(MdStop);
export const CheckIcon = icon(MdCheck);
export const UndoIcon = icon(MdUndo);
export const TrashIcon = icon(MdDelete);
export const CalendarIcon = icon(MdCalendarToday);
export const BriefcaseIcon = icon(MdWork);
export const ArrowLeftIcon = icon(MdArrowBack);
export const ArrowRightIcon = icon(MdArrowForward);
export const CloudUploadIcon = icon(MdCloudUpload);
export const FileIcon = icon(MdInsertDriveFile);
export const CloseIcon = icon(MdClose);
export const DownloadIcon = icon(MdDownload);
export const ImageIcon = icon(MdImage);
export const FilePdfIcon = icon(MdPictureAsPdf);
export const FileWordIcon = icon(MdDescription);
export const FileExcelIcon = icon(MdTableChart);
export const CubeIcon = icon(MdViewInAr);
export const FileTextIcon = icon(MdArticle);
export const FileVideoIcon = icon(MdVideoFile);
export const ChatIcon = icon(MdOutlineChat);
export const SendIcon = icon(MdSend);
export const AccountGroupIcon = icon(MdGroups);
export const RefreshIcon = icon(MdRefresh);
export const LinkOffIcon = icon(MdLinkOff);
export const SearchIcon = icon(MdSearch);
export const PlusIcon = icon(MdAdd);
export const MinusIcon = icon(MdRemove);
export const ReserveIcon = icon(MdBookmarkAdd);
export const CartIcon = icon(MdShoppingCart);
export const HistoryIcon = icon(MdHistory);
export const WarningIcon = icon(MdWarning);
// the left menu
export const HomeIcon = icon(MdHome);
export const ProjectsIcon = icon(MdFolderCopy);
export const InventoryIcon = icon(MdInventory2);
export const MachinesIcon = icon(MdPrecisionManufacturing);
export const StatsIcon = icon(MdBarChart);
export const PeopleIcon = icon(MdPeople);
// the task graph's controls
export const FullscreenIcon = icon(MdFullscreen);
export const FullscreenExitIcon = icon(MdFullscreenExit);
export const ZoomInIcon = icon(MdZoomIn);
export const ZoomOutIcon = icon(MdZoomOut);
export const ZoomResetIcon = icon(MdCenterFocusStrong);
