// Coordinates are relative to the arrangement, never the viewport or tray.
export function dropPosition(clientX, clientY, frame) {
  if (!(frame.width > 0 && frame.height > 0)) return null;
  const x=(clientX-frame.left)/frame.width*100;
  const y=(clientY-frame.top)/frame.height*100;
  return x>=0 && x<=100 && y>=0 && y<=100 ? {x,y} : null;
}
