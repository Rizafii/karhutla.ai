import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

/** Original illustrative aircraft; no device telemetry or hardware claim. */
export function createDrone() {
  const group = new THREE.Group();
  const rotors: THREE.Group[] = [];
  const shell = new THREE.MeshStandardMaterial({ color: 0xe3e8e5, metalness: .48, roughness: .3 });
  const silver = new THREE.MeshStandardMaterial({ color: 0xaab6b2, metalness: .8, roughness: .24 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x202d2c, metalness: .5, roughness: .35 });
  const rubber = new THREE.MeshStandardMaterial({ color: 0x34403e, roughness: .8 });
  const glass = new THREE.MeshPhysicalMaterial({ color: 0x133c40, metalness: .65, roughness: .07, clearcoat: 1 });
  const led = new THREE.MeshStandardMaterial({ color: 0x9ccd9c, emissive: 0x5e9b64, emissiveIntensity: .6 });

  function box(w: number, h: number, d: number, radius: number, material: THREE.Material, x: number, y: number, z: number, parent = group) {
    const mesh = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 4, radius), material);
    mesh.position.set(x, y, z); parent.add(mesh); return mesh;
  }
  function cylinder(top: number, bottom: number, h: number, material: THREE.Material, x: number, y: number, z: number, parent = group) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(top, bottom, h, 36), material);
    mesh.position.set(x, y, z); parent.add(mesh); return mesh;
  }
  function strut(a: THREE.Vector3, b: THREE.Vector3, width: number, height: number, material: THREE.Material) {
    const length = a.distanceTo(b), center = a.clone().add(b).multiplyScalar(.5);
    const mesh = box(width, height, length, .065, material, center.x, center.y, center.z);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), b.clone().sub(a).normalize());
    return mesh;
  }
  box(1.45, .42, 2.12, .2, shell, 0, .04, 0);
  box(1.21, .16, 1.55, .12, silver, 0, .3, -.12);
  box(1.08, .09, 1.38, .08, shell, 0, .4, -.12);
  box(.91, .18, 1.4, .1, dark, 0, -.25, -.12);
  box(.8, .12, .7, .06, shell, 0, -.32, .55);
  // Battery latch, status indicator and body seams.
  box(.25, .028, .34, .025, dark, 0, .455, -.45);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.055, .009, 8, 24), led);
  ring.rotation.x = -Math.PI / 2; ring.position.set(0, .473, -.45); group.add(ring);
  for (const side of [-1, 1]) {
    for (let i = 0; i < 7; i++) box(.025, .06, .085, .009, dark, side * .72, -.04, -.6 + i * .12);
    box(.014, .025, 1.2, .005, silver, side * .726, .07, -.1);
    const sensor = cylinder(.09, .09, .04, dark, side * .45, .02, 1.065);
    sensor.rotation.x = Math.PI / 2;
    const lens = cylinder(.055, .055, .046, glass, side * .45, .02, 1.09);
    lens.rotation.x = Math.PI / 2;
    for (const front of [-1, 1]) {
      const end = new THREE.Vector3(side * 2.05, .12, front * 1.45);
      strut(new THREE.Vector3(side * .53, .04, front * .58), end, .3, .22, shell);
      const hinge = cylinder(.16, .16, .28, silver, side * .72, .08, front * .7);
      hinge.rotation.z = Math.PI / 2;
      cylinder(.21, .19, .23, dark, end.x, .26, end.z);
      cylinder(.22, .22, .035, silver, end.x, .39, end.z);
      cylinder(.13, .16, .09, dark, end.x, .45, end.z);
      box(.075, .65, .1, .03, silver, end.x, -.31, end.z);
      box(.09, .11, .13, .025, rubber, end.x, -.65, end.z);
      box(.12, .05, .12, .02, led, end.x + side * .17, .18, end.z);
      const rotor = new THREE.Group(); rotor.position.set(end.x, .46, end.z); rotor.rotation.y = side * front * .4;
      for (const direction of [-1, 1]) {
        const shape = new THREE.Shape();
        shape.moveTo(.02, -.045); shape.bezierCurveTo(.3, -.14, .93, -.16, 1.13, -.06); shape.bezierCurveTo(1.22, .01, 1.1, .075, .93, .07); shape.bezierCurveTo(.55, .12, .18, .13, .02, .045); shape.closePath();
        const blade = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: .017, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: .008, bevelThickness: .005, curveSegments: 12 }), dark);
        blade.rotation.x = Math.PI / 2; blade.rotation.z = direction < 0 ? Math.PI : 0; rotor.add(blade);
      }
      cylinder(.075, .09, .07, silver, 0, .035, 0, rotor);
      group.add(rotor); rotors.push(rotor);
    }
  }
  // Suspended three-axis camera gimbal, lens rings and mounting arms.
  cylinder(.12, .12, .25, silver, 0, -.48, .79);
  box(.58, .11, .19, .045, silver, 0, -.61, .78);
  for (const side of [-1, 1]) box(.09, .4, .16, .03, silver, side * .29, -.77, .78);
  const camera = box(.49, .42, .42, .1, silver, 0, -.87, .83);
  camera.rotation.x = -.08;
  box(.38, .3, .07, .07, dark, 0, -.87, 1.06);
  for (const [radius, depth, material] of [[.13, .06, silver], [.105, .085, dark], [.08, .095, glass]] as const) {
    const lens = cylinder(radius, radius, depth, material, 0, -.87, 1.1); lens.rotation.x = Math.PI / 2;
  }
  const labelCanvas = document.createElement("canvas"); labelCanvas.width = 512; labelCanvas.height = 128;
  const context = labelCanvas.getContext("2d");
  if (context) {
    context.fillStyle = "#344b42"; context.font = "500 55px Arial"; context.textAlign = "center"; context.fillText("karhutla.ai", 256, 73);
    const texture = new THREE.CanvasTexture(labelCanvas); texture.colorSpace = THREE.SRGBColorSpace;
    const label = new THREE.Mesh(new THREE.PlaneGeometry(.7, .175), new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false }));
    label.rotation.x = -Math.PI / 2; label.position.set(0, .451, .35); group.add(label);
  }
  return { group, rotors };
}
