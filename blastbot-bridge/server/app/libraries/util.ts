export const colors = ["red", "purple", "blue", "light-blue", "orange"];

export function numberFixedLen(n, len) {
  return (1e4 + "" + n).slice(-len);
}

export function getRandomColor() {
  const index = Math.floor(Math.random() * colors.length);
  return colors[index];
}
