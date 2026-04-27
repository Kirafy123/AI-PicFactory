export interface PropItem {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

export interface PropCategory {
  id: string;
  name: string;
  items: PropItem[];
}

export const PROP_CATEGORIES: PropCategory[] = [
  {
    id: '室内家具',
    name: '室内家具',
    items: [
      { id: 'sofa', name: '沙发', emoji: '🛋️', color: '#8B6914' },
      { id: 'chair', name: '椅子', emoji: '🪑', color: '#A0522D' },
      { id: 'desk', name: '桌子', emoji: '🪞', color: '#DEB887' },
      { id: 'bed', name: '床', emoji: '🛏️', color: '#CD853F' },
      { id: 'cabinet', name: '柜子', emoji: '🗄️', color: '#8B4513' },
      { id: 'shelf', name: '书架', emoji: '📚', color: '#D2691E' },
    ],
  },
  {
    id: '室外道具',
    name: '室外道具',
    items: [
      { id: 'house', name: '房屋', emoji: '🏠', color: '#CD853F' },
      { id: 'tree', name: '树木', emoji: '🌲', color: '#228B22' },
      { id: 'car', name: '汽车', emoji: '🚗', color: '#4169E1' },
      { id: 'bench', name: '长椅', emoji: '🪑', color: '#8B6914' },
      { id: 'table', name: '户外桌', emoji: '🪵', color: '#DEB887' },
      { id: 'rock', name: '石头', emoji: '🪨', color: '#808080' },
      { id: 'fence', name: '栅栏', emoji: '🪧', color: '#8B4513' },
      { id: 'lamp', name: '路灯', emoji: '💡', color: '#FFD700' },
    ],
  },
  {
    id: '古风道具',
    name: '古风道具',
    items: [
      { id: 'sword', name: '剑', emoji: '⚔️', color: '#C0C0C0' },
      { id: 'lantern', name: '灯笼', emoji: '🏮', color: '#DC143C' },
      { id: 'winepot', name: '酒壶', emoji: '🏺', color: '#DAA520' },
      { id: 'guqin', name: '古琴', emoji: '🎵', color: '#8B4513' },
      { id: 'vase', name: '花瓶', emoji: '🏺', color: '#4682B4' },
      { id: 'screen', name: '屏风', emoji: '🖼️', color: '#8B0000' },
      { id: 'ancientbed', name: '古床', emoji: '🛏️', color: '#8B4513' },
      { id: 'teatable', name: '茶桌', emoji: '🫖', color: '#8B6914' },
    ],
  },
  {
    id: '现代道具',
    name: '现代道具',
    items: [
      { id: 'door', name: '门', emoji: '🚪', color: '#8B4513' },
      { id: 'skyscraper', name: '高楼', emoji: '🏢', color: '#708090' },
      { id: 'shopfront', name: '店面', emoji: '🏪', color: '#4682B4' },
      { id: 'streetlight', name: '路灯', emoji: '🔦', color: '#FFD700' },
      { id: 'trashcan', name: '垃圾桶', emoji: '🗑️', color: '#696969' },
      { id: 'hydrant', name: '消防栓', emoji: '🚒', color: '#DC143C' },
    ],
  },
  {
    id: '装饰',
    name: '装饰',
    items: [
      { id: 'longlantern', name: '长灯笼', emoji: '🏮', color: '#DC143C' },
      { id: 'cauldron', name: '大鼎', emoji: '🫙', color: '#8B8000' },
      { id: 'inkstone', name: '砚台', emoji: '⬛', color: '#2F4F4F' },
      { id: 'hourglass', name: '沙漏', emoji: '⏳', color: '#DAA520' },
      { id: 'incense', name: '香炉', emoji: '🕯️', color: '#CD853F' },
    ],
  },
  {
    id: '几何模型',
    name: '几何模型',
    items: [
      { id: 'cube', name: '正方体', emoji: '⬜', color: '#4682B4' },
      { id: 'sphere', name: '球体', emoji: '⚪', color: '#6A5ACD' },
      { id: 'cylinder', name: '圆柱', emoji: '🔵', color: '#20B2AA' },
      { id: 'cone', name: '圆锥', emoji: '🔺', color: '#FF6347' },
      { id: 'torus', name: '圆环', emoji: '⭕', color: '#FF69B4' },
      { id: 'plane', name: '平面', emoji: '▬', color: '#90EE90' },
    ],
  },
];

export const POSE_CATEGORIES = [
  {
    id: '站立',
    name: '站立',
    items: [
      { id: 'stand', name: '站立' },
      { id: 'lean45', name: '斜靠45°' },
      { id: 'lieflat', name: '平躺' },
    ],
  },
  {
    id: '坐',
    name: '坐',
    items: [
      { id: 'sitchair', name: '坐椅子' },
    ],
  },
];

export const CAMERA_PRESETS = [
  { name: '正面', position: [0, 1.6, 12] as [number, number, number] },
  { name: '侧面', position: [12, 1.6, 0] as [number, number, number] },
  { name: '45度', position: [8, 2, 8] as [number, number, number] },
  { name: '俯视', position: [0, 15, 0.1] as [number, number, number] },
  { name: '低角度', position: [0, 0.8, 10] as [number, number, number] },
  { name: '远景', position: [0, 3, 20] as [number, number, number] },
  { name: '左倾斜', position: [6, 2.5, 10] as [number, number, number] },
  { name: '右倾斜', position: [-6, 2.5, 10] as [number, number, number] },
  { name: '斜侧', position: [8, 2.5, 8] as [number, number, number] },
  { name: '斜俯', position: [6, 8, 6] as [number, number, number] },
];

export interface MannequinState {
  id: string;
  color: string;
  position: [number, number, number];
  rotation: [number, number, number];
  pose: string;
  scale: number;
}

export interface PropState {
  id: string;
  propId: string;
  color: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
}
