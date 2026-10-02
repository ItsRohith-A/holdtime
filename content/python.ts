import type { Card } from '../types'

/** Python. Written for Holdtime; MIT, like the rest. */
export const PYTHON: readonly Card[] = [
  { id: 'py-mutable-default', topic: 'python', kind: 'fact', text: '`def f(items=[])` creates the list once and shares it across calls. Default to None and create it inside.' },
  { id: 'py-is', topic: 'python', kind: 'fact', text: '`is` checks identity, `==` checks equality. Compare with None using `is None`.' },
  { id: 'py-fstring-equals', topic: 'python', kind: 'fact', text: '`f"{x=}"` prints both the name and the value, like `x=42` (Python 3.8+).' },
  { id: 'py-dict-order', topic: 'python', kind: 'fact', text: 'Dicts keep insertion order; the language guarantees it since Python 3.7.' },
  { id: 'py-enumerate-start', topic: 'python', kind: 'fact', text: '`enumerate(items, start=1)` numbers items from 1 instead of 0.' },
  { id: 'py-zip-strict', topic: 'python', kind: 'fact', text: '`zip(a, b, strict=True)` raises if the lengths differ, instead of silently stopping early (3.10+).' },
  { id: 'py-pathlib', topic: 'python', kind: 'fact', text: '`pathlib` joins paths with `/`: `Path("src") / "app.py"`.' },
  { id: 'py-counter', topic: 'python', kind: 'fact', text: '`Counter("banana").most_common(1)` gives `[("a", 3)]`.' },
  { id: 'py-walrus', topic: 'python', kind: 'fact', text: '`while (line := f.readline()):` assigns and tests in one step, with the walrus operator (3.8+).' },
  { id: 'py-match', topic: 'python', kind: 'fact', text: '`match`/`case` does structural pattern matching on shapes like `case {"type": "user", "id": id}:` (3.10+).' },
  { id: 'py-comprehension-scope', topic: 'python', kind: 'fact', text: 'A list comprehension has its own scope: its loop variable does not leak out (Python 3).' },
  { id: 'py-lru-cache', topic: 'python', kind: 'fact', text: '`@functools.cache` remembers results by argument; the arguments must be hashable.' },
  { id: 'py-slots', topic: 'python', kind: 'fact', text: '`__slots__` stops each instance from getting a `__dict__`, which saves memory for many small objects.' },
  { id: 'py-with', topic: 'python', kind: 'fact', text: '`with open(p) as f:` closes the file even when the block raises an exception.' },
  { id: 'py-generators', topic: 'python', kind: 'fact', text: 'A function with `yield` is a generator: it produces values one at a time, only when asked.' },
  { id: 'py-sort-stable', topic: 'python', kind: 'fact', text: '`sorted()` is stable: items with equal keys keep their original order, so you can sort in passes.' },
  { id: 'py-fixture-yield', topic: 'python', kind: 'fact', text: 'A pytest fixture that uses `yield` runs the code after the yield as teardown, once the test ends.' },
  { id: 'py-typeddict', topic: 'python', kind: 'fact', text: '`TypedDict` describes the keys of a dict for type checkers; nothing is checked at runtime.' },
  {
    id: 'py-float', topic: 'python', kind: 'yesno', answer: false,
    text: 'Is `0.1 + 0.2 == 0.3` true?',
    explain: 'Floating point gives 0.30000000000000004. Use `math.isclose(a, b)` to compare.',
  },
  {
    id: 'py-one-tuple', topic: 'python', kind: 'yesno', answer: false,
    text: 'Is `(1)` a tuple with one element?',
    explain: 'It is just the number 1 in brackets. A one-element tuple needs a comma: `(1,)`.',
  },
  {
    id: 'py-list-key', topic: 'python', kind: 'yesno', answer: false,
    text: 'Can a list be used as a dict key?',
    explain: 'No, lists are mutable and unhashable. Use a tuple instead.',
  },
  {
    id: 'py-reverse-slice', topic: 'python', kind: 'yesno', answer: true,
    text: 'Does `[1, 2, 3][::-1]` return a reversed copy?',
    explain: 'Yes, a step of -1 walks the list backwards and builds a new list.',
  },
  {
    id: 'py-round-half', topic: 'python', kind: 'yesno', answer: false,
    text: 'Does `round(2.5)` return 3?',
    explain: 'It returns 2. Python rounds halves to the nearest even number ("banker\'s rounding").',
  },
  {
    id: 'py-string-repeat', topic: 'python', kind: 'yesno', answer: true,
    text: 'Does `"ab" * 2` give `"abab"`?',
    explain: 'Yes, multiplying a string repeats it.',
  },
  {
    id: 'py-gil', topic: 'python', kind: 'yesno', answer: false,
    text: 'In standard CPython, can two threads run Python bytecode at the same instant?',
    explain: 'No, the GIL lets one thread run bytecode at a time. Free-threaded builds (3.13+) are the exception.',
  },
  {
    id: 'py-chained-assign', topic: 'python', kind: 'yesno', answer: false,
    text: 'Does `a = b = []` create two separate lists?',
    explain: 'No. Both names point at the same list, so appending through one shows in the other.',
  },
  {
    id: 'py-bool-int', topic: 'python', kind: 'yesno', answer: true,
    text: 'Is `bool` a subclass of `int`?',
    explain: 'Yes. `True == 1` and `sum([True, True])` is 2.',
  },
  {
    id: 'py-dict-get', topic: 'python', kind: 'yesno', answer: false,
    text: 'Does `d.get("missing")` raise a KeyError?',
    explain: 'No, it returns None, or the default you pass: `d.get("k", 0)`. `d["missing"]` raises.',
  },
  {
    id: 'py-keyboard-interrupt', topic: 'python', kind: 'yesno', answer: false,
    text: 'Does `except Exception:` catch a KeyboardInterrupt?',
    explain: 'No. KeyboardInterrupt derives from BaseException, not Exception, so Ctrl+C still stops the program.',
  },
  {
    id: 'py-str-mutable', topic: 'python', kind: 'yesno', answer: false,
    text: 'Can you change one character of a string in place, like `s[0] = "x"`?',
    explain: 'No, strings are immutable. Build a new one: `"x" + s[1:]`.',
  },
  {
    id: 'py-range-end', topic: 'python', kind: 'yesno', answer: false,
    text: 'Does `range(5)` include 5?',
    explain: 'No, it gives 0 to 4. The end of a range is excluded.',
  },
  {
    id: 'py-shallow-copy', topic: 'python', kind: 'yesno', answer: false,
    text: 'Does `copy.copy(outer)` also copy the lists nested inside `outer`?',
    explain: 'No, it is shallow: the nested lists are shared. Use `copy.deepcopy`.',
  },
  {
    id: 'py-sorted-in-place', topic: 'python', kind: 'yesno', answer: false,
    text: 'Does `sorted(items)` change `items`?',
    explain: 'No, it returns a new list. `items.sort()` sorts in place and returns None.',
  },
  {
    id: 'py-empty-braces', topic: 'python', kind: 'yesno', answer: false,
    text: 'Does `{}` create an empty set?',
    explain: 'It creates an empty dict. An empty set is `set()`.',
  },
  {
    id: 'py-generator-len', topic: 'python', kind: 'yesno', answer: false,
    text: 'Can you call `len()` on a generator?',
    explain: 'No, it raises TypeError: a generator does not know its length until it is used up.',
  },
  {
    id: 'py-default-eval', topic: 'python', kind: 'yesno', answer: true,
    text: 'Are default argument values evaluated once, when the function is defined?',
    explain: 'Yes. That is why a mutable default like `[]` is shared between calls.',
  },
]
