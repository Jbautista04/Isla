import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js';

const $ = (id) => document.getElementById(id);
const ui = {
 loading:$('loading'), start:$('start-screen'), hud:$('hud'), controls:$('controls'),
 pause:$('pause-screen'), win:$('win-screen'), error:$('error-screen'),
 play:$('play-btn'), pauseBtn:$('pause-btn'), resume:$('resume-btn'),
 restart:$('restart-btn'), again:$('again-btn'), count:$('crystal-count'),
 progress:$('progress-fill'), mission:$('mission-text'), toast:$('toast'),
 joystick:$('joystick'), stick:$('stick'), jump:$('jump-btn')
};
let renderer, scene, camera, clock, player, playerGroup, ocean, island;
let running=false, paused=false, won=false, collected=0, jumpVelocity=0, grounded=true;
let toastTimer=0, elapsed=0, crystals=[], keys={}, moveInput={x:0,y:0}, joystickPointer=null;
const WORLD=42, CRYSTAL_TOTAL=8, playerSpeed=6.2;
const tempV = new THREE.Vector3();

function mat(color, roughness=0.8, metalness=0){return new THREE.MeshStandardMaterial({color,roughness,metalness});}
function mesh(geo, material, parent, x=0,y=0,z=0){const m=new THREE.Mesh(geo,material);m.position.set(x,y,z);parent.add(m);return m;}
function seededRandom(seed){let s=seed;return ()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};}

