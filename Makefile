.PHONY: all clean

all:
	cd api && $(MAKE)
	cd im && $(MAKE)
	cd db-nodejs && $(MAKE)
	cd im-internal && $(MAKE)

clean:
	cd api && $(MAKE) clean
	cd im && $(MAKE) clean
	cd db-nodejs && $(MAKE) clean
	cd im-internal && $(MAKE) clean
