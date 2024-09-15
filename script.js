var container, stats;
var camera, scene, renderer;

var waterNormals;
var envTexture;
var azimuth = .45843;
var inclination = .3011;

var loader = new THREE.TextureLoader();
var clock = new THREE.Clock();

var time = 0;
var uniforms;
var v;
var light;
var rusty;

loader.load('https://s3-us-west-2.amazonaws.com/s.cdpn.io/896175/waternormals.jpg', function (t) {
	t.mapping = THREE.UVMapping;
	waterNormals = t;
	waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping;
	rusty = loader.load('https://s3-us-west-2.amazonaws.com/s.cdpn.io/896175/tex02.jpg')
	rusty.wrapS = rusty.wrapT = THREE.RepeatWrapping;

	init();
	animate();
})

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

function init() {
	container = document.createElement('div');
	document.body.appendChild(container);
	renderer = new THREE.WebGLRenderer({antialias: true});
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFSoftShadowMap;

	container.appendChild(renderer.domElement);
	scene = new THREE.Scene();

	camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.5, 3000000);
	camera.position.set(0, 15, 0);
	camera.rotation.set(-0, 0, 0);

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

	requestAnimationFrame(animate);
	renderer.render(scene, camera);
	window.addEventListener('resize', onWindowResize, false);
}

function random(seed) {
	var x = Math.sin(seed) * 10000;
	return x - Math.floor(x);
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
}
