SHELL := /bin/sh
APP := server
PKG := where-is-maurus/backend

.PHONY: tidy build run docker-build docker-run lint

tidy:
	go mod tidy
	go fmt ./...

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

lint:
	golangci-lint run
