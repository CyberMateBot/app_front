import { calculatePrice, getMediaModelMinPrice, getOptionPriceDelta } from './mediaGenerationPrice.js';

/** @deprecated use calculatePrice */
export function calcImageGenerationPrice(model, selectedOptions = {}) {
    return calculatePrice(model, selectedOptions);
}

/** @deprecated use getMediaModelMinPrice */
export function getImageModelMinPrice(model) {
    return getMediaModelMinPrice(model);
}

/** @deprecated use getOptionPriceDelta */
export function getImageOptionPriceDelta(model, optionKey, value, currentOptions = {}) {
    return getOptionPriceDelta(model, optionKey, value, currentOptions);
}

export { calculatePrice, getMediaModelMinPrice, getOptionPriceDelta } from './mediaGenerationPrice.js';

export function imageModelHasDynamicPrice(model) {
    return Boolean(model?.options?.some((opt) => opt.value_prices && Object.keys(opt.value_prices).length));
}
