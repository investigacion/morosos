DATS := $(shell csvfix printf -ifn -fmt "%s" data/pdfs.csv)
PDFS := $(DATS:%=data/pdf/%.pdf)
TXTS := $(DATS:%=data/txt/%.txt)

data/tsv/cedulas.tsv: scripts/cedulas.js $(TXTS)
	node scripts/cedulas.js $@ $(TXTS)

data/pdf/%.pdf:
	curl \
		--progress-bar \
		--compressed \
		--output "$@" \
		http://dgt.hacienda.go.cr$(shell csvfix find -e "$(basename $(@F))" data/pdfs.csv | csvfix printf -fmt "%@%s")

data/txt/%.txt: data/pdf/%.pdf
	pdf2txt.py \
		-o "$@" \
		-t text \
		-c utf-8 \
		-M 0.4 \
		-L 0.2 \
		"data/pdf/$(@F:.txt=.pdf)"

.PHONY: pdfs txts
