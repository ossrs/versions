.PHONY: clean build

build: src/.build

src/.build: src/*.js src/package.json Makefile
	cd src && npm install && rm -f src/.build && touch .build

clean: 
	rm -rf ./src/node_modules src/.build

