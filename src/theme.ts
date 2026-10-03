export const colors = {
  bg: '#140b33',
  neonPink: '#ff4fd8',
  neonPurple: '#8b5cff',
  neonCyan: '#3ef0ff',
  gold: '#ffd23f',
  danger: '#ff4d5e',
  success: '#5be37d',
  text: '#ffffff',
  textDim: 'rgba(255,255,255,0.65)',
  glass: 'rgba(255,255,255,0.08)',
  glassStrong: 'rgba(255,255,255,0.14)',
  glassBorder: 'rgba(255,255,255,0.18)',
  fur: '#e8994f',
  goldFur: '#ffcc33',
  belly: '#ffe7c7',
  pink: '#ff9eb5',
  dirt: '#7a4a22',
  holeDark: '#12070a',
};

export const gradients = {
  bg: 'linear-gradient(180deg, #120a2e 0%, #2b1263 48%, #0c2f55 100%)',
  field: 'linear-gradient(180deg, #5be37d 0%, #27b05f 50%, #157a43 100%)',
  primary: 'linear-gradient(135deg, #ff4fd8 0%, #8b5cff 55%, #3ef0ff 100%)',
  gold: 'linear-gradient(180deg, #fff3a0 0%, #ffd23f 45%, #e89b0c 100%)',
  fur: 'linear-gradient(180deg, #f6bd7a 0%, #e8994f 55%, #c4742f 100%)',
  goldFur: 'linear-gradient(180deg, #fff6b0 0%, #ffcc33 50%, #e0950a 100%)',
  mallet: 'linear-gradient(90deg, #ff8a80 0%, #ff4d5e 40%, #c2185b 100%)',
  wood: 'linear-gradient(180deg, #e0a868 0%, #b0723a 55%, #7a4a22 100%)',
  mound: 'linear-gradient(180deg, #b47a43 0%, #8a5428 60%, #5c3416 100%)',
  hole: 'linear-gradient(180deg, #000000 0%, #1d0d08 70%, #3a1f0e 100%)',
  danger: 'linear-gradient(180deg, #ff7a85 0%, #ff4d5e 50%, #c81e3a 100%)',
};

export const glow = (color: string, radius = 18) =>
  `0px 0px ${radius}px ${color}`;
