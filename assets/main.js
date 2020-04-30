new class {
  constructor() {
    this.backgroundColor = '#6a2bff';
    this.spotLightColor = 0xffffff;
    this.angle = 0;
    this.spheres = [];
    this.holes = [];
    this.gui = new dat.GUI();
    this.velocity = .08;
    this.amplitude = 5;
    this.waveLength = 20;
    this.scene = new THREE.Scene();
    ({ innerWidth: this.winW, innerHeight: this.winH } = window);
    this.camera = new THREE.PerspectiveCamera(75, this.winW / this.winH, 1, 1000);
    this.camera.position.set(15, 15, -15);
    this.addRenderer();
    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.addAmbientLight();
    this.addSpotLight();
    this.gui.addFolder('Background').addColor(this, 'backgroundColor').onChange(color =>document.body.style.backgroundColor = color);
    let guiWave = this.gui.addFolder('Wave');
    guiWave.add(this, 'waveLength', 0, 20).onChange(waveLength => this.waveLength = waveLength);
    guiWave.add(this, 'amplitude', 3, 10).onChange(amplitude => this.amplitude = amplitude);
    guiWave.add(this, 'velocity', 0, .2).onChange(velocity => this.velocity = velocity);
    for (let i = 0; i < 8; i++) {
      this.createSet(
        (i < 4 ? 1 : 10) + (i < 4 ? 1 : -1) * i * 3,
        1,
        new THREE.SphereGeometry(.5, 32, 32),
        new THREE.MeshPhysicalMaterial({
          color: '#ffffff',
          emissive: '#e07cff',
          reflectivity: 1,
          metalness: .2,
          roughness: 0
        }),
        {
          steps: 1,
          depth: 1,
          bevelEnabled: false
        },
        [
          new THREE.MeshBasicMaterial({ color: '#fa3fce' }),
          new THREE.MeshBasicMaterial({ color: '#671c87' })
        ]
      );
    }
    this.addFloorShadow();
    this.animate();
    window.addEventListener('resize', this.onResize.bind(this));
  }
  radians(degrees) {
    return degrees * Math.PI / 180;
  }
  createSet(x, z, geometry, material, props, materials) {
    this.floorShape = this.createShape();
    this.createRingOfHoles(this.floorShape, 1, 0);
    this.createGround(this.floorShape, x, z, new THREE.ExtrudeGeometry(this.floorShape, props), materials);
    this.addSphere(x, z, geometry, material);
  }
  createRingOfHoles(shape, count, radius) {
    let distance = radius * 2;
    for (let i = 0; i < count; i++) {
      let pos = this.radians(360 / count * i);
      this.createHoles(shape, Math.sin(pos) * distance, Math.cos(pos) * distance);
    }
  }
  createShape() {
    let size = 1;
    let shape = new THREE.Shape([
      new THREE.Vector2(-size, size),
      new THREE.Vector2(-size, -size),
      new THREE.Vector2(size, -size),
      new THREE.Vector2(size, size)
    ]);
    shape.autoClose = true;
    return shape;
  }
  createHoles(shape, x, z) {
    let radius = .5;
    let holePath = new THREE.Path();
    holePath.moveTo(x, z);
    holePath.ellipse(x, z, radius, radius, 0, Math.PI * 2);
    holePath.autoClose = true;
    shape.holes.push(holePath);
    this.holes.push({ x, z });
  }
  addFloorShadow() {
    let planeGeometry = new THREE.PlaneGeometry(50, 50);
    this.floor = new THREE.Mesh(planeGeometry, new THREE.ShadowMaterial({ opacity: .08 }));
    planeGeometry.rotateX(-Math.PI / 2);
    this.floor.position.y = -10;
    this.floor.receiveShadow = true;
    this.scene.add(this.floor);
  }
  createGround(shape, x, z, geometry, materials) {
    let mesh = new THREE.Mesh(geometry, materials);
    mesh.needsUpdate = true;
    mesh.rotation.set(Math.PI * 0.5, 0, 0);
    mesh.position.set(x, 0, z);
    this.scene.add(mesh);
  }
  hexToRgbTreeJs(hex) {
    let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16) / 255,
      g: parseInt(result[2], 16) / 255,
      b: parseInt(result[3], 16) / 255
    } : null;
  }
  addAmbientLight() {
    this.ambientLight = new THREE.AmbientLight(0x6e6e6e, 1);
    this.scene.add(this.ambientLight);
  }
  addSpotLight() {
    this.spotLight = new THREE.SpotLight(0xffffff);
    this.spotLight.position.set(0, 30, 0);
    this.spotLight.castShadow = true;
    this.scene.add(this.spotLight);
  }
  addRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);
  }
  addSphere(x, z, geometry, material) {
    let mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, 2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.spheres.push(mesh);
    this.scene.add(mesh);
  }
  distance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
  }
  map(value, start1, stop1, start2, stop2) {
    return (value - start1) / (stop1 - start1) * (stop2 - start2) + start2;
  }
  drawWave() {
    for (let { position } of this.spheres) {
      position.y = this.map(Math.sin(
        this.angle + this.map(this.distance(position.z, position.x, 100, 100), 0, 100, this.waveLength, -this.waveLength)
      ), -1, 1, -3, this.amplitude);
    }
    this.angle += this.velocity;
  }
  animate() {
    this.drawWave();
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.animate.bind(this));
  }
  onResize() {
    this.camera.aspect = this.winW / this.winH;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.winW, this.winH);
  }
}();