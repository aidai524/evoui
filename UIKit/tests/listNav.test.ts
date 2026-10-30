// List navigation shared by Select (listbox) and Menu: disabled-skipping movement and type-ahead.
import { describe, expect, it } from 'vitest'
import { isTypeaheadKey, moveIndex, typeaheadIndex } from '../src/nui3/components/overlays/listNav'

const items = (spec: string) => [...spec].map((c) => ({ disabled: c === 'x' }))

describe('moveIndex', () => {
  //            0123456
  const list = items('x.x..x.')

  it('steps over disabled items', () => {
    expect(moveIndex(list, 1, 1)).toBe(3)
    expect(moveIndex(list, 3, -1)).toBe(1)
    expect(moveIndex(list, 4, 1)).toBe(6)
  })

  it('clamps at the ends without wrap (listbox)', () => {
    expect(moveIndex(list, 6, 1)).toBe(6)
    expect(moveIndex(list, 1, -1)).toBe(1)
  })

  it('wraps for menus, still skipping disabled', () => {
    expect(moveIndex(list, 6, 1, true)).toBe(1)
    expect(moveIndex(list, 1, -1, true)).toBe(6)
  })

  it('first / last are the first / last enabled', () => {
    expect(moveIndex(list, 4, 'first')).toBe(1)
    expect(moveIndex(list, 1, 'last')).toBe(6)
    expect(moveIndex(items('x..x'), -1, 'last')).toBe(2)
  })

  it('starts from the edge when nothing is active', () => {
    expect(moveIndex(list, -1, 1)).toBe(1)
    expect(moveIndex(list, -1, -1)).toBe(6)
  })

  it('page jumps land on an enabled item in the travel direction, else fall back', () => {
    const long = items('.........x.x')
    expect(moveIndex(long, 0, 10)).toBe(10)
    expect(moveIndex(long, 10, 10)).toBe(10) // already at the last enabled
    expect(moveIndex(long, 10, -10)).toBe(0)
    expect(moveIndex(items('..xxxx'), 0, 10)).toBe(1) // end is disabled → nearest enabled backwards
  })

  it('returns -1 when everything is disabled or the list is empty', () => {
    expect(moveIndex(items('xxx'), -1, 1)).toBe(-1)
    expect(moveIndex(items('xxx'), 0, 'first')).toBe(-1)
    expect(moveIndex(items('xxx'), 0, 1, true)).toBe(-1)
    expect(moveIndex([], 0, 1)).toBe(-1)
  })
})

describe('typeaheadIndex', () => {
  const names = ['Argentina', 'Australia', 'Austria', 'Belgium', 'Brazil', 'Canada', 'Éire', 'Türkiye']
  const none = names.map(() => false)

  it('finds the first item starting with the query', () => {
    expect(typeaheadIndex(names, none, 'b', -1)).toBe(3)
    expect(typeaheadIndex(names, none, 'aus', -1)).toBe(1)
    expect(typeaheadIndex(names, none, 'austr', 0)).toBe(1)
    expect(typeaheadIndex(names, none, 'austri', 1)).toBe(2)
  })

  it('keeps the current match while the query grows', () => {
    expect(typeaheadIndex(names, none, 'br', 4)).toBe(4)
  })

  it('cycles through items when one letter is repeated', () => {
    expect(typeaheadIndex(names, none, 'a', 0)).toBe(1)
    expect(typeaheadIndex(names, none, 'aa', 1)).toBe(2)
    expect(typeaheadIndex(names, none, 'aaa', 2)).toBe(0) // wraps
  })

  it('ignores case and accents', () => {
    expect(typeaheadIndex(names, none, 'E', -1)).toBe(6)
    expect(typeaheadIndex(names, none, 'tu', -1)).toBe(7)
    expect(typeaheadIndex(names, none, 'CAN', -1)).toBe(5)
  })

  it('skips disabled items (array or predicate)', () => {
    const disabled = names.map((n) => n === 'Australia')
    expect(typeaheadIndex(names, disabled, 'au', -1)).toBe(2)
    expect(typeaheadIndex(names, (i) => i === 3, 'b', -1)).toBe(4)
  })

  it('returns -1 for no match or an empty query', () => {
    expect(typeaheadIndex(names, none, 'z', 0)).toBe(-1)
    expect(typeaheadIndex(names, none, '', 0)).toBe(-1)
    expect(typeaheadIndex([], [], 'a', -1)).toBe(-1)
  })
})

describe('isTypeaheadKey', () => {
  const k = (key: string, mods: Partial<Record<'ctrlKey' | 'metaKey' | 'altKey', boolean>> = {}) => ({ key, ctrlKey: false, metaKey: false, altKey: false, ...mods })
  it('accepts printable characters without modifiers', () => {
    expect(isTypeaheadKey(k('a'))).toBe(true)
    expect(isTypeaheadKey(k(' '))).toBe(true)
    expect(isTypeaheadKey(k('ArrowDown'))).toBe(false)
    expect(isTypeaheadKey(k('c', { metaKey: true }))).toBe(false)
    expect(isTypeaheadKey(k('a', { ctrlKey: true }))).toBe(false)
  })
})
