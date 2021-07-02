.PHONY: clean build

build: ./src/main

./src/main: src/*.go Makefile
	cd src && GOOS=linux GOARCH=amd64 go build -mod vendor -o ./main .

clean: 
	rm -rf ./src/main

