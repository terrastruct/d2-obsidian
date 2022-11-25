.POSIX:

.PHONY: all
all: fmt build

.PHONY: fmt
fmt:
	prefix "$@" ./ci/sub/fmt/make.sh
.PHONY: build
build:
	prefix "$@" yarn build
