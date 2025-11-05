# Simple Makefile to build the DevForge report

PDF=report_file/DevForge_Report.pdf
TEX=report.tex
OUTDIR=report_file

all: $(PDF)

$(PDF): $(TEX) $(wildcard chapters/*.tex) report.bib
	@mkdir -p $(OUTDIR)
	latexmk -pdf -interaction=nonstopmode -halt-on-error -outdir=$(OUTDIR) $(TEX)
	@# Rename final artifact for clarity
	@mv -f $(OUTDIR)/report.pdf $(PDF)

clean:
	latexmk -C -outdir=$(OUTDIR)
	@rm -f $(PDF)

.PHONY: all clean
