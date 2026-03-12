import { WpcPanelType } from '../../utils/wpcCalculations';

export type WpcTone = 'negro' | 'caoba' | 'chocolate' | 'natural' | 'cafe-madera';

export const WPC_TONE_LABELS: Record<WpcTone, string> = {
  negro: 'Negro',
  caoba: 'Caoba',
  chocolate: 'Chocolate',
  natural: 'Natural',
  'cafe-madera': 'Café Madera'
};

export const WPC_TONES_BY_TYPE: Record<WpcPanelType, WpcTone[]> = {
  interior: ['negro', 'caoba', 'chocolate', 'natural'],
  exterior: ['negro', 'caoba', 'natural'],
  coextruido: ['cafe-madera']
};

export const WPC_TEXTURES: Record<WpcTone, string> = {
  negro: 'textures/wpc-interior-negro.jpg',
  caoba: 'textures/wpc-caoba.jpg',
  chocolate: 'textures/wpc-interior-chocolate.jpg',
  natural: 'textures/wpc-natural.jpg',
  'cafe-madera': 'textures/wpc-coextruida-cafe-madera.jpg'
};

export const WPC_PANEL_LENGTH_M = 2.9;
