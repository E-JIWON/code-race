import { store } from '../../shared/storage'
import { LIBRARIES, blobUrl, libraryOf, type Snippet } from './snippets'

type Props = {
  snippet: Snippet
  disabled: boolean
  onPick: (snippet: Snippet) => void
}

export function CoursePicker({ snippet, disabled, onPick }: Props) {
  const lib = libraryOf(snippet.id)
  return (
    <>
      <nav className="libs">
        {LIBRARIES.map((l) => (
          <button
            key={l.id}
            className={l.id === lib.id ? 'on' : ''}
            disabled={disabled}
            onClick={() => onPick(l.items[0])}
          >
            {l.name}
          </button>
        ))}
      </nav>
      <p className="blurb">{lib.blurb}</p>
      <nav className="fns">
        {lib.items.map((x, i) => (
          <button key={x.id} className={x.id === snippet.id ? 'on' : ''} disabled={disabled} onClick={() => onPick(x)}>
            <span className="idx">{i + 1}</span>
            {x.title}
            {x.deep && <span className="deep">심화</span>}
            {store.get(`best:${x.id}`) !== null && <span className="check">✓</span>}
          </button>
        ))}
      </nav>

      <p className="about">
        {snippet.summary}
        <br />
        <a href={blobUrl(snippet)} target="_blank" rel="noreferrer">
          {snippet.repo}/{snippet.path}
        </a>
      </p>
    </>
  )
}
