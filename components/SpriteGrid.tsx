
import React, { useState, useEffect, useCallback } from 'react';
import {
  SPRITE_URL,
  SPRITE_COLS,
  SPRITE_ROWS,
  TOTAL_ITEMS,
} from '../constants';
import { GridItemData, SpriteCoords } from '../types';

const GRID_COLS = 14;
const GRID_ROWS = Math.ceil(TOTAL_ITEMS / GRID_COLS);

const getRandomCoords = (): SpriteCoords => ({
  x: Math.floor(Math.random() * SPRITE_COLS),
  y: Math.floor(Math.random() * SPRITE_ROWS),
});

export const SpriteGrid: React.FC = () => {
  const [items, setItems] = useState<GridItemData[]>([]);

  useEffect(() => {
    const initialItems = Array.from({ length: GRID_COLS * GRID_ROWS }).map((_, i) => ({
      id: i,
      coords: getRandomCoords(),
    }));
    setItems(initialItems);
  }, []);

  const shuffleItem = useCallback((id: number) => {
    setItems(prev => {
      const index = prev.findIndex(item => item.id === id);
      if (index === -1) return prev;
      const newItems = [...prev];
      newItems[index] = { ...newItems[index], coords: getRandomCoords() };
      return newItems;
    });
  }, []);

  return (
    <div
      className="w-full h-full"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
        gridTemplateRows: `repeat(${GRID_ROWS}, 1fr)`,
      }}
    >
      {items.map((item) => (
        <div
          key={item.id}
          onMouseEnter={() => shuffleItem(item.id)}
          onMouseMove={() => shuffleItem(item.id)}
          className="cursor-pointer overflow-hidden relative group/item"
        >
          <div
            className="w-full h-full transition-[filter,background-position] duration-150 ease-out brightness-[0.85] group-hover/item:brightness-125 group-hover/item:scale-110"
            style={{
              backgroundImage: `url("${SPRITE_URL}")`,
              backgroundSize: `${SPRITE_COLS * 100}% ${SPRITE_ROWS * 100}%`,
              backgroundPosition: `${(item.coords.x / (SPRITE_COLS - 1)) * 100}% ${(item.coords.y / (SPRITE_ROWS - 1)) * 100}%`,
            }}
          />
          <div className="absolute inset-0 bg-white/0 group-hover/item:bg-white/5 transition-colors pointer-events-none border border-transparent group-hover/item:border-white/20" />
        </div>
      ))}
    </div>
  );
};

export default SpriteGrid;
