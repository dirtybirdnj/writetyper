import React, { useState, useEffect } from 'react'
import './App.css'
import FontSelector from './components/FontSelector'
import TextInput from './components/TextInput'
import PreviewCanvas from './components/PreviewCanvas'
import ExportPanel from './components/ExportPanel'

export default function App() {
  const [text, setText] = useState('Hello World')
  const [fontSize, setFontSize] = useState(72)
  const [selectedFont, setSelectedFont] = useState(null)
  const [fontType, setFontType] = useState('hershey')
  const [svgData, setSvgData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const generatePaths = async () => {
    if (!selectedFont || !text) return
    setLoading(true)
    setError(null)

    try {
      const result = await window.api.generatePaths({
        text,
        fontPath: selectedFont.path,
        fontSize,
        fontType
      })

      if (result.success) {
        setSvgData(result.data)
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError(`Failed to generate paths: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (selectedFont && text) {
        generatePaths()
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [text, fontSize, selectedFont, fontType])

  return (
    <div className="app">
      <header className="app-header">
        <h1>🖊️ Handwriting Text Generator</h1>
        <p>Generate handwriting as SVG paths for artwork</p>
      </header>

      <div className="app-container">
        <aside className="control-panel">
          <section className="control-section">
            <h3>Font</h3>
            <FontSelector
              selectedFont={selectedFont}
              fontType={fontType}
              onFontSelect={setSelectedFont}
              onFontTypeChange={setFontType}
            />
          </section>

          <section className="control-section">
            <h3>Text Settings</h3>
            <TextInput
              text={text}
              fontSize={fontSize}
              onTextChange={setText}
              onFontSizeChange={setFontSize}
            />
          </section>

          {error && <div className="error-box"><strong>Error:</strong> {error}</div>}

          {loading && (
            <div className="info-box">
              <strong>Generating paths...</strong>
            </div>
          )}

          {svgData && (
            <section className="control-section">
              <h3>Export</h3>
              <ExportPanel svgData={svgData} />
            </section>
          )}
        </aside>

        <main className="preview-panel">
          {svgData ? (
            <PreviewCanvas svgData={svgData} />
          ) : (
            <div className="preview-empty">
              <p>Select a font and enter text to preview</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
