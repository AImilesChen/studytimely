import React from "react";
import '@fontsource-variable/inter';
import {createRoot,hydrateRoot} from 'react-dom/client';
import { App } from "./App.jsx";
import "./styles.css";
import './application.css';
import './management.css';
import './flip-clock-layout.css';
import './ambient-controls.css';
import './music-controls.css';

const root=document.getElementById('root');
const app=<App initialPath={location.pathname} initialNow={Number(root.dataset.renderedAt)||0}/>;
if(root.hasChildNodes())hydrateRoot(root,app);else createRoot(root).render(app);

import './timer-presentation.css';
