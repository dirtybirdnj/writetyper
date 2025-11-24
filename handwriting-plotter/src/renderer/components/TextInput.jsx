import React from 'react'

export default function TextInput({ text, fontSize, onTextChange, onFontSizeChange }) {
  return (
    <div className="text-input">
      <div className="form-group">
        <label htmlFor="text">Text to Plot:</label>
        <textarea
          id="text"
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder="Enter text here..."
          rows="4"
          className="textarea"
        />
      </div>

      <div className="form-group">
        <label htmlFor="fontSize">Font Size: {fontSize}px</label>
        <input
          id="fontSize"
          type="range"
          min="12"
          max="200"
          value={fontSize}
          onChange={(e) => onFontSizeChange(Number(e.target.value))}
          className="slider"
        />
        <div className="size-presets">
          {[24, 48, 72, 96, 144].map((size) => (
            <button
              key={size}
              onClick={() => onFontSizeChange(size)}
              className={`size-preset ${fontSize === size ? 'active' : ''}`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      <div className="char-count">
        {text.length} characters
      </div>
    </div>
  )
}
