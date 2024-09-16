/** Common **/

/**
 * Create the animation request.
 */
if (!window.requestAnimationFrame) {
	window.requestAnimationFrame = (function () {
		return window.mozRequestAnimationFrame ||
			window.msRequestAnimationFrame ||
			window.oRequestAnimationFrame ||
			window.webkitRequestAnimationFrame ||
			function (callback, element) {
				// 60 FPS
				window.setTimeout(callback, 1000 / 60);
			};
	})();
}

window.addEventListener('resize', onWindowResize, false);

/** Planet **/

/**
 * Define constants.
 */
const TEXTURE_PATH = 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/123879/';

/**
 * Set our global variables.
 */
var camera,
	scene,
	renderer,
	element,
	container,
	sphere,
	sphereCloud,
	rotationPoint;
var earthRadius = 80;

initPlanet();

/**
 * Initializer function.
 */
function initPlanet() {
	// Build the container
	container = document.createElement('div');
	document.body.appendChild(container);

	// Create the scene.
	scene = new THREE.Scene();

	// Create a rotation point.
	baseRotationPoint = new THREE.Object3D();
	baseRotationPoint.position.set(0, 0, 0);
	scene.add(baseRotationPoint);

	// Create world rotation point.
	worldRotationPoint = new THREE.Object3D();
	worldRotationPoint.position.set(-400, 150, -350);
	scene.add(worldRotationPoint);

	rotationPoint = new THREE.Object3D();
	rotationPoint.position.set(0, 0, earthRadius * 4);
	baseRotationPoint.add(rotationPoint);

	// Create the camera.
	camera = new THREE.PerspectiveCamera(
		60, // Angle
		window.innerWidth / window.innerHeight, // Aspect Ratio.
		1, // Near view.
		10000 // Far view.
	);
	rotationPoint.add(camera);

	// Build the renderer.
	renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.shadowMap.enabled;
	renderer.shadowMap.type = THREE.PCFSoftShadowMap;
	element = renderer.domElement;
	container.appendChild(element);

	// Ambient lights
	var ambient = new THREE.AmbientLight(0x222222);
	scene.add(ambient);

	// The sun.
	var light = new THREE.PointLight(0xffeecc, 0.8, 5000);
	light.position.set(400, 150, -250);
	scene.add(light);

	// Since the sun is much bigger than a point of light, add four fillers.
	var light2 = new THREE.PointLight(0xffffff, 0.6, 4000);
	light2.position.set(400, 150, -100);
	scene.add(light2);

	var light3 = new THREE.PointLight(0xffffff, 0.6, 4000);
	light3.position.set(400, 150, -500);
	scene.add(light3);

	var light4 = new THREE.PointLight(0xffffff, 0.4, 4000);
	light4.position.set(400, 300, -250);
	scene.add(light4);

	var light5 = new THREE.PointLight(0xffffff, 0.4, 4000);
	light5.position.set(400, 0, -250);
	scene.add(light5);

	// Add the Earth sphere model.
	var geometry = new THREE.SphereGeometry(earthRadius, 128, 128);

	// Create the Earth materials.
	loader = new THREE.TextureLoader();
	loader.setCrossOrigin('https://s.codepen.io');
	var texture = loader.load(TEXTURE_PATH + 'ColorMap.jpg');

	var bump = null;
	bump = loader.load(TEXTURE_PATH + 'Bump.jpg');

	var spec = null;
	spec = loader.load(TEXTURE_PATH + 'SpecMask.jpg');

	var material = new THREE.MeshPhongMaterial({
		color: "#ffffff",
		shininess: 5,
		map: texture,
		specularMap: spec,
		specular: "#666666",
		bumpMap: bump,
	});

	sphere = new THREE.Mesh(geometry, material);
	sphere.position.set(0, 0, 0);
	sphere.rotation.y = Math.PI;

	// Focus initially on the prime meridian.
	sphere.rotation.y = -1 * (8.7 * Math.PI / 5);

	// Add the Earth to the scene.https://s3-us-west-2.amazonaws.com/s.cdpn.io/123879/Bump.jpg
	worldRotationPoint.add(sphere);

	// Add the Earth sphere model.
	var geometryCloud = new THREE.SphereGeometry(earthRadius + 0.2, 128, 128);

	loader = new THREE.TextureLoader();
	loader.setCrossOrigin('https://s.codepen.io');
	var alpha = loader.load(TEXTURE_PATH + "alphaMap.jpg");

	var materialCloud = new THREE.MeshPhongMaterial({
		alphaMap: alpha,
	});

	materialCloud.transparent = true;

	sphereCloud = new THREE.Mesh(geometryCloud, materialCloud);
	scene.add(sphereCloud);
	sphereCloud.position.set(-400, 150, -350);

	// Create a glow effect.
	loader = new THREE.TextureLoader();
	loader.setCrossOrigin('https://s.codepen.io');
	var glowMap = loader.load(TEXTURE_PATH + "glow.png");

	// Create the sprite to add the glow effect.
	var spriteMaterial = new THREE.SpriteMaterial({
		map: glowMap,
		color: 0x0099ff,
		transparent: false,
		blending: THREE.AdditiveBlending
	});
	var sprite = new THREE.Sprite(spriteMaterial);
	sprite.scale.set(earthRadius * 2.5, earthRadius * 2.5, 1.0);
	sphereCloud.add(sprite);
}

