.PHONY: clean build

all: build
	sls deploy

build: .build

.build: *.js package.json Makefile
	npm install && rm -f .build && touch .build

clean: 
	rm -rf ./node_modules .build

