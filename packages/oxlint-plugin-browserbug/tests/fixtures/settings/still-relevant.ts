// @browserbug chrome lower-than 130 -- Chrome 120 still needs this
export const a: number = 1;

/** @browserbug firefox lower-than-or-equal 130 */
export function b(): void {}

// Not an annotation: @browserbugs are bugs too
export const c = 3;
