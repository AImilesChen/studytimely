import {renderToString} from 'react-dom/server';
import {App} from './App.jsx';
export function render(path,now){return renderToString(<App initialPath={path} initialNow={now}/>);}