function init(){
  try {
    scene=new THREE.Scene(); scene.background=new THREE.Color('#7bd9df'); scene.fog=new THREE.Fog('#7bd9df',30,85);
    camera=new THREE.PerspectiveCamera(58,innerWidth/innerHeight,.1,180);
    renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
    renderer.setPixelRatio(Math.min(devicePixelRatio,1.7)); renderer.setSize(innerWidth,innerHeight);
    renderer.outputColorSpace=THREE.SRGBColorSpace; renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.15;
    renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    document.body.prepend(renderer.domElement);
    clock=new THREE.Clock();
    scene.add(new THREE.HemisphereLight('#d5ffff','#24546a',2.0));
    const sun=new THREE.DirectionalLight('#fff1c4',3.2); sun.position.set(-12,22,10); sun.castShadow=true;
    sun.shadow.mapSize.set(1024,1024); sun.shadow.camera.left=-28; sun.shadow.camera.right=28; sun.shadow.camera.top=28; sun.shadow.camera.bottom=-28; scene.add(sun);
    makeOcean(); makeIsland(); makePlayer(); makeEnvironment(); makeCrystals();
    camera.position.set(0,5,9); camera.lookAt(0,1,0);
    window.addEventListener('resize',onResize);
    window.addEventListener('keydown',e=>{keys[e.code]=true;if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();});
    window.addEventListener('keyup',e=>keys[e.code]=false);
    ui.loading.classList.add('hidden'); ui.start.classList.remove('hidden');
    requestAnimationFrame(animate);
  } catch(err){console.error(err);ui.loading.classList.add('hidden');ui.error.classList.remove('hidden');}
}
function makeOcean(){
  const geo=new THREE.PlaneGeometry(220,220,60,60);
  const pos=geo.attributes.position;
  for(let i=0;i<pos.count;i++){const x=pos.getX(i),y=pos.getY(i);pos.setZ(i,Math.sin(x*.12)*.07+Math.cos(y*.1)*.06);}
  geo.computeVertexNormals();
  ocean=mesh(geo,new THREE.MeshStandardMaterial({color:'#1e9fb0',roughness:.28,metalness:.1,transparent:true,opacity:.96}),scene,0,-1.4,0);
  ocean.rotation.x=-Math.PI/2;
  const under=mesh(new THREE.CylinderGeometry(22,24,5,64),mat('#c4b07a'),scene,0,-2.7,0);
  under.scale.set(1.18,.9,1.18);
}
function makeIsland(){
  island=new THREE.Group();scene.add(island);
  const sand=mat('#f3d39a'), grass=mat('#3cba8a'), darkGrass=mat('#24886f');
  mesh(new THREE.CylinderGeometry(18.8,20.5,2.4,64,3),sand,island,0,-.35,0);
  const land=mesh(new THREE.CylinderGeometry(17.2,18.7,1.7,64,3),grass,island,0,.65,0);
  land.scale.z=.88;
  const center=mesh(new THREE.CylinderGeometry(6.5,8,1.2,48),darkGrass,island,-1,1.55,-1.4);center.scale.z=.85;
  // A pale beach ring
  const beach=mesh(new THREE.CylinderGeometry(19,19.3,.28,64),mat('#ffe3ac'),island,0,.8,0);beach.scale.z=.88;
  // raised path through the island
  const path=mesh(new THREE.BoxGeometry(4.2,.13,19),mat('#d7b77e'),island,0,1.62,0);path.rotation.y=-.13;
  // heart shrine
  const shrine=new THREE.Group();shrine.position.set(-1,2.25,-1.5);island.add(shrine);
  mesh(new THREE.CylinderGeometry(2.3,2.6,.5,8),mat('#8a9eaa',.35,.3),shrine,0,0,0);
  mesh(new THREE.CylinderGeometry(1.5,1.7,.25,8),mat('#d7f4e9',.25,.2),shrine,0,.35,0);
  const core=mesh(new THREE.OctahedronGeometry(.85,1),new THREE.MeshStandardMaterial({color:'#60ffe2',emissive:'#14c9ba',emissiveIntensity:1.7,metalness:.25,roughness:.2}),shrine,0,1.5,0);core.name='core';
  const ring=mesh(new THREE.TorusGeometry(1.45,.06,8,64),mat('#ffdc85',.25,.5),shrine,0,1.45,0);ring.rotation.x=Math.PI/2;
  for(let i=0;i<5;i++){const a=i*Math.PI*2/5;const p=mesh(new THREE.CylinderGeometry(.2,.28,1.3,6),mat('#718e9d',.45,.25),shrine,Math.cos(a)*2.1,.7,Math.sin(a)*2.1);p.rotation.z=.08*Math.cos(a);}
}
function makePlayer(){
  playerGroup=new THREE.Group();scene.add(playerGroup);
  const teal=mat('#21c9b6',.45,.08), dark=mat('#183a53',.65), skin=mat('#eab38d'), gold=mat('#ffcf70',.35,.25);
  const body=mesh(new THREE.CapsuleGeometry(.36,.65,5,10),teal,playerGroup,0,1.05,0);body.castShadow=true;
  mesh(new THREE.SphereGeometry(.31,20,16),skin,playerGroup,0,1.72,0).castShadow=true;
  const hair=mesh(new THREE.SphereGeometry(.32,16,12,0,Math.PI*2,0,Math.PI*.58),dark,playerGroup,0,1.85,-.02);
  const pack=mesh(new THREE.BoxGeometry(.42,.52,.2),gold,playerGroup,0,1.05,-.32);pack.castShadow=true;
  const eyeMat=mat('#12283a',.35);
  mesh(new THREE.SphereGeometry(.045,8,8),eyeMat,playerGroup,-.105,1.75,.27);
  mesh(new THREE.SphereGeometry(.045,8,8),eyeMat,playerGroup,.105,1.75,.27);
  const legs=mat('#244e66');
  player.leftLeg=mesh(new THREE.CapsuleGeometry(.13,.45,3,7),legs,playerGroup,-.18,.42,0);
  player.rightLeg=mesh(new THREE.CapsuleGeometry(.13,.45,3,7),legs,playerGroup,.18,.42,0);
  playerGroup.position.set(0,1,8);
  player={group:playerGroup,leftLeg:playerGroup.children[6],rightLeg:playerGroup.children[7],body:playerGroup.children[0]};
  playerGroup.traverse(o=>{if(o.isMesh)o.castShadow=true;});
}
function makePalm(parent,x,z,scale=1){
  const g=new THREE.Group();g.position.set(x,1.4,z);g.scale.setScalar(scale);parent.add(g);
  const trunk=mesh(new THREE.CylinderGeometry(.16,.28,3.4,7),mat('#9b6946'),g,0,1.7,0);trunk.rotation.z=.12;
  const leafMat=mat('#177e68');
  for(let i=0;i<7;i++){const a=i*Math.PI*2/7;const leaf=mesh(new THREE.ConeGeometry(.28,2.6,6),leafMat,g,Math.cos(a)*.85,3.2+Math.sin(i*1.8)*.12,Math.sin(a)*.85);leaf.rotation.z=Math.cos(a)*.9;leaf.rotation.x=Math.sin(a)*.9;leaf.rotation.z+=Math.PI/2;}
  for(let i=0;i<3;i++){const c=mesh(new THREE.SphereGeometry(.22,10,8),mat('#ffb64d'),g,Math.cos(i*2.1)*.25,2.75,Math.sin(i*2.1)*.25);}
}
function makeEnvironment(){
  const rand=seededRandom(27);
  for(let i=0;i<32;i++){
    const a=rand()*Math.PI*2,r=10+rand()*7.2,x=Math.cos(a)*r,z=Math.sin(a)*r*.86;
    if(Math.abs(x)<3&&Math.abs(z)<7)continue;
    makePalm(scene,x,z,.65+rand()*.45);
  }
  // Rock clusters
  for(let i=0;i<24;i++){
    const a=rand()*Math.PI*2,r=17+rand()*2.7;
    const rock=mesh(new THREE.DodecahedronGeometry(.5+rand()*.8,0),mat(i%2?'#8ca9a8':'#a2b7ae'),scene,Math.cos(a)*r,.15,Math.sin(a)*r*.88);
    rock.scale.y=.6;rock.rotation.set(rand(),rand(),rand());
  }
  // floating clouds
  for(let i=0;i<8;i++){
    const cloud=new THREE.Group();scene.add(cloud);
    const x=(rand()-.5)*65,z=(rand()-.5)*60,y=10+rand()*7;
    for(let j=0;j<4;j++)mesh(new THREE.SphereGeometry(1.4+rand()*.6,12,10),new THREE.MeshStandardMaterial({color:'#f3ffff',roughness:1,transparent:true,opacity:.65}),cloud,(j-1.5)*1.2,rand()*.5,rand()*.4);
    cloud.position.set(x,y,z);cloud.userData.baseY=y;cloud.userData.phase=rand()*6;
  }
  // distant sea stacks
  for(let i=0;i<11;i++){const a=i/11*Math.PI*2;const rock=mesh(new THREE.ConeGeometry(2+Math.random()*2,5+Math.random()*4,7),mat('#4d9f9b'),scene,Math.cos(a)*28,-.5,Math.sin(a)*26);rock.rotation.z=.1;}
  // fireflies
  const dots=new THREE.BufferGeometry();const arr=[];
  for(let i=0;i<90;i++){const a=rand()*Math.PI*2,r=rand()*17;arr.push(Math.cos(a)*r,1.5+rand()*4,Math.sin(a)*r*.85);}
  dots.setAttribute('position',new THREE.Float32BufferAttribute(arr,3));
  scene.add(new THREE.Points(dots,new THREE.PointsMaterial({color:'#b9fff0',size:.09,transparent:true,opacity:.8})));
}
function makeCrystals(){
  const spots=[[-7,4],[-11,-2],[-5,-10],[5,-11],[10,-4],[12,4],[4,10],[-12,7]];
  spots.forEach((p,i)=>{
    const g=new THREE.Group();g.position.set(p[0],1.9,p[1]);g.userData={baseY:1.9,phase:i*.9,index:i,found:false};
    const crystal=mesh(new THREE.OctahedronGeometry(.55,0),new THREE.MeshStandardMaterial({color:['#5fffe0','#f5a8ff','#8dbdff','#ffd36b'][i%4],emissive:['#16cdb6','#c44dff','#327cff','#ffad30'][i%4],emissiveIntensity:1.2,metalness:.25,roughness:.18}),g,0,0,0);
    crystal.rotation.z=.2;mesh(new THREE.TorusGeometry(.7,.025,6,32),mat('#d7fff5',.25,.35),g,0,-.7,0).rotation.x=Math.PI/2;
    scene.add(g);crystals.push(g);
    const glow=new THREE.PointLight(['#5fffe0','#f5a8ff','#8dbdff','#ffd36b'][i%4],1.1,3);glow.position.set(0,0,0);g.add(glow);
  });
}
function onResize(){
  camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.setSize(innerWidth,innerHeight);
}
function startGame(){
  ui.start.classList.add('hidden');ui.pause.classList.add('hidden');ui.win.classList.add('hidden');
  ui.hud.classList.remove('hidden');ui.controls.classList.remove('hidden');
  running=true;paused=false;won=false;clock.getDelta();ui.mission.textContent='Encuentra los prismas perdidos';
}
function resetGame(){
  collected=0;ui.count.textContent='0';ui.progress.style.width='0%';ui.mission.textContent='Encuentra los prismas perdidos';
  crystals.forEach(c=>{c.visible=true;c.userData.found=false;});playerGroup.position.set(0,1,8);playerGroup.rotation.y=0;startGame();
}
function showToast(msg){ui.toast.textContent=msg;ui.toast.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>ui.toast.classList.remove('show'),1800);}
function jump(){if(running&&!paused&&grounded){jumpVelocity=7.2;grounded=false;}}
function setJoystick(dx,dy){const max=39,len=Math.hypot(dx,dy),s=len>max?max/len:1;dx*=s;dy*=s;ui.stick.style.transform=`translate(${dx}px,${dy}px)`;moveInput.x=dx/max;moveInput.y=dy/max;}
ui.joystick.addEventListener('pointerdown',e=>{joystickPointer=e.pointerId;ui.joystick.setPointerCapture(e.pointerId);const r=ui.joystick.getBoundingClientRect();setJoystick(e.clientX-(r.left+r.width/2),e.clientY-(r.top+r.height/2));});
ui.joystick.addEventListener('pointermove',e=>{if(e.pointerId!==joystickPointer)return;const r=ui.joystick.getBoundingClientRect();setJoystick(e.clientX-(r.left+r.width/2),e.clientY-(r.top+r.height/2));});
function releaseStick(e){if(e.pointerId!==joystickPointer)return;joystickPointer=null;setJoystick(0,0);}
ui.joystick.addEventListener('pointerup',releaseStick);ui.joystick.addEventListener('pointercancel',releaseStick);ui.jump.addEventListener('pointerdown',e=>{e.preventDefault();jump();});
ui.play.addEventListener('click',startGame);ui.pauseBtn.addEventListener('click',()=>{paused=true;ui.pause.classList.remove('hidden');});
ui.resume.addEventListener('click',()=>{paused=false;ui.pause.classList.add('hidden');clock.getDelta();});
ui.restart.addEventListener('click',resetGame);ui.again.addEventListener('click',resetGame);
function animate(){
  requestAnimationFrame(animate);
  const dt=Math.min(clock.getDelta(),.04);elapsed+=dt;
  if(scene){
    ocean.material.color.setHSL(.52+Math.sin(elapsed*.12)*.008,.72,.42);
    island.rotation.y=Math.sin(elapsed*.08)*.012;
    scene.traverse(o=>{if(o.userData?.baseY!==undefined&&o.userData.phase!==undefined){o.position.y=o.userData.baseY+Math.sin(elapsed*1.8+o.userData.phase)*.16;o.rotation.y+=dt*.55;}});
    if(running&&!paused&&!won)updateGame(dt);
    renderer.render(scene,camera);
  }
}
function updateGame(dt){
  let ix=moveInput.x,iy=moveInput.y;
  if(keys.KeyA||keys.ArrowLeft)ix-=1;if(keys.KeyD||keys.ArrowRight)ix+=1;
  if(keys.KeyW||keys.ArrowUp)iy-=1;if(keys.KeyS||keys.ArrowDown)iy+=1;
  if(keys.Space)jump();
  const mag=Math.hypot(ix,iy);if(mag>1){ix/=mag;iy/=mag;}
  // Camera-relative movement, horizontal plane
  const forward=new THREE.Vector3();camera.getWorldDirection(forward);forward.y=0;forward.normalize();
  const right=new THREE.Vector3().crossVectors(forward,new THREE.Vector3(0,1,0)).normalize();
  const move=new THREE.Vector3().addScaledVector(right,ix).addScaledVector(forward,-iy);
  if(move.lengthSq()>.001){
    move.normalize();playerGroup.position.addScaledVector(move,playerSpeed*dt);
    playerGroup.rotation.y=Math.atan2(move.x,move.z);
    const swing=Math.sin(elapsed*12)*.42* Math.min(1,mag);
    player.leftLeg.rotation.x=swing;player.rightLeg.rotation.x=-swing;
    player.body.position.y=1.05+Math.abs(swing)*.08;
  }else{player.leftLeg.rotation.x*=.8;player.rightLeg.rotation.x*=.8;player.body.position.y=1.05;}
  playerGroup.position.x=THREE.MathUtils.clamp(playerGroup.position.x,-16.5,16.5);
  playerGroup.position.z=THREE.MathUtils.clamp(playerGroup.position.z,-15,15);
  jumpVelocity-=18*dt;playerGroup.position.y+=jumpVelocity*dt;
  if(playerGroup.position.y<=1){playerGroup.position.y=1;jumpVelocity=0;grounded=true;}
  // Smooth chase camera
  const desired=new THREE.Vector3(playerGroup.position.x,playerGroup.position.y+4.4,playerGroup.position.z+7.8);
  camera.position.lerp(desired,1-Math.exp(-5*dt));
  const lookAt=new THREE.Vector3(playerGroup.position.x,playerGroup.position.y+1.05,playerGroup.position.z-1.4);
  camera.lookAt(lookAt);
  for(const c of crystals){
    if(!c.visible)continue;
    if(c.position.distanceTo(playerGroup.position)<1.55){
      c.visible=false;c.userData.found=true;collected++;ui.count.textContent=String(collected);ui.progress.style.width=(collected/CRYSTAL_TOTAL*100)+'%';
      showToast(['¡Prisma de marea recuperado!','¡Has encontrado un prisma lunar!','¡La energía vuelve al arrecife!','¡Prisma recuperado!'][collected%4]);
      if(collected===CRYSTAL_TOTAL){won=true;running=false;ui.hud.classList.add('hidden');ui.controls.classList.add('hidden');ui.win.classList.remove('hidden');}
    }
  }
  const core=scene.getObjectByName('core');if(core){core.rotation.y+=dt*.7;core.rotation.x=Math.sin(elapsed)*.12;}
}
init();
