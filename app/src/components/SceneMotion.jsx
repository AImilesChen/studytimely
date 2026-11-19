import {useEffect} from 'react';
import {SceneVideo} from './SceneVideo.jsx';
import {sceneVideo} from '../lib/focus-space.mjs';
export function SceneMotion(props){return sceneVideo(props.scene)?<SceneVideo {...props}/>:<StillScene onStatus={props.onStatus}/>;}
function StillScene({onStatus}){useEffect(()=>{onStatus?.('still');},[onStatus]);return null;}
