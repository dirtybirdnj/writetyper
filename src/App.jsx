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
      const result = await window.api.loadFont(path);
      if (result.success) {
        setFontPath(path);
        setFontName(result.data.name);
        setFontData(result.data);
        setError(null);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const generatePaths = async () => {
    if (!fontPath || !text) return;

    setLoading(true);
    setError(null);

    try {
      const result = await window.api.generatePaths({
        text,
        fontPath,
        fontSize,
        fontData
      });

      if (result.success) {
        setSvgData(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportSVG = async () => {
    if (!svgData) return;

    try {
      const result = await window.api.exportSVG(svgData);
      if (result.success) {
        alert(`Exported to: ${result.path}`);
      }
    } catch (err) {
      alert(`Export failed: ${err.message}`);
    }
  };

  const handleExportJSON = async () => {
    if (!svgData) return;

    try {
      const result = await window.api.exportJSON(svgData);
      if (result.success) {
        alert(`Exported to: ${result.path}`);
      }
    } catch (err) {
      alert(`Export failed: ${err.message}`);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (fontPath && text) {
        generatePaths();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [text, fontSize, fontPath, fontData]);

  return (
    <div className="app">
      <header className="header">
        <h1>✍️ WriteTyper</h1>
        <p>Generate handwriting as SVG paths</p>
      </header>

      <div className="container">
        <aside className="sidebar">
          <section className="section">
            <h3>Font</h3>
            {availableFonts.length > 0 ? (
              <select
                value={fontPath || ''}
                onChange={(e) => handleSelectFont(e.target.value)}
                className="font-select"
              >
                {availableFonts.map((font) => (
                  <option key={font.path} value={font.path}>
                    {font.displayName}
                  </option>
                ))}
              </select>
            ) : (
              <div className="info-message">
                <p>Downloading Hershey fonts...</p>
                <small>This happens once on first run</small>
              </div>
            )}
          </section>

          <section className="section">
            <h3>Text</h3>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter text..."
              rows="4"
            />
            <div className="char-count">{text.length} characters</div>
          </section>

          <section className="section">
            <h3>Font Size: {fontSize}px</h3>
            <input
              type="range"
              min="12"
              max="200"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
            />
            <div className="presets">
              {[24, 48, 72, 96, 144].map(size => (
                <button
                  key={size}
                  onClick={() => setFontSize(size)}
                  className={fontSize === size ? 'preset active' : 'preset'}
                >
                  {size}
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
                onClick={() => navigator.clipboard.writeText(svgData.svg)}
                className="btn"
              >
                📋 Copy SVG
              </button>
            </section>
          )}
        </aside>

        <main className="preview">
          {loading && <div className="loading">Generating...</div>}
          {svgData && !loading ? (
            <div
              className="svg-container"
              dangerouslySetInnerHTML={{ __html: svgData.svg }}
            />
          ) : (
            !loading && (
              <div className="empty">
                <p>Load a font and enter text to preview</p>
              </div>
            )
          )}
        </main>
      </div>
    </div>
  );
}
