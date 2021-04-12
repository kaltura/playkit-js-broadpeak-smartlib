// @flow
import {KalturaPlayer, BasePlugin, core} from 'kaltura-player-js';
import {SmartLib} from '@broadpeak/smartlib-v3';
import {LoggerManager} from '@broadpeak/smartlib-v3';
import {BPEngineDecorator} from './bp-engine-decorator';
import {BPMiddleware} from './bp-middleware';

const {BaseMiddleware, Utils, LogLevel} = core;
const BroadPeakLogLevel: { [level: string]: number } = {
  OFF: -1,
  INFO: 0,
  DEBUG: 1
};

LoggerManager.getInstance().setLogLevel(BroadPeakLogLevel.OFF);

/**
 * The BroadPeak plugin.
 * @class BroadPeak
 * @param {string} name - The plugin name.
 * @param {Object} config - The plugin config.
 * @extends BasePlugin
 */
class BroadPeak extends BasePlugin {
  /**
   * The default configuration of the plugin.
   * @type {Object}
   * @static
   * @memberof BroadPeak
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
   * @memberof BroadPeak
   */
  _srcPromise: DeferredPromise;

  /**
   * Source change callback
   * @type {Promise<*>}
   * @member
   * @public
   * @memberof BroadPeak
   */
  sourceChangeCallback: Function;

  /**
   * session object of BP
   * @type {Promise<*>}
   * @member
   * @public
   * @memberof BroadPeak
   */
  session: any;

  /**
   * Gets the engine decorator.
   * @param {IEngine} engine - The engine to decorate.
   * @public
   * @returns {IEngineDecorator} - The ads api.
   * @instance
   * @memberof BroadPeak
   */
  getEngineDecorator(engine: IEngine): IEngineDecorator {
    return new BPEngineDecorator(engine, this);
  }

  /**
   * Gets the middleware.
   * @public
   * @returns {BPMiddleware} - The middleware api.
   * @instance
   * @memberof BroadPeak
   */
  getMiddlewareImpl(): BaseMiddleware {
    return new BPMiddleware(this);
  }

  /**
   * Whether the BroadPeak plugin is valid.
   * @static
   * @override
   * @public
   * @memberof BroadPeak
   */
  static isValid() {
    return true;
  }

  constructor(name: string, player: KalturaPlayer, config: Object) {
    super(name, player, config);
    this._setLogLevel();
    this.eventManager.listen(this.player, this.player.Event.Core.ERROR, () => this.reset());
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

  _setLogLevel(): void {
    const playerLogLevel = Utils.Object.getPropertyPath(this.player, 'config.log.level');
    switch (playerLogLevel) {
      case LogLevel.ERROR.name:
      case LogLevel.OFF.name:
        LoggerManager.getInstance().setLogLevel(BroadPeakLogLevel.OFF);
        break;
      case LogLevel.DEBUG.name:
        LoggerManager.getInstance().setLogLevel(BroadPeakLogLevel.DEBUG);
        break;
      case LogLevel.TIME.name:
      case LogLevel.WARN.name:
      case LogLevel.INFO.name:
      default:
        LoggerManager.getInstance().setLogLevel(BroadPeakLogLevel.INFO);
        break;
    }
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
        this.logger.debug('getUrl response', result.getURL());
        this.sourceChangeCallback(result.getURL());
        this._srcPromise.resolve();
      } else {
        this.logger.error('getUrl failed', result.getErrorCode(), result.getErrorMessage());
        this.reset();
        this._srcPromise.reject();
      }
    });
  }
}

export {BroadPeak};
