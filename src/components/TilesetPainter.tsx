"use client";

import React, { useState, useCallback } from "react";
import { TilesetUploader } from "./TilesetUploader";
import { TileConfigurer } from "./TileConfigurer";
import { TilePainter } from "./TilePainter";
import { ConfigManager } from "./ConfigManager";
import { TilesetConfig, AppMode } from "@/types/tileset";
import {
  ChevronLeft,
  ChevronRight,
  Upload,
  Settings,
  Paintbrush,
  Save,
} from "lucide-react";

export function TilesetPainter() {
  const [mode, setMode] = useState<AppMode>("upload");
  const [tilesetConfig, setTilesetConfig] = useState<TilesetConfig | null>(
    null
  );

  const handleTilesetUploaded = useCallback((config: TilesetConfig) => {
    setTilesetConfig(config);
    setMode("configure");
  }, []);

  const handleConfigurationComplete = useCallback((config: TilesetConfig) => {
    setTilesetConfig(config);
    setMode("paint");
  }, []);

  const handleConfigLoaded = useCallback((config: TilesetConfig) => {
    setTilesetConfig(config);
    setMode("configure");
  }, []);

  const renderModeIcon = (currentMode: AppMode) => {
    switch (currentMode) {
      case "upload":
        return <Upload className="w-5 h-5" />;
      case "configure":
        return <Settings className="w-5 h-5" />;
      case "paint":
        return <Paintbrush className="w-5 h-5" />;
    }
  };

  const canNavigateToMode = (targetMode: AppMode): boolean => {
    switch (targetMode) {
      case "upload":
        return true;
      case "configure":
        return tilesetConfig !== null;
      case "paint":
        return tilesetConfig !== null && tilesetConfig.materials.length > 0;
    }
  };

  return (
    <div className="space-y-6">
      {/* Mode Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setMode("upload")}
            disabled={!canNavigateToMode("upload")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
              mode === "upload"
                ? "bg-blue-500 text-white border-blue-500"
                : canNavigateToMode("upload")
                ? "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                : "bg-gray-100 dark:bg-gray-700 text-gray-400 border-gray-200 dark:border-gray-600 cursor-not-allowed"
            }`}
          >
            {renderModeIcon("upload")}
            <span>1. Upload Tileset</span>
          </button>

          <ChevronRight className="w-4 h-4 text-gray-400" />

          <button
            onClick={() => setMode("configure")}
            disabled={!canNavigateToMode("configure")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
              mode === "configure"
                ? "bg-blue-500 text-white border-blue-500"
                : canNavigateToMode("configure")
                ? "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                : "bg-gray-100 dark:bg-gray-700 text-gray-400 border-gray-200 dark:border-gray-600 cursor-not-allowed"
            }`}
          >
            {renderModeIcon("configure")}
            <span>2. Configure Tiles</span>
          </button>

          <ChevronRight className="w-4 h-4 text-gray-400" />

          <button
            onClick={() => setMode("paint")}
            disabled={!canNavigateToMode("paint")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
              mode === "paint"
                ? "bg-blue-500 text-white border-blue-500"
                : canNavigateToMode("paint")
                ? "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                : "bg-gray-100 dark:bg-gray-700 text-gray-400 border-gray-200 dark:border-gray-600 cursor-not-allowed"
            }`}
          >
            {renderModeIcon("paint")}
            <span>3. Paint</span>
          </button>
        </div>

        {/* Configuration Management */}
        <div className="flex items-center space-x-2">
          <ConfigManager
            config={tilesetConfig}
            onConfigLoaded={handleConfigLoaded}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        {mode === "upload" && (
          <TilesetUploader onTilesetUploaded={handleTilesetUploaded} />
        )}

        {mode === "configure" && tilesetConfig && (
          <TileConfigurer
            config={tilesetConfig}
            onConfigChange={setTilesetConfig}
            onComplete={handleConfigurationComplete}
          />
        )}

        {mode === "paint" && tilesetConfig && (
          <TilePainter config={tilesetConfig} />
        )}
      </div>
    </div>
  );
}
