"use client";

import React, { useRef } from "react";
import { TilesetConfig } from "@/types/tileset";
import { Download, Upload } from "lucide-react";
import { useToasts, ToastContainer } from "./Toast";

interface ConfigManagerProps {
  config: TilesetConfig | null;
  onConfigLoaded: (config: TilesetConfig) => void;
}

export function ConfigManager({ config, onConfigLoaded }: ConfigManagerProps) {
  const { toasts, removeToast, showSuccess, showError } = useToasts();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const saveConfig = () => {
    if (!config) {
      showError("Save Error", "No configuration to save");
      return;
    }

    // Include the complete configuration with image data
    const configToSave = {
      ...config,
      version: "1.0", // Add version for future compatibility
      savedAt: new Date().toISOString(),
    };

    const dataStr = JSON.stringify(configToSave, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });

    const exportFileDefaultName = `${config.name
      .replace(/[^a-z0-9]/gi, "_")
      .toLowerCase()}_config.json`;

    const linkElement = document.createElement("a");
    linkElement.href = URL.createObjectURL(dataBlob);
    linkElement.download = exportFileDefaultName;
    linkElement.click();

    // Clean up the URL object
    URL.revokeObjectURL(linkElement.href);

    showSuccess(
      "Configuration Saved",
      `Saved as ${exportFileDefaultName} with complete tileset data`
    );
  };

  const loadConfig = () => {
    fileInputRef.current?.click();
  };

  const handleFileLoad = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const configData = JSON.parse(
          e.target?.result as string
        ) as TilesetConfig & { version?: string; savedAt?: string };

        // Validate the config structure
        if (
          !configData.id ||
          !configData.name ||
          !configData.tileSize ||
          !Array.isArray(configData.materials)
        ) {
          throw new Error("Invalid configuration file format");
        }

        // Check if image data is present
        if (!configData.imageUrl || configData.imageUrl === "") {
          showError(
            "Load Error",
            "Configuration file doesn't contain image data. Please use a complete configuration file."
          );
          return;
        }

        // Clean up the config (remove extra metadata)
        const cleanConfig: TilesetConfig = {
          id: configData.id,
          name: configData.name,
          imageUrl: configData.imageUrl,
          tileSize: configData.tileSize,
          materials: configData.materials,
          borders: configData.borders,
          noise: configData.noise,
        };

        showSuccess(
          "Configuration Loaded",
          `Loaded complete configuration with ${configData.materials.length} materials, ${configData.borders.length} borders, and ${configData.noise.length} noise tiles`
        );
        onConfigLoaded(cleanConfig);
      } catch (error) {
        showError(
          "Load Error",
          "Error loading configuration file: " + (error as Error).message
        );
      }
    };
    reader.readAsText(file);

    // Reset the input
    event.target.value = "";
  };

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <div className="flex items-center space-x-2">
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileLoad}
          className="hidden"
        />

        <button
          onClick={loadConfig}
          className="flex items-center space-x-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors"
          title="Load Configuration"
        >
          <Upload className="w-4 h-4" />
          <span>Load Config</span>
        </button>

        <button
          onClick={saveConfig}
          disabled={!config}
          className="flex items-center space-x-2 px-3 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
          title="Save Configuration"
        >
          <Download className="w-4 h-4" />
          <span>Save Config</span>
        </button>
      </div>
    </>
  );
}
