.PHONY: all clean

all:
	cd api && $(MAKE)
	cd api-gateway && $(MAKE)

clean:
	cd api && $(MAKE) clean

