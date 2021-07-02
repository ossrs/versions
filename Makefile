.PHONY: all clean

all:
	cd api && $(MAKE)

clean:
	cd api && $(MAKE) clean
