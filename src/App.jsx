import { useState, useEffect, useRef } from 'react';
import Tesseract from 'tesseract.js';

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
  const [ocrProgress, setOcrProgress] = useState(0); // OCR progress 0-100
  const [isOcrRunning, setIsOcrRunning] = useState(false); // OCR in progress
  const [showFontTest, setShowFontTest] = useState(false); // Font test modal
  const [fontTestResults, setFontTestResults] = useState([]); // Test render results
  const [showTemplateModal, setShowTemplateModal] = useState(false); // Template generator modal
  const svgContainerRef = useRef(null);

  // Template presets for Repaper A5 (210x148mm)
  const TEMPLATE_PRESETS = [
    { name: 'Lowercase (a-z)', chars: 'abcdefghijklmnopqrstuvwxyz', cols: 6, rows: 5 },
    { name: 'Uppercase (A-Z)', chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', cols: 6, rows: 5 },
    { name: 'Numbers + Punct', chars: '0123456789!@#$%&*()-+=', cols: 6, rows: 4 },
    { name: 'Common Letters', chars: 'etaoinshrdlu', cols: 4, rows: 3 },
    { name: 'Full Alpha (small)', chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', cols: 10, rows: 6 },
    { name: 'Custom', chars: '', cols: 6, rows: 4 }
  ];

  const [templatePreset, setTemplatePreset] = useState(TEMPLATE_PRESETS[0]);
  const [customChars, setCustomChars] = useState('');

  // Test strings for font rendering
  const TEST_STRINGS = [
    'The quick brown fox jumps over the lazy dog',
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    'abcdefghijklmnopqrstuvwxyz',
    '0123456789',
    '!@#$%^&*()_+-=[]{}|;:\'",.<>?'
  ];

  // Status notification helper
  const showStatus = (message, duration = 3000) => {
    setStatusMessage(message);
    if (duration > 0) {
      setTimeout(() => setStatusMessage('Ready'), duration);
    }
  };

  // Load available fonts on mount and setup menu event listeners
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

    // Setup menu event listeners
    window.api.onMenuUploadImage(() => handleImageUpload());
    window.api.onMenuLoadSample((samplePath) => handleLoadSample(samplePath));
    window.api.onMenuGlyphTemplate(() => setShowTemplateModal(true));
    window.api.onMenuFontMenu(() => openFontMenu());
    window.api.onMenuExportSVG(() => handleExportSVG());
    window.api.onMenuExportPNG(() => handleExportPNG());
    window.api.onMenuExportJPG(() => handleExportJPG());
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

  // Run OCR on image data
  const runOCR = async (imageData) => {
    setIsOcrRunning(true);
    setOcrProgress(0);
    showStatus('Running OCR...', 0);

    try {
      const ocrResult = await Tesseract.recognize(
        imageData,
        'eng',
        {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              setOcrProgress(Math.round(m.progress * 100));
            }
          }
        }
      );

      // Set extracted text
      const extractedText = ocrResult.data.text.trim();
      setText(extractedText);

      // Auto-scale page size based on text length and line count
      const lineCount = extractedText.split('\n').length;
      const charCount = extractedText.length;

      let newPageSize = '4x6';
      if (charCount > 2000 || lineCount > 50) {
        newPageSize = '12x24';
      } else if (charCount > 1500 || lineCount > 40) {
        newPageSize = '12x18';
      } else if (charCount > 1000 || lineCount > 30) {
        newPageSize = '9x12';
      } else if (charCount > 800 || lineCount > 20) {
        newPageSize = '8x12';
      } else if (charCount > 300 || lineCount > 10) {
        newPageSize = '5x8';
      }
      setPageSize(newPageSize);

      setIsOcrRunning(false);
      setOcrProgress(0);
      showStatus(`✓ OCR: ${charCount} chars, ${lineCount} lines → ${newPageSize}" page`);
    } catch (err) {
      setIsOcrRunning(false);
      setOcrProgress(0);
      showStatus(`✗ OCR failed: ${err.message}`, 5000);
    }
  };

  // OCR: Select image and extract text
  const handleImageUpload = async () => {
    try {
      const result = await window.api.selectImage();
      if (!result.success) {
        if (result.error !== 'No image selected') {
          showStatus(`✗ ${result.error}`, 5000);
        }
        return;
      }

      await runOCR(result.data);
    } catch (err) {
      showStatus(`✗ ${err.message}`, 5000);
    }
  };

  // Load and OCR a sample image
  const handleLoadSample = async (samplePath) => {
    try {
      const result = await window.api.loadSample(samplePath);
      if (!result.success) {
        showStatus(`✗ ${result.error}`, 5000);
        return;
      }

      await runOCR(result.data);
    } catch (err) {
      showStatus(`✗ ${err.message}`, 5000);
    }
  };

  // Open font menu and generate previews
  const openFontMenu = async () => {
    setShowFontTest(true);
    setFontTestResults([]);
    showStatus('Loading font previews...', 0);

    const results = [];
    const testText = TEST_STRINGS[0]; // Use pangram for preview

    for (const font of availableFonts) {
      try {
        // Load font
        const loadResult = await window.api.loadFont(font.path);
        if (!loadResult.success) {
          results.push({
            font: font,
            error: loadResult.error,
            svg: null
          });
          continue;
        }

        // Generate preview render (stroke paths only, no fill)
        const renderResult = await window.api.generatePaths({
          text: testText,
          fontPath: font.path,
          fontSize: 24,
          fontData: loadResult.data,
          pageSize: null, // Fit to content
          charSpacing: 1.0,
          strokeWidth: 1.5,
          pageRotated: false
        });

        if (renderResult.success) {
          results.push({
            font: font,
            error: null,
            svg: renderResult.data.svg
          });
        } else {
          results.push({
            font: font,
            error: renderResult.error,
            svg: null
          });
        }
      } catch (err) {
        results.push({
          font: font,
          error: err.message,
          svg: null
        });
      }
    }

    setFontTestResults(results);
    showStatus('Ready');
  };

  // Select font from menu and close
  const selectFontFromMenu = (fontPath) => {
    handleSelectFont(fontPath);
    setShowFontTest(false);
  };

  // Generate glyph capture template SVG
  const generateTemplate = () => {
    const chars = templatePreset.name === 'Custom' ? customChars : templatePreset.chars;
    if (!chars) return null;

    // US Letter dimensions in mm (portrait)
    const letterWidth = 215.9;
    const letterHeight = 279.4;

    // A5 template area in mm (landscape orientation)
    const templateWidth = 210;
    const templateHeight = 148;

    // Center the A5 area on letter paper
    const offsetX = (letterWidth - templateWidth) / 2;
    const offsetY = (letterHeight - templateHeight) / 2;

    const margin = 10;
    const labelHeight = 8;
    const cropMarkLength = 8;

    const cols = templatePreset.cols;
    const rows = templatePreset.rows;

    const cellWidth = (templateWidth - margin * 2) / cols;
    const cellHeight = (templateHeight - margin * 2) / rows;

    let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${letterWidth} ${letterHeight}" width="${letterWidth}mm" height="${letterHeight}mm">
  <style>
    .cell { fill: none; stroke: #ccc; stroke-width: 0.3; }
    .baseline { stroke: #ddd; stroke-width: 0.2; stroke-dasharray: 2,2; }
    .label { font-family: Arial, sans-serif; font-size: ${labelHeight * 0.6}px; fill: #999; text-anchor: middle; }
    .title { font-family: Arial, sans-serif; font-size: 4px; fill: #666; }
    .crop-mark { stroke: #000; stroke-width: 0.3; }
    .cut-label { font-family: Arial, sans-serif; font-size: 3px; fill: #999; }
  </style>
  <rect x="0" y="0" width="${letterWidth}" height="${letterHeight}" fill="white"/>

  <!-- Crop marks for cutting to A5 -->
  <!-- Top-left corner -->
  <line x1="${offsetX}" y1="${offsetY - cropMarkLength}" x2="${offsetX}" y2="${offsetY}" class="crop-mark"/>
  <line x1="${offsetX - cropMarkLength}" y1="${offsetY}" x2="${offsetX}" y2="${offsetY}" class="crop-mark"/>
  <!-- Top-right corner -->
  <line x1="${offsetX + templateWidth}" y1="${offsetY - cropMarkLength}" x2="${offsetX + templateWidth}" y2="${offsetY}" class="crop-mark"/>
  <line x1="${offsetX + templateWidth}" y1="${offsetY}" x2="${offsetX + templateWidth + cropMarkLength}" y2="${offsetY}" class="crop-mark"/>
  <!-- Bottom-left corner -->
  <line x1="${offsetX}" y1="${offsetY + templateHeight}" x2="${offsetX}" y2="${offsetY + templateHeight + cropMarkLength}" class="crop-mark"/>
  <line x1="${offsetX - cropMarkLength}" y1="${offsetY + templateHeight}" x2="${offsetX}" y2="${offsetY + templateHeight}" class="crop-mark"/>
  <!-- Bottom-right corner -->
  <line x1="${offsetX + templateWidth}" y1="${offsetY + templateHeight}" x2="${offsetX + templateWidth}" y2="${offsetY + templateHeight + cropMarkLength}" class="crop-mark"/>
  <line x1="${offsetX + templateWidth}" y1="${offsetY + templateHeight}" x2="${offsetX + templateWidth + cropMarkLength}" y2="${offsetY + templateHeight}" class="crop-mark"/>

  <text x="${letterWidth / 2}" y="${offsetY - 12}" class="cut-label" text-anchor="middle">Cut along crop marks (A5: 210 x 148 mm)</text>

  <!-- Template area border (light) -->
  <rect x="${offsetX}" y="${offsetY}" width="${templateWidth}" height="${templateHeight}" fill="none" stroke="#eee" stroke-width="0.2"/>

  <!-- Title inside template area -->
  <text x="${offsetX + margin}" y="${offsetY + margin - 2}" class="title">WriteTyper Glyph Template - ${templatePreset.name}</text>
`;

    for (let i = 0; i < chars.length && i < cols * rows; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = offsetX + margin + col * cellWidth;
      const y = offsetY + margin + row * cellHeight;
      const char = chars[i];

      // Cell rectangle
      svg += `  <rect x="${x}" y="${y}" width="${cellWidth}" height="${cellHeight}" class="cell"/>\n`;

      // Baseline guide (at 75% height)
      const baselineY = y + cellHeight * 0.75;
      svg += `  <line x1="${x + 2}" y1="${baselineY}" x2="${x + cellWidth - 2}" y2="${baselineY}" class="baseline"/>\n`;

      // Character label (small, in corner)
      svg += `  <text x="${x + cellWidth / 2}" y="${y + labelHeight}" class="label">${char === '&' ? '&amp;' : char === '<' ? '&lt;' : char === '>' ? '&gt;' : char}</text>\n`;
    }

    svg += `</svg>`;
    return svg;
  };

  // Download template as SVG
  const downloadTemplate = () => {
    const svg = generateTemplate();
    if (!svg) {
      showStatus('No characters to generate template', 3000);
      return;
    }

    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `glyph-template-${templatePreset.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showStatus('Template downloaded!');
  };

  // Export as PNG
  const handleExportPNG = async () => {
    if (!svgData) return;

    try {
      showStatus('Rendering PNG...', 0);
      const dataUrl = await svgToRaster('png');
      const result = await window.api.exportPNG(dataUrl);
      if (result.success) {
        showStatus(`✓ Exported to: ${result.path}`);
      } else {
        showStatus(`✗ Export failed: ${result.error}`, 5000);
      }
    } catch (err) {
      showStatus(`✗ Export failed: ${err.message}`, 5000);
    }
  };

  // Export as JPG
  const handleExportJPG = async () => {
    if (!svgData) return;

    try {
      showStatus('Rendering JPG...', 0);
      const dataUrl = await svgToRaster('jpeg');
      const result = await window.api.exportJPG(dataUrl);
      if (result.success) {
        showStatus(`✓ Exported to: ${result.path}`);
      } else {
        showStatus(`✗ Export failed: ${result.error}`, 5000);
      }
    } catch (err) {
      showStatus(`✗ Export failed: ${err.message}`, 5000);
    }
  };

  // Convert SVG to raster image (PNG or JPG)
  const svgToRaster = (format) => {
    return new Promise((resolve, reject) => {
      const svgEl = svgContainerRef.current?.querySelector('svg');
      if (!svgEl) {
        reject(new Error('No SVG to export'));
        return;
      }

      const svgData = new XMLSerializer().serializeToString(svgEl);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = svgEl.width.baseVal.value || 800;
        canvas.height = svgEl.height.baseVal.value || 600;

        const ctx = canvas.getContext('2d');
        // White background for JPG (no transparency)
        if (format === 'jpeg') {
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.drawImage(img, 0, 0);

        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL(`image/${format}`, 0.95));
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to render SVG'));
      };
      img.src = url;
    });
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
            <div className="font-row">
              <label>Font</label>
              <button
                className="gear-btn"
                onClick={openFontMenu}
                title="Font menu"
              >
                ⚙
              </button>
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
          </div>

          <div className="control-group">
            <label>Size</label>
            <div className="size-row">
              <select
                value={[12, 16, 20, 24, 32, 48, 64, 72, 96, 120, 144].includes(fontSize) ? fontSize : 'custom'}
                onChange={(e) => {
                  if (e.target.value !== 'custom') {
                    setFontSize(Number(e.target.value));
                  }
                }}
                className="header-select size-select"
              >
                {[12, 16, 20, 24, 32, 48, 64, 72, 96, 120, 144].map(size => (
                  <option key={size} value={size}>{size}pt</option>
                ))}
                <option value="custom">Custom</option>
              </select>
              <input
                type="number"
                value={fontSize}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val) && val >= 1 && val <= 999.99) {
                    // Round to 2 decimal places
                    setFontSize(Math.round(val * 100) / 100);
                  }
                }}
                step="0.01"
                min="1"
                max="999.99"
                className="size-input"
              />
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
          {isOcrRunning && (
            <section className="section">
              <h3>OCR Progress</h3>
              <div className="ocr-progress">
                <div
                  className="ocr-progress-bar"
                  style={{ width: `${ocrProgress}%` }}
                />
              </div>
              <span className="ocr-progress-text">{ocrProgress}%</span>
            </section>
          )}

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
                { label: '8×12"', value: '8x12' },
                { label: '9×12"', value: '9x12' },
                { label: '12×18"', value: '12x18' },
                { label: '12×24"', value: '12x24' }
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
                Export SVG
              </button>
              <button onClick={handleExportPNG} className="btn">
                Export PNG
              </button>
              <button onClick={handleExportJPG} className="btn">
                Export JPG
              </button>
              <button
                onClick={handleCopySVG}
                className="btn"
              >
                Copy SVG
              </button>
            </section>
          )}
        </aside>

        <main className="main-area">
          <div className="preview-area">
            {loading && <div className="loading">Generating...</div>}
            {svgData && !loading ? (
              <div
                ref={svgContainerRef}
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

      {/* Font Menu Modal */}
      {showFontTest && (
        <div className="modal-overlay" onClick={() => setShowFontTest(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Font Menu</h2>
              <button className="modal-close" onClick={() => setShowFontTest(false)}>×</button>
            </div>
            <div className="modal-body">
              <p className="test-string-info">Preview: "{TEST_STRINGS[0]}"</p>
              <p className="font-menu-hint">Click a font to select it. All fonts render as stroke paths for pen plotters.</p>
              {fontTestResults.length === 0 ? (
                <div className="loading">Loading font previews...</div>
              ) : (
                <div className="font-test-grid">
                  {fontTestResults.map((result, index) => (
                    <div
                      key={index}
                      className={`font-test-item ${result.error ? 'has-error' : ''} ${result.font.path === fontPath ? 'selected' : ''}`}
                      onClick={() => !result.error && selectFontFromMenu(result.font.path)}
                      style={{ cursor: result.error ? 'not-allowed' : 'pointer' }}
                    >
                      <div className="font-test-header">
                        <span className="font-test-name">{result.font.displayName}</span>
                        <span className="font-test-type">{result.font.type}</span>
                      </div>
                      {result.error ? (
                        <div className="font-test-error">{result.error}</div>
                      ) : (
                        <div
                          className="font-test-render"
                          dangerouslySetInnerHTML={{ __html: result.svg }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Template Generator Modal */}
      {showTemplateModal && (
        <div className="modal-overlay" onClick={() => setShowTemplateModal(false)}>
          <div className="modal template-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Glyph Capture Template</h2>
              <button className="modal-close" onClick={() => setShowTemplateModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p className="template-hint">Generate a template for capturing handwritten glyphs with your Repaper tablet. Print at A5 size (210×148mm landscape).</p>

              <div className="template-controls">
                <div className="template-control-group">
                  <label>Preset</label>
                  <select
                    value={templatePreset.name}
                    onChange={(e) => {
                      const preset = TEMPLATE_PRESETS.find(p => p.name === e.target.value);
                      if (preset) setTemplatePreset(preset);
                    }}
                    className="template-select"
                  >
                    {TEMPLATE_PRESETS.map(preset => (
                      <option key={preset.name} value={preset.name}>
                        {preset.name} ({preset.chars.length || 'custom'} chars)
                      </option>
                    ))}
                  </select>
                </div>

                {templatePreset.name === 'Custom' && (
                  <div className="template-control-group">
                    <label>Characters</label>
                    <input
                      type="text"
                      value={customChars}
                      onChange={(e) => setCustomChars(e.target.value)}
                      placeholder="Enter characters to include..."
                      className="template-input"
                    />
                  </div>
                )}

                <div className="template-control-group">
                  <label>Grid: {templatePreset.cols} × {templatePreset.rows}</label>
                  <span className="template-info">
                    {templatePreset.name === 'Custom'
                      ? `${customChars.length} characters`
                      : `${templatePreset.chars.length} characters`}
                  </span>
                </div>
              </div>

              <div className="template-preview">
                <div
                  className="template-preview-svg"
                  dangerouslySetInnerHTML={{ __html: generateTemplate() || '<p>Enter characters to preview</p>' }}
                />
              </div>

              <div className="template-actions">
                <button onClick={downloadTemplate} className="btn btn-primary">
                  Download SVG
                </button>
                <button onClick={() => setShowTemplateModal(false)} className="btn">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
