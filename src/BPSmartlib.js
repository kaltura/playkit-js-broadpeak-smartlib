// @flow
import {BasePlugin} from 'kaltura-player-js';
import {SmartLib} from '@broadpeak/smartlib-v3';
/**
 * The BPSmartlib plugin.
 * @class Ima
 * @param {string} name - The plugin name.
 * @param {KalturaPlayer} player - The player instance.
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
      this.session.stopStreamingSession();
    });
    this._attachChangeMedia();
    SmartLib.getInstance().init(this.config.analyticsAddress, this.config.nanoCDNHost, this.config.broadpeakDomainNames);
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
    this.session.stopStreamingSession();
    this.session = null;
    this._attachChangeMedia();
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

  _attachChangeMedia(): void {
    this.eventManager.listenOnce(this.player, this.player.Event.Core.SOURCE_SELECTED, event => {
      this.session = SmartLib.getInstance().createStreamingSession();
      this.session.attachPlayer(this.player);
      this.session.getURL(event.payload.selectedSource[0].url).then(result => {
        if (!result.isError()) {
          let sources = this.player.config.sources;
          const streamType = this.player._localPlayer.streamType;
          this.player.reset();
          sources[streamType].forEach(source => {
            source.url = result.getURL();
          });
          // Start the playback
          this.player.setMedia({sources, plugins: this.player.config.plugins, session: this.player.config.session});
        } else {
          this.session.stopStreamingSession();
        }
      });
    });
  }
}

export {BPSmartlib};
