import {useState, useEffect} from 'react';

import {ColorType, ProductType} from '../types';

export const useUniqueColors = (products: ProductType[]) => {
  const [uniqueColors, setUniqueColors] = useState<ColorType[]>([]);

  useEffect(() => {
    const colors: ColorType[] = [];

    products.forEach((product) => {
      product.colors.forEach((color) => {
        if (!colors.some((uniqueColor) => uniqueColor.id === color.id)) {
          colors.push(color);
        }
      });
    });

    setUniqueColors(colors);
  }, [products]);

  return uniqueColors;
};
