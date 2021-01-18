// @flow
import {registerPlugin} from 'kaltura-player-js';
import {BroadPeak} from './broadpeak';

declare var __VERSION__: string;
declare var __NAME__: string;

const VERSION = __VERSION__;
const NAME = __NAME__;

export {BroadPeak as Plugin};
export {VERSION, NAME};

const pluginName: string = 'broadpeak';

registerPlugin(pluginName, BroadPeak);
