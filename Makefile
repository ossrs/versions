.PHONY: all clean

all:
	cd api && $(MAKE)
	cd ws && $(MAKE)

clean:
	cd api && $(MAKE) clean
	cd ws && $(MAKE) clean
