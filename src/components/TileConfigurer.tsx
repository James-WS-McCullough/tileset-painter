"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  TilesetConfig,
  BaseMaterial,
  TileData,
  BorderTile,
  NoiseTile,
} from "@/types/tileset";
import { Palette, Plus, Trash2, Shuffle, ArrowRight } from "lucide-react";

// Extended canvas context interface for pixel-perfect rendering
interface ExtendedCanvasRenderingContext2D extends CanvasRenderingContext2D {
  webkitImageSmoothingEnabled?: boolean;
  mozImageSmoothingEnabled?: boolean;
  msImageSmoothingEnabled?: boolean;
}

interface TileConfigurerProps {
  config: TilesetConfig;
  onConfigChange: (config: TilesetConfig) => void;
  onComplete: (config: TilesetConfig) => void;
}

type ConfigMode = "materials" | "borders" | "noise";

// Define the 12 border types with their visual representations in circular order
const BORDER_TYPES = [
  // 4 base directions in circular order starting from southeast
  {
    id: "se",
    name: "Southeast",
    icon: "↘",
    description: "Bottom-right corner",
  },
  { id: "s", name: "South", icon: "↓", description: "Bottom edge" },
  { id: "sw", name: "Southwest", icon: "↙", description: "Bottom-left corner" },
  { id: "w", name: "West", icon: "←", description: "Left edge" },
  { id: "nw", name: "Northwest", icon: "↖", description: "Top-left corner" },
  { id: "n", name: "North", icon: "↑", description: "Top edge" },
  { id: "ne", name: "Northeast", icon: "↗", description: "Top-right corner" },
  { id: "e", name: "East", icon: "→", description: "Right edge" },

  // 4 inward diagonal directions in same circular order
  {
    id: "inward-se",
    name: "Inward SE",
    icon: "⌟",
    description: "Inner bottom-right",
  },
  {
    id: "inward-sw",
    name: "Inward SW",
    icon: "⌜",
    description: "Inner bottom-left",
  },
  {
    id: "inward-nw",
    name: "Inward NW",
    icon: "⌞",
    description: "Inner top-left",
  },
  {
    id: "inward-ne",
    name: "Inward NE",
    icon: "⌝",
    description: "Inner top-right",
  },
];

