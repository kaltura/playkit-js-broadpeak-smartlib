// @flow
import {KalturaPlayer, BasePlugin, core} from '@playkit-js/kaltura-player-js';
import {SmartLib, LoggerManager, StreamingSessionOptions, StreamingSessionResult} from '@broadpeak/smartlib-v3-nopolyfill';
import {BPEngineDecorator} from './bp-engine-decorator';
import {BPMiddleware} from './bp-middleware';

const {BaseMiddleware, Utils, LogLevel} = core;
const BroadPeakLogLevel: {[level: string]: number} = {
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
    if (this.config.uuid) {
      SmartLib.getInstance().setUUID(this.config.uuid);
    }
    if (this.config.gdprReference) {
      //GDPR_DELETE=1;static GDPR_ANONYMIZED=2;static GDPR_ENCRYPTED=3;static GDPR_CLEAR=4
      SmartLib.getInstance().setOption(StreamingSessionOptions.GDPR_PREFERENCE, this.config.gdprReference);
    }
    if (this.config.deviceType) {
      SmartLib.getInstance().setDeviceType(this.config.deviceType);
    }
    if (this.config.userAgent) {
      SmartLib.getInstance().setUserAgent(this.config.userAgent);
    }
    if (this.config.userAgentAdEvent) {
      SmartLib.getInstance().setOption(StreamingSessionOptions.USERAGENT_AD_EVENT, this.config.userAgentAdEvent);
    }
    if (this.config.sessionKeepaliveFrequency) {
      SmartLib.getInstance().setOption(StreamingSessionOptions.SESSION_KEEPALIVE_FREQUENCY, this.config.sessionKeepaliveFrequency);
    }
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
      this._setSessionParameters(this.session);
      this._getSource(event.payload.selectedSource[0].url);
    });
  }

  _setSessionParameters(session) {
    if (this.config.sessionCustomParameters) {
      Object.entries(this.config.sessionCustomParameters).forEach(([key, value]) => {
        session.setCustomParameter(key, value);
      });
    }
  }

  _getSource(playbackUrl: string): void {
    this.session.getURL(playbackUrl).then(result => {
      if (!result.isError()) {
        const updatedUrl = result.getURL();
        this.logger.debug('getUrl response', updatedUrl);
        this.sourceChangeCallback(updatedUrl);
        this.dispatchEvent(this.player.Event.SOURCE_URL_SWITCHED, {originalUrl: playbackUrl, updatedUrl});
        this._srcPromise.resolve();
      } else {
        if (result.getErrorCode() === StreamingSessionResult.RESULT_SESSION_HAS_BEEN_STOPPED_DURING_REQUEST) {
          //ignore this error as it happened when change tabs
          this.reset();
          this._srcPromise.resolve();
          return;
        }
        const errorMessage = `getUrl failed with error code: ${result.getErrorCode()}. error message: ${result.getErrorMessage()}`;
        this.logger.error(errorMessage);
        this.reset();
        this._srcPromise.reject(new Error(errorMessage));
      }
    });
  }
}

export {BroadPeak};
