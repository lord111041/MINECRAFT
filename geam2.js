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
document.body.appendChild(renderer.domElement);

// Свет
let light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(10,20,10);
scene.add(light);

// Блоки
let blockGeo = new THREE.BoxGeometry(5,1,5);

let materials = [
  new THREE.MeshLambertMaterial({color: "green"}),
  new THREE.MeshLambertMaterial({color: "brown"}),
  new THREE.MeshLambertMaterial({color: "gray"}),
  new THREE.MeshLambertMaterial({color: "yellow"}),
  new THREE.MeshLambertMaterial({color: "red"}),
  new THREE.MeshLambertMaterial({color:"pink"}),
  new THREE.MeshLambertMaterial({color:"purple"})
];

let selectedBlock = 0;

// Инвентарь
function selectSlot(n){
  selectedBlock = n;

  document.querySelectorAll(".slot").forEach(s=>{
    s.classList.remove("selected");
  });

  document.getElementById("slot"+n).classList.add("selected");
}

// Мир
let blocks = [];

for(let x=-3;x<3;x++){
  for(let z=-3;z<3;z++){

    let dirt = new THREE.Mesh(blockGeo, materials[1]);
    dirt.position.set(x,-1,z);
    scene.add(dirt);
    blocks.push(dirt);

    let grass = new THREE.Mesh(blockGeo, materials[0]);
    grass.position.set(x,0,z);
    scene.add(grass);
    blocks.push(grass);
  }
}

// Камера
camera.position.set(0,2,5);

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
  if(e.code === "Digit7") selectSlot(6)

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

// Прыжок
let velocityY = 0;
let onGround = false;

function physics(){

  velocityY -= 0.01;
  camera.position.y += velocityY;

  if(camera.position.y < 2){
    camera.position.y = 2;
    velocityY = 0;
    onGround = true;
  }else{
    onGround = false;
  }

  if(keys["Space"] && onGround){
    velocityY = 0.2;
  }
}

// Движение
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

  if(keys["KeyW"]) camera.position.add(forward.clone().multiplyScalar(-speed));
  if(keys["KeyS"]) camera.position.add(forward.clone().multiplyScalar(speed));
  if(keys["KeyA"]) camera.position.add(right.clone().multiplyScalar(-speed));
  if(keys["KeyD"]) camera.position.add(right.clone().multiplyScalar(speed));
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

// Цикл
function animate(){
  requestAnimationFrame(animate);

  move();
  physics();

  renderer.render(scene, camera);
}

animate();
