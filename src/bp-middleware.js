// @flow
import {core} from 'kaltura-player-js';
import {BroadPeak} from './broadpeak';

const {BaseMiddleware} = core;
/**
 * Middleware implementation for BroadPeak plugin.
 * @class BPMiddleware
 * @param {BroadPeak} context - The BP plugin context.
 * @private
 */
class BPMiddleware extends BaseMiddleware {
  /**
   * The id of the BP middleware.
   * @type {string}
   * @public
   * @memberof BPMiddleware
   */
  id: string = 'BPMiddleware';
  /**
   * The plugin context.
   * @member
   * @private
   * @memberof BPMiddleware
   */
  _context: BroadPeak;

  constructor(context: BroadPeak) {
    super();
    this._context = context;
  }

  /**
   * Load middleware handler.
   * @param {Function} next - The load play handler in the middleware chain.
   * @returns {void}
   * @memberof BPMiddleware
   */
  load(next: Function): void {
    this._context
      .srcReady()
      .catch(() => {})
      .then(() => this.callNext(next));
  }
}

export {BPMiddleware};
