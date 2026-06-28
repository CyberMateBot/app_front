/**
 * @typedef {'image' | 'video' | 'audio' | '3d'} MediaKind
 */

/**
 * @typedef {Object} MediaOption
 * @property {string} key
 * @property {'select' | 'boolean' | 'text' | 'number' | 'range'} [type]
 * @property {string[]} [values]
 * @property {string|number|boolean} [default]
 * @property {Record<string, number>} [value_prices]
 */

/**
 * @typedef {Object} MediaModel
 * @property {string} id
 * @property {MediaKind} [kind]
 * @property {number} [price]
 * @property {boolean} [supports_edit]
 * @property {boolean} [supports_multi]
 * @property {MediaOption[]} [options]
 */

/**
 * @typedef {Object} PriceContext
 * @property {number} [textLength]
 * @property {boolean} [voiceClone]
 */

export {};
