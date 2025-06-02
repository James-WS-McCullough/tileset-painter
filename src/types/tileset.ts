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

export type AppMode = "upload" | "configure" | "paint";
