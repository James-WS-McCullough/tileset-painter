# Copilot Instructions

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

This is a Next.js TypeScript tileset painter application with the following key features:

## Project Structure

- Tileset upload and configuration system
- Base material tile definition
- Automatic border tile generation between different materials
- Random noise tile overlay system
- Grid-based painting interface
- JSON configuration save/load functionality

## Key Components

- TilesetUploader: Handles image upload and tile size configuration
- TileConfigurer: Interface for defining base materials, borders, and noise tiles
- TilePainter: Grid-based painting canvas
- ConfigManager: Save/load configurations as JSON

## Technical Requirements

- Use TypeScript with strict type checking
- Implement canvas-based rendering for performance
- Use React hooks for state management
- Implement drag-and-drop functionality
- Support various image formats for tilesets
- Generate border tiles automatically based on adjacency rules

## Border Generation Logic

- 4 directional borders (north, south, east, west)
- 4 diagonal borders (northeast, northwest, southeast, southwest)
- 4 inward diagonal borders for complex transitions
- Automatic detection of material adjacency

## Noise Tile System

- Random chance overlay system
- Configurable probability per base tile
- Layer-based rendering approach
