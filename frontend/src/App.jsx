import { useCallback, useEffect, useRef, useState } from 'react'
import './App.css'

const API_BASE = '/api'

async function readResponse(res) {
  const text = await res.text()
  try {
    return JSON.parse(text)
  } catch {
    return { detail: text || `Request failed (${res.status})` }
  }
}

function generateSessionId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `session-${Date.now()}`
}

const WELCOME_MESSAGE = {
  role: 'assistant',
  content:
    'Hello. Ask me anything. If you upload a PDF, I can answer using that document too.',
}

function AssistantIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function App() {
  const [sessionId] = useState(generateSessionId)
  const [messages, setMessages] = useState([WELCOME_MESSAGE])
  const [input, setInput] = useState('')
  const [isAsking, setIsAsking] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [pdfInfo, setPdfInfo] = useState(null)
  const [error, setError] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef(null)
  const scrollRef = useRef(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [messages, isAsking])

  const handleUpload = useCallback(
    async (file) => {
      if (!file || isUploading) return
      setIsUploading(true)
      setError('')
      const formData = new FormData()
      formData.append('session_id', sessionId)
      formData.append('file', file)

      try {
        const res = await fetch(`${API_BASE}/upload`, {
          method: 'POST',
          body: formData,
        })
        const data = await readResponse(res)
        if (!res.ok) throw new Error(data.detail || 'Upload failed')
        setPdfInfo(data)
        setMessages((prev) => [
          ...prev,
          {
            role: 'system',
            content: `PDF ready: ${data.filename} (${data.pages} pages, ${data.chunks} chunks)`,
          },
        ])
      } catch (err) {
        setError(err.message)
      } finally {
        setIsUploading(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    },
    [sessionId, isUploading],
  )

  async function sendMessage() {
    const message = input.trim()
    if (!message || isAsking) return

    setMessages((prev) => [...prev, { role: 'user', content: message }])
    setInput('')
    setIsAsking(true)
    setError('')

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, session_id: sessionId }),
      })
      const data = await readResponse(res)
      if (!res.ok) throw new Error(data.detail || 'Request failed')
      setMessages((prev) => [...prev, { role: 'assistant', content: data.answer }])
    } catch (err) {
      setError(err.message)
    } finally {
      setIsAsking(false)
    }
  }

  async function clearChat() {
    setError('')
    try {
      await fetch(`${API_BASE}/clear`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ session_id: sessionId }),
      })
    } catch {
      // server reset is best-effort; clear the UI regardless
    }
    setPdfInfo(null)
    setMessages([WELCOME_MESSAGE])
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="brand">
            <span className="brand-logo">
              <AssistantIcon />
            </span>
            <span className="brand-name">Book Query Resolver</span>
          </div>
          <p className="app-subtitle">Chat with the assistant, with optional PDF context.</p>
        </div>

        <div className="sidebar-body">
          <h2 className="section-title">PDF Mode</h2>

          <div
            className={`dropzone${isDragging ? ' dragover' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault()
              setIsDragging(false)
              handleUpload(e.dataTransfer.files?.[0])
            }}
          >
            <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <span className="dropzone-title">{isUploading ? 'Loading PDF...' : 'Upload a PDF'}</span>
            <span className="dropzone-sub">or drag &amp; drop here</span>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            hidden
            onChange={(e) => handleUpload(e.target.files?.[0])}
          />

          {pdfInfo ? (
            <div className="pdf-info">
              <div className="pdf-info-head">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                <span className="pdf-status">Using PDF context</span>
              </div>
              <div className="pdf-name">{pdfInfo.filename}</div>
              <div className="pdf-meta">
                {pdfInfo.pages} pages · {pdfInfo.chunks} chunks
              </div>
            </div>
          ) : (
            <p className="hint">Upload a PDF to answer questions using that document.</p>
          )}

          <button type="button" className="clear-button" onClick={clearChat}>
            Clear chat
          </button>
        </div>
      </aside>

      <main className="chat">
        <header className="chat-header">
          <span className="chat-title">
            {pdfInfo ? 'PDF mode active' : 'General assistant'}
          </span>
          <span className={`status-dot${pdfInfo ? ' online' : ''}`} />
        </header>

        <div className="messages" ref={scrollRef}>
          {messages.map((msg, i) => {
            if (msg.role === 'system') {
              return (
                <div key={i} className="system-note">
                  {msg.content}
                </div>
              )
            }
            return (
              <div key={i} className={`message ${msg.role}`}>
                <span className={`avatar ${msg.role}`}>
                  {msg.role === 'user' ? <UserIcon /> : <AssistantIcon />}
                </span>
                <div className={`bubble ${msg.role}`}>{msg.content}</div>
              </div>
            )
          })}
          {isAsking && (
            <div className="message assistant">
              <span className="avatar assistant">
                <AssistantIcon />
              </span>
              <div className="bubble assistant typing">
                <span className="dot" />
                <span className="dot" />
                <span className="dot" />
              </div>
            </div>
          )}
        </div>

        {error && <div className="error">{error}</div>}

        <form
          className="composer"
          onSubmit={(e) => {
            e.preventDefault()
            sendMessage()
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message"
            disabled={isAsking}
          />
          <button type="submit" disabled={!input.trim() || isAsking}>
            {isAsking ? 'Sending...' : 'Send'}
          </button>
        </form>
      </main>
    </div>
  )
}

export default App