export function TileConfigurer({
  config,
  onConfigChange,
  onComplete,
}: TileConfigurerProps) {
  const [mode, setMode] = useState<ConfigMode>("materials");
  const [selectedTile, setSelectedTile] = useState<TileData | null>(null);
  const [materialName, setMaterialName] = useState("");
  const [primaryMaterial, setPrimaryMaterial] = useState<string>("");
  const [borderMaterial, setBorderMaterial] = useState<string>("");
  const [selectedBorderType, setSelectedBorderType] = useState<string>("");
  const [borderMappings, setBorderMappings] = useState<{
    [key: string]: TileData | null;
  }>({});
  const [noiseMaterial, setNoiseMaterial] = useState<string>("");
  const [selectedNoiseTiles, setSelectedNoiseTiles] = useState<TileData[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  // Load tileset image
  useEffect(() => {
    const img = new Image();
    img.onload = () => setImage(img);
    // Ensure pixel-perfect loading
    img.style.imageRendering = "pixelated";
    img.src = config.imageUrl;
  }, [config.imageUrl]);

  // Draw tileset on canvas
  useEffect(() => {
    if (!image || !canvasRef.current) return;

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

    canvas.width = image.width;
    canvas.height = image.height;

    ctx.drawImage(image, 0, 0);

    // Draw grid
    ctx.strokeStyle = "#ffffff80";
    ctx.lineWidth = 1;

    for (let x = 0; x <= image.width; x += config.tileSize.width) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, image.height);
      ctx.stroke();
    }

    for (let y = 0; y <= image.height; y += config.tileSize.height) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(image.width, y);
      ctx.stroke();
    }

    // Only highlight the currently selected tile for user guidance
    if (mode === "noise") {
      selectedNoiseTiles.forEach((tile) => {
        ctx.strokeStyle = "#7c3aed";
        ctx.lineWidth = 2;
        ctx.strokeRect(tile.x, tile.y, tile.width, tile.height);
      });
    }

    // Highlight selected tile
    if (selectedTile) {
      ctx.strokeStyle = "#ff0000";
      ctx.lineWidth = 2;
      ctx.strokeRect(
        selectedTile.x,
        selectedTile.y,
        selectedTile.width,
        selectedTile.height
      );
    }
  }, [
    image,
    config,
    selectedTile,
    mode,
    borderMappings,
    selectedNoiseTiles,
    primaryMaterial,
    borderMaterial,
  ]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const tileX = Math.floor(x / config.tileSize.width) * config.tileSize.width;
    const tileY =
      Math.floor(y / config.tileSize.height) * config.tileSize.height;

    const tile: TileData = {
      id: `tile_${tileX}_${tileY}`,
      x: tileX,
      y: tileY,
      width: config.tileSize.width,
      height: config.tileSize.height,
      type: "base",
    };

    if (mode === "materials") {
      setSelectedTile(tile);
    } else if (
      mode === "borders" &&
      primaryMaterial &&
      borderMaterial &&
      selectedBorderType
    ) {
      // Assign the clicked tile to the selected border type
      setBorderMappings((prev) => ({
        ...prev,
        [`${primaryMaterial}_${borderMaterial}_${selectedBorderType}`]: tile,
      }));

      // Auto-select the next border type in circular order
      const currentIndex = BORDER_TYPES.findIndex(
        (bt) => bt.id === selectedBorderType
      );
      const nextIndex = (currentIndex + 1) % BORDER_TYPES.length;
      const nextBorderType = BORDER_TYPES[nextIndex];

      // Check if the next border type already has a mapping
      const nextMappingKey = `${primaryMaterial}_${borderMaterial}_${nextBorderType.id}`;
      if (!borderMappings[nextMappingKey]) {
        setSelectedBorderType(nextBorderType.id);
      } else {
        // Find the next unmapped border type
        let foundNext = false;
        for (let i = 1; i < BORDER_TYPES.length; i++) {
          const checkIndex = (currentIndex + i) % BORDER_TYPES.length;
          const checkBorderType = BORDER_TYPES[checkIndex];
          const checkMappingKey = `${primaryMaterial}_${borderMaterial}_${checkBorderType.id}`;
          if (!borderMappings[checkMappingKey]) {
            setSelectedBorderType(checkBorderType.id);
            foundNext = true;
            break;
          }
        }
        if (!foundNext) {
          setSelectedBorderType(""); // All types are mapped
        }
      }
    } else if (mode === "noise" && noiseMaterial) {
      // Add to selected noise tiles if not already selected
      const existingTile = selectedNoiseTiles.find(
        (t) => t.x === tile.x && t.y === tile.y
      );
      if (!existingTile) {
        setSelectedNoiseTiles((prev) => [...prev, tile]);
      }
    }
  };

  const addBorderSet = () => {
    if (!primaryMaterial || !borderMaterial) {
      alert("Please select both primary and border materials");
      return;
    }

    const newBorders: BorderTile[] = [];
    const currentMappings = Object.entries(borderMappings);

    if (currentMappings.length === 0) {
      alert("Please assign tiles to at least one border type");
      return;
    }

    currentMappings.forEach(([key, tile]) => {
      if (tile && key.startsWith(`${primaryMaterial}_${borderMaterial}_`)) {
        // Extract just the border direction from the end of the key
        const borderType = key.split("_").slice(-1)[0];
        newBorders.push({
          id: `border_${primaryMaterial}_${borderMaterial}_${borderType}_${Date.now()}`,
          x: tile.x,
          y: tile.y,
          width: tile.width,
          height: tile.height,
          type: "border",
          directions: borderType,
          materialA: primaryMaterial,
          materialB: borderMaterial,
        });
      }
    });

    const updatedConfig = {
      ...config,
      borders: [...config.borders, ...newBorders],
    };

    onConfigChange(updatedConfig);

    // Clear mappings for this material pair
    const clearedMappings = { ...borderMappings };
    Object.keys(clearedMappings).forEach((key) => {
      if (key.startsWith(`${primaryMaterial}_${borderMaterial}_`)) {
        delete clearedMappings[key];
      }
    });
    setBorderMappings(clearedMappings);
  };

  const addNoiseTiles = () => {
    if (!noiseMaterial || selectedNoiseTiles.length === 0) {
      alert("Please select a material and at least one noise tile");
      return;
    }

    const newNoise: NoiseTile[] = selectedNoiseTiles.map((tile, index) => ({
      id: `noise_${noiseMaterial}_${Date.now()}_${index}`,
      x: tile.x,
      y: tile.y,
      width: tile.width,
      height: tile.height,
      type: "noise",
      baseMaterial: noiseMaterial,
    }));

    const updatedConfig = {
      ...config,
      noise: [...config.noise, ...newNoise],
    };

    onConfigChange(updatedConfig);
    setSelectedNoiseTiles([]);
  };

  const updateMaterialNoiseProbability = (
    materialId: string,
    probability: number
  ) => {
    const updatedMaterials = config.materials.map((material) =>
      material.id === materialId
        ? { ...material, noiseProbability: probability }
        : material
    );

    onConfigChange({
      ...config,
      materials: updatedMaterials,
    });
  };

  const removeNoiseTile = (noiseId: string) => {
    const updatedConfig = {
      ...config,
      noise: config.noise.filter((n) => n.id !== noiseId),
    };
    onConfigChange(updatedConfig);
  };

  const addMaterial = () => {
    if (!selectedTile || !materialName.trim()) {
      alert("Please select a tile and enter a material name");
      return;
    }

    const material: BaseMaterial = {
      id: `material_${Date.now()}`,
      name: materialName.trim(),
      tile: selectedTile,
      color: "#3b82f6", // Default blue color for UI purposes
      noiseProbability: 0, // Default to no noise
    };

    const updatedConfig = {
      ...config,
      materials: [...config.materials, material],
    };

    onConfigChange(updatedConfig);
    setMaterialName("");
    setSelectedTile(null);
  };

  const removeMaterial = (materialId: string) => {
    const updatedConfig = {
      ...config,
      materials: config.materials.filter((m) => m.id !== materialId),
    };
    onConfigChange(updatedConfig);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Configure Tileset: {config.name}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Define base materials, borders, and noise tiles
        </p>
      </div>

      {/* Mode Selection */}
      <div className="flex justify-center space-x-4">
        <button
          onClick={() => setMode("materials")}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
            mode === "materials"
              ? "bg-blue-500 text-white border-blue-500"
              : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>Base Materials</span>
        </button>
        <button
          onClick={() => setMode("borders")}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
            mode === "borders"
              ? "bg-blue-500 text-white border-blue-500"
              : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
          }`}
        >
          <ArrowRight className="w-4 h-4" />
          <span>Border Tiles</span>
        </button>
        <button
          onClick={() => setMode("noise")}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
            mode === "noise"
              ? "bg-blue-500 text-white border-blue-500"
              : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
          }`}
        >
          <Shuffle className="w-4 h-4" />
          <span>Noise Tiles</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tileset Canvas */}
        <div className="lg:col-span-2">
          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Tileset Preview
            </h3>
            <div className="overflow-auto max-h-96 border border-gray-300 dark:border-gray-600 rounded">
              <canvas
                ref={canvasRef}
                onClick={handleCanvasClick}
                className="cursor-crosshair max-w-full"
                style={{ imageRendering: "pixelated" }}
              />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Click on a tile to select it
            </p>
          </div>
        </div>

        {/* Configuration Panel */}
        <div className="space-y-4">
          {mode === "materials" && (
            <>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Add Base Material
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Material Name
                    </label>
                    <input
                      type="text"
                      value={materialName}
                      onChange={(e) => setMaterialName(e.target.value)}
                      placeholder="e.g., Grass, Water, Stone"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <button
                    onClick={addMaterial}
                    disabled={!selectedTile || !materialName.trim()}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Material</span>
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Materials ({config.materials.length})
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {config.materials.map((material) => (
                    <div
                      key={material.id}
                      className="flex items-center justify-between p-2 bg-white dark:bg-gray-700 rounded border"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 border rounded overflow-hidden bg-gray-100">
                          {image && (
                            <canvas
                              width={material.tile.width}
                              height={material.tile.height}
                              className="w-full h-full"
                              style={{ imageRendering: "pixelated" }}
                              ref={(canvas) => {
                                if (canvas) {
                                  const ctx = canvas.getContext(
                                    "2d"
                                  ) as ExtendedCanvasRenderingContext2D;
                                  if (ctx) {
                                    // Configure context for pixel-perfect rendering
                                    ctx.imageSmoothingEnabled = false;
                                    if (
                                      ctx.webkitImageSmoothingEnabled !==
                                      undefined
                                    )
                                      ctx.webkitImageSmoothingEnabled = false;
                                    if (
                                      ctx.mozImageSmoothingEnabled !== undefined
                                    )
                                      ctx.mozImageSmoothingEnabled = false;
                                    if (
                                      ctx.msImageSmoothingEnabled !== undefined
                                    )
                                      ctx.msImageSmoothingEnabled = false;

                                    ctx.drawImage(
                                      image,
                                      material.tile.x,
                                      material.tile.y,
                                      material.tile.width,
                                      material.tile.height,
                                      0,
                                      0,
                                      material.tile.width,
                                      material.tile.height
                                    );
                                  }
                                }
                              }}
                            />
                          )}
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {material.name}
                        </span>
                      </div>
                      <button
                        onClick={() => removeMaterial(material.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {mode === "borders" && (
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Border Definition
              </h3>

              {config.materials.length >= 2 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Primary Material
                      </label>
                      <select
                        value={primaryMaterial}
                        onChange={(e) => setPrimaryMaterial(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="">Select Primary Material</option>
                        {config.materials.map((material) => (
                          <option key={material.id} value={material.id}>
                            {material.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Border Material
                      </label>
                      <select
                        value={borderMaterial}
                        onChange={(e) => setBorderMaterial(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="">Select Border Material</option>
                        {config.materials
                          .filter((m) => m.id !== primaryMaterial)
                          .map((material) => (
                            <option key={material.id} value={material.id}>
                              {material.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  {primaryMaterial && borderMaterial && (
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                          Border Types - Click to select, then click on tileset
                        </h4>
                        <div className="grid grid-cols-4 gap-2">
                          {BORDER_TYPES.map((borderType) => {
                            const mappingKey = `${primaryMaterial}_${borderMaterial}_${borderType.id}`;
                            const isSelected =
                              selectedBorderType === borderType.id;
                            const hasMapping = borderMappings[mappingKey];

                            return (
                              <button
                                key={borderType.id}
                                onClick={() =>
                                  setSelectedBorderType(
                                    isSelected ? "" : borderType.id
                                  )
                                }
                                className={`p-3 border rounded-lg text-center transition-colors ${
                                  isSelected
                                    ? "bg-blue-500 text-white border-blue-500"
                                    : hasMapping
                                    ? "bg-green-100 border-green-500 text-green-700"
                                    : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                                }`}
                                title={borderType.description}
                              >
                                <div className="text-lg mb-1">
                                  {borderType.icon}
                                </div>
                                <div className="text-xs">{borderType.name}</div>
                              </button>
                            );
                          })}
                        </div>
                        {selectedBorderType && (
                          <p className="text-sm text-blue-600 mt-2">
                            Selected:{" "}
                            {
                              BORDER_TYPES.find(
                                (bt) => bt.id === selectedBorderType
                              )?.name
                            }{" "}
                            - Click on a tile in the tileset to assign
                          </p>
                        )}
                      </div>

                      {Object.keys(borderMappings).some((key) =>
                        key.startsWith(`${primaryMaterial}_${borderMaterial}_`)
                      ) && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Assigned Border Tiles
                          </h4>
                          <div className="grid grid-cols-6 gap-2">
                            {BORDER_TYPES.map((borderType) => {
                              const mappingKey = `${primaryMaterial}_${borderMaterial}_${borderType.id}`;
                              const tile = borderMappings[mappingKey];

                              if (!tile) return null;

                              return (
                                <div
                                  key={borderType.id}
                                  className="text-center"
                                >
                                  <div className="text-xs mb-1">
                                    {borderType.icon}
                                  </div>
                                  <div
                                    className="w-8 h-8 border rounded overflow-hidden bg-gray-100 mx-auto cursor-pointer"
                                    onClick={() => {
                                      const newMappings = { ...borderMappings };
                                      delete newMappings[mappingKey];
                                      setBorderMappings(newMappings);
                                    }}
                                    title="Click to remove"
                                  >
                                    {image && (
                                      <canvas
                                        width={tile.width}
                                        height={tile.height}
                                        className="w-full h-full"
                                        style={{ imageRendering: "pixelated" }}
                                        ref={(canvas) => {
                                          if (canvas) {
                                            const ctx = canvas.getContext(
                                              "2d"
                                            ) as ExtendedCanvasRenderingContext2D;
                                            if (ctx) {
                                              // Configure context for pixel-perfect rendering
                                              ctx.imageSmoothingEnabled = false;
                                              if (
                                                ctx.webkitImageSmoothingEnabled !==
                                                undefined
                                              )
                                                ctx.webkitImageSmoothingEnabled =
                                                  false;
                                              if (
                                                ctx.mozImageSmoothingEnabled !==
                                                undefined
                                              )
                                                ctx.mozImageSmoothingEnabled =
                                                  false;
                                              if (
                                                ctx.msImageSmoothingEnabled !==
                                                undefined
                                              )
                                                ctx.msImageSmoothingEnabled =
                                                  false;

                                              ctx.drawImage(
                                                image,
                                                tile.x,
                                                tile.y,
                                                tile.width,
                                                tile.height,
                                                0,
                                                0,
                                                tile.width,
                                                tile.height
                                              );
                                            }
                                          }
                                        }}
                                      />
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          <button
                            onClick={addBorderSet}
                            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Add Border Set</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {config.borders.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                        Configured Borders ({config.borders.length})
                      </h4>
                      <div className="space-y-1 max-h-24 overflow-y-auto">
                        {Array.from(
                          new Set(
                            config.borders.map(
                              (b) => `${b.materialA}-${b.materialB}`
                            )
                          )
                        ).map((borderPair) => {
                          const [matA, matB] = borderPair.split("-");
                          const matAName = config.materials.find(
                            (m) => m.id === matA
                          )?.name;
                          const matBName = config.materials.find(
                            (m) => m.id === matB
                          )?.name;
                          const borderCount = config.borders.filter(
                            (b) => b.materialA === matA && b.materialB === matB
                          ).length;
                          return (
                            <div
                              key={borderPair}
                              className="text-xs text-gray-600 dark:text-gray-400"
                            >
                              {matAName} → {matBName}: {borderCount} tiles
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  You need at least 2 base materials to define borders.
                </p>
              )}
            </div>
          )}

          {mode === "noise" && (
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Noise Tiles
              </h3>

              {config.materials.length > 0 ? (
                <div className="space-y-6">
                  {/* Material-based noise configuration */}
                  {config.materials.map((material) => {
                    const materialNoise = config.noise.filter(
                      (n) => n.baseMaterial === material.id
                    );

                    return (
                      <div
                        key={material.id}
                        className="border border-gray-200 dark:border-gray-600 rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                            {material.name}
                          </h4>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500">
                              {materialNoise.length} noise tiles
                            </span>
                          </div>
                        </div>

                        {/* Noise Probability Slider */}
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Noise Probability: {material.noiseProbability}%
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={material.noiseProbability}
                            onChange={(e) =>
                              updateMaterialNoiseProbability(
                                material.id,
                                Number(e.target.value)
                              )
                            }
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>0%</span>
                            <span>50%</span>
                            <span>100%</span>
                          </div>
                        </div>

                        {/* Current Noise Tiles */}
                        {materialNoise.length > 0 && (
                          <div className="mb-4">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Current Noise Tiles:
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {materialNoise.map((noiseTile) => (
                                <div
                                  key={noiseTile.id}
                                  className="relative w-8 h-8 border rounded overflow-hidden bg-gray-100 group cursor-pointer"
                                  onClick={() => removeNoiseTile(noiseTile.id)}
                                  title="Click to remove"
                                >
                                  {image && (
                                    <canvas
                                      width={32}
                                      height={32}
                                      className="w-full h-full"
                                      style={{ imageRendering: "pixelated" }}
                                      ref={(canvas) => {
                                        if (canvas && image.complete) {
                                          const ctx = canvas.getContext(
                                            "2d"
                                          ) as ExtendedCanvasRenderingContext2D;
                                          if (ctx) {
                                            ctx.imageSmoothingEnabled = false;
                                            if (
                                              ctx.webkitImageSmoothingEnabled !==
                                              undefined
                                            )
                                              ctx.webkitImageSmoothingEnabled =
                                                false;
                                            if (
                                              ctx.mozImageSmoothingEnabled !==
                                              undefined
                                            )
                                              ctx.mozImageSmoothingEnabled =
                                                false;
                                            if (
                                              ctx.msImageSmoothingEnabled !==
                                              undefined
                                            )
                                              ctx.msImageSmoothingEnabled =
                                                false;

                                            // Clear canvas first
                                            ctx.clearRect(0, 0, 32, 32);

                                            // Draw the tile image scaled to 32x32
                                            ctx.drawImage(
                                              image,
                                              noiseTile.x,
                                              noiseTile.y,
                                              noiseTile.width,
                                              noiseTile.height,
                                              0,
                                              0,
                                              32,
                                              32
                                            );
                                          }
                                        }
                                      }}
                                    />
                                  )}
                                  <div className="absolute inset-0 bg-red-500 bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                                    <Trash2 className="w-3 h-3 text-white" />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Add Noise Tiles Button */}
                        <button
                          onClick={() => {
                            setNoiseMaterial(material.id);
                            setSelectedNoiseTiles([]);
                          }}
                          className={`w-full flex items-center justify-center space-x-2 px-3 py-2 border-2 border-dashed rounded-lg font-medium transition-colors ${
                            noiseMaterial === material.id
                              ? "border-purple-400 bg-purple-50 text-purple-700 dark:border-purple-500 dark:bg-purple-900/20 dark:text-purple-300"
                              : "border-gray-300 text-gray-600 hover:border-purple-400 hover:text-purple-600 dark:border-gray-600 dark:text-gray-400"
                          }`}
                        >
                          <Plus className="w-4 h-4" />
                          <span>
                            {noiseMaterial === material.id
                              ? "Click tiles to add noise"
                              : "Add Noise Tiles"}
                          </span>
                        </button>
                      </div>
                    );
                  })}

                  {/* Current Selection Display */}
                  {noiseMaterial && selectedNoiseTiles.length > 0 && (
                    <div className="border border-purple-200 dark:border-purple-700 rounded-lg p-4 bg-purple-50 dark:bg-purple-900/20">
                      <p className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-2">
                        Selected noise tiles for{" "}
                        {
                          config.materials.find((m) => m.id === noiseMaterial)
                            ?.name
                        }
                        :
                      </p>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {selectedNoiseTiles.map((tile, index) => (
                          <div
                            key={index}
                            className="w-8 h-8 border rounded overflow-hidden bg-gray-100 cursor-pointer"
                            onClick={() => {
                              setSelectedNoiseTiles((prev) =>
                                prev.filter((_, i) => i !== index)
                              );
                            }}
                            title="Click to remove"
                          >
                            {image && (
                              <canvas
                                width={32}
                                height={32}
                                className="w-full h-full"
                                style={{ imageRendering: "pixelated" }}
                                ref={(canvas) => {
                                  if (canvas && image.complete) {
                                    const ctx = canvas.getContext(
                                      "2d"
                                    ) as ExtendedCanvasRenderingContext2D;
                                    if (ctx) {
                                      ctx.imageSmoothingEnabled = false;
                                      if (
                                        ctx.webkitImageSmoothingEnabled !==
                                        undefined
                                      )
                                        ctx.webkitImageSmoothingEnabled = false;
                                      if (
                                        ctx.mozImageSmoothingEnabled !==
                                        undefined
                                      )
                                        ctx.mozImageSmoothingEnabled = false;
                                      if (
                                        ctx.msImageSmoothingEnabled !==
                                        undefined
                                      )
                                        ctx.msImageSmoothingEnabled = false;

                                      // Clear canvas first
                                      ctx.clearRect(0, 0, 32, 32);

                                      // Draw the tile image scaled to 32x32
                                      ctx.drawImage(
                                        image,
                                        tile.x,
                                        tile.y,
                                        tile.width,
                                        tile.height,
                                        0,
                                        0,
                                        32,
                                        32
                                      );
                                    }
                                  }
                                }}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={addNoiseTiles}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add {selectedNoiseTiles.length} Noise Tiles</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  You need at least 1 base material to define noise tiles.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Complete Button */}
      {config.materials.length > 0 && (
        <div className="flex justify-center">
          <button
            onClick={() => onComplete(config)}
            className="flex items-center space-x-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
          >
            <Palette className="w-4 h-4" />
            <span>Start Painting</span>
          </button>
        </div>
      )}
    </div>
  );
}
