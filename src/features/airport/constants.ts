import { OtherOption, RouteType } from '@/data/airports';

export const ROUTE_EMOJI: Record<RouteType, string> = {
  train: '🚃',
  monorail: '🚝',
  bus: '🚌',
  taxi: '🚕',
};

export const OTHER_EMOJI: Record<OtherOption['type'], string> = {
  taxi: '🚕',
  rentalcar: '🚗',
};
