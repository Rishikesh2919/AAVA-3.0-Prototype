import Editor from '@monaco-editor/react'
import type { PlaygroundState, Scenario } from '../../state/types'
import '../../monaco'

const LANG: Record<string, string> = { html: 'html', ts: 'typescript', scss: 'scss', json: 'json' }

/** The editor is real: what you type here is what the preview renders. */
export function Code({ scenario, pg, theme, onFile, onEdit, file }: {
  scenario: Scenario
  pg: PlaygroundState
  theme: 'dark' | 'light'
  onFile: (f: string) => void
  onEdit: (file: string, text: string) => void
  /* Set when the workspace hosts this editor as a per-file tab. The tab bar is
     then the file switcher, so the internal strip would be the second one. */
  file?: string
}) {
  const active = file ?? pg.activeFile ?? scenario.fileOrder[0]
  const version = pg.fileVersions[active] ?? 0
  /* `@@` marks the changed lines in the scripted version for the diff view;
     the editor shows the file itself, not the annotation. */
  const scripted = scenario.files[active].versions[version].replaceAll('@@', '')
  const value = pg.edits[active] ?? scripted
  const dirty = pg.edits[active] !== undefined && pg.edits[active] !== scripted

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Hosted as a file tab with a clean file, this row has nothing in it —
          and an empty row is 8px of dead space above every editor. */}
      {(!file || dirty) && (
      <div className="mb-2 flex flex-wrap items-center gap-1">
        {!file && scenario.fileOrder.map((f) => (
          <button key={f} onClick={() => onFile(f)}
            className="mono rounded-[var(--r-sm)] px-2.5 py-1.5 text-[11px] transition-colors"
            style={{
              background: f === active ? 'var(--wash-4)' : 'transparent',
              color: f === active ? 'var(--text)' : 'var(--muted-deep)',
            }}>
            {f}
            {((pg.fileVersions[f] ?? 0) > 0 || pg.edits[f] !== undefined) && (
              <span style={{ color: 'var(--aurora-2)' }}> ●</span>
            )}
          </button>
        ))}
        {dirty && (
          <button
            onClick={() => onEdit(active, scripted)}
            className="mono ml-auto rounded-[var(--r-sm)] px-2 py-1.5 text-[10.5px] transition-colors hover:bg-[var(--wash-3)]"
            style={{ color: 'var(--muted)' }}
          >
            Revert
          </button>
        )}
      </div>
      )}

      {/* min-h-0 + flex-1: Monaco measures its container, and an auto-height
          parent measures Monaco. One of the two has to commit to a size. */}
      <div className="min-h-0 flex-1 overflow-hidden rounded-[var(--r-sm)]"
        style={{ border: '1px solid var(--glass-line-soft)' }}>
        <Editor
          height="100%"
          path={active}
          language={LANG[active.split('.').pop() ?? ''] ?? 'plaintext'}
          value={value}
          theme={theme === 'dark' ? 'vs-dark' : 'vs'}
          onChange={(text) => onEdit(active, text ?? '')}
          loading={<span className="mono text-[11px]" style={{ color: 'var(--muted-deep)' }}>Loading editor…</span>}
          options={{
            fontSize: 12,
            lineHeight: 20,
            fontFamily: 'var(--font-mono, ui-monospace)',
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            renderLineHighlight: 'none',
            padding: { top: 10, bottom: 10 },
            tabSize: 2,
            automaticLayout: true,
          }}
        />
      </div>
    </div>
  )
}
