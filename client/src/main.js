import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/global.css';
import { inject } from '@vercel/analytics';
inject({ scriptSrc: "/guess-who/_vercel/insights/script.js", endpoint: "/guess-who/_vercel/insights" });
ReactDOM.createRoot(document.getElementById('root')).render(_jsx(React.StrictMode, { children: _jsx(App, {}) }));
