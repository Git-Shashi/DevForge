# DevForge Project Report (LaTeX)

This folder contains the LaTeX source for the DevForge project report. The build outputs are placed in `report_file/`.

## Prerequisites (macOS, zsh)

You need a LaTeX distribution. The smallest, fast install is BasicTeX via Homebrew.

```zsh
# Install BasicTeX (minimal TeX Live)
brew install --cask basictex

# Add tlmgr to PATH for current shell (adjust version if needed)
export PATH="/Library/TeX/texbin:$PATH"

# Initialize tlmgr and update itself
sudo tlmgr update --self

# Install required packages
sudo tlmgr install latexmk fouriernc subcaption pgfplots tocbibind xcolor lipsum hyperref amsfonts amsmath longtable bibtex
```

If you prefer the full distribution (larger download), install:

```zsh
brew install --cask mactex
```

## Build

Using the provided Makefile:

```zsh
make
```

Or manually with latexmk:

```zsh
latexmk -pdf -interaction=nonstopmode -halt-on-error -outdir=report_file report.tex
mv -f report_file/report.pdf report_file/DevForge_Report.pdf
```

## Outputs

- `report_file/DevForge_Report.pdf` — Final compiled PDF

## Troubleshooting

- `command not found: pdflatex`: Ensure TeX Live binaries are on your PATH:
  ```zsh
  export PATH="/Library/TeX/texbin:$PATH"
  ```
- Missing package errors: install via tlmgr, e.g. `sudo tlmgr install <package>`.
- Bibliography not showing: run `latexmk -pdf` (it invokes BibTeX automatically). Ensure citations exist in `report.bib` and the key names match the `\cite{...}` keys.
