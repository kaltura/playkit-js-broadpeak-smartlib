// @flow
import {BPSmartlib} from './BPSmartlib';

/**
 * Engine decorator for ima plugin.
 * @class ImaEngineDecorator
 * @param {IEngine} engine - The HTML5 engine.
 * @param {Ima} plugin - The ima plugin.
 * @implements {IEngineDecorator}
 */
class BpEngineDecorator implements IEngineDecorator {
  _plugin: BPSmartlib;

  constructor(engine: IEngine, plugin: BPSmartlib) {
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
