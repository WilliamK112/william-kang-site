// A small, illustrated sky belonging to the model, built entirely from local
// procedural textures. Progress is shared with the scene's daylight transition.
export function buildSky({ THREE, scene }) {
  const sky = new THREE.Group();
  sky.name = 'Campus illustrated sky';
  sky.userData.dynamic = true;
  scene.add(sky);
  const textures = [], materials = [];
  const clamp = value => Math.max(0, Math.min(1, value));
  const smooth = (a, b, value) => {
    const t = clamp((value - a) / (b - a));
    return t * t * (3 - 2 * t);
  };

  function texture(width, height, paint) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    paint(canvas.getContext('2d'), width, height);
    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    textures.push(map);
    return map;
  }
  function sprite(map, x, y, z, width, height, opacity = 1, additive = false) {
    const material = new THREE.SpriteMaterial({
      map, transparent: true, opacity, depthWrite: false, toneMapped: false,
      blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    });
    materials.push(material);
    const object = new THREE.Sprite(material);
    object.position.set(x, y, z);
    object.scale.set(width, height, 1);
    sky.add(object);
    return object;
  }

  const haloMap = texture(256, 256, (ctx, width, height) => {
    const halo = ctx.createRadialGradient(128, 128, 12, 128, 128, 124);
    halo.addColorStop(0, 'rgba(255,236,187,0.50)');
    halo.addColorStop(.25, 'rgba(255,236,187,0.17)');
    halo.addColorStop(.64, 'rgba(255,236,187,0.025)');
    halo.addColorStop(1, 'rgba(255,236,187,0)');
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, width, height);
  });
  const moonMap = texture(512, 512, ctx => {
    ctx.fillStyle = '#fff0ce';
    ctx.beginPath(); ctx.arc(256, 256, 202, 0, Math.PI * 2); ctx.fill();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath(); ctx.arc(336, 203, 191, 0, Math.PI * 2); ctx.fill();
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = 'rgba(202,182,151,.18)';
    for (const [x, y, r] of [[122, 272, 16], [171, 364, 24], [238, 416, 12]]) {
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
  });
  const sunMap = texture(512, 512, ctx => {
    ctx.strokeStyle = 'rgba(237,166,87,.28)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(256, 256, 221, 0, Math.PI * 2); ctx.stroke();
    const sun = ctx.createLinearGradient(0, 70, 0, 435);
    sun.addColorStop(0, '#fff2c9'); sun.addColorStop(1, '#f3bd78');
    ctx.fillStyle = sun;
    ctx.beginPath(); ctx.arc(256, 256, 185, 0, Math.PI * 2); ctx.fill();
  });
  const starMap = texture(128, 128, ctx => {
    ctx.fillStyle = '#efe9d6';
    ctx.beginPath();
    ctx.moveTo(64, 8); ctx.quadraticCurveTo(68, 58, 120, 64);
    ctx.quadraticCurveTo(68, 70, 64, 120);
    ctx.quadraticCurveTo(58, 70, 8, 64);
    ctx.quadraticCurveTo(58, 58, 64, 8); ctx.fill();
  });
  const cloudMap = texture(768, 320, ctx => {
    // Compact scalloped silhouettes retain their graphic quality at hero size.
    const fill = ctx.createLinearGradient(0, 50, 0, 272);
    fill.addColorStop(0, '#fff8e8'); fill.addColorStop(.68, '#f0eee3');
    fill.addColorStop(1, '#d1dce0');
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(115, 247);
    ctx.bezierCurveTo(28, 247, 29, 141, 118, 137);
    ctx.bezierCurveTo(131, 72, 212, 63, 256, 111);
    ctx.bezierCurveTo(285, 17, 423, 23, 456, 117);
    ctx.bezierCurveTo(499, 88, 568, 107, 586, 155);
    ctx.bezierCurveTo(657, 127, 721, 174, 704, 216);
    ctx.bezierCurveTo(696, 246, 669, 251, 630, 251);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(189,207,211,.31)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(154, 248);
    ctx.bezierCurveTo(323, 257, 472, 245, 631, 251); ctx.stroke();
  });

  const moonHalo = sprite(haloMap, 4, 9.55, -5.8, 3.65, 3.65, .35, true);
  const moon = sprite(moonMap, 4, 9.55, -5.77, 1.72, 1.72);
  const sunHalo = sprite(haloMap, 4.5, 8.05, -5.8, 4, 4, 0, true);
  const sun = sprite(sunMap, 4.5, 8.05, -5.77, 1.72, 1.72, 0);
  moon.name = 'Crescent moon'; sun.name = 'Morning sun';
  const stars = [
    [-3.8, 9.7, -6.6, .16], [-2.55, 10.8, -6.4, .23],
    [-.75, 9.85, -6.3, .12], [.85, 11.35, -6.3, .18],
    [2.15, 10.65, -6.1, .12], [5.1, 11.1, -6.7, .19],
    [6.6, 9.25, -6.2, .13], [-5.65, 8.95, -6.5, .12],
    [6.75, 10.45, -6.8, .1],
  ].map(([x, y, z, scale], index) => {
    const object = sprite(starMap, x, y, z, scale, scale, .6);
    object.name = `Quiet star ${index + 1}`;
    return object;
  });
  const clouds = [
    { object: sprite(cloudMap, -2.35, 9.2, -7.8, 4.35, 1.81, 0), x: -2.35, phase: .6, opacity: .84 },
    { object: sprite(cloudMap, 6.2, 8.6, -7.3, 2.85, 1.19, 0), x: 6.2, phase: 2.6, opacity: .70 },
    { object: sprite(cloudMap, -5.8, 7.8, -7.1, 2.2, .92, 0), x: -5.8, phase: 4.5, opacity: .48 },
  ];

  function setDay(progress, time = 0) {
    const day = clamp(progress);
    const nightVisibility = 1 - smooth(.02, .62, day);
    const dayVisibility = smooth(.32, .97, day);
    moon.material.opacity = nightVisibility;
    moonHalo.material.opacity = nightVisibility * .36;
    moon.position.y = moonHalo.position.y = 9.55 - day * 1.6;
    moon.position.x = moonHalo.position.x = 4 - day * .6;
    sun.material.opacity = dayVisibility;
    sunHalo.material.opacity = dayVisibility * .46;
    sun.position.y = sunHalo.position.y = 7.9 + day * 1.85;
    sun.position.x = sunHalo.position.x = 5.05 - day * .7;
    stars.forEach((star, index) => {
      star.material.opacity = (1 - smooth(0, .53, day)) * (.46 + .18 * Math.sin(time * .48 + index * 1.87));
    });
    clouds.forEach(({ object, x, phase, opacity }) => {
      object.material.opacity = smooth(.24, .92, day) * opacity;
      object.position.x = x + Math.sin(time * .035 + phase) * .18;
    });
    // Zero-alpha sprites need not take part in the mirrored reflection pass.
    for (const object of sky.children) object.visible = object.material.opacity > .003;
  }
  setDay(0);
  return {
    group: sky,
    setDay,
    dispose() {
      scene.remove(sky);
      for (const material of materials) material.dispose();
      for (const map of textures) map.dispose();
    },
  };
}
