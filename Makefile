# Makefile for QEC Visualizer Project

.PHONY: all build build-wasm setup serve clean help

# Default target
all: build

help:
	@echo "Available commands:"
	@echo "  make setup        - Install build dependencies (wasm-pack)"
	@echo "  make build        - Build WASM module and documentation"
	@echo "  make serve        - Start MkDocs development server (builds WASM first)"
	@echo "  make clean        - Remove build artifacts"

setup:
	@echo "Checking for wasm-pack..."
	@which wasm-pack || (echo "Installing wasm-pack..." && curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh)

build: build-wasm
	@echo "Building MkDocs site..."
	uv run mkdocs build

build-wasm:
	@echo "Building WASM module..."
	cd tools/qec_sim && wasm-pack build --target web --out-dir pkg
	@echo "Copying artifacts to docs/javascripts/..."
	cp tools/qec_sim/pkg/qec_sim.js docs/javascripts/
	cp tools/qec_sim/pkg/qec_sim_bg.wasm docs/javascripts/

serve: build-wasm
	@echo "Starting MkDocs server..."
	uv run mkdocs serve

clean:
	@echo "Cleaning artifacts..."
	rm -rf site/
	rm -rf tools/qec_sim/target/
	rm -rf tools/qec_sim/pkg/
	rm -f docs/javascripts/qec_sim.js
	rm -f docs/javascripts/qec_sim_bg.wasm
