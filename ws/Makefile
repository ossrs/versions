.PHONY: clean build

build: ./src/node_modules

./src/node_modules: src/*.js Makefile
	cd src && npm install

clean: 
	rm -rf ./src/node_modules

