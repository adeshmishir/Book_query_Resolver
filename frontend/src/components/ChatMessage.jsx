import { BookSparkleIcon, UserIcon } from './icons.jsx'

function ChatMessage({ role, content, isTyping }) {
  const isUser = role === 'user'

  return (
    <div className={`message ${role}`}>
      <span className={`avatar ${role}`}>
        {isUser ? <UserIcon size={16} /> : <BookSparkleIcon size={16} strokeWidth={1.8} />}
      </span>
      <div className={`bubble ${role}`}>
        {isTyping ? (
          <span className="typing">
            <span className="dot" />
            <span className="dot" />
            <span className="dot" />
          </span>
        ) : (
          content
        )}
      </div>
    </div>
  )
}

export default ChatMessage