import { useCallback, useEffect, useRef } from 'react'
import { PaperclipIcon, SendIcon } from './icons.jsx'

function ChatInput({ value, onChange, onSend, disabled, onUploadClick, inputRef }) {
  const innerRef = useRef(null)

  const setRef = useCallback(
    (node) => {
      innerRef.current = node
      inputRef.current = node
    },
    [inputRef],
  )

  useEffect(() => {
    const el = innerRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }, [value])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSend()
    }
  }

  return (
    <form
      className="composer"
      onSubmit={(e) => {
        e.preventDefault()
        onSend()
      }}
    >
      <button
        type="button"
        className="attach-button"
        onClick={onUploadClick}
        aria-label="Upload a PDF"
        title="Upload a PDF"
      >
        <PaperclipIcon size={18} />
      </button>
      <textarea
        ref={setRef}
        value={value}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        placeholder="Ask anything about your book…"
        rows={1}
      />
      <button
        type="submit"
        className="send-button"
        disabled={disabled || !value.trim()}
        aria-label="Send message"
      >
        {disabled ? <span className="send-spinner" /> : <SendIcon size={17} />}
      </button>
      <span className="composer-hint">Enter to send · Shift + Enter for a new line</span>
    </form>
  )
}

export default ChatInput