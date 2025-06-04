export interface TilePosition {
  x: number;
  y: number;
}

export interface TileData {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: "base" | "border" | "noise";
}

export interface BaseMaterial {
  id: string;
  name: string;
  tile: TileData;
  color: string; // For visual identification
  noiseProbability: number; // 0-100 chance of getting any noise
}

export interface BorderTile extends TileData {
  directions: string; // e.g., "n", "ne", "e", "se", "s", "sw", "w", "nw", "inward-ne", etc.
  materialA: string; // Material ID
  materialB: string; // Material ID
}

export interface NoiseTile extends TileData {
  baseMaterial: string; // Material ID this noise applies to
}

export interface TilesetConfig {
  id: string;
  name: string;
  imageUrl: string;
  tileSize: {
    width: number;
    height: number;
  };
  materials: BaseMaterial[];
  borders: BorderTile[];
  noise: NoiseTile[];
  customTiles: CustomTileSelection[];
}

export interface PaintedTile {
  x: number;
  y: number;
  materialId: string;
  borderTileId?: string; // Border tile ID if this is a border tile
  noiseIds?: string[]; // Applied noise tiles
}

export interface GridConfig {
  width: number;
  height: number;
  tileSize: {
    width: number;
    height: number;
  };
}

export interface CustomTileSelection {
  id: string;
  sourceX: number; // X position in tileset grid
  sourceY: number; // Y position in tileset grid
  sourceWidth: number; // Width in tiles
  sourceHeight: number; // Height in tiles
  color: string; // For visual identification
}

export interface CustomPaintedTile {
  x: number;
  y: number;
  customTileId: string;
  offsetX?: number; // Offset within the custom tile selection
  offsetY?: number; // Offset within the custom tile selection
}

export type AppMode = "upload" | "configure" | "paint";
