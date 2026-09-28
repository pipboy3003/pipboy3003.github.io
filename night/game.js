/* Nachtfahrt – Kamera-Update 2, 2026-09-28. Vollständige night/game.js */
import * as THREE from 'three';

const viewport=document.getElementById('viewport');
const menu=document.getElementById('menu');
const pause=document.getElementById('pause');
const error=document.getElementById('error');
const hud=document.getElementById('hud');
const bottomHud=document.getElementById('bottomHud');
const speedLabel=document.getElementById('speed');
const statusLabel=document.getElementById('status');
const toast=document.getElementById('toast');
const streetLines=[-240,-120,0,120,240];
const roadWidth=19;
const cameraModes=[
  {name:'Stadtblick',offset:null,look:null,fov:52},
  {name:'Verfolger nah',offset:new THREE.Vector3(0,26,33),look:new THREE.Vector3(0,2,-12),fov:52},
  {name:'Verfolger fern',offset:new THREE.Vector3(0,47,78),look:new THREE.Vector3(0,2,-12),fov:52},
  {name:'Motorhaube',offset:new THREE.Vector3(0,2.55,-2.4),look:new THREE.Vector3(0,1.5,-35),fov:70},
  {name:'Stoßstange',offset:new THREE.Vector3(0,1.25,-4.35),look:new THREE.Vector3(0,1.4,-35),fov:75}
];
let cameraMode=0;
const cameraLook=new THREE.Vector3(-240,2,-5);
const cameraTarget=new THREE.Vector3();
const lookTarget=new THREE.Vector3();
const clamp=THREE.MathUtils.clamp;
let renderer,scene,camera,car,body,wheels=[],rain,raindrops=[];
let playing=false,paused=false,velocity=0,heading=0;
let position=new THREE.Vector3(-240,0,0);
let cameraPoint=new THREE.Vector3(-190,85,90),last=performance.now();
let messageTimer=0,collisionCooldown=0;
const keys=new Set();
const m=(color,extra={})=>new THREE.MeshStandardMaterial({color,roughness:.75,...extra});
const asphalt=m(0x172633,{roughness:.43,metalness:.14});
const pavement=m(0x25333d);
const dark=m(0x0d1926);
const white=m(0xdbe3d1,{emissive:0x434e3d,emissiveIntensity:.15});
const teal=m(0x58e8db,{emissive:0x19b0a7,emissiveIntensity:2});
const orange=m(0xffbd72,{emissive:0xe48738,emissiveIntensity:1.9});
const red=m(0xff4c5e,{emissive:0xea1b33,emissiveIntensity:2});
function box(parent,w,h,d,x,y,z,material){
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);
  mesh.position.set(x,y,z);mesh.receiveShadow=true;mesh.castShadow=h>1;parent.add(mesh);return mesh;
}
function notify(text){toast.textContent=text;toast.classList.add('show');messageTimer=3.4}
function sign(parent,text,x,y,z,color='#6ce6e0'){
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;
  const ctx=canvas.getContext('2d');ctx.fillStyle='rgba(4,20,35,.90)';ctx.fillRect(0,0,512,128);
  ctx.strokeStyle=color;ctx.lineWidth=8;ctx.strokeRect(4,4,504,120);
  ctx.fillStyle=color;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 55px Arial';ctx.fillText(text,256,65);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  const plane=new THREE.Mesh(new THREE.PlaneGeometry(13,3.25),new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide,transparent:true}));
  plane.position.set(x,y,z);parent.add(plane);
}
function building(x,z,w,d,h,seed){
  const materials=[m(0x1d3040),m(0x253445),m(0x24394a),m(0x27323e)];
  box(scene,w,h,d,x,h/2+.12,z,materials[seed%materials.length]);
  box(scene,w+.6,.35,d+.6,x,h+.28,z,m(0x0e1c29));
  const levels=Math.min(8,Math.floor(h/4));
  const warm=m(0xf0ae65,{emissive:0xd68c49,emissiveIntensity:1.25});
  const cool=m(0x83bdd0,{emissive:0x4086a9,emissiveIntensity:.6});
  for(let floor=0;floor<levels;floor++)for(let j=0;j<Math.min(5,Math.floor(w/6));j++){
    if((floor*7+j+seed)%4===0)continue;
    const wx=x-w/2+4+j*6,wy=3.3+floor*3.7;
    if(wx>x+w/2-2||wy>h-1)continue;
    box(scene,1.9,1.4,.08,wx,wy,z+d/2+.055,(floor+j+seed)%3?warm:cool);
  }
  if(seed%3===0)box(scene,2,.8,2,x,h+.75,z,dark);
}
function city(){
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(730,730),m(0x0d1923,{roughness:1}));
  ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
  for(const c of streetLines){
    box(scene,roadWidth,.09,595,c,.04,0,asphalt);
    box(scene,595,.09,roadWidth,0,.05,c,asphalt);
    for(let t=-280;t<280;t+=20){
      if(streetLines.some(s=>Math.abs(s-t)<15))continue;
      box(scene,.22,.012,7,c,.105,t,white);
      box(scene,7,.012,.22,t,.115,c,white);
    }
  }
  for(let i=0;i<4;i++)for(let j=0;j<4;j++){
    const x=(streetLines[i]+streetLines[i+1])/2,z=(streetLines[j]+streetLines[j+1])/2;
    box(scene,97,.22,97,x,.05,z,pavement);
    const k=i*4+j;
    building(x-22,z-22,37,38,15+(k*7)%19,k);
    building(x+22,z-20,34,32,14+(k*11)%18,k+2);
    building(x-18,z+22,42,32,12+(k*13)%22,k+4);
    building(x+24,z+22,30,37,17+(k*5)%20,k+6);
  }
  box(scene,40,12,32,-274,6,0,m(0x273c46));
  box(scene,1,8,14,-253.4,4,0,teal);
  sign(scene,'GARAGE',-252,10,0);
  for(let a=-240;a<=240;a+=120)for(let b=-240;b<=240;b+=120){
    if((a+b)%240!==0)continue;
    const post=box(scene,.5,9,.5,a+12,4.5,b+12,m(0x344858));
    post.castShadow=false;box(scene,2.4,.25,1,a+11,9,b+12,orange);
  }
  const skyline=m(0x111e2b);
  for(let t=-320;t<=320;t+=38){
    box(scene,27,19+(Math.abs(t*7)%24),25,t,10,-333,skyline);
    box(scene,25,20+(Math.abs(t*11)%29),24,t,11,333,skyline);
  }
}
function makeCar(){
  car=new THREE.Group();scene.add(car);
  body=new THREE.Group();car.add(body);
  box(body,3.9,1.15,7.3,0,1.15,0,m(0x4ed2cd,{metalness:.55,roughness:.32}));
  box(body,3.3,1.2,3.65,0,2.17,.2,m(0x183747,{metalness:.38,roughness:.26}));
  box(body,3.35,.09,2.5,0,2.85,.1,m(0x66ddd5,{metalness:.45,roughness:.3}));
  box(body,3.4,.11,.12,0,2.13,-1.82,teal);
  box(body,1,.38,.22,-1.04,1.3,-3.67,white);
  box(body,1,.38,.22,1.04,1.3,-3.67,white);
  box(body,.9,.29,.22,-1.07,1.3,3.67,red);
  box(body,.9,.29,.22,1.07,1.3,3.67,red);
  const tire=m(0x0a1018,{roughness:1});
  for(const side of [-1,1])for(const rear of [-1,1]){
    const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.87,.87,.52,16),tire);
    wheel.rotation.z=Math.PI/2;wheel.position.set(side*2.12,.87,rear*2.35);body.add(wheel);wheels.push(wheel);
  }
  const left=new THREE.SpotLight(0xb5eaff,22,85,Math.PI/7,.55,1.2);
  left.position.set(-1,1.55,-3.5);left.target.position.set(-1,0,-28);car.add(left,left.target);
  const right=left.clone();right.position.x=1;right.target.position.x=1;car.add(right,right.target);
  car.position.copy(position);
}
function makeRain(){
  const positions=new Float32Array(480*3);
  rain=new THREE.BufferGeometry();rain.setAttribute('position',new THREE.BufferAttribute(positions,3));
  const material=new THREE.PointsMaterial({color:0x9cc0d4,size:.22,transparent:true,opacity:.45,depthWrite:false});
  raindrops=Array.from({length:480},()=>({x:(Math.random()-.5)*115,y:Math.random()*65+2,z:(Math.random()-.5)*115}));
  const points=new THREE.Points(rain,material);scene.add(points);rain.userData.points=points;
}
function setup(){
  try{
    renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
    renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.toneMapping=THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure=1.65;renderer.shadowMap.enabled=true;
    renderer.shadowMap.type=THREE.PCFSoftShadowMap;viewport.appendChild(renderer.domElement);
    scene=new THREE.Scene();scene.background=new THREE.Color(0x0b1b2b);
    scene.fog=new THREE.FogExp2(0x102032,.0022);
    camera=new THREE.PerspectiveCamera(52,1,.1,1100);
    scene.add(new THREE.HemisphereLight(0x8dbed5,0x1b202a,2.1));
    const moon=new THREE.DirectionalLight(0x9bb9d9,2.2);
    moon.position.set(-80,130,70);moon.castShadow=true;moon.shadow.mapSize.set(1024,1024);
    moon.shadow.camera.left=-95;moon.shadow.camera.right=95;moon.shadow.camera.top=95;moon.shadow.camera.bottom=-95;
    moon.shadow.bias=-.0008;scene.add(moon);window._nachtfahrtMoon=moon;
    city();makeCar();makeRain();resize();
    window.addEventListener('resize',resize);requestAnimationFrame(frame);
  }catch(e){error.textContent='3D-Start fehlgeschlagen: '+e.message;error.classList.remove('hidden');console.error(e)}
}
function resize(){if(!renderer)return;const w=viewport.clientWidth,h=viewport.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}
function clearInput(){keys.clear()}
function road(x,z){
  const inside=Math.abs(x)<=249&&Math.abs(z)<=249;
  return inside&&(streetLines.some(s=>Math.abs(x-s)<roadWidth/2-1)||streetLines.some(s=>Math.abs(z-s)<roadWidth/2-1));
}
function reset(){position.set(-240,0,0);velocity=0;heading=0;car.position.copy(position);car.rotation.y=0;clearInput();notify('Zur Garage zurückgesetzt')}
function changeCamera(){
  cameraMode=(cameraMode+1)%cameraModes.length;
  const mode=cameraModes[cameraMode];
  camera.fov=mode.fov;camera.updateProjectionMatrix();
  if(cameraMode>=3){
    car.updateMatrixWorld(true);
    cameraPoint.copy(mode.offset);car.localToWorld(cameraPoint);
    cameraLook.copy(mode.look);car.localToWorld(cameraLook);
  }
  notify('Kamera: '+mode.name);
}
function setPause(value){if(!playing)return;paused=value;clearInput();pause.classList.toggle('hidden',!value);pause.setAttribute('aria-hidden',String(!value));statusLabel.textContent=value?'Pausiert':'Freie Fahrt'}
function showMenu(){playing=false;paused=false;clearInput();menu.classList.remove('hidden');pause.classList.add('hidden');hud.hidden=true;bottomHud.hidden=true;statusLabel.textContent='Freie Fahrt'}
function start(){reset();playing=true;paused=false;menu.classList.add('hidden');pause.classList.add('hidden');hud.hidden=false;bottomHud.hidden=false;notify('Willkommen zur Nachtschicht – C wechselt die Kamera!')}
function drive(dt){
  const gas=keys.has('KeyW')||keys.has('ArrowUp'),brake=keys.has('KeyS')||keys.has('ArrowDown');
  const steer=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0);
  if(gas)velocity+=35*dt;
  if(brake)velocity-=velocity>1?55*dt:24*dt;
  if(!gas&&!brake)velocity*=Math.exp(-1.55*dt);
  velocity=clamp(velocity,-13,39);if(Math.abs(velocity)<.12)velocity=0;
  heading+=steer*dt*1.65*clamp(Math.abs(velocity)/15,0,1)*(velocity<0?-1:1);
  const nx=position.x+Math.sin(heading)*velocity*dt,nz=position.z-Math.cos(heading)*velocity*dt;
  if(road(nx,nz)){position.x=nx;position.z=nz}else{
    velocity=0;if(collisionCooldown<=0){notify('Fahrbahn verlassen – vorsichtig!');collisionCooldown=2}
  }
  car.position.copy(position);car.rotation.y=-heading;
  body.rotation.z=THREE.MathUtils.lerp(body.rotation.z,-steer*velocity/39*.085,Math.min(1,dt*5));
  for(const wheel of wheels)wheel.rotation.x-=velocity*dt/.87;
  speedLabel.textContent=String(Math.round(Math.abs(velocity)*3)).padStart(2,'0');
}
function updateRain(dt){
  const arr=rain.attributes.position.array;
  for(let i=0;i<raindrops.length;i++){
    const drop=raindrops[i];drop.y-=dt*34;drop.x+=dt*2;
    if(drop.y<.3){drop.y=60;drop.x=(Math.random()-.5)*115;drop.z=(Math.random()-.5)*115}
    arr[i*3]=position.x+drop.x;arr[i*3+1]=drop.y;arr[i*3+2]=position.z+drop.z;
  }
  rain.attributes.position.needsUpdate=true;
}
function frame(time){
  requestAnimationFrame(frame);
  const dt=Math.min((time-last)/1000,.05);last=time;
  if(messageTimer>0){messageTimer-=dt;if(messageTimer<=0)toast.classList.remove('show')}
  if(collisionCooldown>0)collisionCooldown-=dt;
  if(playing&&!paused)drive(dt);
  updateRain(dt);
  if(cameraMode===0){
    cameraTarget.set(position.x+51,86,position.z+89);
    lookTarget.set(position.x,2,position.z-5);
  }else{
    car.updateMatrixWorld(true);
    cameraTarget.copy(cameraModes[cameraMode].offset);car.localToWorld(cameraTarget);
    lookTarget.copy(cameraModes[cameraMode].look);car.localToWorld(lookTarget);
  }
  const response=Math.min(1,dt*(cameraMode===0?3:cameraMode>=3?14:6));
  cameraPoint.lerp(cameraTarget,response);
  cameraLook.lerp(lookTarget,response);
  camera.position.copy(cameraPoint);
  camera.lookAt(cameraLook);
  const moon=window._nachtfahrtMoon;
  moon.position.set(position.x-80,130,position.z+70);
  moon.target.position.set(position.x,0,position.z);scene.add(moon.target);
  renderer.render(scene,camera);
}
window.addEventListener('keydown',e=>{
  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)&&playing)e.preventDefault();
  if(e.code==='Escape'){setPause(!paused);return}
  if(e.code==='KeyR'&&playing&&!paused){reset();return}
  if(e.code==='KeyC'&&playing&&!paused&&!e.repeat){changeCamera();return}
  if(!e.repeat)keys.add(e.code);
});
window.addEventListener('keyup',e=>keys.delete(e.code));
window.addEventListener('blur',clearInput);
document.addEventListener('visibilitychange',()=>{if(document.hidden&&playing&&!paused)setPause(true)});
document.getElementById('startButton').addEventListener('click',start);
document.getElementById('resumeButton').addEventListener('click',()=>setPause(false));
document.getElementById('menuButton').addEventListener('click',showMenu);
document.getElementById('pauseButton').addEventListener('click',()=>setPause(true));
setup();
