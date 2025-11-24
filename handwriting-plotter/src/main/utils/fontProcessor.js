import opentype from 'opentype.js'
import fs from 'fs/promises'
import path from 'path'

export class FontProcessor {
  constructor() {
    this.loadedFonts = new Map()
  }

  async loadFont(fontPath) {
    try {
      if (this.loadedFonts.has(fontPath)) {
        return this.loadedFonts.get(fontPath)
      }

      const buffer = await fs.readFile(fontPath)
      const font = opentype.parse(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength))
      this.loadedFonts.set(fontPath, font)
      
      return {
        name: font.names.fontFamily.en || 'Unknown',
        unitsPerEm: font.unitsPerEm,
        ascender: font.ascender,
        descender: font.descender,
        path: fontPath
      }
    } catch (error) {
      throw new Error(`Failed to load font: ${error.message}`)
    }
  }

  async loadHersheyFont(fontPath) {
    try {
      const svgContent = await fs.readFile(fontPath, 'utf-8')
      const glyphRegex = /<glyph[^>]*unicode="([^"]*)"[^>]*d="([^"]*)"[^>]*\/>/g
      const glyphs = new Map()
      let match

      while ((match = glyphRegex.exec(svgContent)) !== null) {
        const char = match[1]
        const pathData = match[2]
        glyphs.set(char, pathData)
      }

      return {
        name: path.basename(fontPath, '.svg'),
        type: 'hershey',
        glyphs,
        path: fontPath
      }
    } catch (error) {
      throw new Error(`Failed to load Hershey font: ${error.message}`)
    }
  }

  async generateOpenTypePaths(text, fontPath, fontSize = 72) {
    try {
      const font = this.loadedFonts.get(fontPath)
      if (!font) throw new Error('Font not loaded.')

      const paths = []
      let x = 0
      let y = fontSize

      for (const char of text) {
        const path = font.getPath(char, x, y, fontSize)
        if (path) {
          paths.push({
            character: char,
            svg: path.toSVG(),
            commands: path.commands,
            bounds: path.getBounds()
          })
          const glyph = font.charToGlyph(char)
          x += (glyph.advanceWidth * fontSize) / font.unitsPerEm
        }
      }

      const svg = this.generateSVG(paths, fontSize)
      return {
        text,
        paths,
        svg,
        metadata: {
          fontPath,
          fontSize,
          charCount: text.length,
          type: 'opentype'
        }
      }
    } catch (error) {
      throw new Error(`Failed to generate paths: ${error.message}`)
    }
  }

  async generateHersheyPaths(text, fontPath, fontSize = 72) {
    try {
      const font = this.loadedFonts.get(fontPath)
      if (!font || !font.glyphs) throw new Error('Hershey font not loaded.')

      const paths = []
      let x = 0

      for (const char of text) {
        const pathData = font.glyphs.get(char)
        if (pathData) {
          paths.push({
            character: char,
            pathData,
            x,
            y: 0
          })
          x += fontSize * 0.6
        } else if (char === ' ') {
          x += fontSize * 0.3
        }
      }

      const svg = this.generateHersheySVG(paths, fontSize)
      return {
        text,
        paths,
        svg,
        metadata: {
          fontPath,
          fontSize,
          charCount: text.length,
          type: 'hershey'
        }
      }
    } catch (error) {
      throw new Error(`Failed to generate Hershey paths: ${error.message}`)
    }
  }

  generateSVG(paths, fontSize) {
    let totalWidth = 0
    let totalHeight = fontSize

    for (const path of paths) {
      if (path.bounds) {
        totalWidth = Math.max(totalWidth, path.bounds.x2)
        totalHeight = Math.max(totalHeight, path.bounds.y2)
      }
    }

    const padding = 20
    const viewBox = `0 0 ${totalWidth + padding * 2} ${totalHeight + padding * 2}`

    let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${totalWidth + padding * 2}" height="${totalHeight + padding * 2}">
  <style>
    path { fill: none; stroke: black; stroke-width: 1; stroke-linecap: round; stroke-linejoin: round; }
  </style>
  <g transform="translate(${padding}, ${padding})">
`

    for (const path of paths) {
      svg += `    <path d="${this.extractPathData(path.commands)}" />\n`
    }

    svg += `  </g>
</svg>`

    return svg
  }

  generateHersheySVG(paths, fontSize) {
    const padding = 20
    const width = Math.max(500, paths.length * fontSize * 0.6 + padding * 2)
    const height = fontSize + padding * 2
    const viewBox = `0 0 ${width} ${height}`

    let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${width}" height="${height}">
  <style>
    path { fill: none; stroke: black; stroke-width: 1; stroke-linecap: round; stroke-linejoin: round; }
  </style>
  <g transform="translate(${padding}, ${padding + fontSize * 0.7})">
`

    for (const path of paths) {
      svg += `    <path d="${path.pathData}" transform="translate(${path.x}, ${path.y}) scale(${fontSize / 1000})" />\n`
    }

    svg += `  </g>
</svg>`

    return svg
  }

  extractPathData(commands) {
    let pathData = ''
    for (const cmd of commands) {
      switch (cmd.type) {
        case 'M':
          pathData += `M${cmd.x},${cmd.y} `
          break
        case 'L':
          pathData += `L${cmd.x},${cmd.y} `
          break
        case 'Q':
          pathData += `Q${cmd.x1},${cmd.y1} ${cmd.x},${cmd.y} `
          break
        case 'C':
          pathData += `C${cmd.x1},${cmd.y1} ${cmd.x2},${cmd.y2} ${cmd.x},${cmd.y} `
          break
        case 'Z':
          pathData += 'Z '
          break
      }
    }
    return pathData
  }

  async writeSVG(filePath, svgData) {
    const svg = typeof svgData === 'string' ? svgData : svgData.svg
    await fs.writeFile(filePath, svg, 'utf-8')
  }

  async writeJSON(filePath, pathData) {
    const json = JSON.stringify(pathData, null, 2)
    await fs.writeFile(filePath, json, 'utf-8')
  }
}
