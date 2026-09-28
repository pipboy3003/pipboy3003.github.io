/* Nachtfahrt Racing v0.1 – kompletter Rundkurs mit 3 Runden. 2026-09-28 */
import * as THREE from 'three';
const $=id=>document.getElementById(id);
const viewport=$('viewport'),menu=$('menu'),pause=$('pause'),hud=$('hud'),bottomHud=$('bottomHud');
const statusLabel=$('status'),speedLabel=$('speed'),toast=$('toast'),error=$('error');
const finishPanel=$('finish'),finishTitle=$('finishTitle'),finishTime=$('finishTime'),bestTime=$('bestTime');
const clamp=THREE.MathUtils.clamp,TRACK_WIDTH=24,LAPS=3,COUNT=360;
const points=[[-188,-20],[-175,-123],[-94,-205],[35,-211],[164,-166],[216,-68],[194,44],[131,154],[17,212],[-106,180],[-203,93]];
const curve=new THREE.CatmullRomCurve3(points.map(([x,z])=>new THREE.Vector3(x,0,z)),true,'centripetal');
const track=[];
const cameraModes=[
  {name:'Stadtblick',offset:null,look:null,fov:52},
  {name:'Verfolger nah',offset:new THREE.Vector3(0,26,33),look:new THREE.Vector3(0,2,-12),fov:52},
  {name:'Verfolger fern',offset:new THREE.Vector3(0,47,78),look:new THREE.Vector3(0,2,-12),fov:52},
  {name:'Motorhaube',offset:new THREE.Vector3(0,2.55,-2.4),look:new THREE.Vector3(0,1.5,-35),fov:70},
  {name:'Stoßstange',offset:new THREE.Vector3(0,1.25,-4.35),look:new THREE.Vector3(0,1.4,-35),fov:75}
];
let renderer,scene,camera,car,body,wheels=[],rain,raindrops=[],sun;
let cameraMode=1,cameraPoint=new THREE.Vector3(),cameraLook=new THREE.Vector3(),last=performance.now();
const targetPos=new THREE.Vector3(),targetLook=new THREE.Vector3();
let playing=false,paused=false,ended=false,velocity=0,heading=0,position=new THREE.Vector3();
let lap=1,checkpoint=0,elapsed=0,penalty=0,messageTimer=0,wallCooldown=0;
const keys=new Set();
const mat=(color,other={})=>new THREE.MeshStandardMaterial({color,roughness:.7,...other});
const roadMat=mat(0x1a2933,{roughness:.49,metalness:.12}),grass=mat(0x0b2025);
const white=mat(0xe1ece4,{emissive:0x404b44,emissiveIntensity:.18});
const amber=mat(0xffce84,{emissive:0xd97e39,emissiveIntensity:2});
const red=mat(0xf45263,{emissive:0xd8283e,emissiveIntensity:1.8});
const cyan=mat(0x72f2e6,{emissive:0x20cbbf,emissiveIntensity:1.8});
function box(parent,w,h,d,x,y,z,material){
  const item=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);item.position.set(x,y,z);
  item.castShadow=h>1;item.receiveShadow=true;parent.add(item);return item;
}
function message(text){toast.textContent=text;toast.classList.add('show');messageTimer=3}
function timeLabel(seconds){const min=Math.floor(seconds/60),sec=Math.floor(seconds%60),dec=Math.floor((seconds%1)*10);return `${String(min).padStart(2,'0')}:${String(sec).padStart(2,'0')}.${dec}`}
function best(){try{return Number(localStorage.getItem('nachtrennen-best-v1'))||0}catch{return 0}}
function saveBest(value){try{localStorage.setItem('nachtrennen-best-v1',String(value))}catch{}}
function nearest(x,z){
  let dist2=Infinity,t=0;
  for(let i=0;i<COUNT;i++){
    const a=track[i],b=track[i+1],dx=b.x-a.x,dz=b.z-a.z;
    const u=clamp(((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz),0,1);
    const px=a.x+dx*u,pz=a.z+dz*u,d=(x-px)**2+(z-pz)**2;
    if(d<dist2){dist2=d;t=(i+u)/COUNT}
  }
  return {distance:Math.sqrt(dist2),t};
}
function roadMesh(){
  const vertices=[],indices=[];
  for(let i=0;i<=COUNT;i++){
    const t=i/COUNT,p=curve.getPoint(t),v=curve.getTangent(t).normalize(),nx=-v.z,nz=v.x;
    track.push({x:p.x,z:p.z});
    vertices.push(p.x+nx*TRACK_WIDTH/2,.16,p.z+nz*TRACK_WIDTH/2,p.x-nx*TRACK_WIDTH/2,.16,p.z-nz*TRACK_WIDTH/2);
    if(i<COUNT){const k=i*2;indices.push(k,k+2,k+1,k+1,k+2,k+3)}
  }
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  geo.setIndex(indices);geo.computeVertexNormals();
  const asphalt=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color:0x1b2c35,roughness:.48,metalness:.1,side:THREE.DoubleSide}));
  asphalt.receiveShadow=true;scene.add(asphalt);
  const curbWhite=mat(0xc8d5cf),curbRed=mat(0xb83c52);
  const pole=mat(0x465963,{metalness:.35}),lamp=mat(0xffd8a1,{emissive:0xe6a364,emissiveIntensity:2.3});
  for(let i=0;i<COUNT;i+=6){
    const a=track[i],b=track[i+2],v=curve.getTangent(i/COUNT).normalize();
    const nx=-v.z,nz=v.x,angle=Math.atan2(nx,nz);
    for(const s of [-1,1]){
      const r=i%12===0?curbRed:curbWhite;
      const curb=box(scene,1.1,.32,9,a.x+s*nx*(TRACK_WIDTH/2-.45),.23,a.z+s*nz*(TRACK_WIDTH/2-.45),r);
      curb.rotation.y=angle;
      if(i%18===0){
        const rail=box(scene,.35,1.1,9,a.x+s*nx*(TRACK_WIDTH/2+1.3),.7,a.z+s*nz*(TRACK_WIDTH/2+1.3),pole);
        rail.rotation.y=angle;
      }
    }
    if(i%12===0){
      const dash=box(scene,.18,.02,5,a.x,.18,a.z,white);
      dash.rotation.y=Math.atan2(v.x,v.z);
    }
    if(i%36===0){
      const side=i%72===0?1:-1;
      const px=a.x+side*nx*(TRACK_WIDTH/2+4),pz=a.z+side*nz*(TRACK_WIDTH/2+4);
      box(scene,.32,9,.32,px,4.5,pz,pole);
      const head=box(scene,1.2,.28,1.2,px,9.1,pz,lamp);head.castShadow=false;
      const light=new THREE.PointLight(0xffc994,4,42,2);light.position.set(px,8.8,pz);scene.add(light);
    }
  }
  for(let i=0;i<12;i++){
    const t=i/12,p=curve.getPoint(t),v=curve.getTangent(t).normalize(),nx=-v.z,nz=v.x;
    const x=p.x+nx*(TRACK_WIDTH/2+22),z=p.z+nz*(TRACK_WIDTH/2+22);
    box(scene,17,5,9,x,2.5,z,mat(i%2?0x183443:0x283641));
    if(i%2===0)box(scene,18,.23,10,x,5.2,z,cyan);
  }
  for(const t of [0,.25,.5,.75])gate(t,t===0?cyan:amber,t===0);
}
function gate(t,color,finish){
  const p=curve.getPoint(t),v=curve.getTangent(t).normalize(),nx=-v.z,nz=v.x;
  for(const s of [-1,1]){
    const x=p.x+s*nx*(TRACK_WIDTH/2+3),z=p.z+s*nz*(TRACK_WIDTH/2+3);
    box(scene,.5,9,.5,x,4.5,z,color);
  }
  if(finish){
    const across=new THREE.Vector3(nx,0,nz),angle=Math.atan2(-across.z,across.x);
    const bar=box(scene,TRACK_WIDTH+6,.55,.7,p.x,9,p.z,cyan);bar.rotation.y=angle;
    for(let s=-6;s<=6;s++){
      const tile=box(scene,1.7,.018,2,p.x+nx*s*1.7,.195,p.z+nz*s*1.7,s%2?white:mat(0x121c26));
      tile.rotation.y=angle;
    }
  }
}
function makeCar(){
  car=new THREE.Group();scene.add(car);body=new THREE.Group();car.add(body);
  box(body,3.9,1.15,7.3,0,1.15,0,mat(0x43d1cc,{metalness:.55,roughness:.32}));
  box(body,3.3,1.2,3.65,0,2.17,.2,mat(0x173645,{metalness:.38,roughness:.26}));
  box(body,3.35,.09,2.5,0,2.85,.1,cyan);
  box(body,1,.38,.22,-1.04,1.3,-3.67,white);box(body,1,.38,.22,1.04,1.3,-3.67,white);
  box(body,.9,.29,.22,-1.07,1.3,3.67,red);box(body,.9,.29,.22,1.07,1.3,3.67,red);
  const tire=mat(0x090e15,{roughness:1});
  for(const side of [-1,1])for(const back of [-1,1]){
    const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.87,.87,.52,16),tire);
    wheel.rotation.z=Math.PI/2;wheel.position.set(side*2.12,.87,back*2.35);body.add(wheel);wheels.push(wheel);
  }
  const left=new THREE.SpotLight(0xb5eaff,22,85,Math.PI/7,.55,1.2);
  left.position.set(-1,1.55,-3.5);left.target.position.set(-1,0,-28);car.add(left,left.target);
  const right=left.clone();right.position.x=1;right.target.position.x=1;car.add(right,right.target);
  resetCar();
}
function resetCar(){
  const p=curve.getPoint(.006),v=curve.getTangent(.006).normalize();
  position.set(p.x,0,p.z);heading=Math.atan2(v.x,-v.z);velocity=0;
  car.position.copy(position);car.rotation.y=-heading;keys.clear();
  speedLabel.textContent='00';
}
function makeRain(){
  rain=new THREE.BufferGeometry();rain.setAttribute('position',new THREE.BufferAttribute(new Float32Array(380*3),3));
  raindrops=Array.from({length:380},()=>({x:(Math.random()-.5)*120,y:Math.random()*65+2,z:(Math.random()-.5)*120}));
  scene.add(new THREE.Points(rain,new THREE.PointsMaterial({color:0x9cc0d4,size:.2,transparent:true,opacity:.38,depthWrite:false})));
}
function setup(){
  try{
    renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
    renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.7;
    renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;viewport.appendChild(renderer.domElement);
    scene=new THREE.Scene();scene.background=new THREE.Color(0x0b1929);scene.fog=new THREE.FogExp2(0x0e2030,.0024);
    camera=new THREE.PerspectiveCamera(52,1,.1,1000);
    const ground=new THREE.Mesh(new THREE.PlaneGeometry(800,800),grass);ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
    scene.add(new THREE.HemisphereLight(0x8dbed5,0x182029,2));
    sun=new THREE.DirectionalLight(0x9bb9d9,2.1);sun.position.set(-80,130,70);sun.castShadow=true;
    sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-90;sun.shadow.camera.right=90;
    sun.shadow.camera.top=90;sun.shadow.camera.bottom=-90;scene.add(sun,sun.target);
    roadMesh();makeCar();makeRain();resize();window.addEventListener('resize',resize);requestAnimationFrame(frame);
  }catch(e){error.textContent='3D-Start fehlgeschlagen: '+e.message;error.classList.remove('hidden');console.error(e)}
}
function resize(){if(!renderer)return;const w=viewport.clientWidth,h=viewport.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}
function changeCamera(){
  cameraMode=(cameraMode+1)%cameraModes.length;
  const mode=cameraModes[cameraMode];camera.fov=mode.fov;camera.updateProjectionMatrix();
  if(cameraMode>=3){car.updateMatrixWorld(true);cameraPoint.copy(mode.offset);car.localToWorld(cameraPoint);cameraLook.copy(mode.look);car.localToWorld(cameraLook)}
  message('Kamera '+(cameraMode+1)+'/5: '+mode.name);
}
function updateHud(){statusLabel.textContent=`RUNDE ${lap}/${LAPS} · ${timeLabel(elapsed+penalty)}`}
function raceStart(){
  resetCar();lap=1;checkpoint=0;elapsed=0;penalty=0;ended=false;playing=true;paused=false;
  menu.classList.add('hidden');pause.classList.add('hidden');finishPanel.classList.add('hidden');
  hud.hidden=false;bottomHud.hidden=false;cameraMode=1;camera.fov=52;camera.updateProjectionMatrix();
  updateHud();message('Start! Drei Runden im Uhrzeigersinn.');
}
function raceEnd(){
  ended=true;playing=false;keys.clear();
  const total=elapsed+penalty,record=best();
  if(!record||total<record)saveBest(total);
  finishTitle.textContent='ZIEL ERREICHT';finishTime.textContent=timeLabel(total);
  bestTime.textContent=timeLabel(best());finishPanel.classList.remove('hidden');
  hud.hidden=true;bottomHud.hidden=true;
}
function updateRace(dt){
  elapsed+=dt;
  const gas=keys.has('KeyW')||keys.has('ArrowUp'),brake=keys.has('KeyS')||keys.has('ArrowDown');
  const steer=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0);
  if(gas)velocity+=35*dt;if(brake)velocity-=velocity>1?55*dt:24*dt;
  if(!gas&&!brake)velocity*=Math.exp(-1.55*dt);
  velocity=clamp(velocity,-13,39);if(Math.abs(velocity)<.12)velocity=0;
  heading+=steer*dt*1.65*clamp(Math.abs(velocity)/15,0,1)*(velocity<0?-1:1);
  const nx=position.x+Math.sin(heading)*velocity*dt,nz=position.z-Math.cos(heading)*velocity*dt;
  if(nearest(nx,nz).distance<TRACK_WIDTH/2-2){position.x=nx;position.z=nz}
  else{velocity=0;if(wallCooldown<=0){message('Streckenrand – Tempo raus!');wallCooldown=1.5}}
  car.position.copy(position);car.rotation.y=-heading;
  body.rotation.z=THREE.MathUtils.lerp(body.rotation.z,-steer*velocity/39*.085,Math.min(1,dt*5));
  for(const wheel of wheels)wheel.rotation.x-=velocity*dt/.87;
  speedLabel.textContent=String(Math.round(Math.abs(velocity)*3)).padStart(2,'0');
  const p=nearest(position.x,position.z),tangent=curve.getTangent(p.t).normalize();
  const forward=velocity>2&&(Math.sin(heading)*tangent.x-Math.cos(heading)*tangent.z)>.45;
  if(forward){
    if(checkpoint===0&&p.t>.25&&p.t<.42){checkpoint=1;message('Checkpoint 1/3')}
    else if(checkpoint===1&&p.t>.5&&p.t<.67){checkpoint=2;message('Checkpoint 2/3')}
    else if(checkpoint===2&&p.t>.75&&p.t<.92){checkpoint=3;message('Checkpoint 3/3')}
    else if(checkpoint===3&&p.t<.045&&p.t>.001){
      checkpoint=0;
      if(lap===LAPS){raceEnd();return}
      lap++;message('Runde '+lap+'/'+LAPS);
    }
  }
  updateHud();
}
function updateRain(dt){
  const arr=rain.attributes.position.array;
  for(let i=0;i<raindrops.length;i++){
    const d=raindrops[i];d.y-=dt*34;d.x+=dt*2;
    if(d.y<.3){d.y=60;d.x=(Math.random()-.5)*120;d.z=(Math.random()-.5)*120}
    arr[i*3]=position.x+d.x;arr[i*3+1]=d.y;arr[i*3+2]=position.z+d.z;
  }rain.attributes.position.needsUpdate=true;
}
function frame(time){
  requestAnimationFrame(frame);const dt=Math.min((time-last)/1000,.05);last=time;
  if(messageTimer>0){messageTimer-=dt;if(messageTimer<=0)toast.classList.remove('show')}
  if(wallCooldown>0)wallCooldown-=dt;
  if(playing&&!paused)updateRace(dt);updateRain(dt);
  if(cameraMode===0){targetPos.set(position.x+51,86,position.z+89);targetLook.set(position.x,2,position.z-5)}
  else{car.updateMatrixWorld(true);targetPos.copy(cameraModes[cameraMode].offset);car.localToWorld(targetPos);targetLook.copy(cameraModes[cameraMode].look);car.localToWorld(targetLook)}
  if(cameraMode>=3){cameraPoint.copy(targetPos);cameraLook.copy(targetLook)}
  else{const blend=Math.min(1,dt*(cameraMode===0?3:6));cameraPoint.lerp(targetPos,blend);cameraLook.lerp(targetLook,blend)}
  camera.position.copy(cameraPoint);camera.lookAt(cameraLook);
  sun.position.set(position.x-80,130,position.z+70);sun.target.position.set(position.x,0,position.z);
  renderer.render(scene,camera);
}
window.addEventListener('keydown',e=>{
  if(playing&&['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();
  if(e.code==='Escape'&&playing){paused=!paused;keys.clear();pause.classList.toggle('hidden',!paused);return}
  if(e.code==='KeyC'&&playing&&!paused&&!e.repeat){changeCamera();return}
  if(e.code==='KeyR'&&playing&&!paused){penalty+=5;checkpoint=0;resetCar();updateHud();message('Reset zur Startlinie · +5 Sekunden · Checkpoints neu');return}
  if(!e.repeat)keys.add(e.code);
});
window.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',()=>keys.clear());
document.addEventListener('visibilitychange',()=>{if(document.hidden&&playing&&!paused){paused=true;keys.clear();pause.classList.remove('hidden')}});
$('startButton').addEventListener('click',raceStart);
$('resumeButton').addEventListener('click',()=>{paused=false;pause.classList.add('hidden')});
$('menuButton').addEventListener('click',()=>{playing=false;paused=false;keys.clear();pause.classList.add('hidden');menu.classList.remove('hidden');hud.hidden=true;bottomHud.hidden=true});
$('pauseButton').addEventListener('click',()=>{paused=true;keys.clear();pause.classList.remove('hidden')});
$('againButton').addEventListener('click',raceStart);
$('finishMenuButton').addEventListener('click',()=>{finishPanel.classList.add('hidden');menu.classList.remove('hidden')});
setup();
