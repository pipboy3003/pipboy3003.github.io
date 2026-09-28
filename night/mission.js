/* Nachtfahrt – erste Lieferung: Nachtkiosk am nordwestlichen Straßenrand. */
export function createFirstDelivery(THREE,scene,previouslyDelivered=false){
  const target={x:-198,z:-120,radius:9};
  let delivered=Boolean(previouslyDelivered),hold=0;
  const marker=new THREE.Group();
  const color=new THREE.MeshBasicMaterial({color:0xffbe79,side:THREE.DoubleSide,transparent:true,opacity:.9});
  const ground=new THREE.Mesh(new THREE.RingGeometry(6.3,7.4,40),color);
  ground.rotation.x=-Math.PI/2;ground.position.y=.24;marker.add(ground);
  const glow=new THREE.Mesh(new THREE.CylinderGeometry(2.8,2.8,.05,32),new THREE.MeshBasicMaterial({color:0xffa45e,transparent:true,opacity:.22,depthWrite:false}));
  glow.position.y=.21;marker.add(glow);
  const beacon=new THREE.Mesh(new THREE.CylinderGeometry(.22,.22,8,12),new THREE.MeshBasicMaterial({color:0xffcf93,transparent:true,opacity:.5,depthWrite:false}));
  beacon.position.y=4;marker.add(beacon);
  marker.position.set(target.x,0,target.z);marker.visible=!delivered;scene.add(marker);
  return {
    get done(){return delivered},
    distance(x,z){return Math.hypot(x-target.x,z-target.z)},
    update(x,z,speed,dt,now){
      if(delivered)return {delivered:false,text:'Lieferung 1/3 erledigt'};
      const distance=Math.hypot(x-target.x,z-target.z);
      ground.rotation.z=now*.0003;
      beacon.material.opacity=.34+.12*Math.sin(now*.003);
      if(distance>target.radius||Math.abs(speed)>=1.8){
        hold=0;
        return {delivered:false,text:distance<target.radius?'Im Lieferfeld anhalten':'Nachtkiosk · '+Math.round(distance)+' m'};
      }
      hold=Math.min(1.2,hold+dt);
      if(hold>=1.2){
        delivered=true;marker.visible=false;
        return {delivered:true,text:'Lieferung 1/3 erledigt'};
      }
      return {delivered:false,text:'Lieferung abgeben · '+Math.round(hold/1.2*100)+' %'};
    }
  };
}
