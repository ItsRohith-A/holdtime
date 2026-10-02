import type { Card } from '../types'

/** JavaScript and TypeScript. Written for Holdtime; MIT, like the rest. */
export const JAVASCRIPT: readonly Card[] = [
  { id: 'js-at', topic: 'javascript', kind: 'fact', text: '`arr.at(-1)` returns the last element; `arr[-1]` is just undefined.' },
  { id: 'js-structured-clone', topic: 'javascript', kind: 'fact', text: '`structuredClone(value)` deep-copies objects, including Maps, Sets and Dates. Functions cannot be cloned.' },
  { id: 'js-group-by', topic: 'javascript', kind: 'fact', text: '`Object.groupBy(items, fn)` groups a list into an object of arrays keyed by what `fn` returns (ES2024).' },
  { id: 'js-nullish', topic: 'javascript', kind: 'fact', text: '`a ?? b` falls back only when `a` is null or undefined; `a || b` also falls back on 0, "" and false.' },
  { id: 'js-optional-chain', topic: 'javascript', kind: 'fact', text: '`a?.b.c` stops and gives undefined when `a` is null or undefined, instead of throwing.' },
  { id: 'js-all-settled', topic: 'javascript', kind: 'fact', text: '`Promise.allSettled` waits for every promise and never rejects; `Promise.all` rejects on the first failure.' },
  { id: 'js-satisfies', topic: 'javascript', kind: 'fact', text: 'TypeScript `satisfies` checks a value against a type but keeps the value\'s own, narrower inferred type.' },
  { id: 'js-to-sorted', topic: 'javascript', kind: 'fact', text: '`arr.toSorted()` returns a sorted copy; `arr.sort()` sorts the array in place (ES2023).' },
  { id: 'js-const', topic: 'javascript', kind: 'fact', text: '`const` stops reassignment, not mutation: the properties of a const object can still change.' },
  { id: 'js-json-undefined', topic: 'javascript', kind: 'fact', text: '`JSON.stringify` drops undefined and function values from objects, and writes them as null inside arrays.' },
  { id: 'js-typeof-null', topic: 'javascript', kind: 'fact', text: '`typeof null` is "object": a bug from the first version of JavaScript, kept for compatibility.' },
  { id: 'js-unknown', topic: 'javascript', kind: 'fact', text: 'In TypeScript, an `unknown` value must be narrowed before use; `any` switches type checking off.' },
  { id: 'js-for-in', topic: 'javascript', kind: 'fact', text: '`for...of` loops over values; `for...in` loops over enumerable keys, inherited ones included.' },
  { id: 'js-number-isnan', topic: 'javascript', kind: 'fact', text: '`Number.isNaN("abc")` is false, but global `isNaN("abc")` is true: the global one converts to a number first.' },
  { id: 'js-as-const', topic: 'javascript', kind: 'fact', text: 'TypeScript `as const` makes a literal readonly and keeps its exact values as types, like `"GET"` instead of string.' },
  { id: 'js-array-from', topic: 'javascript', kind: 'fact', text: '`Array.from({ length: 3 }, (_, i) => i)` builds `[0, 1, 2]`.' },
  { id: 'js-microtasks', topic: 'javascript', kind: 'fact', text: 'Promise callbacks (microtasks) run before the next `setTimeout` callback, even one with a delay of 0.' },
  { id: 'js-replace-all', topic: 'javascript', kind: 'fact', text: '`"a-a".replace("-", "+")` changes only the first match; `replaceAll` changes every one.' },
  {
    id: 'js-sort-default', topic: 'javascript', kind: 'yesno', answer: false,
    text: 'Does `[1, 2, 10].sort()` return `[1, 2, 10]`?',
    explain: 'The default sort compares strings, giving [1, 10, 2]. Pass a comparator: `(a, b) => a - b`.',
  },
  {
    id: 'js-nan-equal', topic: 'javascript', kind: 'yesno', answer: false,
    text: 'Is `NaN === NaN` true?',
    explain: 'NaN is not equal to anything, itself included. Use `Number.isNaN(x)` or `Object.is(x, NaN)`.',
  },
  {
    id: 'js-object-is-zero', topic: 'javascript', kind: 'yesno', answer: false,
    text: 'Does `Object.is(-0, 0)` return true?',
    explain: '`Object.is` tells -0 and 0 apart, unlike `===`, which treats them as equal.',
  },
  {
    id: 'js-async-returns', topic: 'javascript', kind: 'yesno', answer: true,
    text: 'Does an `async` function always return a Promise?',
    explain: 'Yes. A plain return value is wrapped in a resolved Promise, and a throw becomes a rejected one.',
  },
  {
    id: 'js-tdz', topic: 'javascript', kind: 'yesno', answer: false,
    text: 'Can you read a `let` variable on a line above its declaration?',
    explain: 'No. It exists but sits in the temporal dead zone until declared, so reading it throws a ReferenceError.',
  },
  {
    id: 'js-float', topic: 'javascript', kind: 'yesno', answer: false,
    text: 'Is `0.1 + 0.2 === 0.3` true?',
    explain: 'Binary floating point gives 0.30000000000000004. Compare with a small tolerance instead.',
  },
  {
    id: 'js-foreach-await', topic: 'javascript', kind: 'yesno', answer: false,
    text: 'Does `await` inside a `forEach` callback make `forEach` wait for it?',
    explain: '`forEach` ignores the returned promises. Use `for...of` with await, or `Promise.all` with `map`.',
  },
  {
    id: 'js-typeof-array', topic: 'javascript', kind: 'yesno', answer: false,
    text: 'Is `typeof []` equal to "array"?',
    explain: 'It is "object". Use `Array.isArray(value)` to check for an array.',
  },
  {
    id: 'js-arrow-this', topic: 'javascript', kind: 'yesno', answer: false,
    text: 'Does an arrow function get its own `this`?',
    explain: 'No. It uses the `this` of the code around it, which is why arrows suit callbacks inside methods.',
  },
  {
    id: 'js-json-date', topic: 'javascript', kind: 'yesno', answer: false,
    text: 'Does `JSON.parse(JSON.stringify(new Date()))` give back a Date?',
    explain: 'It gives an ISO string. Convert it back with `new Date(text)`.',
  },
  {
    id: 'js-enum-runtime', topic: 'javascript', kind: 'yesno', answer: true,
    text: 'Does a regular TypeScript `enum` produce JavaScript code at runtime?',
    explain: 'Yes, an object holding the members. Most types vanish when compiled, but enums do not.',
  },
  {
    id: 'js-set-objects', topic: 'javascript', kind: 'yesno', answer: true,
    text: 'Can a `Set` hold two different objects that have identical contents?',
    explain: 'Yes. A Set compares objects by reference, so `{}` and `{}` are two different members.',
  },
  {
    id: 'js-strict-implicit-any', topic: 'javascript', kind: 'yesno', answer: true,
    text: 'Does `"strict": true` in tsconfig turn on `noImplicitAny`?',
    explain: 'Yes. `strict` enables a family of checks, including `noImplicitAny` and `strictNullChecks`.',
  },
  {
    id: 'js-array-holes', topic: 'javascript', kind: 'yesno', answer: false,
    text: 'Does `new Array(3).map((_, i) => i)` give `[0, 1, 2]`?',
    explain: '`new Array(3)` has empty slots, and `map` skips them. Use `Array.from({ length: 3 }, (_, i) => i)`.',
  },
  {
    id: 'js-race-reject', topic: 'javascript', kind: 'yesno', answer: true,
    text: 'Does `Promise.race` reject if the first promise to settle rejects?',
    explain: 'Yes. It settles the same way as whichever promise settles first, resolved or rejected.',
  },
  {
    id: 'js-spread-deep', topic: 'javascript', kind: 'yesno', answer: false,
    text: 'Does `{ ...obj }` deep-copy nested objects?',
    explain: 'No, it is a shallow copy: nested objects are shared. Use `structuredClone` for a deep copy.',
  },
  {
    id: 'js-includes-nan', topic: 'javascript', kind: 'yesno', answer: true,
    text: 'Does `[NaN].includes(NaN)` return true?',
    explain: 'Yes. `includes` uses SameValueZero, which matches NaN, while `indexOf(NaN)` returns -1.',
  },
  {
    id: 'js-interface-merge', topic: 'javascript', kind: 'yesno', answer: true,
    text: 'Are two TypeScript `interface` declarations with the same name merged into one?',
    explain: 'Yes, declaration merging combines their members. Type aliases with `type` cannot be merged.',
  },
]
