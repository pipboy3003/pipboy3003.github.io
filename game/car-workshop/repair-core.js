// 2026-10-01 12:00 CEST: Koordinatenmodell, Reparaturzustände und auftragsspezifische Fahrtprüfung als testbarer Kern eingeführt.
export const LOCATIONS = Object.freeze({
  frontRight: Object.freeze({label:'vorne rechts',x:-1.17,z:-1.44}),
  frontLeft: Object.freeze({label:'vorne links',x:1.17,z:-1.44}),
  rearRight: Object.freeze({label:'hinten rechts',x:-1.17,z:1.44}),
  rearLeft: Object.freeze({label:'hinten links',x:1.17,z:1.44})
});
export const MISSIONS = Object.freeze([
  {id:'brake-fr',title:'Bremsbelag vorne rechts',part:'brake',location:'frontRight',test:'brake',reward:180},
  {id:'tire-rl',title:'Reifen hinten links',part:'tire',location:'rearLeft',test:'drive',reward:220},
  {id:'lamp-fl',title:'Scheinwerfer vorne links',part:'lamp',location:'frontLeft',test:'light',reward:160},
  {id:'battery',title:'Batterie im Motorraum',part:'battery',location:'engine',test:'start',reward:240},
  {id:'brake-fl',title:'Bremsbelag vorne links',part:'brake',location:'frontLeft',test:'brake',reward:190},
  {id:'tire-rr',title:'Reifen hinten rechts',part:'tire',location:'rearRight',test:'drive',reward:230},
  {id:'lamp-fr',title:'Scheinwerfer vorne rechts',part:'lamp',location:'frontRight',test:'light',reward:170},
  {id:'tire-fr',title:'Reifen vorne rechts',part:'tire',location:'frontRight',test:'drive',reward:260},
  {id:'brake-rr',title:'Bremse hinten rechts',part:'brake',location:'rearRight',test:'brake',reward:210},
  {id:'tire-fl',title:'Reifen vorne links',part:'tire',location:'frontLeft',test:'drive',reward:240},
  {id:'brake-rl',title:'Bremse hinten links',part:'brake',location:'rearLeft',test:'brake',reward:215},
  {id:'tire-rr-2',title:'Hinterrad rechts: Unwucht',part:'tire',location:'rearRight',test:'drive',reward:245}
]);
export const missionAt = completed => MISSIONS[completed % MISSIONS.length];
export function createRepair(mission) {
  if (!mission || !['brake','tire','lamp','battery'].includes(mission.part)) throw new Error('Ungültiger Auftrag');
  return {mission,phase:'inspect',wheelRemoved:false,padRemoved:false,hoodOpen:false,partRemoved:false,wrongChecks:0,driveMeters:0,brakeStarted:false,brakePassed:false,lightPassed:false,startPassed:false,complete:false};
}
export function inspect(state,part,location) {
  if (state.phase!=='inspect') throw new Error('Inspektion nicht möglich');
  if (part==='battery'&&!state.hoodOpen) throw new Error('Motorhaube zuerst öffnen');
  if (part==='brake'&&!state.wheelRemoved) throw new Error('Rad zuerst demontieren');
  if (part!==state.mission.part||location!==state.mission.location){state.wrongChecks++;return false}
  state.phase='remove';return true;
}
export function step(state,action) {
  if (action==='openHood'&&state.phase==='inspect') {state.hoodOpen=true;return state}
  if (action==='removeWheel'&&state.phase==='inspect'&&state.mission.part==='brake') {state.wheelRemoved=true;return state}
  if (action==='removePad'&&state.phase==='remove'&&state.mission.part==='brake'&&state.wheelRemoved) {state.padRemoved=true;state.partRemoved=true;state.phase='replace';return state}
  if (action==='removePart'&&state.phase==='remove'&&state.mission.part!=='brake') {state.partRemoved=true;state.phase='replace';return state}
  if (action==='installPart'&&state.phase==='replace'&&state.partRemoved) {state.partRemoved=false;state.phase=state.mission.part==='brake'?'reassemble':'drive';return state}
  if (action==='installWheel'&&state.phase==='reassemble'&&state.mission.part==='brake') {state.wheelRemoved=false;state.phase='drive';return state}
  throw new Error(`Ungültiger Schritt: ${action} in ${state.phase}`);
}
export function testDrive(state,{meters=0,kmh=0,braking=false,lightsOn=false,engineStarted=false}={}) {
  if (state.phase!=='drive') throw new Error('Probefahrt vor Montage gesperrt');
  state.driveMeters=Math.max(state.driveMeters,meters);
  if (state.mission.test==='brake') {if(kmh>=40)state.brakeStarted=true;if(state.brakeStarted&&braking&&kmh<=8)state.brakePassed=true}
  if (state.mission.test==='light'&&lightsOn)state.lightPassed=true;
  if (state.mission.test==='start'&&engineStarted)state.startPassed=true;
  const extra={brake:state.brakePassed,drive:true,light:state.lightPassed,start:state.startPassed}[state.mission.test];
  state.complete=state.driveMeters>=300&&extra;
  if(state.complete)state.phase='done';
  return state.complete;
}