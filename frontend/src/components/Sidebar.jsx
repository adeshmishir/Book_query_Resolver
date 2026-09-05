import { BookSparkleIcon, FileIcon, PlusIcon, TrashIcon } from './icons.jsx'
import UploadPanel from './UploadPanel.jsx'

function Sidebar({ appName, pdfInfo, isUploading, open, onUpload, onUploadClick, onNewChat, onClearChat }) {
  return (
    <aside className={`sidebar${open ? ' open' : ''}`}>
      <div className="sidebar-header">
        <div className="brand">
          <span className="brand-logo">
            <BookSparkleIcon size={20} strokeWidth={1.8} />
          </span>
          <span className="brand-name">{appName}</span>
        </div>
      </div>

      <div className="sidebar-body">
        <button type="button" className="new-chat-button" onClick={onNewChat}>
          <PlusIcon size={16} />
          New Chat
        </button>

        <h2 className="section-title">PDF Mode</h2>
        <UploadPanel isUploading={isUploading} onUpload={onUpload} onUploadClick={onUploadClick} />

        {pdfInfo ? (
          <div className="pdf-info">
            <div className="pdf-info-head">
              <FileIcon size={16} />
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

        <button type="button" className="clear-button" onClick={onClearChat}>
          <TrashIcon size={15} />
          Clear Chat
        </button>
      </div>
    </aside>
  )
}

export default Sidebar