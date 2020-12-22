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

  get active(): boolean {
    return true;
  }

  dispatchEvent(event: FakeEvent): boolean {
    return event.defaultPrevented;
  }

  constructor(engine: IEngine, plugin: BPSmartlib) {
    this._plugin = plugin;
    this._plugin.setSourceChangeCallback(playbackUrl => (engine.src = playbackUrl));
  }
}

export {BpEngineDecorator};
