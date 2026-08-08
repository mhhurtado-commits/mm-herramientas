export function updateSceneFocus(scene, delta, scale = 1) {
  if (!scene || !delta) return scene;
  const current = scene.focus || { x: 0.5, y: 0.5 };
  scene.focus = {
    x: Math.max(0, Math.min(1, current.x - Number(delta.x || 0) / scale)),
    y: Math.max(0, Math.min(1, current.y - Number(delta.y || 0) / scale)),
  };
  return scene;
}
