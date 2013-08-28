pdfs = $(shell IFS=$$'\n'; \
	for file in `cat data/pdfs.txt`; \
		do echo "build/dgt.hacienda.go.cr$$file" | sed 's/ /\\ /g'; \
	done)

txts = $(shell IFS=$$'\n'; \
	for file in `cat data/pdfs.txt`; \
		do echo "build/dgt.hacienda.go.cr$${file%%.pdf}.txt" | sed 's/ /\\ /g'; \
	done)

openbracket_replace := \(
openbracket := (
closebracket_replace := \)
closebracket := )

data/json/tablas.json: $(txts)
	node \
		scripts/tablas.js \
		$(subst $(closebracket),$(closebracket_replace),$(subst $(openbracket),$(openbracket_replace),$(txts)))

$(pdfs): data/pdfs.txt build/dgt.hacienda.go.cr
	path="$@"; \
	path="$${path// /%20}"; \
	path="$${path//ó/%C3%B3}"; \
	curl \
		--create-dirs \
		--progress-bar \
		--tr-encoding \
		--output "$@" \
		"http://$${path#build/}"

$(txts): $(pdfs)
	path="$@"; \
	pdftotext \
		-enc UTF-8 \
		-layout "$${path%%.txt}.pdf" "$@"

build:
	if [ ! -d $@ ]; then \
		mkdir $@; \
	else \
		touch $@; \
	fi

build/dgt.hacienda.go.cr: build
	if [ ! -d $@ ]; then \
		mkdir $@; \
	else \
		touch $@; \
	fi

clean:
	rm -rf build

.PHONY: clean
