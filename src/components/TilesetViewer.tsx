"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { TilesetConfig, CustomTileSelection } from "@/types/tileset";
import { Plus, Minus } from "lucide-react";

interface TilesetViewerProps {
  config: TilesetConfig;
  onCustomTileAdded: (customTile: CustomTileSelection) => void;
  onCustomTileRemoved: (customTileId: string) => void;
  selectedCustomTile: string | null;
  onCustomTileSelected: (customTileId: string | null) => void;
}

interface SelectionRect {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export function TilesetViewer({
  config,
  onCustomTileAdded,
  onCustomTileRemoved,
  selectedCustomTile,
  onCustomTileSelected,
}: TilesetViewerProps) {
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionRect, setSelectionRect] = useState<SelectionRect | null>(
    null
  );
  const [zoom, setZoom] = useState(2);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Calculate tileset dimensions
  const tilesetCols = Math.floor(
    (imageRef.current?.naturalWidth || 0) / config.tileSize.width
  );
  const tilesetRows = Math.floor(
    (imageRef.current?.naturalHeight || 0) / config.tileSize.height
  );

  const drawTileset = useCallback(() => {
    if (!canvasRef.current || !imageRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = imageRef.current;
    const displayWidth = img.naturalWidth * zoom;
    const displayHeight = img.naturalHeight * zoom;

    canvas.width = displayWidth;
    canvas.height = displayHeight;

    // Configure context for pixel-perfect rendering
    ctx.imageSmoothingEnabled = false;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw tileset image
    ctx.drawImage(img, 0, 0, displayWidth, displayHeight);

    // Draw grid lines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.lineWidth = 1;

    const tileWidth = config.tileSize.width * zoom;
    const tileHeight = config.tileSize.height * zoom;

    // Vertical lines
    for (let x = 0; x <= displayWidth; x += tileWidth) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, displayHeight);
      ctx.stroke();
    }

    // Horizontal lines
    for (let y = 0; y <= displayHeight; y += tileHeight) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(displayWidth, y);
      ctx.stroke();
    }

