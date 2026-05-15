import { Palette, PaletteOptions } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Palette {
    surface: string;
    hairlineSoft: string;
    hairlineStrong: string;
    surfaceFeature: string;
    ink: string;
    steel: string;
  }

  interface PaletteOptions {
    surface?: string;
    hairlineSoft?: string;
    hairlineStrong?: string;
    surfaceFeature?: string;
    ink?: string;
    steel?: string;
  }
}
