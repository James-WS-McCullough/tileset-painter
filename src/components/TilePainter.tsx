"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  TilesetConfig,
  PaintedTile,
  GridConfig,
  BaseMaterial,
} from "@/types/tileset";
import { Download, Trash2, Undo, Redo } from "lucide-react";

// Extended canvas context interface for pixel-perfect rendering
interface ExtendedCanvasRenderingContext2D extends CanvasRenderingContext2D {
  webkitImageSmoothingEnabled?: boolean;
  mozImageSmoothingEnabled?: boolean;
  msImageSmoothingEnabled?: boolean;
}

interface TilePainterProps {
  config: TilesetConfig;
}

interface MaterialButtonProps {
  material: BaseMaterial;
  isSelected: boolean;
  onClick: () => void;
  tilesetImage: HTMLImageElement | null;
}

function MaterialButton({
  material,
  isSelected,
  onClick,
  tilesetImage,
}: MaterialButtonProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !tilesetImage) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d") as ExtendedCanvasRenderingContext2D;
    if (!ctx) return;

    // Configure context for pixel-perfect rendering
    ctx.imageSmoothingEnabled = false;
    if (ctx.webkitImageSmoothingEnabled !== undefined)
      ctx.webkitImageSmoothingEnabled = false;
    if (ctx.mozImageSmoothingEnabled !== undefined)
      ctx.mozImageSmoothingEnabled = false;
    if (ctx.msImageSmoothingEnabled !== undefined)
      ctx.msImageSmoothingEnabled = false;

    canvas.width = 24;
    canvas.height = 24;

    // Draw the material tile sprite with pixel-perfect coordinates
    ctx.drawImage(
      tilesetImage,
      Math.round(material.tile.x),
      Math.round(material.tile.y),
      Math.round(material.tile.width),
      Math.round(material.tile.height),
      0,
      0,
      24,
      24
    );
  }, [material, tilesetImage]);

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
        isSelected
          ? "bg-blue-100 dark:bg-blue-900/30 border-blue-500"
          : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
      }`}
    >
      <canvas
        ref={canvasRef}
        className="w-6 h-6 rounded border"
        style={{ imageRendering: "pixelated" }}
      />
      <span className="text-sm font-medium text-gray-900 dark:text-white">
        {material.name}
      </span>
    </button>
  );
}

export function TilePainter({ config }: TilePainterProps) {
  const [gridConfig, setGridConfig] = useState<GridConfig>({
    width: 20,
    height: 15,
    tileSize: { width: config.tileSize.width, height: config.tileSize.height },
  });

  const [paintedTiles, setPaintedTiles] = useState<Map<string, PaintedTile>>(
    new Map()
  );
  const [selectedMaterial, setSelectedMaterial] = useState<string>(
    config.materials[0]?.id || ""
  );
  const [isPainting, setIsPainting] = useState(false);
  const [isErasing, setIsErasing] = useState(false);
  const [history, setHistory] = useState<Map<string, PaintedTile>[]>([
    new Map(),
  ]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tilesetImageRef = useRef<HTMLImageElement>(null);

  const redrawCanvas = useCallback(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d") as ExtendedCanvasRenderingContext2D;
    if (!ctx) return;

    // Configure context for pixel-perfect rendering
    ctx.imageSmoothingEnabled = false;
    if (ctx.webkitImageSmoothingEnabled !== undefined)
      ctx.webkitImageSmoothingEnabled = false;
    if (ctx.mozImageSmoothingEnabled !== undefined)
      ctx.mozImageSmoothingEnabled = false;
    if (ctx.msImageSmoothingEnabled !== undefined)
      ctx.msImageSmoothingEnabled = false;

    // Set canvas size to exact pixel dimensions
    const canvasWidth = gridConfig.width * gridConfig.tileSize.width;
    const canvasHeight = gridConfig.height * gridConfig.tileSize.height;

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Set canvas display size to maintain pixel-perfect rendering
    canvas.style.width = `${Math.max(canvasWidth, 400)}px`;
    canvas.style.height = `${Math.max(canvasHeight, 300)}px`;

    // Clear canvas with background
    ctx.fillStyle = "#f3f4f6";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Draw grid
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 1;

    // Vertical lines
    for (let x = 0; x <= canvasWidth; x += gridConfig.tileSize.width) {
      ctx.beginPath();
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, canvasHeight);
      ctx.stroke();
    }

    // Horizontal lines
    for (let y = 0; y <= canvasHeight; y += gridConfig.tileSize.height) {
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(canvasWidth, y + 0.5);
      ctx.stroke();
    }

    // Only draw tiles if we have the tileset image loaded
    if (!tilesetImageRef.current) return;

    // Draw painted tiles
    paintedTiles.forEach((paintedTile) => {
      const material = config.materials.find(
        (m) => m.id === paintedTile.materialId
      );
      if (!material) return;

      // Choose which tile to draw: border tile takes priority over base material
      let tileToRender = material.tile;

      if (paintedTile.borderTileId) {
        const borderTile = config.borders.find(
          (b) => b.id === paintedTile.borderTileId
        );
        if (borderTile) {
          tileToRender = borderTile;
        }
      }

      // Draw the selected tile (either border or base material) with pixel-perfect coordinates
      // Now gridConfig.tileSize matches the actual tileset tile dimensions
      const destX = Math.round(paintedTile.x * gridConfig.tileSize.width);
      const destY = Math.round(paintedTile.y * gridConfig.tileSize.height);

      ctx.drawImage(
        tilesetImageRef.current!,
        Math.round(tileToRender.x),
        Math.round(tileToRender.y),
        Math.round(tileToRender.width),
        Math.round(tileToRender.height),
        destX,
        destY,
        Math.round(gridConfig.tileSize.width),
        Math.round(gridConfig.tileSize.height)
      );

      // Draw noise tiles if any (these are overlays) with pixel-perfect coordinates
      if (paintedTile.noiseIds) {
        paintedTile.noiseIds.forEach((noiseId) => {
          const noiseTile = config.noise.find((n) => n.id === noiseId);
          if (noiseTile) {
            ctx.drawImage(
              tilesetImageRef.current!,
              Math.round(noiseTile.x),
              Math.round(noiseTile.y),
              Math.round(noiseTile.width),
              Math.round(noiseTile.height),
              Math.round(paintedTile.x * gridConfig.tileSize.width),
              Math.round(paintedTile.y * gridConfig.tileSize.height),
              Math.round(gridConfig.tileSize.width),
              Math.round(gridConfig.tileSize.height)
            );
          }
        });
      }
    });
  }, [gridConfig, paintedTiles, config]);

  // Load tileset image
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      tilesetImageRef.current = img;
      redrawCanvas();
    };
    // Ensure pixel-perfect loading
    img.style.imageRendering = "pixelated";
    img.src = config.imageUrl;
  }, [config.imageUrl, redrawCanvas]);

  // Update grid tile size when config changes to match tileset dimensions
  useEffect(() => {
    setGridConfig((prev) => ({
      ...prev,
      tileSize: {
        width: config.tileSize.width,
        height: config.tileSize.height,
      },
    }));
  }, [config.tileSize]);

  // Redraw canvas when grid or tiles change
  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  const getTilePosition = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return null;

    const rect = canvasRef.current.getBoundingClientRect();
    const canvas = canvasRef.current;

    // Calculate exact pixel coordinates
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    // Get precise canvas coordinates
    const canvasX = (e.clientX - rect.left) * scaleX;
    const canvasY = (e.clientY - rect.top) * scaleY;

    // Convert to tile coordinates with proper floor rounding
    const x = Math.floor(canvasX / gridConfig.tileSize.width);
    const y = Math.floor(canvasY / gridConfig.tileSize.height);

    // Ensure coordinates are within bounds
    if (x >= 0 && x < gridConfig.width && y >= 0 && y < gridConfig.height) {
      return { x, y };
    }
    return null;
  };

  // Get adjacent tile positions
  const getAdjacentPositions = (x: number, y: number) => ({
    n: { x, y: y - 1 },
    ne: { x: x + 1, y: y - 1 },
    e: { x: x + 1, y },
    se: { x: x + 1, y: y + 1 },
    s: { x, y: y + 1 },
    sw: { x: x - 1, y: y + 1 },
    w: { x: x - 1, y },
    nw: { x: x - 1, y: y - 1 },
  });

  // Recalculate all border tiles for the entire grid - global approach
  const recalculateAllBorders = useCallback(
    (tilesMap: Map<string, PaintedTile>) => {
      const updatedMap = new Map<string, PaintedTile>();

      // Process each tile to determine its border requirements
      tilesMap.forEach((tile, key) => {
        const adjacent = getAdjacentPositions(tile.x, tile.y);
        const surroundings: { [key: string]: string | null } = {};

        // Check each adjacent position for material types
        Object.entries(adjacent).forEach(([direction, pos]) => {
          const adjacentKey = `${pos.x},${pos.y}`;
          const adjacentTile = tilesMap.get(adjacentKey);
          surroundings[direction] = adjacentTile
            ? adjacentTile.materialId
            : null;
        });

        // Find the best matching border tile with priority system
        let bestBorder = null;
        let highestPriority = -1;

        for (const border of config.borders) {
          // Only apply border sprite if this tile is the PRIMARY material (materialA)
          // The border material (materialB) should keep its base tile
          if (border.materialA === tile.materialId) {
            const borderMaterial = border.materialB;

            // Check if the pattern matches
            if (
              matchesBorderPattern(
                surroundings,
                tile.materialId,
                borderMaterial,
                border.directions
              )
            ) {
              // Prioritize border types: cardinal directions > inward corners > diagonal corners
              let priority = 0;
              if (border.directions.startsWith("inward-")) {
                priority = 3; // Inward corners high priority
              } else if (border.directions.length === 1) {
                priority = 4; // Cardinal directions (n, s, e, w) highest priority
              } else if (border.directions.length === 2) {
                priority = 2; // Diagonal corners (ne, se, sw, nw) lower priority
              } else {
                priority = 1; // Other cases
              }

              if (priority > highestPriority) {
                bestBorder = border;
                highestPriority = priority;
              }
            }
          }
        }

        // Create the updated tile with border information
        const updatedTile: PaintedTile = {
          x: tile.x,
          y: tile.y,
          materialId: tile.materialId,
          borderTileId: bestBorder?.id,
          noiseIds: tile.noiseIds,
        };

        updatedMap.set(key, updatedTile);
      });

      return updatedMap;
    },
    [config.borders]
  );

  // Check if the surrounding pattern matches a border type
  const matchesBorderPattern = (
    surroundings: { [key: string]: string | null },
    primaryMaterial: string,
    borderMaterial: string,
    borderType: string
  ): boolean => {
    // Count orthogonal (cardinal) neighbors that are border material
    const orthogonalDirections = ["n", "e", "s", "w"];
    const orthogonalBorderCount = orthogonalDirections.filter(
      (dir) => surroundings[dir] === borderMaterial
    ).length;

    // For directional borders (n, s, e, w), only use if there's exactly 1 orthogonal neighbor
    if (
      borderType === "n" ||
      borderType === "s" ||
      borderType === "e" ||
      borderType === "w"
    ) {
      return (
        orthogonalBorderCount === 1 &&
        surroundings[borderType] === borderMaterial
      );
    }

    // For diagonal corners (ne, se, sw, nw), use when there's exactly 1 orthogonal neighbor
    // OR when there are 0 orthogonal neighbors but the diagonal has border material
    if (
      borderType === "ne" ||
      borderType === "se" ||
      borderType === "sw" ||
      borderType === "nw"
    ) {
      if (orthogonalBorderCount === 1) {
        return surroundings[borderType] === borderMaterial;
      } else if (orthogonalBorderCount === 0) {
        return surroundings[borderType] === borderMaterial;
      }
      return false;
    }

    // For inward corners, use when there are 2 orthogonal neighbors at 90 degrees apart,
    // or 3+ orthogonal neighbors forming an L-shape
    if (borderType.startsWith("inward-")) {
      const corner = borderType.replace("inward-", "");

      if (orthogonalBorderCount >= 2) {
        switch (corner) {
          case "ne":
            // Need north AND east orthogonal neighbors, plus the diagonal
            return (
              surroundings.n === borderMaterial &&
              surroundings.e === borderMaterial &&
              surroundings.ne === borderMaterial
            );
          case "se":
            // Need south AND east orthogonal neighbors, plus the diagonal
            return (
              surroundings.s === borderMaterial &&
              surroundings.e === borderMaterial &&
              surroundings.se === borderMaterial
            );
          case "sw":
            // Need north AND west orthogonal neighbors, plus the diagonal (swapped logic)
            return (
              surroundings.n === borderMaterial &&
              surroundings.w === borderMaterial &&
              surroundings.nw === borderMaterial
            );
          case "nw":
            // Need south AND west orthogonal neighbors, plus the diagonal (swapped logic)
            return (
              surroundings.s === borderMaterial &&
              surroundings.w === borderMaterial &&
              surroundings.sw === borderMaterial
            );
        }
      }
      return false;
    }

    return false;
  };

  const paintTile = (x: number, y: number) => {
    const key = `${x},${y}`;

    if (isErasing) {
      setPaintedTiles((prev) => {
        const newMap = new Map(prev);
        newMap.delete(key);
        // Apply global border recalculation after erasing
        return recalculateAllBorders(newMap);
      });
    } else if (selectedMaterial) {
      setPaintedTiles((prev) => {
        const newMap = new Map(prev);

        // Add the new tile
        const paintedTile: PaintedTile = {
          x,
          y,
          materialId: selectedMaterial,
          // Add random noise if configured
          noiseIds: config.noise
            .filter(
              (noise) =>
                noise.baseMaterial === selectedMaterial &&
                Math.random() * 100 < noise.probability
            )
            .map((noise) => noise.id),
        };

        newMap.set(key, paintedTile);

        // Apply global border recalculation after adding new tile
        return recalculateAllBorders(newMap);
      });
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getTilePosition(e);
    if (!pos) return;

    setIsPainting(true);
    paintTile(pos.x, pos.y);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isPainting) return;

    const pos = getTilePosition(e);
    if (!pos) return;

    paintTile(pos.x, pos.y);
  };

  const handleMouseUp = () => {
    if (isPainting) {
      // Save to history
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(new Map(paintedTiles));
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
    setIsPainting(false);
  };

  const clearCanvas = () => {
    setPaintedTiles(new Map());
    const newHistory = [...history, new Map()];
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setPaintedTiles(new Map(history[historyIndex - 1]));
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setPaintedTiles(new Map(history[historyIndex + 1]));
    }
  };

  const exportImage = () => {
    if (!canvasRef.current) return;

    const link = document.createElement("a");
    link.download = `${config.name}_painted.png`;
    link.href = canvasRef.current.toDataURL();
    link.click();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Paint with {config.name}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Click and drag to paint tiles on the canvas
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Material Palette */}
        <div className="space-y-4">
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Materials
            </h3>
            <div className="space-y-2">
              {config.materials.map((material) => (
                <MaterialButton
                  key={material.id}
                  material={material}
                  isSelected={selectedMaterial === material.id && !isErasing}
                  onClick={() => {
                    setSelectedMaterial(material.id);
                    setIsErasing(false);
                  }}
                  tilesetImage={tilesetImageRef.current}
                />
              ))}

              <button
                onClick={() => setIsErasing(!isErasing)}
                className={`w-full flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                  isErasing
                    ? "bg-red-100 dark:bg-red-900/30 border-red-500"
                    : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
                }`}
              >
                <Trash2 className="w-5 h-5 text-red-500" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Eraser
                </span>
              </button>
            </div>
          </div>

          {/* Grid Controls */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Grid Size
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Width
                </label>
                <input
                  type="number"
                  min="5"
                  max="100"
                  value={gridConfig.width}
                  onChange={(e) =>
                    setGridConfig((prev) => ({
                      ...prev,
                      width: parseInt(e.target.value) || 20,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Height
                </label>
                <input
                  type="number"
                  min="5"
                  max="100"
                  value={gridConfig.height}
                  onChange={(e) =>
                    setGridConfig((prev) => ({
                      ...prev,
                      height: parseInt(e.target.value) || 15,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={undo}
                disabled={historyIndex <= 0}
                className="flex items-center justify-center space-x-1 px-3 py-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm rounded-lg transition-colors"
              >
                <Undo className="w-4 h-4" />
                <span>Undo</span>
              </button>
              <button
                onClick={redo}
                disabled={historyIndex >= history.length - 1}
                className="flex items-center justify-center space-x-1 px-3 py-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm rounded-lg transition-colors"
              >
                <Redo className="w-4 h-4" />
                <span>Redo</span>
              </button>
            </div>

            <button
              onClick={clearCanvas}
              className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear All</span>
            </button>

            <button
              onClick={exportImage}
              className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-green-500 hover:bg-green-600 text-white text-sm rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export PNG</span>
            </button>
          </div>
        </div>

        {/* Canvas */}
        <div className="lg:col-span-3">
          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Canvas ({gridConfig.width} × {gridConfig.height})
            </h3>
            <div className="overflow-auto border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 p-4">
              <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                className="cursor-crosshair border border-gray-200"
                style={{
                  imageRendering: "pixelated",
                  backgroundColor: "#f3f4f6",
                  display: "block",
                }}
              />
            </div>
            <div className="flex justify-between items-center mt-2 text-sm text-gray-600 dark:text-gray-400">
              <span>
                {isErasing
                  ? "Erasing mode active"
                  : `Painting with: ${
                      config.materials.find((m) => m.id === selectedMaterial)
                        ?.name || "None"
                    }`}
              </span>
              <span>Tiles painted: {paintedTiles.size}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