    // Draw existing custom tile selections
    config.customTiles.forEach((customTile) => {
      const x = customTile.sourceX * tileWidth;
      const y = customTile.sourceY * tileHeight;
      const width = customTile.sourceWidth * tileWidth;
      const height = customTile.sourceHeight * tileHeight;

      // Use different colors for selected vs unselected
      if (customTile.id === selectedCustomTile) {
        // Selected tile: bright green border and overlay
        ctx.strokeStyle = "#00ff00";
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, width, height);
        ctx.fillStyle = "rgba(0, 255, 0, 0.2)";
        ctx.fillRect(x, y, width, height);
      } else {
        // Unselected tile: grey border and subtle overlay
        ctx.strokeStyle = "#808080";
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);
        ctx.fillStyle = "rgba(128, 128, 128, 0.1)";
        ctx.fillRect(x, y, width, height);
      }
    });

    // Draw current selection
    if (selectionRect) {
      const x = Math.min(selectionRect.startX, selectionRect.endX) * tileWidth;
      const y = Math.min(selectionRect.startY, selectionRect.endY) * tileHeight;
      const width =
        (Math.abs(selectionRect.endX - selectionRect.startX) + 1) * tileWidth;
      const height =
        (Math.abs(selectionRect.endY - selectionRect.startY) + 1) * tileHeight;

      ctx.strokeStyle = "#ff0000";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(x, y, width, height);
      ctx.setLineDash([]);

      ctx.fillStyle = "rgba(255, 0, 0, 0.2)";
      ctx.fillRect(x, y, width, height);
    }
  }, [config, selectionRect, selectedCustomTile, zoom]);

  useEffect(() => {
    if (imageRef.current && imageRef.current.complete) {
      drawTileset();
    }
  }, [drawTileset]);

  const handleImageLoad = () => {
    drawTileset();
  };

  const getCanvasMousePos = (e: React.MouseEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };

    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const getTilePos = (canvasX: number, canvasY: number) => {
    const tileWidth = config.tileSize.width * zoom;
    const tileHeight = config.tileSize.height * zoom;

    return {
      x: Math.floor(canvasX / tileWidth),
      y: Math.floor(canvasY / tileHeight),
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Don't start selection on right-click
    if (e.button !== 0) return;

    const pos = getCanvasMousePos(e);
    const tilePos = getTilePos(pos.x, pos.y);

    // Check if we clicked on an existing custom tile
    const customTileAtPos = config.customTiles.find((tile) => {
      return (
        tilePos.x >= tile.sourceX &&
        tilePos.x < tile.sourceX + tile.sourceWidth &&
        tilePos.y >= tile.sourceY &&
        tilePos.y < tile.sourceY + tile.sourceHeight
      );
    });

    if (customTileAtPos) {
      // Select this custom tile
      onCustomTileSelected(customTileAtPos.id);
      return;
    }

    // Start new selection if not clicking on existing tile
    if (
      tilePos.x >= 0 &&
      tilePos.x < tilesetCols &&
      tilePos.y >= 0 &&
      tilePos.y < tilesetRows
    ) {
      setIsSelecting(true);
      setSelectionRect({
        startX: tilePos.x,
        startY: tilePos.y,
        endX: tilePos.x,
        endY: tilePos.y,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isSelecting || !selectionRect) return;

    const pos = getCanvasMousePos(e);
    const tilePos = getTilePos(pos.x, pos.y);

    setSelectionRect({
      ...selectionRect,
      endX: Math.min(Math.max(tilePos.x, 0), tilesetCols - 1),
      endY: Math.min(Math.max(tilePos.y, 0), tilesetRows - 1),
    });
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    // Only create custom tiles on left-click mouse up
    if (isSelecting && selectionRect && e.button === 0) {
      // Automatically create the custom tile without naming
      const customTile: CustomTileSelection = {
        id: Date.now().toString(),
        sourceX: Math.min(selectionRect.startX, selectionRect.endX),
        sourceY: Math.min(selectionRect.startY, selectionRect.endY),
        sourceWidth: Math.abs(selectionRect.endX - selectionRect.startX) + 1,
        sourceHeight: Math.abs(selectionRect.endY - selectionRect.startY) + 1,
        color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
      };

      onCustomTileAdded(customTile);
      setSelectionRect(null);
    }
    setIsSelecting(false);
  };

  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const pos = getCanvasMousePos(e);
    const tilePos = getTilePos(pos.x, pos.y);

    // Find if there's a custom tile at this position
    const customTileAtPos = config.customTiles.find((tile) => {
      return (
        tilePos.x >= tile.sourceX &&
        tilePos.x < tile.sourceX + tile.sourceWidth &&
        tilePos.y >= tile.sourceY &&
        tilePos.y < tile.sourceY + tile.sourceHeight
      );
    });

    if (customTileAtPos) {
      // If this was the selected tile, deselect it
      if (selectedCustomTile === customTileAtPos.id) {
        onCustomTileSelected(null);
      }
      onCustomTileRemoved(customTileAtPos.id);
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Tileset Selector
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setZoom(Math.max(1, zoom - 1))}
            className="p-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
            title="Zoom Out"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="text-sm font-mono">{zoom}x</span>
          <button
            onClick={() => setZoom(Math.min(5, zoom + 1))}
            className="p-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
            title="Zoom In"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="text-sm text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
        <p>
          <strong>Left-click and drag:</strong> Select tiles to create custom
          tile groups
        </p>
        <p>
          <strong>Left-click on grey outline:</strong> Select that custom tile
          group
        </p>
        <p>
          <strong>Right-click:</strong> Remove a custom tile group
        </p>
      </div>

      {/* Tileset Canvas */}
      <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-auto max-h-96">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imageRef}
          src={config.imageUrl}
          alt="Tileset"
          style={{ display: "none" }}
          onLoad={handleImageLoad}
        />
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onContextMenu={handleRightClick}
          className="cursor-crosshair"
        />
      </div>
    </div>
  );
}
