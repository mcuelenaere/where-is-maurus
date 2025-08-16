SHELL := /bin/sh
APP := server
PKG := where-is-maurus/backend

.PHONY: fmt build run docker-build docker-run lint

build:
	CGO_ENABLED=0 go build -trimpath -ldflags "-s -w" -o bin/$(APP) ./cmd/server

run:
	HTTP_ADDR=:8080 go run ./cmd/server

docker-build:
	docker build -t where-is-maurus/backend:latest .

docker-run:
	docker run --rm -p 8080:8080 --env-file .env where-is-maurus/backend:latest

test:
	go test ./...
	go test -race ./...

fmt:
	golangci-lint fmt
	go mod tidy

lint:
	golangci-lint run
