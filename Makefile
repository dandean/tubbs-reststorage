REPORTER = dot

test:
	make server && make mocha

server:
	node test/server/server.js

mocha:
	./node_modules/.bin/mocha

.PHONY: test
