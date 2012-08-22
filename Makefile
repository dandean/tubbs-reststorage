REPORTER = dot

test:
	./node_modules/.bin/mocha

server:
	node test/server/server.js

.PHONY: test
