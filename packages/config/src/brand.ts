import brandTokens from '../brand.json';

export const colors = brandTokens.colors;
export const fonts = brandTokens.fonts;
export const radius = brandTokens.radius;
export const apiPrefix = brandTokens.api.prefix;

export type BrandColor = keyof typeof colors;

export const brand = {
  colors,
  fonts,
  radius,
  apiPrefix,
};
