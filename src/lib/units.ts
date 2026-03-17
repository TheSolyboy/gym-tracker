export const kgToLbs = (kg: number) => Math.round(kg * 2.20462 * 10) / 10;
export const lbsToKg = (lbs: number) => Math.round((lbs / 2.20462) * 10) / 10;
export const cmToIn = (cm: number) => Math.round((cm / 2.54) * 10) / 10;
export const inToCm = (inches: number) => Math.round(inches * 2.54 * 10) / 10;
