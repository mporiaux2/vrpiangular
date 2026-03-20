// demarrer.component.ts (version allégée côté Google Maps)



import { Component, OnInit, OnDestroy, ChangeDetectorRef ,ElementRef,ViewChild} from '@angular/core';
import { SimulationComponent } from '../simulation/simulation.component';
import { FormsModule } from '@angular/forms';
import { TdbComponent } from '../tdb/tdb.component';
import { ValeursService } from '../../services/valeurs.service';
import { NgIf } from '@angular/common';
import { StreetViewMapsService } from '../../services/StreetViewMapService.service';
import {Carte, Coordonnees} from './carte';

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


  @ViewChild('carteDiv', { static: true }) carteDiv!: ElementRef<HTMLElement>;
  @ViewChild('leftCarteSlot', { static: true }) leftCarteSlot!: ElementRef<HTMLElement>;
  @ViewChild('wrapCarteSlot', { static: true }) wrapCarteSlot!: ElementRef<HTMLElement>;

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

  //carte:any;

  carte:Carte|null=null;
  wstacx: WebSocket;
  wsarduino: WebSocket;

  distParcours = 0;
  elevation = 0;
  startPos=new Coordonnees( 50.456494, 4.238618 );

  oldelev = 0;
  deniv = 0;
  premelev = true;

  showChild = true;

  rot:number=0;

  carteDansWrap = false;

  // ... le reste de ton code


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
      console.log("data reçue de arduino ",e.data);
      if(isNaN(e.data)){
        console.log("message reçu de arduino : "+e.data);

      }
      else {
        this.rot = parseInt(e.data, 10);
        if(!isNaN(this.rot)){
          this.active?.setPov({ heading: this.rot, pitch: 0 });
          this.next?.setPov({ heading: this.rot, pitch: 0 });
          this.carte?.setHeading(this.rot);
          console.log("heading de la carte = "+this.rot);
        }
      };
    }
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
    this.carte=new Carte(this.startPos,this.rot,this.maps);
/*    this.carte = this.maps.createMap(
      document.getElementById('carte') as HTMLElement,
      {
        center: this.startPos,
        zoom: 22,
        tilt: 47.5,
        mapTypeId: 'satellite',
        heading: this.head,
        mapId: '90f87356969d889c',
      }
    );*/
  }


  toggleCartePosition() {
    const carteEl = this.carteDiv.nativeElement;

    if (!this.carteDansWrap) {
      // Mettre la carte dans le wrap, dans le slot prévu (au-dessus des panos)
      this.wrapCarteSlot.nativeElement.appendChild(carteEl);
    } else {
      // Remettre la carte à gauche
      this.leftCarteSlot.nativeElement.appendChild(carteEl);

      this.panoA = this.maps.createPanorama(
        document.getElementById('panoA') as HTMLElement,
        this.startPos,
        this.rot
      );
      this.panoB = this.maps.createPanorama(
        document.getElementById('panoB') as HTMLElement,
        this.startPos,
        this.rot
      );

    }

    this.carteDansWrap = !this.carteDansWrap;

    // IMPORTANT : refresh Google Maps après changement de taille/parent DOM
    setTimeout(() => {
      try {
        // @ts-ignore (si google n'est pas typé)
        google.maps.event.trigger(this.carte, 'resize');

        const center = this.active?.getPosition?.() || this.startPos;
        this.carte?.setCenter?.(center);
      } catch (e) {
        // pas bloquant si l'API n'est pas encore prête
      }
    }, 400);
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
      const elev = await this.maps.getElevationAt(this.carteDansWrap?this.startPos:this.next.getPosition());
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


    if(this.carteDansWrap){
      this.carte.moveCenter();
      this.startPos=this.carte.centre;
    }
    else {
      this.startPos=this.active.getPosition();
      this.carte.setCenter(this.startPos);
    }

    //this.startPos =  this.carteDansWrap ? this.calculateDestination(center.lat(), center.lng(), bearing, 10): this.active.getPosition();

    this.valeursService.startPos=this.startPos;
  }



  // ... garder avancer(), calculDistance(), zoomOut() comme avant, en appelant this.chargerElevation()
  async   avancer(){
    do {
      this.recentrerCarteSurPanoActif();
      this.chargerElevation();
      this.distParcours=Math.round(this.distParcours);
      this.cdr.detectChanges();
      if(this.carteDansWrap) {
        await sleep(36000/this.vit);
        this.distParcours+=10;
        continue;
      }
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
    const crda=new Coordonnees(pa.getPosition().lat(),pa.getPosition().lng());
    const crdb=new Coordonnees(pb.getPosition().lat(),pb.getPosition().lng());

    return crda.distance(crdb);

   /*const R = 6371000.0;
    const oldlatr =  pa.getPosition().lat() * Math.PI / 180;
    const oldlongr = pa.getPosition().lng() * Math.PI / 180;
    const latr = pb.getPosition().lat() * Math.PI / 180;
    const longr = pb.getPosition().lng() * Math.PI / 180;

    return R * Math.acos(Math.cos(oldlatr) * Math.cos(latr) *
      Math.cos(longr - oldlongr) + Math.sin(oldlatr) *
      Math.sin(latr));*/

  }


  calculateDestination(lat:number, lon:number, bearing:number, distance:number) {
     let crd=new Coordonnees(lat,lon);
     return crd.destination(bearing,distance);
    // Convertir l'orientation en radians
/*    const bearingRad :number=   bearing * (Math.PI / 180);
    const latRad : number  = lat * (Math.PI / 180);

    // Calcul de la nouvelle latitude et longitude
    const newLat = lat + (distance * Math.cos(bearingRad)) / 111320;

    const newLon = lon + (distance * Math.sin(bearingRad)) / (111320 * Math.cos(latRad));
    console.log("lat calculée  bis=  "+newLat);
    return {
      lat: newLat,
      lng: newLon,
    };*/
  }


  async   zoomOut( pano :any,dist:number) {
   console.log("appel de zoomout");
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
        console.log("zoomact = "+zoomact);
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












