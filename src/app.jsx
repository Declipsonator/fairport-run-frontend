import React from "react";
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router";
import Home from "./pages/Home";
import "./style.css"

createRoot(document.getElementById("app")).render(
    <div>
        <BrowserRouter>
            <Home />
        </BrowserRouter>
    </div>
)
