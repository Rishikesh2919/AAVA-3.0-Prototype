import { describe, it, expect } from 'vitest'
import { t1 } from './t1'
import { getScenario, routeBeat } from './index'

describe('t1 scenario', () => {
  it('has ten prep steps, each with a matching evidence block', () => {
    expect(t1.prep).toHaveLength(10)
    for (const step of t1.prep) {
      expect(t1.evidence[step.key], `evidence missing for ${step.key}`).toBeDefined()
    }
  })

  it('routes the demo phrases to the right beats', () => {
    expect(routeBeat(t1, 'run it')).toBe('run')
    expect(routeBeat(t1, 'show me the output')).toBe('run')
    expect(routeBeat(t1, "what's not covered?")).toBe('coverage')
    expect(routeBeat(t1, 'raise the PRs')).toBe('ship')
    expect(routeBeat(t1, 'what is the weather')).toBeNull()
  })

  it('routes "Show me the diff" to the diff beat, not run', () => {
    expect(routeBeat(t1, 'Show me the diff')).toBe('diff')
  })

  /* "Show agentic process steps" contains "show", which the preview rule matches —
     so this is really a test of router ORDER, and it fails the day someone
     appends the new rules to the bottom of the list. */
  it('routes the two review paths without the preview rule stealing them', () => {
    expect(routeBeat(t1, 'Show agentic process steps')).toBe('steps')
    expect(routeBeat(t1, 'Review the code changes')).toBe('files')
    expect(routeBeat(t1, 'run it')).toBe('run')
  })

  it('every file link opens a file the scenario actually has', () => {
    const links = t1.beats.files.flatMap((e) =>
      e.type === 'say' && e.block?.kind === 'links' ? e.block.links : [])
    expect(links).not.toHaveLength(0)
    for (const l of links) {
      expect(l.file, `"${l.label}" is not openable`).toBeDefined()
      expect(t1.files[l.file!], `no such file: ${l.file}`).toBeDefined()
    }
  })

  it('every chip sends text that routes to a beat', () => {
    for (const chips of Object.values(t1.chips)) {
      for (const chip of chips) {
        expect(routeBeat(t1, chip.sends), `chip "${chip.label}" routes nowhere`).not.toBeNull()
      }
    }
  })

  it('ships the form with Submit below the comment field', () => {
    const html = t1.files['feedback-form.component.html'].versions[0]
    expect(html.indexOf('play-button')).toBeGreaterThan(html.indexOf('play-character-counter'))
  })

  it('is registered under its task id', () => {
    expect(getScenario('T1')).toBe(t1)
    expect(getScenario('T3')).toBeNull()
  })
})
