"use strict";

import {Deque} from './collections/deque.js';


/*
 * Random number generators
 */
export function rand(min, max) {
    return Math.random() * (max - min) + min;
}

export function randint(min, max) {
    return Math.round(rand(min, max));
}


export function clip(value, min, max) {
    if (value <= min) return min;
    if (value >= max) return max;
    return value;
}


/*
 * HSLColor
 */
export class HSLColor {
    constructor(hue, saturation, lightness) {
        this.hue = hue;
        this.saturation = saturation;
        this.lightness = lightness;
        this.string = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    }

    toString() {
        return this.string;
    }

    equals(color) {
        return this.hue === color.hue
            && this.saturation === color.saturation
            && this.lightness === color.lightness;
    }

    withHue(hue) {
        return new HSLColor(hue, this.saturation, this.lightness);
    }

    withSaturation(saturation) {
        return new HSLColor(this.hue, saturation, this.lightness);
    }

    withLightness(lightness) {
        return new HSLColor(this.hue, this.saturation, lightness);
    }
}

export class HSLColorSampler {
    constructor({minH = 0, maxH = 360, minS = 0, maxS = 100, minL = 0, maxL = 100}) {
        this.minH = minH;
        this.maxH = maxH;
        this.minS = minS;
        this.maxS = maxS;
        this.minL = minL;
        this.maxL = maxL;
    }

    sample() {
        let h = randint(this.minH, this.maxH);
        let s = randint(this.minS, this.maxS);
        let l = randint(this.minL, this.maxL);
        return new HSLColor(h, s, l);
    }
}


export class ExponentialAverage {
    constructor({alpha = 0.5, startValue = null}) {
        this.alpha = alpha;
        this.value = startValue;
        this.startValue = startValue;
    }

    update(x) {
        if (this.value === null)
            this.value = x;
        else
            this.value = this.alpha * x + (1 - this.alpha) * this.value;
    }

    reset() {
        this.value = this.startValue;
    }
}


/**
 * Simple Moving Average (SMA): computes an average over the last
 * numSamples data points.
 */
export class MovingAverage {
    constructor(numSamples, {startValue = 0} = {}) {
        if (numSamples == null)
            throw new Error('you must provide the argument numSamples');
        this._numSamples = numSamples;
        this._samples = new Deque({maxLength: numSamples});
        this.startValue = startValue;
        this._value = startValue;
        this._sum = 0;
    }

    get numSamples() {
        return this._numSamples;
    }

    get value() {
        return this._value;
    }

    update(newSample) {
        let oldestSample = this._samples.pushRight(newSample) || 0;
        this._sum += newSample - oldestSample;
        this._value = this._sum / this._samples.length;
    }

    reset() {
        this._samples.clear();
        this._sum = 0;
        this._value = this.startValue;
    }
}
