// demarrer.component.ts (version allégée côté Google Maps)
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { SimulationComponent } from '../simulation/simulation.component';
import { FormsModule } from '@angular/forms';
import { TdbComponent } from '../tdb/tdb.component';
import { ValeursService } from '../../services/valeurs.service';
import { NgIf } from '@angular/common';
import { StreetViewMapsService } from '../../services/StreetViewMapService.service';

async function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

@Component({
  selector: 'app-demarrer',
  standalone: true,
  imports: [SimulationComponent, FormsModule, TdbComponent, NgIf],
  templateUrl: './demarrer.component.html',
  styleUrl: './demarrer.component.css',
})
class DemarrerComponent implements OnInit, OnDestroy {

  vitZoom: number;
  FADE_MS: number;
  READY_GRACE_MS: number;
  MAX_WAIT_MS: number;

  head = 0;
  vit = 10;
  pente = 0;

  current = "A";
  active: any;
  next: any;
  isTransitioning = false;

  panoA: any;
  panoB: any;

  carte:any;

  wstacx: WebSocket;
  wsarduino: WebSocket;

  distParcours = 0;
  elevation = 0;
  startPos = { lat: 50.456494, lng: 4.238618 };

  oldelev = 0;
  deniv = 0;
  premelev = true;

  showChild = true;

  rot:number=0;

  constructor(
    private cdr: ChangeDetectorRef,
    private valeursService: ValeursService,
    private maps: StreetViewMapsService
  ) {
    this.vitZoom = valeursService.vitZoom;
    this.FADE_MS = valeursService.FADE_MS;
    this.READY_GRACE_MS = valeursService.READY_GRACE_MS;
    this.MAX_WAIT_MS = valeursService.MAX_WAIT_MS;
    this.startPos = valeursService.startPos;



    this.wstacx = new WebSocket("ws://pi5.local/wstacxhtml");
    this.wstacx.onmessage = (e) => {
      const infos = e.data.split(":");
      if (infos[0] === "v") this.vit = parseFloat(infos[1]);
      if (infos[0] === "p") this.pente = parseFloat(infos[1]);
      this.cdr.detectChanges();
    };

    this.wsarduino = new WebSocket("ws://pi5.local/wsarduinohtml");
    this.wsarduino.onmessage = (e) => {
      this.rot = parseInt(e.data, 10);
      this.active?.setPov({ heading: this.rot, pitch: 0 });
      this.next?.setPov({ heading: this.rot, pitch: 0 });
      this.carte?.setHeading(this.rot);
     };
  }

  async ngOnInit(): Promise<void> {
    // 1) charge Google Maps via service
    await this.maps.load(this.valeursService.apiKey);

    // 2) crée les panoramas via service
    this.setFadeDuration(this.FADE_MS);
    this.panoA = this.maps.createPanorama(
      document.getElementById('panoA') as HTMLElement,
      this.startPos,
      this.head
    );
    this.panoB = this.maps.createPanorama(
      document.getElementById('panoB') as HTMLElement,
      this.startPos,
      this.head
    );
    this.carte = this.maps.createMap(
      document.getElementById('carte') as HTMLElement,
      {
        center: this.startPos,
        zoom: 22,
        tilt: 47.5,
        mapTypeId: 'satellite',
        heading: this.rot,
        mapId: '90f87356969d889c',
      }
    );
  }



  ngOnDestroy(): void {
    this.maps.cleanupGlobalCallback();
  }

  toggleChild() {
    this.showChild = !this.showChild;
  }

  setFadeDuration(ms: any) {
    (document.getElementById("panoA") as HTMLElement).style.transition = `opacity ${ms}ms ease`;
    (document.getElementById("panoB") as HTMLElement).style.transition = `opacity ${ms}ms ease`;
  }


  async chargerElevation() {
    try {
      const elev = await this.maps.getElevationAt(this.next.getPosition());
      if (this.premelev) {
        this.oldelev = elev;
        this.premelev = false;
      }

      this.elevation = elev;
      const delta = this.elevation - this.oldelev;
      if (delta > 0) this.deniv += delta;
      this.oldelev = this.elevation;

      this.wstacx.send("h:" + this.elevation + ":" + this.distParcours);
    } catch (e) {
      console.error('Elevation error', e);
    }
  }


  waitForNextPanoReady(pano: any, expectedPanoId: any) {
    return new Promise(async (resolve) => {
      const start = performance.now();
      if (pano.getPano && pano.getPano() === expectedPanoId) {
        await sleep(this.READY_GRACE_MS);
        resolve(true);
        return;
      }

      const listener = pano.addListener("pano_changed", async () => {
        if (pano.getPano && pano.getPano() === expectedPanoId) {
          listener.remove();
          await sleep(this.READY_GRACE_MS);
          resolve(true);
        }
      });

      while (performance.now() - start < this.MAX_WAIT_MS) {
        if (pano.getPano && pano.getPano() === expectedPanoId) {
          listener.remove();
          await sleep(this.READY_GRACE_MS);
          resolve(true);
          return;
        }
        await sleep(100);
      }

      try { listener.remove(); } catch {}
      resolve(false);
    });
  }

