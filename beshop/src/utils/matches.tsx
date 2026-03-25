import {ProductType, ColorType} from '../types';

export const colorMatch = (
  product: ProductType,
  selectedColors: string[],
): boolean => {
  return selectedColors.length === 0
    ? true
    : selectedColors.some((selectedColor) =>
        product.colors.some(
          (productColor: ColorType) => productColor.name === selectedColor,
        ),
      );
};

export const tagMatch = (
  product: ProductType,
  selectedTags: string[],
): boolean => {
  return selectedTags.length === 0
    ? true
    : selectedTags.some((tag) => product.tags.includes(tag));
};

export const statusMatch = (
  product: ProductType,
  selectedCategories: string[],
): boolean => {
  return selectedCategories.length === 0
    ? true
    : (product.isNew && selectedCategories.includes('new')) ||
        (product.isTop && selectedCategories.includes('top')) ||
        ((product.flag_discount === true || !!product.oldPrice) &&
          selectedCategories.includes('sale'));
};
