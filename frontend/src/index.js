// src/index.js
// This is the entry point of the React app.
// It renders the <App /> component into the #root div in index.html.

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