  crossfade(toShowId: any, toHideId: any) {
    (document.getElementById(toShowId) as HTMLElement).style.opacity = "1";
    (document.getElementById(toHideId) as HTMLElement).style.opacity = "0";
  }

  difference(pano: any, link: any) {
    let diff = Math.abs(pano.pov.heading % 360 - link.heading);
    if (diff > 180) diff = Math.abs(360 - diff);
    return diff;
  }



  recentrerCarteSurPanoActif() {
    if (!this.carte || !this.active) return;

    const position = this.active.getPosition();
    this.carte.setCenter(position);
  }



  // ... garder avancer(), calculDistance(), zoomOut() comme avant, en appelant this.chargerElevation()
  async   avancer() {

    do {

      this.recentrerCarteSurPanoActif();
      this.chargerElevation();
      console.log("ok0");
      console.log("boucle avancer , distparcours = "+ this.distParcours);
      this.distParcours=Math.round(this.distParcours);
      this.cdr.detectChanges();
      if (this.isTransitioning) return;
      this.isTransitioning = true;

      this.active = (this.current === "A") ? this.panoA : this.panoB;
      this.next = (this.current === "A") ? this.panoB : this.panoA;

      const links = this.active.getLinks();
      if (!links || links.length === 0) {
        this.isTransitioning = false;
        return;
      }
      console.log(" nbre liens = " + this.active.getLinks().length);
      console.log(" heading active= " + this.active.pov.heading);
      let curr = this.active.links[0];
      let differ = this.difference(this.active, curr);
      console.log("differ 0 = " + differ);
      for (let i = 1; i < this.active.getLinks().length; i++) {
        differ = this.difference(this.active, this.active.links[i]);

        console.log("differ " + i + " = " + differ);
        if (this.difference(this.active, curr) > this.difference(this.active, this.active.links[i])) {
          curr = this.active.links[i];
          console.log("ok =" + i);
        }
      }

      const target :any = curr;

      // Aligne POV pour que le fondu paraisse “continu”
      const pov = this.active.getPov();
      this.head=pov.heading;
      console.log("head = " + this.head);
      this.next.setPov({heading: this.head, pitch: pov.pitch});
      this.next.setZoom(1);

      // Précharge le pano suivant (EN RESTANT INVISIBLE)
      this.next.setPano(target.pano);
      let dist = this.calculDistance(this.active,this.next);
      await this.zoomOut(this.active,dist);

      // Attendre qu’il soit “prêt” (au moins un pano_changed + petite marge)
      await this.waitForNextPanoReady(this.next, target.pano);
      // Crossfade SANS NOIR : A reste visible pendant que B monte
      if (this.current === "A") {
        this.crossfade("panoB", "panoA");
        this.current = "B";
      } else {
        this.crossfade("panoA", "panoB");
        this.current = "A";
      }

      // Bloque les clics pendant la transition
      await sleep(this.FADE_MS);
      this.isTransitioning = false;
    } while (true);
  }


  calculDistance(pa:any,pb:any) : number{

    const R = 6371000.0;
    const oldlatr =  pa.getPosition().lat() * Math.PI / 180;
    const oldlongr = pa.getPosition().lng() * Math.PI / 180;
    const latr = pb.getPosition().lat() * Math.PI / 180;
    const longr = pb.getPosition().lng() * Math.PI / 180;

    return R * Math.acos(Math.cos(oldlatr) * Math.cos(latr) *
      Math.cos(longr - oldlongr) + Math.sin(oldlatr) *
      Math.sin(latr));

  }

  async   zoomOut( pano :any,dist:number) {

    let zoomact=1;
    let dtot=0;
    return new Promise<void>(resolve => {
      let startzoom = performance.now();
      const step = (now: any) => {
        // @ts-ignore
        let deltaDist=(now - startzoom)*this.vit/3600 ;
        dtot = dtot+deltaDist;
        this.distParcours+=deltaDist;
        console.log("distance parcours="+this.distParcours);
        zoomact= 1+ dtot/dist * this.vitZoom;
        // @ts-ignore
        pano.setZoom(zoomact); // zoom vers 3
        startzoom = now;
        if (dtot< dist) requestAnimationFrame(step);
        else resolve();
      }
      requestAnimationFrame(step);
    });
  }
}

export default DemarrerComponent





