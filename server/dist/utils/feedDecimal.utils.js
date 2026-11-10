"use strict";
// Decimal strings at API boundaries; integer arithmetic internally.
// Default scale: six decimal places.
Object.defineProperty(exports, "__esModule", { value: true });
exports.quantityKg = exports.money = void 0;
exports.decimal = decimal;
exports.divideRound = divideRound;
exports.formatDecimal = formatDecimal;
exports.scaleWeights = scaleWeights;
function decimal(value, places = 6) {
    if (!/^(0|[1-9]\d*)(\.\d+)?$/.test(value)) {
        throw new Error("Invalid decimal");
    }
    const [whole, fraction = ""] = value.split(".");
    if (fraction.length > places) {
        throw new Error("Too many decimal places");
    }
    return (BigInt(whole) * 10n ** BigInt(places) +
        BigInt(fraction.padEnd(places, "0") || "0"));
}
function divideRound(value, divisor) {
    if (divisor <= 0n) {
        throw new Error("Divisor must be positive");
    }
    const sign = value < 0n ? -1n : 1n;
    const absolute = value < 0n ? -value : value;
    return sign * ((absolute + divisor / 2n) / divisor);
}
function formatDecimal(value, places = 6, trim = true) {
    const sign = value < 0n ? "-" : "";
    const absolute = value < 0n ? -value : value;
    const scale = 10n ** BigInt(places);
    const fraction = (absolute % scale).toString().padStart(places, "0");
    const formatted = places
        ? `${absolute / scale}.${fraction}`
        : String(absolute);
    return sign + (trim && places ? formatted.replace(/\.?0+$/, "") : formatted);
}
const money = (micros) => formatDecimal(divideRound(micros, 10000n), 2, false);
exports.money = money;
// 0.001 g equals 0.000001 kg.
const quantityKg = (value, unit) => unit === "kg" ? decimal(value) : decimal(value, 3);
exports.quantityKg = quantityKg;
// EXACT mode allocates remaining milligrams deterministically,
// ensuring the scaled rows add up to the requested batch weight.
function scaleWeights(weights, numerator, denominator, exact) {
    if (!exact) {
        return weights.map((weight) => divideRound(weight * numerator, denominator));
    }
    const values = weights.map((weight) => (weight * numerator) / denominator);
    let remaining = numerator - values.reduce((sum, value) => sum + value, 0n);
    const order = weights
        .map((weight, index) => ({
        index,
        remainder: (weight * numerator) % denominator,
    }))
        .sort((a, b) => a.remainder === b.remainder
        ? a.index - b.index
        : a.remainder > b.remainder
            ? -1
            : 1);
    for (const { index } of order) {
        if (remaining <= 0n)
            break;
        values[index] += 1n;
        remaining -= 1n;
    }
    return values;
}
