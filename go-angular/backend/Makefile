.PHONY: build test run vet fmt tidy clean

build:
	go build ./...

test:
	go test ./...

vet:
	go vet ./...

fmt:
	gofmt -l . 

run:
	go run ./cmd/server

tidy:
	go mod tidy

clean:
	go clean ./...