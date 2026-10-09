// Kamera-irányítás: telefon giroszkóp (DeviceOrientation) + ujjal húzás (asztali gépen ez az egyetlen mód).
import * as THREE from 'three';

const Y_AXIS = new THREE.Vector3(0, 1, 0);
const Z_AXIS = new THREE.Vector3(0, 0, 1);
const Q_WORLD = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5)); // -90° X körül

export class LookControls {
  constructor(camera) {
    this.camera = camera;
    this.deviceQ = new THREE.Quaternion();
    this.hasDevice = false;
    this.yawOffset = 0;   // középre igazítás + húzás
    this.dragPitch = 0;   // csak giroszkóp nélkül
    this._euler = new THREE.Euler();
    this._q = new THREE.Quaternion();
    this._needsRecenter = true;
    this._onOrient = (e) => this._handle(e);
  }

  /** iOS 13+: engedélyt kell kérni, felhasználói gesztusból hívandó. */
  static requestPermission() {
    const D = window.DeviceOrientationEvent;
    if (D && typeof D.requestPermission === 'function') {
      return D.requestPermission().catch(() => 'denied');
    }
    return Promise.resolve('granted');
  }

  connect() {
    window.addEventListener('deviceorientation', this._onOrient);
  }

  _handle(e) {
    if (e.alpha == null) return;
    const orient = THREE.MathUtils.degToRad(screen.orientation?.angle ?? window.orientation ?? 0);
    this._euler.set(
      THREE.MathUtils.degToRad(e.beta),
      THREE.MathUtils.degToRad(e.alpha),
      -THREE.MathUtils.degToRad(e.gamma),
      'YXZ'
    );
    this.deviceQ.setFromEuler(this._euler);
    this.deviceQ.multiply(Q_WORLD);
    this.deviceQ.multiply(this._q.setFromAxisAngle(Z_AXIS, -orient));
    this.hasDevice = true;
    if (this._needsRecenter) { this._needsRecenter = false; this.recenter(); }
  }

  /** Az aktuális nézési irány legyen az "előre" (−Z). */
  recenter() {
    if (this.hasDevice) {
      this._euler.setFromQuaternion(this.deviceQ, 'YXZ');
      this.yawOffset = -this._euler.y;
    } else {
      this.yawOffset = 0;
      this.dragPitch = 0;
    }
  }

  drag(dx, dy) {
    this.yawOffset += dx * 0.005;
    if (!this.hasDevice) {
      this.dragPitch = THREE.MathUtils.clamp(this.dragPitch + dy * 0.005, -1.3, 1.3);
    }
  }

  update() {
    if (this.hasDevice) {
      this.camera.quaternion.setFromAxisAngle(Y_AXIS, this.yawOffset).multiply(this.deviceQ);
    } else {
      this._euler.set(this.dragPitch, this.yawOffset, 0, 'YXZ');
      this.camera.quaternion.setFromEuler(this._euler);
    }
  }

  /** Fel-le dőlés radiánban (pozitív = felfelé néz). */
  pitch() {
    const d = new THREE.Vector3();
    this.camera.getWorldDirection(d);
    return Math.asin(THREE.MathUtils.clamp(d.y, -1, 1));
  }

  /** A kamera vízszintes iránya radiánban (0 = −Z, pozitív = balra). */
  yaw() {
    const d = new THREE.Vector3();
    this.camera.getWorldDirection(d);
    return Math.atan2(-d.x, -d.z);
  }
}
