export default class {
  // 背景颜色
  backgroundColor = '#6a2bff';
  // 光照颜色
  spotLightColor = 0xffffff;
  // 角度  默认0
  angle = 0;
  // 球
  spheres = [];
  // 孔
  holes = [];
  // 组件个数
  num = 8;
  // 轨迹类
  gui = new dat.GUI();
  // 数度  默认0.08  取值小于0.2
  velocity = .08;
  // 振幅  默认5  取值3--10
  amplitude = 5;
  // 波长 默认20  取值小于20
  waveLength = 20;
  // 场景类
  scene = new THREE.Scene();
  constructor() {
    // 设置界面宽高
    // 采用ES6的简写赋值方式
    ({ innerWidth: this.winW, innerHeight: this.winH } = window);
    // 窗口类
    this.camera = new THREE.PerspectiveCamera(75, this.winW / this.winH, 1, 1000);
    // 设置空间坐标位置
    this.camera.position.set(15, 15, -15);
    // 添加渲染器
    this.addRenderer();
    // 控制类
    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    // 添加环境光
    this.addAmbientLight();
    // 添加聚光灯
    this.addSpotLight();
    // 添加背景颜色控件
    this.gui.addFolder('Background').addColor(this, 'backgroundColor').onChange(color => document.body.style.backgroundColor = color);
    // 添加属性控件
    let guiWave = this.gui.addFolder('Wave');
    guiWave.add(this, 'waveLength', 0, 20).onChange(waveLength => this.waveLength = waveLength);
    guiWave.add(this, 'amplitude', 3, 10).onChange(amplitude => this.amplitude = amplitude);
    guiWave.add(this, 'velocity', 0, .2).onChange(velocity => this.velocity = velocity);
    // 循环添加球和空洞
    for (let i = 0; i < this.num; i++) {
      // 创建与设置
      this.createSet((i < 4 ? 1 : 10) + (i < 4 ? 1 : -1) * i * 3, 1, new THREE.SphereGeometry(.5, 32, 32), // 球面几何
        new THREE.MeshPhysicalMaterial({
          color: '#fff',
          emissive: '#e07cff',
          reflectivity: 1,
          metalness: .2,
          roughness: 0 // 粗糙度
        }), {
        steps: 1,
        depth: 1,
        bevelEnabled: !1 // 启用斜角
      }, [
        new THREE.MeshBasicMaterial({ color: '#fa3fce' }),
        new THREE.MeshBasicMaterial({ color: '#671c87' })
      ]);
    }
    // 增加地板的影子
    this.addFloorShadow();
    this.animate();
    // 设置界面监听事件
    window.addEventListener('resize', this.onResize.bind(this));
  }
  /**
   * 获取弧度
   * @param {Number} degrees 角度值
   * @returns {Number} 弧度值
   */
  radians(degrees) {
    return degrees * Math.PI / 180;
  }
  /**
   * 创建与设置
   * @param {*} x X坐标
   * @param {*} z Y坐标
   * @param {*} geometry 几何形状
   * @param {*} material 材料
   * @param {*} props 道具
   * @param {*} materials 材料
   */
  createSet(x, z, geometry, material, props, materials) {
    // 地板的形状
    this.floorShape = this.createShape();
    // 制造孔环
    this.createRingOfHoles(this.floorShape, 1, 0);
    // 创建地面
    this.createGround(x, z, new THREE.ExtrudeGeometry(this.floorShape, props), materials);
    // 添加范围
    this.addSphere(x, z, geometry, material);
  }
  /**
   * 制造孔环
   * @param {*} shape 形状
   * @param {*} count 数量
   * @param {*} radius 半径
   */
  createRingOfHoles(shape, count, radius) {
    let distance = radius * 2;
    for (let i = 0; i < count; i++) {
      let pos = this.radians(360 / count * i);
      // 创建孔
      this.createHoles(shape, Math.sin(pos) * distance, Math.cos(pos) * distance);
    }
  }
  /**
   * 创建形状
   * @returns {object} 形状
   */
  createShape() {
    let size = 1;
    let shape = new THREE.Shape([
      new THREE.Vector2(-size, +size),
      new THREE.Vector2(-size, -size),
      new THREE.Vector2(+size, -size),
      new THREE.Vector2(+size, +size)
    ]);
    shape.autoClose = !0;
    return shape;
  }
  /**
   * 创建孔
   * @param {Object} shape 形状
   * @param {Number} x X坐标
   * @param {Number} z Y坐标
   */
  createHoles(shape, x, z) {
    let radius = .5;
    let holePath = new THREE.Path();
    holePath.moveTo(x, z);
    holePath.ellipse(x, z, radius, radius, 0, Math.PI * 2);
    holePath.autoClose = !0;
    shape.holes.push(holePath);
    this.holes.push({ x, z });
  }
  // 增加地板的影子
  addFloorShadow() {
    let planeGeometry = new THREE.PlaneGeometry(50, 50);
    this.floor = new THREE.Mesh(planeGeometry, new THREE.ShadowMaterial({ opacity: .08 }));
    planeGeometry.rotateX(-Math.PI / 2);
    this.floor.position.y = -10;
    this.floor.receiveShadow = !0;
    this.scene.add(this.floor);
  }
  /**
   * 创建地面
   * @param {*} x X坐标
   * @param {*} z Y坐标
   * @param {*} geometry 几何形状
   * @param {*} materials 材料
   */
  createGround(x, z, geometry, materials) {
    let mesh = new THREE.Mesh(geometry, materials);
    mesh.needsUpdate = !0;
    mesh.rotation.set(Math.PI * .5, 0, 0);
    mesh.position.set(x, 0, z);
    this.scene.add(mesh);
  }
  /**
   * 十六进制转rgb数值
   * @param {Number} hex 十六进制数
   * @returns {Object} 颜色对象
   */
  hexToRgbTreeJs(hex) {
    let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16) / 255,
      g: parseInt(result[2], 16) / 255,
      b: parseInt(result[3], 16) / 255
    } : null;
  }
  // 添加环境光
  addAmbientLight() {
    this.ambientLight = new THREE.AmbientLight(0x6e6e6e, 1);
    this.scene.add(this.ambientLight);
  }
  // 添加聚光灯
  addSpotLight() {
    this.spotLight = new THREE.SpotLight(this.spotLightColor);
    this.spotLight.position.set(0, 30, 0);
    this.spotLight.castShadow = !0;
    this.scene.add(this.spotLight);
  }
  // 添加渲染器
  addRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: !0, alpha: !0 });
    this.renderer.shadowMap.enabled = !0;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);
  }
  /**
   * 添加范围
   * @param {*} x X坐标
   * @param {*} z Y坐标
   * @param {*} geometry 几何形状
   * @param {*} material 材料
   */
  addSphere(x, z, geometry, material) {
    let mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, 2, z);
    mesh.castShadow = !0;
    mesh.receiveShadow = !0;
    this.spheres.push(mesh);
    this.scene.add(mesh);
  }
  /**
   * 获取距离
   * @param {Number} x1 
   * @param {Number} y1 
   * @param {Number} x2 
   * @param {Number} y2 
   */
  distance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
  }
  /**
   * 获取界面
   * @param {*} value 
   * @param {*} start1 
   * @param {*} stop1 
   * @param {*} start2 
   * @param {*} stop2 
   */
  map(value, start1, stop1, start2, stop2) {
    return (value - start1) / (stop1 - start1) * (stop2 - start2) + start2;
  }
  // 画波形
  drawWave() {
    this.spheres.forEach(({ position }) => position.y = this.map(Math.sin(this.angle + this.map(this.distance(position.z, position.x, 100, 100), 0, 100, this.waveLength, -this.waveLength)), -1, 1, -3, this.amplitude));
    this.angle += this.velocity;
  }
  animate() {
    this.drawWave();
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.animate.bind(this));
  }
  // 调整
  onResize() {
    this.camera.aspect = this.winW / this.winH;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.winW, this.winH);
  }
}
