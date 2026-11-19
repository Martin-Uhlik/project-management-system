export const getBackendAddress = (address) => {
    return import.meta.env.VITE_BACKEND + address;
};
