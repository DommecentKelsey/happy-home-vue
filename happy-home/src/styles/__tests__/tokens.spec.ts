import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect } from 'vitest'

// Vitest runs from the project root; read the real file (CSS imports are stubbed in tests).
const css = readFileSync(resolve(process.cwd(), 'src/styles/tokens.css'), 'utf8')

type Theme = Record<string, string>

function declarations(body: string): Theme {
  const out: Theme = {}
  for (const m of body.matchAll(/--color-([a-z-]+):\s*(#[0-9A-Fa-f]{6});/g))
    out[m[1]!] = m[2]!.toLowerCase()
  return out
}

function forced(theme: string): Theme {
  const m = css.match(new RegExp(`:root\\[data-theme='${theme}'\\]\\s*\\{([^}]*)\\}`))
  if (!m) throw new Error(`missing data-theme=${theme} block`)
  return declarations(m[1]!)
}

function media(query: string): Theme {
  const m = css.match(new RegExp(`@media \\(${query}\\)\\s*\\{\\s*:root\\s*\\{([^}]*)\\}`))
  if (!m) throw new Error(`missing @media (${query}) block`)
  return declarations(m[1]!)
}

const light = declarations(css.match(/^:root\s*\{([^}]*)\}/m)![1]!)
const themes = {
  light,
  dark: forced('dark'),
  'high-contrast': forced('high-contrast'),
}

// Names from the Figma "Theme" collection (each with WEB syntax var(--color-<name>)).
const figmaTokens = [
  'bg',
  'on-bg',
  'surface',
  'surface-border',
  'text',
  'text-muted',
  'icon-muted',
  'box',
  'box-border',
  'primary',
  'primary-disabled',
  'on-primary',
  'error',
  'error-bg',
  'warning',
  'focus',
]

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }) as [number, number, number]
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number]
  return (hi + 0.05) / (lo + 0.05)
}

describe('theme tokens', () => {
  it.each(Object.entries(themes))('%s defines every Figma token', (_name, theme) => {
    expect(Object.keys(theme).sort()).toEqual([...figmaTokens].sort())
  })

  it('the system media queries match the forced themes', () => {
    expect(media('prefers-color-scheme: dark')).toEqual(themes.dark)
    expect(media('prefers-contrast: more')).toEqual(themes['high-contrast'])
  })

  it('applies the contrast fixes agreed in design.md', () => {
    expect(themes.light['text-muted']).toBe('#707070')
    expect(themes['high-contrast'].error).toBe('#ff6b6b')
  })
})

// [foreground, background, kind]
const textPairs: [string, string][] = [
  ['text', 'surface'],
  ['text-muted', 'surface'],
  ['error', 'surface'],
  ['warning', 'surface'],
  ['on-primary', 'primary'],
  ['on-bg', 'bg'],
]
const largeOrGraphicPairs: [string, string][] = [
  ['text', 'box'], // 48px digits
  ['icon-muted', 'surface'], // close icon
  ['focus', 'surface'], // focus ring
  ['on-primary', 'primary-disabled'], // spinner
]

describe.each(Object.entries(themes))('contrast in %s', (name, theme) => {
  const textMin = name === 'high-contrast' ? 7 : 4.5
  it.each(textPairs)(`text %s on %s is at least ${textMin}:1`, (fg, bg) => {
    expect(contrast(theme[fg]!, theme[bg]!)).toBeGreaterThanOrEqual(textMin)
  })
  it.each(largeOrGraphicPairs)('large text/icon %s on %s is at least 3:1', (fg, bg) => {
    expect(contrast(theme[fg]!, theme[bg]!)).toBeGreaterThanOrEqual(3)
  })
})
