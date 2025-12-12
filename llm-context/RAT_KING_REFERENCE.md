# rat-king Reference Architecture

> Architecture patterns from the rat-king project to apply to writetyper-cli.

## Overview

[rat-king](https://github.com/dirtybirdnj/rat-king) is a Rust CLI tool for generating vector fill patterns for pen plotters. It serves as the architectural reference for writetyper-cli.

**Repository:** `/Users/mgilbert/rat-king`

## Workspace Structure

```
rat-king/
├── crates/
│   ├── Cargo.toml              # Workspace manifest
│   ├── rat-king/               # Core library crate
│   │   ├── Cargo.toml
│   │   └── src/
│   │       ├── lib.rs          # Public exports
│   │       ├── geometry.rs     # Point, Line, Polygon
│   │       ├── clip.rs         # Line clipping
│   │       ├── hatch.rs        # Line generation
│   │       ├── svg.rs          # SVG parsing
│   │       └── patterns/       # Pattern generators
│   │           ├── mod.rs      # Pattern enum
│   │           ├── spiral.rs
│   │           └── ...
│   │
│   └── rat-king-cli/           # CLI binary crate
│       ├── Cargo.toml
│       └── src/
│           ├── main.rs         # Entry + TUI
│           └── cli/
│               ├── mod.rs
│               ├── fill.rs     # fill command
│               ├── benchmark.rs
│               └── ...
```

## CLI Pattern (No Framework)

rat-king uses manual argument parsing instead of clap:

```rust
// main.rs
fn main() -> Result<(), Box<dyn Error>> {
    let args: Vec<String> = std::env::args().collect();

    if args.len() >= 2 {
        match args[1].as_str() {
            "fill" => cmd_fill(&args[2..]),
            "benchmark" => cmd_benchmark(&args[2..]),
            "patterns" => cmd_patterns(&args[2..]),
            "fonts" => cmd_fonts(&args[2..]),
            "--help" | "-h" => print_help(),
            _ => {
                eprintln!("Unknown command: {}", args[1]);
                std::process::exit(1);
            }
        }
    } else {
        // Default behavior (TUI or help)
        run_tui()
    }
}
```

## Command Implementation Pattern

Each command in its own file:

```rust
// cli/fill.rs
pub fn cmd_fill(args: &[String]) -> Result<(), Box<dyn Error>> {
    let mut input_file = None;
    let mut output_file = None;
    let mut pattern = "lines";
    let mut spacing = 2.5;
    let mut angle = 45.0;
    let mut format = OutputFormat::Svg;

    let mut i = 0;
    while i < args.len() {
        match args[i].as_str() {
            "-p" | "--pattern" => {
                pattern = &args[i + 1];
                i += 2;
            }
            "-s" | "--spacing" => {
                spacing = args[i + 1].parse()?;
                i += 2;
            }
            "-o" | "--output" => {
                output_file = Some(&args[i + 1]);
                i += 2;
            }
            "--format" => {
                format = match args[i + 1].as_str() {
                    "json" => OutputFormat::Json,
                    _ => OutputFormat::Svg,
                };
                i += 2;
            }
            arg if !arg.starts_with('-') && input_file.is_none() => {
                input_file = Some(arg);
                i += 1;
            }
            _ => i += 1,
        }
    }

    // Execute command logic...
    Ok(())
}
```

## Output Handling Pattern

```rust
// Write to stdout or file
fn write_output(content: &str, output_path: Option<&str>) -> Result<()> {
    match output_path {
        Some(path) if path != "-" => {
            std::fs::write(path, content)?;
        }
        _ => {
            print!("{}", content);
        }
    }
    Ok(())
}
```

## Core Library Pattern

Library crate has no CLI dependencies:

```rust
// rat-king/src/lib.rs
pub mod geometry;
pub mod clip;
pub mod hatch;
pub mod svg;
pub mod patterns;

pub use geometry::{Point, Line, Polygon};
pub use patterns::Pattern;
```

## Geometry Types

```rust
// geometry.rs
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Point {
    pub x: f64,
    pub y: f64,
}

#[derive(Debug, Clone, Copy)]
pub struct Line {
    pub x1: f64,
    pub y1: f64,
    pub x2: f64,
    pub y2: f64,
}

impl Point {
    pub fn new(x: f64, y: f64) -> Self {
        Self { x, y }
    }

    pub fn distance(&self, other: &Point) -> f64 {
        let dx = self.x - other.x;
        let dy = self.y - other.y;
        (dx * dx + dy * dy).sqrt()
    }
}
```

## Pattern Enum Pattern

```rust
// patterns/mod.rs
pub enum Pattern {
    Lines,
    Crosshatch,
    Spiral,
    Honeycomb,
    // ...
}

impl Pattern {
    pub fn from_name(name: &str) -> Option<Self> {
        match name.to_lowercase().as_str() {
            "lines" => Some(Self::Lines),
            "crosshatch" => Some(Self::Crosshatch),
            "spiral" => Some(Self::Spiral),
            _ => None,
        }
    }

    pub fn generate(&self, polygon: &Polygon, spacing: f64, angle: f64) -> Vec<Line> {
        match self {
            Self::Lines => generate_lines_fill(polygon, spacing, angle),
            Self::Crosshatch => generate_crosshatch_fill(polygon, spacing, angle),
            Self::Spiral => generate_spiral_fill(polygon, spacing, angle),
            // ...
        }
    }

    pub fn all_names() -> &'static [&'static str] {
        &["lines", "crosshatch", "spiral", "honeycomb", ...]
    }
}
```

## SVG Output Pattern

```rust
// output/svg.rs
pub fn lines_to_svg(lines: &[Line], options: &SvgOptions) -> String {
    let mut svg = String::new();

    svg.push_str(&format!(
        r#"<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="{}" height="{}" viewBox="0 0 {} {}">
<g stroke="{}" stroke-width="{}" fill="none" stroke-linecap="round" stroke-linejoin="round">
"#,
        options.width, options.height,
        options.viewbox_width, options.viewbox_height,
        options.stroke_color, options.stroke_width
    ));

    for line in lines {
        svg.push_str(&format!(
            r#"<line x1="{:.2}" y1="{:.2}" x2="{:.2}" y2="{:.2}"/>"#,
            line.x1, line.y1, line.x2, line.y2
        ));
        svg.push('\n');
    }

    svg.push_str("</g>\n</svg>");
    svg
}
```

## JSON Output Pattern

```rust
// output/json.rs
use serde::Serialize;

#[derive(Serialize)]
pub struct JsonOutput {
    pub lines: Vec<JsonLine>,
    pub bounds: Bounds,
    pub stats: Stats,
}

#[derive(Serialize)]
pub struct JsonLine {
    pub x1: f64,
    pub y1: f64,
    pub x2: f64,
    pub y2: f64,
}

pub fn lines_to_json(lines: &[Line]) -> String {
    let output = JsonOutput {
        lines: lines.iter().map(|l| JsonLine {
            x1: l.x1, y1: l.y1, x2: l.x2, y2: l.y2
        }).collect(),
        // ...
    };
    serde_json::to_string_pretty(&output).unwrap()
}
```

## GitHub Actions Build

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    tags: ['v*']

jobs:
  build:
    strategy:
      matrix:
        include:
          - os: macos-latest
            target: aarch64-apple-darwin
            name: macos-aarch64
          - os: macos-latest
            target: x86_64-apple-darwin
            name: macos-x86_64
          - os: ubuntu-latest
            target: x86_64-unknown-linux-musl
            name: linux-x86_64

    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
        with:
          targets: ${{ matrix.target }}
      - run: cargo build --release --target ${{ matrix.target }}
      - uses: softprops/action-gh-release@v1
        with:
          files: target/${{ matrix.target }}/release/rat-king
```

## Key Takeaways for writetyper-cli

1. **Workspace layout** - Separate library and binary crates
2. **No CLI framework** - Simple match-based argument parsing
3. **Modular commands** - Each command in its own file
4. **Library independence** - Core crate has no CLI deps
5. **Multiple outputs** - SVG, JSON, with consistent patterns
6. **Streaming output** - Write to stdout by default
7. **GitHub Actions** - Cross-platform static binaries
