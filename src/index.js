// @flow
import {registerPlugin} from 'kaltura-player-js';
import {BPSmartlib} from './bp-smartlib';

declare var __VERSION__: string;
declare var __NAME__: string;

const VERSION = __VERSION__;
const NAME = __NAME__;

export {BPSmartlib as Plugin};
export {VERSION, NAME};

const pluginName: string = 'bpsmartlib';

registerPlugin(pluginName, BPSmartlib);
