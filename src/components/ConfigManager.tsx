"use client";

import React, { useRef } from "react";
import { TilesetConfig } from "@/types/tileset";
import { Download, Upload, Save } from "lucide-react";

interface ConfigManagerProps {
  config: TilesetConfig | null;
  onConfigLoaded: (config: TilesetConfig) => void;
}

export function ConfigManager({ config, onConfigLoaded }: ConfigManagerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const saveConfig = () => {
    if (!config) {
      alert("No configuration to save");
      return;
    }

    const configToSave = {
      ...config,
      // Remove the base64 image data to reduce file size
      imageUrl: "",
    };

    const dataStr = JSON.stringify(configToSave, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

    const exportFileDefaultName = `${config.name
      .replace(/[^a-z0-9]/gi, "_")
      .toLowerCase()}_config.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
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
        ) as TilesetConfig;

        // Validate the config structure
        if (
          !configData.id ||
          !configData.name ||
          !configData.tileSize ||
          !Array.isArray(configData.materials)
        ) {
          throw new Error("Invalid configuration file format");
        }

        // Since we don't save the image data, the user will need to re-upload the image
        alert(
          "Configuration loaded! Please note that you will need to re-upload the tileset image."
        );
        onConfigLoaded(configData);
      } catch (error) {
        alert("Error loading configuration file: " + (error as Error).message);
      }
    };
    reader.readAsText(file);

    // Reset the input
    event.target.value = "";
  };

  return (
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
  );
}