/**
 * Updates to apply to the scene while running.
 */
function updatePlanet() {
	camera.updateProjectionMatrix();
	worldRotationPoint.rotation.y -= 0.0025 * Math.PI / 180;
	sphereCloud.rotation.y += 0.00025;
}

/** Sea **/

var waterNormals;
var azimuth = .45843;
var inclination = .3011;

var loader = new THREE.TextureLoader();
var clock = new THREE.Clock();

var time = 0;
var uniforms;
var v;
var light;

loader.load('https://s3-us-west-2.amazonaws.com/s.cdpn.io/896175/waternormals.jpg', function (t) {
	t.mapping = THREE.UVMapping;
	waterNormals = t;
	waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping;
	initSea();
	animate();
});

function initSky() {

	// Add Sky Mesh
	sky = new THREE.Sky();
	scene.add(sky.mesh);

	// Add Sun Helper
	sunSphere = new THREE.Mesh(
		new THREE.SphereBufferGeometry(20, 16, 8),
		new THREE.MeshBasicMaterial({color: 0xffffff})
	);
	sunSphere.visible = false;
	scene.add(sunSphere);

	uniforms = sky.uniforms;
	uniforms.turbidity.value = 0.01;
	uniforms.rayleigh.value = 0.0066;
	uniforms.luminance.value = 0.8;
	uniforms.mieCoefficient.value = 10.1;
	uniforms.mieDirectionalG.value = 0.824;

	moveSun();
}

function moveSun() {
	var distance = 4500;

	var theta = Math.PI * (inclination - 0.5);
	var phi = 2 * Math.PI * (azimuth - 0.5);

	sunSphere.position.x = distance * Math.cos(phi);
	sunSphere.position.y = distance * Math.sin(phi) * Math.sin(theta);
	sunSphere.position.z = distance * Math.sin(phi) * Math.cos(theta);

	sky.uniforms.sunPosition.value.copy(sunSphere.position);
}

function initSea() {
	initSky();

	water = new THREE.Water(renderer, camera, scene, {
		textureWidth: 512,
		textureHeight: 512,
		waterNormals: waterNormals,
		alpha: 1.0,
		sunDirection: sky.uniforms.sunPosition.value.normalize(),
		sunColor: 0xf5ebce,
		waterColor: 0x5b899b,
		distortionScale: 15.0,
	});
	mirrorMesh = new THREE.Mesh(
		new THREE.PlaneGeometry(4400, 4400, 120, 120),
		water.material
	);
	mirrorMesh.add(water);
	mirrorMesh.rotation.x = -Math.PI * 0.5;
	scene.add(mirrorMesh);

	v = mirrorMesh.geometry.vertices;

	// LIGHT
	var ambient = new THREE.AmbientLight(0xf5ebce, 0.25);
	scene.add(ambient);

	light = new THREE.DirectionalLight(0xf5ebce, 0.8);
	light.position.set(0, 0, 0);

	light.castShadow = true;
	light.shadow = new THREE.LightShadow(new THREE.PerspectiveCamera(40, .7, 4000, 4800));
	light.shadow.bias = 0.0000001;
	light.shadow.mapSize.width = 2048;
	light.shadow.mapSize.height = 2048;
	scene.add(light);
}

/** Animations **/

// Animation
function animate() {

	var delta = clock.getDelta();
	time += delta * 0.5;

	for (var i = v.length - 1; i >= 0; i--) {
		v[i].z = Math.sin(i * 1 + time * -1) * 3;
	}
	camera.position.y = v[7320].z * 1.5 + 14;

	mirrorMesh.geometry.verticesNeedUpdate = true;

	moveSun();
	water.material.uniforms.time.value -= 1.0 / 60.0;
	water.sunDirection = sky.uniforms.sunPosition.value.normalize()//sunSphere.position.normalize()
	light.position.copy(sunSphere.position);

	water.render();
	updatePlanet();

	requestAnimationFrame(animate);
	renderer.render(scene, camera);
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
}
