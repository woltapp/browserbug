// @browserbug chrome lower-than 110 -- Line comment
export const a = 1;

/**
 * A block comment, with the annotation on a later line
 * @browserbug firefox lower-than 100 -- Block comment
 */
export const b = 2;

/* @browserbug safari lower-than 17 -- Safari is not in the query */
export const c = 3;

// @browserbug web-feature scrollend -- Every target supports it
export const d = 4;

// @browserbug not-a-browser 12
export const e = 5;
