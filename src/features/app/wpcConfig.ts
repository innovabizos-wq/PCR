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

export const WPC_TEXTURES: Record<WpcPanelType, Partial<Record<WpcTone, string>>> = {
  interior: {
    negro: 'textures/wpc-interior-negro.jpg',
    caoba: 'textures/wpc-interior-caoba.jpg',
    chocolate: 'textures/wpc-interior-chocolate.jpg',
    natural: 'textures/wpc-interior-natural.jpg'
  },
  exterior: {
    negro: 'textures/wpc-exterior-negro.jpg',
    caoba: 'textures/wpc-exterior-caoba.jpg',
    natural: 'textures/wpc-exterior-natural.jpg'
  },
  coextruido: {
    'cafe-madera': 'textures/wpc-coextruido-cafe-madera.jpg'
  }
};

export const getWpcTexture = (panelType: WpcPanelType, tone: WpcTone): string => {
  const direct = WPC_TEXTURES[panelType][tone];
  if (direct) return direct;

  const fallbackType = WPC_TONES_BY_TYPE[panelType][0];
  if (fallbackType) {
    const fallback = WPC_TEXTURES[panelType][fallbackType];
    if (fallback) return fallback;
  }

  return 'textures/wpc-interior-negro.jpg';
};

export const WPC_PANEL_LENGTH_M = 2.9;
