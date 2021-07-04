.PHONY: all clean

all:
	cd api && $(MAKE)
	cd websocket && $(MAKE)

clean:
	cd api && $(MAKE) clean
	cd websocket && $(MAKE) clean
