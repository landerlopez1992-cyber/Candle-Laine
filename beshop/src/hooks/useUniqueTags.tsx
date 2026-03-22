import {useState, useEffect} from 'react';
import {ProductType} from '../types';

export const useUniqueTags = (products: ProductType[]) => {
  const [uniqueTags, setUniqueTags] = useState<string[]>([]);

  useEffect(() => {
    const tags: Set<string> = new Set();

    products.forEach((product) => {
      product.tags.forEach((tag) => {
        tags.add(tag);
      });
    });

    setUniqueTags(Array.from(tags));
  }, [products]);

  return uniqueTags;
};
