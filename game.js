let scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

// Камера
let camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth/window.innerHeight,
  0.1,
  1000
);

// Рендер
let renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// Свет
let light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(10,20,10);
scene.add(light);

let ambient = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambient);

// ТекстурыMINR=E
let loader = new THREE.TextureLoader();

function loadTexture(path){
  let tex = loader.load(path);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  return tex;
}

// Материалы
let materials = [
  new THREE.MeshLambertMaterial({map: loadTexture("textures/purple.png")}),
  new THREE.MeshLambertMaterial({map: loadTexture("textures/tnt.png")}),
  new THREE.MeshLambertMaterial({map: loadTexture("textures/diamond.png")}),
  new THREE.MeshLambertMaterial({color:"yellow"}),
  new THREE.MeshLambertMaterial({color:"red"}),
  new THREE.MeshLambertMaterial({color:"pink"}),
  new THREE.MeshLambertMaterial({color:"yellowgreen"}),
  new THREE.MeshLambertMaterial({color:"green"})
];

let selectedBlock = 0;

// Инвентарь
function selectSlot(n){
  selectedBlock = n;

  document.querySelectorAll(".slot").forEach(s=>{
    s.classList.remove("selected");
  });

  let slot = document.getElementById("slot"+n);
  if(slot) slot.classList.add("selected");
}

// Блок
let blockGeo = new THREE.BoxGeometry(1,1,1);

// Мир
let blocks = [];

for(let x=-20;x<20;x++){
  for(let z=-20;z<20;z++){

    let block = new THREE.Mesh(blockGeo, materials[0]);
    block.position.set(x,0,z);

    scene.add(block);
    blocks.push(block);
  }
}

// Камера выше земли
camera.position.set(0,3,5);

// Управление
let keys = {};

window.addEventListener("keydown", (e)=>{
  keys[e.code] = true;

  if(e.code === "Digit1") selectSlot(0);
  if(e.code === "Digit2") selectSlot(1);
  if(e.code === "Digit3") selectSlot(2);
  if(e.code === "Digit4") selectSlot(3);
  if(e.code === "Digit5") selectSlot(4);
  if(e.code === "Digit6") selectSlot(5);
  if(e.code === "Digit7") selectSlot(6);
  if(e.code === "Digit8") selectSlot(7);
});

window.addEventListener("keyup", (e)=>{
  keys[e.code] = false;
});

// Мышка
let yaw = 0;
let pitch = 0;

document.body.onclick = ()=>{
  document.body.requestPointerLock();
};

document.addEventListener("mousemove", e=>{
  if(document.pointerLockElement === document.body){

    yaw -= e.movementX * 0.002;
    pitch -= e.movementY * 0.002;

    pitch = Math.max(-Math.PI/2, Math.min(Math.PI/2, pitch));

    camera.rotation.order = "YXZ";
    camera.rotation.y = yaw;
    camera.rotation.x = pitch;
  }
});

// ФИЗИКА (ИСПРАВЛЕНО)
let velocityY = 0;
let onGround = false;
let gravity = 0.01;
let playerHeight = 1.8;

function physics(){

  velocityY -= gravity;
  camera.position.y += velocityY;

  onGround = false;

  for(let block of blocks){

    let dx = Math.abs(camera.position.x - block.position.x);
    let dz = Math.abs(camera.position.z - block.position.z);

    if(dx < 0.5 && dz < 0.5){

      let top = block.position.y + 0.5;
      let feet = camera.position.y - playerHeight;

      if(feet <= top && feet >= top - 0.3){
        camera.position.y = top + playerHeight;
        velocityY = 0;
        onGround = true;
      }

    }
  }

  // Прыжок
  if(keys["Space"] && onGround){
    velocityY = 0.18;
  }
}

// Движение с коллизией
function move(){

  let speed = 0.1;

  let forward = new THREE.Vector3(
    Math.sin(yaw),
    0,
    Math.cos(yaw)
  );

  let right = new THREE.Vector3(
    Math.cos(yaw),
    0,
    -Math.sin(yaw)
  );

  let newPos = camera.position.clone();

  if(keys["KeyW"]) newPos.add(forward.clone().multiplyScalar(-speed));
  if(keys["KeyS"]) newPos.add(forward.clone().multiplyScalar(speed));
  if(keys["KeyA"]) newPos.add(right.clone().multiplyScalar(-speed));
  if(keys["KeyD"]) newPos.add(right.clone().multiplyScalar(speed));

  let canMove = true;

  for(let block of blocks){

    let dx = Math.abs(newPos.x - block.position.x);
    let dz = Math.abs(newPos.z - block.position.z);
    let dy = Math.abs(camera.position.y - block.position.y);

    if(dx < 0.6 && dz < 0.6 && dy < 1.5){
      canMove = false;
      break;
    }
  }

  if(canMove){
    camera.position.x = newPos.x;
    camera.position.z = newPos.z;
  }
}

// Ломать и ставить
let raycaster = new THREE.Raycaster();

document.addEventListener("mousedown", e=>{

  raycaster.setFromCamera(new THREE.Vector2(0,0), camera);
  let hits = raycaster.intersectObjects(blocks);

  if(hits.length > 0){

    let block = hits[0].object;

    // Ломать
    if(e.button === 0){
      scene.remove(block);
      blocks = blocks.filter(b=>b!==block);
    }

    // Ставить
    if(e.button === 2){

      let newBlock = new THREE.Mesh(
        blockGeo,
        materials[selectedBlock]
      );

      let normal = hits[0].face.normal;

      newBlock.position.copy(block.position)
        .add(normal);

      scene.add(newBlock);
      blocks.push(newBlock);
    }
  }
});

document.addEventListener("contextmenu", e=>e.preventDefault());

// Анимация
function animate(){
  requestAnimationFrame(animate);

  move();
  physics();

  renderer.render(scene, camera);
}

animate();