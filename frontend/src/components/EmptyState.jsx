import { BookSparkleIcon, UploadIcon } from './icons.jsx'

const EXAMPLES = [
  'Summarize this book',
  'What are the main ideas?',
  'Explain the key concepts',
  'What does chapter 3 discuss?',
]

function EmptyState({ onExampleClick, onUploadClick }) {
  return (
    <div className="empty-state">
      <div className="empty-illustration">
        <BookSparkleIcon size={40} strokeWidth={1.6} />
      </div>
      <h1 className="empty-title">Ask anything about your book</h1>
      <p className="empty-sub">
        Upload a PDF to get answers grounded in your document, or ask general questions.
      </p>
      <div className="example-prompts">
        {EXAMPLES.map((prompt) => (
          <button
            type="button"
            key={prompt}
            className="example-prompt"
            onClick={() => onExampleClick(prompt)}
          >
            {prompt}
          </button>
        ))}
      </div>
      <button type="button" className="empty-upload" onClick={onUploadClick}>
        <UploadIcon size={15} />
        Upload a PDF to begin
      </button>
    </div>
  )
}

export default EmptyState