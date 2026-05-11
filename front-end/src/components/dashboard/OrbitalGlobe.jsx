import { useRef, useEffect } from "react";
import * as THREE from "three";

export default function OrbitalGlobe() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const W = mount.clientWidth;
    const H = mount.clientHeight || 420;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    // Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 1000);
    camera.position.set(0, 2.5, 7);
    camera.lookAt(0, 0, 0);

    // Lights
    const ambient = new THREE.AmbientLight(0x1a3a6a, 1.2);
    scene.add(ambient);
    const sunLight = new THREE.PointLight(0x4488ff, 3, 50);
    sunLight.position.set(8, 5, 8);
    scene.add(sunLight);
    const rimLight = new THREE.PointLight(0x0066ff, 1.5, 30);
    rimLight.position.set(-8, -3, -5);
    scene.add(rimLight);

    // Stars
    const starGeo = new THREE.BufferGeometry();
    const starCount = 1500;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i++) {
      starPositions[i] = (Math.random() - 0.5) * 200;
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.15, transparent: true, opacity: 0.7 });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // Earth
    const earthGeo = new THREE.SphereGeometry(2, 64, 64);
    const earthMat = new THREE.MeshPhongMaterial({
      color: 0x1a4a8a,
      emissive: 0x0d2a5a,
      emissiveIntensity: 0.6,
      shininess: 40,
      specular: 0x4488cc,
    });
    const earth = new THREE.Mesh(earthGeo, earthMat);
    scene.add(earth);

    // City lights (yellow dots)
    const cityGroup = new THREE.Group();
    for (let i = 0; i < 120; i++) {
      const phi = Math.random() * Math.PI;
      const theta = Math.random() * Math.PI * 2;
      const r = 2.02;
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);
      const dotGeo = new THREE.SphereGeometry(0.012, 4, 4);
      const dotMat = new THREE.MeshBasicMaterial({ color: 0xffcc44, transparent: true, opacity: 0.8 });
      const dot = new THREE.Mesh(dotGeo, dotMat);
      dot.position.set(x, y, z);
      cityGroup.add(dot);
    }
    scene.add(cityGroup);

    // Land masses as solid patches on the globe surface
    // Each continent is made of multiple overlapping elliptical patches
    const landGroup = new THREE.Group();

    // Helper: create a solid elliptical patch on the sphere surface
    function createLandPatch(centerPhi, centerTheta, spanPhi, spanTheta, color, numPoints = 800) {
      const positions = [];
      // Use random points within a seed-based irregular shape
      const rng = (seed) => {
        let x = Math.sin(seed * 127.1 + centerPhi * 311.7) * 43758.5453;
        return x - Math.floor(x);
      };
      for (let i = 0; i < numPoints; i++) {
        // Irregular shape via noise offset
        const noise1 = (rng(i * 3.1) - 0.5) * 0.3;
        const noise2 = (rng(i * 7.3) - 0.5) * 0.3;
        const angle = rng(i * 2.7) * Math.PI * 2;
        const radius = rng(i * 4.9) * (1 + noise1);
        const dp = Math.cos(angle) * radius * spanPhi * 0.5;
        const dt = Math.sin(angle) * radius * spanTheta * 0.5;
        const pp = centerPhi + dp + noise2 * 0.05;
        const tt = centerTheta + dt;
        const r = 2.012;
        positions.push(new THREE.Vector3(
          r * Math.sin(pp) * Math.cos(tt),
          r * Math.cos(pp),
          r * Math.sin(pp) * Math.sin(tt)
        ));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(positions);
      const mat = new THREE.PointsMaterial({
        color,
        size: 0.028,
        transparent: true,
        opacity: 0.92,
      });
      return new THREE.Points(geo, mat);
    }

    // North America
    landGroup.add(createLandPatch(0.95, 4.05, 0.72, 0.65, 0x2d7a3a));
    landGroup.add(createLandPatch(1.25, 3.75, 0.55, 0.5, 0x236b30));
    landGroup.add(createLandPatch(0.7, 3.85, 0.35, 0.3, 0x1e6b2e)); // Canada
    // Central America
    landGroup.add(createLandPatch(1.52, 3.65, 0.18, 0.14, 0x2d7a3a));
    // South America
    landGroup.add(createLandPatch(1.75, 3.85, 0.55, 0.42, 0x1a5c2a));
    landGroup.add(createLandPatch(2.05, 3.9, 0.4, 0.32, 0x2d7a3a));
    // Europe
    landGroup.add(createLandPatch(0.88, 0.32, 0.32, 0.28, 0x3a8a45));
    landGroup.add(createLandPatch(0.78, 0.6, 0.22, 0.2, 0x2d7a3a));
    // Africa
    landGroup.add(createLandPatch(1.15, 0.38, 0.5, 0.42, 0x236b30));
    landGroup.add(createLandPatch(1.55, 0.32, 0.52, 0.38, 0x1a5c2a));
    landGroup.add(createLandPatch(1.9, 0.4, 0.35, 0.28, 0x2d7a3a)); // Southern Africa
    // Middle East / Arabian Peninsula
    landGroup.add(createLandPatch(1.08, 0.82, 0.28, 0.3, 0x4a8a35));
    // Asia - Russia/Siberia
    landGroup.add(createLandPatch(0.6, 1.4, 0.55, 0.9, 0x2d7a3a));
    landGroup.add(createLandPatch(0.65, 2.1, 0.4, 0.6, 0x236b30));
    // Asia - China/India
    landGroup.add(createLandPatch(1.0, 1.45, 0.48, 0.55, 0x1e6b2e));
    landGroup.add(createLandPatch(1.15, 1.15, 0.35, 0.3, 0x2d7a3a)); // India
    // Southeast Asia
    landGroup.add(createLandPatch(1.22, 1.85, 0.3, 0.35, 0x3a8a45));
    // Japan/Korea
    landGroup.add(createLandPatch(0.85, 2.3, 0.15, 0.12, 0x2d7a3a));
    // Australia
    landGroup.add(createLandPatch(1.68, 2.18, 0.42, 0.5, 0x4a7a35));
    // Greenland
    landGroup.add(createLandPatch(0.45, 3.45, 0.28, 0.25, 0x7ab08a)); // lighter/icy
    // Antarctica
    landGroup.add(createLandPatch(2.85, 0.0, 0.35, Math.PI * 2, 0xaaddcc));

    scene.add(landGroup);

    // Atmosphere glow
    const atmGeo = new THREE.SphereGeometry(2.25, 64, 64);
    const atmMat = new THREE.MeshPhongMaterial({
      color: 0x1166ff,
      transparent: true,
      opacity: 0.12,
      side: THREE.FrontSide,
    });
    const atmosphere = new THREE.Mesh(atmGeo, atmMat);
    scene.add(atmosphere);

    // Atmosphere rim (backside glow)
    const rimGeo = new THREE.SphereGeometry(2.3, 64, 64);
    const rimMat = new THREE.MeshPhongMaterial({
      color: 0x3399ff,
      transparent: true,
      opacity: 0.06,
      side: THREE.BackSide,
    });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    scene.add(rim);

    // Helper: create orbital ellipse
    function createOrbit(radiusX, radiusZ, tiltX, tiltZ, color, opacity = 0.5) {
      const points = [];
      for (let i = 0; i <= 200; i++) {
        const a = (i / 200) * Math.PI * 2;
        points.push(new THREE.Vector3(Math.cos(a) * radiusX, 0, Math.sin(a) * radiusZ));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity });
      const line = new THREE.Line(geo, mat);
      line.rotation.x = tiltX;
      line.rotation.z = tiltZ;
      return line;
    }

    const orbits = [
      createOrbit(3.2, 3.2, 0.3, 0, 0x4488ff, 0.6),
      createOrbit(3.8, 3.8, -0.5, 0.1, 0x88bbff, 0.45),
      createOrbit(4.4, 4.2, 0.8, -0.2, 0x2255cc, 0.4),
      createOrbit(5.0, 4.8, 0.15, 0.3, 0x6699ff, 0.3),
      createOrbit(5.6, 5.2, -0.9, 0.05, 0x334499, 0.25),
    ];
    orbits.forEach(o => scene.add(o));

    // Satellites on each orbit
    const satConfigs = [
      { orbitIdx: 0, speed: 0.4, offset: 0, size: 0.06 },
      { orbitIdx: 1, speed: 0.28, offset: 2.1, size: 0.055 },
      { orbitIdx: 2, speed: 0.2, offset: 4.3, size: 0.05 },
      { orbitIdx: 3, speed: 0.15, offset: 1.2, size: 0.045 },
      { orbitIdx: 4, speed: 0.1, offset: 3.7, size: 0.04 },
    ];

    const satGroup = new THREE.Group();
    const satMeshes = satConfigs.map(cfg => {
      const orbit = orbits[cfg.orbitIdx];
      const geo = new THREE.BoxGeometry(cfg.size * 1.5, cfg.size * 0.4, cfg.size * 0.4);
      const mat = new THREE.MeshStandardMaterial({ color: 0xaaddff, emissive: 0x4488ff, emissiveIntensity: 1.5 });
      const sat = new THREE.Mesh(geo, mat);

      // Glow dot
      const glowGeo = new THREE.SphereGeometry(cfg.size * 0.7, 8, 8);
      const glowMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 });
      const glow = new THREE.Mesh(glowGeo, glowMat);
      sat.add(glow);

      satGroup.add(sat);
      return { mesh: sat, cfg, orbit };
    });
    scene.add(satGroup);

    // Connection lines between satellites
    const lineGroup = new THREE.Group();
    scene.add(lineGroup);

    // Grid lines on earth (longitude/latitude)
    const gridGroup = new THREE.Group();
    for (let i = 0; i < 8; i++) {
      const pts = [];
      const lon = (i / 8) * Math.PI * 2;
      for (let j = 0; j <= 60; j++) {
        const lat = (j / 60) * Math.PI - Math.PI / 2;
        pts.push(new THREE.Vector3(
          2.01 * Math.cos(lat) * Math.cos(lon),
          2.01 * Math.sin(lat),
          2.01 * Math.cos(lat) * Math.sin(lon)
        ));
      }
      const g = new THREE.BufferGeometry().setFromPoints(pts);
      const m = new THREE.LineBasicMaterial({ color: 0x1144aa, transparent: true, opacity: 0.2 });
      gridGroup.add(new THREE.Line(g, m));
    }
    for (let i = 0; i < 5; i++) {
      const pts = [];
      const lat = ((i + 1) / 6) * Math.PI - Math.PI / 2;
      for (let j = 0; j <= 60; j++) {
        const lon = (j / 60) * Math.PI * 2;
        pts.push(new THREE.Vector3(
          2.01 * Math.cos(lat) * Math.cos(lon),
          2.01 * Math.sin(lat),
          2.01 * Math.cos(lat) * Math.sin(lon)
        ));
      }
      const g = new THREE.BufferGeometry().setFromPoints(pts);
      const m = new THREE.LineBasicMaterial({ color: 0x1144aa, transparent: true, opacity: 0.15 });
      gridGroup.add(new THREE.Line(g, m));
    }
    scene.add(gridGroup);

    // Mouse drag rotation
    let isDragging = false;
    let prevMouse = { x: 0, y: 0 };
    let rotY = 0, rotX = 0.3;

    const onMouseDown = (e) => { isDragging = true; prevMouse = { x: e.clientX, y: e.clientY }; };
    const onMouseUp = () => { isDragging = false; };
    const onMouseMove = (e) => {
      if (!isDragging) return;
      const dx = e.clientX - prevMouse.x;
      const dy = e.clientY - prevMouse.y;
      rotY += dx * 0.005;
      rotX += dy * 0.005;
      rotX = Math.max(-0.8, Math.min(0.8, rotX));
      prevMouse = { x: e.clientX, y: e.clientY };
    };
    mount.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("mousemove", onMouseMove);

    // Animation
    const clock = new THREE.Clock();
    let animId;

    function animate() {
      animId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // Auto rotate earth slowly
      if (!isDragging) rotY += 0.0015;
      earth.rotation.y = rotY;
      earth.rotation.x = rotX;
      cityGroup.rotation.y = rotY;
      cityGroup.rotation.x = rotX;
      landGroup.rotation.y = rotY;
      landGroup.rotation.x = rotX;
      gridGroup.rotation.y = rotY;
      gridGroup.rotation.x = rotX;

      // Animate satellites
      const satPositions = [];
      satMeshes.forEach(({ mesh, cfg, orbit }) => {
        const angle = t * cfg.speed + cfg.offset;
        const rx = orbit.geometry?.parameters?.radiusX || 3.2;
        // Extract orbit radius from first point
        const positions = orbit.geometry.attributes?.position?.array;
        const orbitRX = positions ? Math.sqrt(positions[0] ** 2 + positions[2] ** 2) : 3.2;
        const x = Math.cos(angle) * orbitRX;
        const z = Math.sin(angle) * orbitRX;

        // Apply orbit tilt
        const tiltX = orbit.rotation.x;
        const tiltZ = orbit.rotation.z;
        const y = z * Math.sin(tiltX);
        const zFinal = z * Math.cos(tiltX);

        mesh.position.set(x * Math.cos(tiltZ) - zFinal * Math.sin(tiltZ), y, x * Math.sin(tiltZ) + zFinal * Math.cos(tiltZ));
        mesh.rotation.y = angle;
        satPositions.push(mesh.position.clone());
      });

      // Update connection lines
      lineGroup.clear();
      for (let i = 0; i < satPositions.length; i++) {
        for (let j = i + 1; j < satPositions.length; j++) {
          const dist = satPositions[i].distanceTo(satPositions[j]);
          if (dist < 6) {
            const pts = [satPositions[i], satPositions[j]];
            const g = new THREE.BufferGeometry().setFromPoints(pts);
            const opacity = Math.max(0, 0.4 - dist / 15);
            const m = new THREE.LineBasicMaterial({ color: 0x88bbff, transparent: true, opacity });
            lineGroup.add(new THREE.Line(g, m));
          }
        }
      }

      // Atmosphere pulse
      atmosphere.material.opacity = 0.1 + Math.sin(t * 0.5) * 0.03;

      renderer.render(scene, camera);
    }
    animate();

    // Resize
    const handleResize = () => {
      const W2 = mount.clientWidth;
      const H2 = mount.clientHeight || 420;
      camera.aspect = W2 / H2;
      camera.updateProjectionMatrix();
      renderer.setSize(W2, H2);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("mousemove", onMouseMove);
      mount.removeEventListener("mousedown", onMouseDown);
      mount.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative w-full rounded-xl overflow-hidden" style={{ height: 420 }}>
      {/* Hero background image */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(https://media.base44.com/images/public/69ff5cddeac91471114596cf/4da1c850f_ChatGPTImage1demaide202603_00_49.png)`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.35,
        }}
      />
      <div ref={mountRef} className="absolute inset-0 z-10 cursor-grab active:cursor-grabbing" style={{ height: "100%" }} />
      <div className="absolute inset-0 z-20 pointer-events-none bg-gradient-to-t from-background/60 via-transparent to-transparent" />
      <div className="absolute bottom-3 right-3 z-30 text-xs font-mono text-primary/60">
        drag to rotate
      </div>
    </div>
  );
}