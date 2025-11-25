import { useState, useEffect } from 'react';

export default function App() {
  const [text, setText] = useState('Hello World');
  const [fontSize, setFontSize] = useState(72);
  const [fontPath, setFontPath] = useState(null);
  const [fontName, setFontName] = useState(null);
  const [fontData, setFontData] = useState(null);
  const [availableFonts, setAvailableFonts] = useState([]);
  const [svgData, setSvgData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fontType, setFontType] = useState('all'); // 'all', 'hershey', 'svg', 'opentype'
  const [pageSize, setPageSize] = useState('4x6'); // Page size in inches
  const [charSpacing, setCharSpacing] = useState(1.0); // Character spacing multiplier
  const [strokeWidth, setStrokeWidth] = useState(2); // Stroke width for rendering
  const [statusMessage, setStatusMessage] = useState('Ready'); // Status bar message
  const [pageRotated, setPageRotated] = useState(true); // Page rotation state - default to landscape

  // Status notification helper
  const showStatus = (message, duration = 3000) => {
    setStatusMessage(message);
    if (duration > 0) {
      setTimeout(() => setStatusMessage('Ready'), duration);
    }
  };

  // Load available fonts on mount
  useEffect(() => {
    const loadFonts = async () => {
      try {
        const result = await window.api.getAvailableFonts();
        if (result.success) {
          setAvailableFonts(result.fonts);

          // Auto-select first font if available
          if (result.fonts.length > 0) {
            handleSelectFont(result.fonts[0].path);
          }
        }
      } catch (err) {
        console.error('Failed to load fonts:', err);
      }
    };

    loadFonts();
  }, []);

  const handleSelectFont = async (path) => {
    try {
      showStatus('Loading font...', 0);
      const result = await window.api.loadFont(path);
      if (result.success) {
        setFontPath(path);
        setFontName(result.data.name);
        setFontData(result.data);
        setError(null);
        showStatus(`✓ Loaded: ${result.data.name}`);
      } else {
        setError(result.error);
        showStatus(`✗ Failed to load font`, 5000);
      }
    } catch (err) {
      setError(err.message);
      showStatus(`✗ Error: ${err.message}`, 5000);
    }
  };

  const generatePaths = async () => {
    if (!fontPath || !text) return;

    setLoading(true);
    setError(null);
    showStatus('Rendering...', 0);

    try {
      const result = await window.api.generatePaths({
        text,
        fontPath,
        fontSize,
        fontData,
        pageSize,
        charSpacing,
        strokeWidth,
        pageRotated
      });

      if (result.success) {
        setSvgData(result.data);
        const charCount = result.data.metadata.charCount;
        const lineCount = text.split(/\r?\n/).length;
        showStatus(`✓ Rendered ${charCount} chars, ${lineCount} line${lineCount > 1 ? 's' : ''}`);
      } else {
        setError(result.error);
        showStatus(`✗ Render failed`, 5000);
      }
    } catch (err) {
      setError(err.message);
      showStatus(`✗ Error: ${err.message}`, 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleExportSVG = async () => {
    if (!svgData) return;

    try {
      const result = await window.api.exportSVG(svgData);
      if (result.success) {
        showStatus(`✓ Exported to: ${result.path}`);
      } else {
        showStatus(`✗ Export failed: ${result.error}`, 5000);
      }
    } catch (err) {
      showStatus(`✗ Export failed: ${err.message}`, 5000);
    }
  };

  const handleExportJSON = async () => {
    if (!svgData) return;

    try {
      const result = await window.api.exportJSON(svgData);
      if (result.success) {
        showStatus(`✓ Exported to: ${result.path}`);
      } else {
        showStatus(`✗ Export failed: ${result.error}`, 5000);
      }
    } catch (err) {
      showStatus(`✗ Export failed: ${err.message}`, 5000);
    }
  };

  const handleCopySVG = () => {
    if (!svgData) return;

    navigator.clipboard.writeText(svgData.svg)
      .then(() => showStatus('✓ SVG copied to clipboard'))
      .catch((err) => showStatus(`✗ Copy failed: ${err.message}`, 5000));
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (fontPath && text) {
        generatePaths();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [text, fontSize, fontPath, fontData, pageSize, charSpacing, strokeWidth, pageRotated]);


  return (
    <div className="app">
      <header className="header">
        <div className="header-controls">
          <div className="control-group">
            <label>Font</label>
            {availableFonts.length > 0 ? (
              <select
                value={fontPath || ''}
                onChange={(e) => handleSelectFont(e.target.value)}
                className="header-select"
              >
                {availableFonts.map((font) => {
                  const prefix = font.type === 'svg' ? 'S' : font.type === 'hershey' ? 'H' : '';
                  const displayName = prefix ? `${prefix} · ${font.displayName}` : font.displayName;
                  return (
                    <option key={font.path} value={font.path}>
                      {displayName}
                    </option>
                  );
                })}
              </select>
            ) : (
              <span className="loading-text">Loading fonts...</span>
            )}
          </div>

          <div className="control-group">
            <label>Size</label>
            <div className="header-buttons">
              {[24, 48, 72, 96, 144].map(size => (
                <button
                  key={size}
                  onClick={() => setFontSize(size)}
                  className={fontSize === size ? 'header-btn active' : 'header-btn'}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div className="control-group">
            <label>Spacing</label>
            <div className="spacing-control">
              <button
                onClick={() => setCharSpacing(Math.max(0.1, charSpacing - 0.1))}
                className="spacing-btn"
              >
                −
              </button>
              <input
                type="number"
                value={charSpacing.toFixed(1)}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val) && val >= 0.1 && val <= 5.0) {
                    setCharSpacing(val);
                  }
                }}
                step="0.1"
                min="0.1"
                max="5.0"
                className="spacing-input"
              />
              <button
                onClick={() => setCharSpacing(Math.min(5.0, charSpacing + 0.1))}
                className="spacing-btn"
              >
                +
              </button>
            </div>
          </div>

          <div className="control-group">
            <label>Stroke</label>
            <div className="spacing-control">
              <button
                onClick={() => setStrokeWidth(Math.max(0.5, strokeWidth - 0.5))}
                className="spacing-btn"
              >
                −
              </button>
              <input
                type="number"
                value={strokeWidth.toFixed(1)}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val) && val >= 0.5 && val <= 10.0) {
                    setStrokeWidth(val);
                  }
                }}
                step="0.5"
                min="0.5"
                max="10.0"
                className="spacing-input"
              />
              <button
                onClick={() => setStrokeWidth(Math.min(10.0, strokeWidth + 0.5))}
                className="spacing-btn"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container">
        <aside className="sidebar">
          <section className="section">
            <div className="section-header">
              <h3>Page Size</h3>
              <button
                onClick={() => setPageRotated(!pageRotated)}
                className="rotate-btn"
                title="Rotate page 90°"
              >
                ↻
              </button>
            </div>
            <div className="page-size-grid">
              {[
                { label: '4×6"', value: '4x6' },
                { label: '5×8"', value: '5x8' },
                { label: '8×12"', value: '8x12' }
              ].map(size => (
                <button
                  key={size.value}
                  onClick={() => setPageSize(size.value)}
                  className={pageSize === size.value ? 'preset active' : 'preset'}
                >
                  {size.label}
                </button>
              ))}
            </div>
          </section>

          {error && (
            <div className="error">
              <strong>Error:</strong> {error}
            </div>
          )}

          {svgData && (
            <section className="section">
              <h3>Export</h3>
              <button onClick={handleExportSVG} className="btn">
                📥 Export SVG
              </button>
              <button onClick={handleExportJSON} className="btn">
                📥 Export JSON
              </button>
              <button
                onClick={handleCopySVG}
                className="btn"
              >
                📋 Copy SVG
              </button>
            </section>
          )}
        </aside>

        <main className="main-area">
          <div className="preview-area">
            {loading && <div className="loading">Generating...</div>}
            {svgData && !loading ? (
              <div
                className="svg-container"
                data-page-size={`Page: ${pageSize.replace('x', '″ × ')}″`}
                dangerouslySetInnerHTML={{ __html: svgData.svg }}
              />
            ) : (
              !loading && (
                <div className="empty">
                  <p>Enter text below to preview</p>
                </div>
              )
            )}
          </div>

          <div className="text-area">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter text to render..."
              className="main-textarea"
            />
          </div>
        </main>
      </div>

      <footer className="status-bar">
        <span className="status-message">{statusMessage}</span>
      </footer>
    </div>
  );
}
