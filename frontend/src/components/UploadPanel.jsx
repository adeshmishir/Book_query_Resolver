import { useState } from 'react'
import { UploadIcon } from './icons.jsx'

function UploadPanel({ isUploading, onUpload, onUploadClick }) {
  const [isDragging, setIsDragging] = useState(false)

  return (
    <div
      className={`dropzone${isDragging ? ' dragover' : ''}`}
      onClick={onUploadClick}
      onDragOver={(e) => {
        e.preventDefault()
        setIsDragging(true)
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setIsDragging(false)
        onUpload(e.dataTransfer.files?.[0])
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onUploadClick()
        }
      }}
    >
      <UploadIcon size={26} strokeWidth={1.8} />
      <span className="dropzone-title">{isUploading ? 'Loading PDF...' : 'Upload a PDF'}</span>
      <span className="dropzone-sub">or drag &amp; drop here</span>
    </div>
  )
}

export default UploadPanel