
import React, { useState, useEffect, useCallback } from 'react';
import {
  SPRITE_URL,
  SPRITE_COLS,
  SPRITE_ROWS,
  TOTAL_ITEMS,
} from '../constants';
import { GridItemData, SpriteCoords } from '../types';

const getRandomCoords = (): SpriteCoords => ({
  x: Math.floor(Math.random() * SPRITE_COLS),
  y: Math.floor(Math.random() * SPRITE_ROWS),
});

export const SpriteGrid: React.FC = () => {
  const [items, setItems] = useState<GridItemData[]>([]);

  useEffect(() => {
    const initialItems = Array.from({ length: TOTAL_ITEMS }).map((_, i) => ({
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
      className="grid grid-cols-4 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-14 w-full"
    >
      {items.map((item) => (
        <div
          key={item.id}
          onMouseEnter={() => shuffleItem(item.id)}
          onMouseMove={() => shuffleItem(item.id)}
          className="aspect-square cursor-pointer overflow-hidden transition-all duration-300 relative group/item"
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
