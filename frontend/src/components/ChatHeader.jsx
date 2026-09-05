import { FileCheckIcon, MenuIcon } from './icons.jsx'

function ChatHeader({ title, pdfActive, onMenuClick }) {
  return (
    <header className="chat-header">
      <button type="button" className="menu-button" onClick={onMenuClick} aria-label="Open sidebar">
        <MenuIcon size={20} />
      </button>
      <span className="chat-title">{title}</span>
      <span className={`status-pill${pdfActive ? ' online' : ''}`}>
        <FileCheckIcon size={13} strokeWidth={2.4} />
        {pdfActive ? 'Book mode' : 'General'}
      </span>
    </header>
  )
}

export default ChatHeader