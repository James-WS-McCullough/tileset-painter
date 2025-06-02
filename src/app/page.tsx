"use client";

import { TilesetPainter } from "@/components/TilesetPainter";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Tileset Painter
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Create and paint with custom tilesets
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <TilesetPainter />
      </main>
    </div>
  );
}
