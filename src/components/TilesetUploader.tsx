"use client";

import React, { useState, useRef, useCallback } from "react";
import { TilesetConfig } from "@/types/tileset";
import { Upload, Image as ImageIcon, Grid } from "lucide-react";

interface TilesetUploaderProps {
  onTilesetUploaded: (config: TilesetConfig) => void;
  onConfigLoaded?: (config: TilesetConfig) => void;
}

export function TilesetUploader({
  onTilesetUploaded,
  onConfigLoaded,
}: TilesetUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [tileSize, setTileSize] = useState({ width: 32, height: 32 });
  const [tilesetName, setTilesetName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const configInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) {
        alert("Please upload an image file");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        setUploadedImage(imageUrl);

        // Get image dimensions
        const img = new Image();
        img.onload = () => {
          setImageSize({ width: img.width, height: img.height });
          if (!tilesetName) {
            setTilesetName(file.name.replace(/\.[^/.]+$/, ""));
          }
        };
        img.src = imageUrl;
      };
      reader.readAsDataURL(file);
    },
    [tilesetName]
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFile(e.dataTransfer.files[0]);
      }
    },
    [handleFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      e.preventDefault();
      if (e.target.files && e.target.files[0]) {
        handleFile(e.target.files[0]);
      }
    },
    [handleFile]
  );

  const handleSubmit = () => {
    if (!uploadedImage || !imageSize || !tilesetName.trim()) {
      alert("Please fill in all required fields");
      return;
    }

    const config: TilesetConfig = {
      id: Date.now().toString(),
      name: tilesetName.trim(),
      imageUrl: uploadedImage,
      tileSize,
      materials: [],
      borders: [],
      noise: [],
    };

    onTilesetUploaded(config);
  };

  const loadConfiguration = () => {
    configInputRef.current?.click();
  };

  const handleConfigLoad = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const configData = JSON.parse(
          e.target?.result as string
        ) as TilesetConfig;

        // Validate the config structure
        if (
          !configData.id ||
          !configData.name ||
          !configData.tileSize ||
          !Array.isArray(configData.materials) ||
          !configData.imageUrl
        ) {
          alert("Invalid configuration file format or missing image data");
          return;
        }

        // Load the configuration directly if onConfigLoaded is provided
        if (onConfigLoaded) {
          onConfigLoaded(configData);
        } else {
          // Fallback: just load the tileset part
          onTilesetUploaded(configData);
        }
      } catch (error) {
        alert("Error loading configuration file: " + (error as Error).message);
      }
    };
    reader.readAsText(file);

    // Reset the input
    event.target.value = "";
  };

  const tilesPerRow = Math.floor(imageSize?.width || 0 / tileSize.width);
  const tilesPerColumn = Math.floor(imageSize?.height || 0 / tileSize.height);
  const totalTiles = tilesPerRow * tilesPerColumn;

  return (
    <div className="p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Upload Your Tileset
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Upload an image file and configure the tile dimensions, or load a
          saved configuration
        </p>
      </div>

      {/* Load Configuration Option */}
      <div className="text-center">
        <input
          ref={configInputRef}
          type="file"
          accept=".json"
          onChange={handleConfigLoad}
          className="hidden"
        />
        <button
          onClick={loadConfiguration}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
        >
          <Upload className="w-4 h-4" />
          <span>Load Saved Configuration</span>
        </button>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Load a complete tileset configuration with all materials, borders, and
          noise settings
        </p>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300 dark:border-gray-600" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">
            OR
          </span>
        </div>
      </div>

      {/* File Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20"
            : uploadedImage
            ? "border-green-400 bg-green-50 dark:bg-green-900/20"
            : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          accept="image/*"
          onChange={handleChange}
        />

        {uploadedImage ? (
          <div className="space-y-4">
            <div className="flex justify-center">
              <img
                src={uploadedImage}
                alt="Uploaded tileset"
                className="max-w-full max-h-64 border rounded shadow-sm"
                style={{ imageRendering: "pixelated" }}
              />
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {imageSize && (
                <p>
                  Image size: {imageSize.width} × {imageSize.height} pixels
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-center">
              <Upload className="w-12 h-12 text-gray-400" />
            </div>
            <div>
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                Drop your tileset image here
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                or click to browse files
              </p>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Supports PNG, JPG, GIF, and other image formats
            </p>
          </div>
        )}
      </div>

      {uploadedImage && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tileset Name */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tileset Name
            </label>
            <input
              type="text"
              value={tilesetName}
              onChange={(e) => setTilesetName(e.target.value)}
              placeholder="Enter tileset name"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Tile Size Configuration */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Grid className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Tile Size
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Width (px)
                </label>
                <input
                  type="number"
                  min="1"
                  max="256"
                  value={tileSize.width}
                  onChange={(e) =>
                    setTileSize((prev) => ({
                      ...prev,
                      width: parseInt(e.target.value) || 32,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Height (px)
                </label>
                <input
                  type="number"
                  min="1"
                  max="256"
                  value={tileSize.height}
                  onChange={(e) =>
                    setTileSize((prev) => ({
                      ...prev,
                      height: parseInt(e.target.value) || 32,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tile Grid Information */}
      {uploadedImage && imageSize && (
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            Grid Information
          </h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">
                Tiles per row:
              </span>
              <span className="ml-2 font-medium text-gray-900 dark:text-white">
                {tilesPerRow}
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">
                Tiles per column:
              </span>
              <span className="ml-2 font-medium text-gray-900 dark:text-white">
                {tilesPerColumn}
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">
                Total tiles:
              </span>
              <span className="ml-2 font-medium text-gray-900 dark:text-white">
                {totalTiles}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Submit Button */}
      {uploadedImage && (
        <div className="flex justify-center">
          <button
            onClick={handleSubmit}
            disabled={!tilesetName.trim()}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
          >
            <ImageIcon className="w-4 h-4" />
            <span>Configure Tileset</span>
          </button>
        </div>
      )}
    </div>
  );
}
