import React from 'react';
import ReactDOM from 'react-dom/client';
import {App} from './App';
import './styles.css';

export const getBackendAddress = (address) => {
    return process.env.REACT_APP_BACKEND + address;
}

const documentHeight = () => {
    const doc = document.documentElement
    doc.style.setProperty('--doc-height', `${window.innerHeight}px`)
}
window.addEventListener("resize", documentHeight)
documentHeight()


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

