import { useCallback, useEffect, useRef, useState } from 'react'
import './App.css'
import Sidebar from './components/Sidebar.jsx'
import ChatHeader from './components/ChatHeader.jsx'
import ChatMessage from './components/ChatMessage.jsx'
import EmptyState from './components/EmptyState.jsx'
import ChatInput from './components/ChatInput.jsx'
import { AlertIcon } from './components/icons.jsx'

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

function App() {
  const [sessionId] = useState(generateSessionId)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isAsking, setIsAsking] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [pdfInfo, setPdfInfo] = useState(null)
  const [error, setError] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const fileInputRef = useRef(null)
  const scrollRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [messages, isAsking])

  useEffect(() => {
    if (!isAsking) inputRef.current?.focus()
  }, [isAsking])

  const openUpload = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

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

  async function sendMessage(messageOverride) {
    const message = (messageOverride ?? input).trim()
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
    setMessages([])
    setInput('')
    setSidebarOpen(false)
  }

  function newChat() {
    setMessages([])
    setInput('')
    setError('')
    setSidebarOpen(false)
  }

  function handleExample(prompt) {
    sendMessage(prompt)
  }

  return (
    <div className="app">
      <Sidebar
        appName="BookQuery AI"
        pdfInfo={pdfInfo}
        isUploading={isUploading}
        open={sidebarOpen}
        onUpload={handleUpload}
        onUploadClick={openUpload}
        onNewChat={newChat}
        onClearChat={clearChat}
      />

      {sidebarOpen && <div className="backdrop" onClick={() => setSidebarOpen(false)} />}

      <main className="chat">
        <ChatHeader
          title={pdfInfo ? 'Book mode' : 'General assistant'}
          pdfActive={!!pdfInfo}
          onMenuClick={() => setSidebarOpen(true)}
        />

        {error && (
          <div className="error-banner" role="alert">
            <AlertIcon size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className="messages" ref={scrollRef}>
          {messages.length === 0 ? (
            <EmptyState onExampleClick={handleExample} onUploadClick={openUpload} />
          ) : (
            messages.map((msg, i) =>
              msg.role === 'system' ? (
                <div key={i} className="system-note">
                  {msg.content}
                </div>
              ) : (
                <ChatMessage key={i} role={msg.role} content={msg.content} />
              ),
            )
          )}
          {isAsking && messages.length > 0 && <ChatMessage role="assistant" isTyping />}
        </div>

        <ChatInput
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onSend={sendMessage}
          disabled={isAsking}
          onUploadClick={openUpload}
          inputRef={inputRef}
        />

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          hidden
          onChange={(e) => handleUpload(e.target.files?.[0])}
        />
      </main>
    </div>
  )
}

export default App