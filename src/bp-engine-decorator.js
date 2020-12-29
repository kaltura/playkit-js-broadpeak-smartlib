// @flow
import {BroadPeak} from './bp-smartlib';

/**
 * Engine decorator for BroadPeak plugin.
 * @class BpEngineDecorator
 * @param {IEngine} engine - The HTML5 engine.
 * @param {BroadPeak} plugin - The broadpeak plugin.
 * @implements {IEngineDecorator}
 */
class BpEngineDecorator implements IEngineDecorator {
  _plugin: BroadPeak;

  constructor(engine: IEngine, plugin: BroadPeak) {
    this._plugin = plugin;
    this._plugin.setSourceChangeCallback(playbackUrl => (engine.src = playbackUrl));
  }

  get active(): boolean {
    return false;
  }

  dispatchEvent(event: FakeEvent): boolean {
    return event.defaultPrevented;
  }
}

export {BpEngineDecorator};
