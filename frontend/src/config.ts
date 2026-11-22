export const getBackendAddress = (address: string) => {
    return import.meta.env.VITE_BACKEND + address;
};
