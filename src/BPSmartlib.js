// @flow
import {KalturaPlayer, BasePlugin, core} from 'kaltura-player-js';
import {SmartLib} from '@broadpeak/smartlib-v3';
import {BpEngineDecorator} from './bp-engine-decorator';
import {BPMiddleware} from './bp-middleware';

const {BaseMiddleware, Utils} = core;
/**
 * The BPSmartlib plugin.
 * @class Ima
 * @param {string} name - The plugin name.
 * @param {Object} config - The plugin config.
 * @extends BasePlugin
 */
class BPSmartlib extends BasePlugin {
  /**
   * The default configuration of the plugin.
   * @type {Object}
   * @static
   * @memberof Ima
   */
  static defaultConfig: Object = {
    analyticsAddress: null,
    nanoCDNHost: null,
    broadpeakDomainNames: []
  };

  /**
   * Promise for src changing.
   * @type {Promise<*>}
   * @member
   * @public
   * @memberof BPSmartlib
   */
  _srcPromise: DeferredPromise;

  /**
   * Source change callback
   * @type {Promise<*>}
   * @member
   * @public
   * @memberof BPSmartlib
   */
  sourceChangeCallback: Function;

  /**
   * session object of BP
   * @type {Promise<*>}
   * @member
   * @public
   * @memberof BPSmartlib
   */
  session: any;

  /**
   * Gets the engine decorator.
   * @param {IEngine} engine - The engine to decorate.
   * @public
   * @returns {IEngineDecorator} - The ads api.
   * @instance
   * @memberof Ima
   */
  getEngineDecorator(engine: IEngine): IEngineDecorator {
    return new BpEngineDecorator(engine, this);
  }

  /**
   * Gets the middleware.
   * @public
   * @returns {ImaMiddleware} - The middleware api.
   * @instance
   * @memberof Ima
   */
  getMiddlewareImpl(): BaseMiddleware {
    return new BPMiddleware(this);
  }

  /**
   * Whether the ima plugin is valid.
   * @static
   * @override
   * @public
   * @memberof Ima
   */
  static isValid() {
    return true;
  }

  constructor(name: string, player: KalturaPlayer, config: Object) {
    super(name, player, config);
    this.eventManager.listen(this.player, this.player.Event.Core.ERROR, () => {
      this.reset();
    });
    this._attachSourceChange();
    SmartLib.getInstance().init(this.config.analyticsAddress, this.config.nanoCDNHost, this.config.broadpeakDomainNames);
  }

  srcReady(): Promise<*> {
    return this._srcPromise;
  }

  setSourceChangeCallback(callback: Function) {
    this.sourceChangeCallback = callback;
  }

  /**
   * Prepare the plugin before media is loaded.
   * @override
   * @public
   * @returns {void}
   * @instance
   */
  loadMedia(): void {}

  /**
   * Resets the plugin.
   * @override
   * @public
   * @returns {void}
   * @instance
   */
  reset(): void {
    if (this.session) {
      this.session.stopStreamingSession();
    }
    this.session = null;
  }

  /**
   * Destroys the plugin.
   * @override
   * @public
   * @returns {void}
   * @instance
   */
  destroy(): void {
    // not sure if it's correct cause we couldn't know for multiple players
    SmartLib.getInstance().release();
  }

  _attachSourceChange() {
    this.eventManager.listen(this.player, this.player.Event.Core.SOURCE_SELECTED, event => {
      this._srcPromise = Utils.Object.defer();
      this.session = SmartLib.getInstance().createStreamingSession();
      this.session.attachPlayer(this.player);
      this._getSource(event.payload.selectedSource[0].url);
    });
  }

  _getSource(playbackUrl: string): void {
    this.session.getURL(playbackUrl).then(result => {
      if (!result.isError()) {
        this.sourceChangeCallback(result.getURL());
        this._srcPromise.resolve();
      } else {
        this.reset();
        this._srcPromise.reject();
      }
    });
  }
}

export {BPSmartlib};
