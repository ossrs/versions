.PHONY: all clean

all:
	cd api && $(MAKE)
	cd ws && $(MAKE)
	cd im && $(MAKE)
	cd db-nodejs && $(MAKE)

clean:
	cd api && $(MAKE) clean
	cd ws && $(MAKE) clean
	cd im && $(MAKE) clean
	cd db-nodejs && $(MAKE) clean
