// @flow
import {core} from 'kaltura-player-js';
import {BPSmartlib} from './bp-smartlib';

const {BaseMiddleware} = core;
/**
 * Middleware implementation for BPSmartlib plugin.
 * @class BPMiddleware
 * @param {BPSmartlib} context - The BP plugin context.
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
  _context: BPSmartlib;

  constructor(context: BPSmartlib) {
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
    this._context.srcReady().finally(() => this.callNext(next));
  }
}

export {BPMiddleware};
