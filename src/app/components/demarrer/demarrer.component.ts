import { Component, NgZone, OnInit, OnDestroy } from '@angular/core';
import {SimulationComponent} from '../simulation/simulation.component';
import {FormsModule} from '@angular/forms';


declare global {
  interface Window {
    initializeStreetView: () => void;
  }
}


async function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}


@Component({
  selector: 'app-demarrer',
  standalone:true,
  imports: [SimulationComponent, FormsModule],
  templateUrl: './demarrer.component.html',
  styleUrl: './demarrer.component.css',
})



export class DemarrerComponent implements  OnInit,OnDestroy {
  private googleMapsScriptLoaded = false;
  vitZoom:number= 2;
  FADE_MS = 1500;
  head = 30;
  vit = 10;
  current = "A";
  curr: string="A";
  isTransitioning = false;
  READY_GRACE_MS = 250;    // marge après "pano_changed" pour laisser apparaître des tuiles
  MAX_WAIT_MS = 4000;
  panoA:any;
  panoB:any;
  wstacx:WebSocket | undefined;
  wsarduino: WebSocket | undefined;

  zoomact:number=1;

  startzoom: number | undefined=0;

  adist: number =0;

  dtot:number=0;

  dist:number=0;
  rot:number=0;

  active:any;
  next:any;


  constructor(private zone: NgZone) {
  }

  ngOnInit(): void {
    // Exposer la fonction callback pour Google
    window.initializeStreetView = () => {
      this.zone.run(() => this.initializeStreetView());
    };

    this.loadGoogleMapsScript();
    this.setFadeDuration(this.FADE_MS);
    this.wstacx = new WebSocket("ws://pi5.local/wstacxhtml");
//wstacx.onopen = () => wstacx.send("activation de wstacxhtml");
    this.wstacx.onmessage = (e) => {
      console.log("réception vitesse : " + e.data);
      this.vit = parseFloat(e.data);
    }

    this.wsarduino = new WebSocket("ws://pi5.local/wsarduinohtml");
//wsarduino.onopen = () => wsarduino.send("activation de wsarduinohtml");
    this.wsarduino.onmessage = (e) => {
      console.log("réception direction :" + e.data);
      let direction: number = parseInt(e.data);
      switch (direction) {
        case 0 :

          break;
        case 1 :
          this.rot -= 3;
          this.rotate();
          break;
        case 2 :
          this.rot += 3;
          this.rotate();
          break;
      }
    }


  }
  rotate() {
    this.active.setPov({
        heading: this.rot,
        pitch: 0,
      });
    this.next.setPov({
      heading:this.rot,
      pitch:0,
    })
  }

  ngOnDestroy(): void {
    // Optionnel : cleanup
    delete (window as any).initializeStreetView;
  }

  private loadGoogleMapsScript(): void {
    if (this.googleMapsScriptLoaded) {
      return;
    }

    const script = document.createElement('script');
    script.async = true;
    script.defer = true;

    //  Mets ta vraie clé ici
    const apiKey = 'AIzaSyDPLZsTh4cya1n_CshNgzsH4OmKDLWK8xQ';

    script.src =
      `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initializeStreetView`;

    script.onload = () => {
      console.log('Google Maps script chargé');
      this.googleMapsScriptLoaded = true;
    };

    script.onerror = () => {
      console.error('Erreur de chargement Google Maps');
    };

    document.head.appendChild(script);
  }

  // ----- CALLBACK ANGULAR -----





  private initializeStreetView(): void {
    console.log('Initialisation Street View (Angular)');


    this.panoA = new (window as any).google.maps.StreetViewPanorama(
      document.getElementById('panoA') as HTMLElement,
      {
        position: {lat: 44.442500, lng: 4.413828}, // lagorce
        pov: {heading: 30, pitch: 0},
        zoom: 1,
      }
    );


    this.panoB = new (window as any).google.maps.StreetViewPanorama(
      document.getElementById('panoB') as HTMLElement,
      {
        position: {lat: 44.442500, lng: 4.413828}, // lagorce
        pov: {heading: 30, pitch: 0},
        zoom: 1,
      }
    );
  }




  setFadeDuration(ms: any) {
    // @ts-ignore
    document.getElementById("panoA").style.transition = `opacity ${ms}ms ease`;
    // @ts-ignore
    document.getElementById("panoB").style.transition = `opacity ${ms}ms ease`;
  }

   waitForNextPanoReady(pano: { getPano: () => any; addListener: (arg0: string, arg1: () => Promise<void>) => any; }, expectedPanoId: any) {
    return new Promise(async (resolve) => {
      const start = performance.now();

      // Si le pano est déjà le bon, on sort vite
      if (pano.getPano && pano.getPano() === expectedPanoId) {
        await sleep(this.READY_GRACE_MS);
        resolve(true);
        return;
      }

      const listener = pano.addListener("pano_changed", async () => {
        // Vérifie qu'on est bien sur le pano attendu
        if (pano.getPano && pano.getPano() === expectedPanoId) {
          listener.remove();
          await sleep(this.READY_GRACE_MS); // laisse le temps d’afficher des tuiles
          resolve(true);
        }
      });

      // timeout de sécurité
      await (async () => {
        while (performance.now() - start < this.MAX_WAIT_MS) {
          if (pano.getPano && pano.getPano() === expectedPanoId) {
            listener.remove();
            await sleep(this.READY_GRACE_MS);
            resolve(true);
            return;
          }
          await sleep(100);
        }
        // Au pire on tente quand même (mais ça peut re-clignoter si réseau lent)
        try {
          listener.remove();
        } catch (e) {
        }
        resolve(false);
      })();
    });
  }

   crossfade(toShowId:any, toHideId:any) {
    // @ts-ignore
     document.getElementById(toShowId).style.opacity = "1";
    // @ts-ignore
     document.getElementById(toHideId).style.opacity = "0";
  }

  init() {
    this.setFadeDuration(this.FADE_MS);

    const startPos = {lat: 44.442500, lng: 4.413828};//lagorce

  }
    difference(pano:any, link:any) {
    var diff = Math.abs(pano.pov.heading % 360 - link.heading);
    if (diff > 180)
      diff = Math.abs(360 - diff);
    return diff;
  }

  async   avancer() {

    do {
      console.log("ok0");
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
      this.curr = this.active.links[0];
      let differ = this.difference(this.active, this.curr);
      console.log("differ 0 = " + differ);
      for (let i = 1; i < this.active.getLinks().length; i++) {
        differ = this.difference(this.active, this.active.links[i]);

        console.log("differ " + i + " = " + differ);
        if (this.difference(this.active, this.curr) > this.difference(this.active, this.active.links[i])) {
          this.curr = this.active.links[i];
          console.log("ok =" + i);
        }
      }

      const target :any = this.curr;

      // Aligne POV pour que le fondu paraisse “continu”
      const pov = this.active.getPov();
      this.head=pov.heading;
      //next.setPov({ heading: target.heading, pitch: pov.pitch });
      console.log("head = " + this.head);
      this.next.setPov({heading: this.head, pitch: pov.pitch});
      //next.setZoom(active.getZoom());
      this.next.setZoom(1);

      // Précharge le pano suivant (EN RESTANT INVISIBLE)
      this.next.setPano(target.pano);
     // let lapsTemps = 10 / this.vit * 3600;
     // await this.zoomOut(lapsTemps, active);

      const R = 6371000.0;
      const oldlatr =  this.active.getPosition().lat() * Math.PI / 180;
      const oldlongr = this.active.getPosition().lng() * Math.PI / 180;
      const latr = this.next.getPosition().lat() * Math.PI / 180;
      const longr = this.next.getPosition().lng() * Math.PI / 180;

      this.dist = R * Math.acos(Math.cos(oldlatr) * Math.cos(latr) *
        Math.cos(longr - oldlongr) + Math.sin(oldlatr) *
        Math.sin(latr));

      console.log("oldatr="+oldlatr+"oldlongr="+oldlongr+"latr="+latr+"longr="+longr+"distance = "+this.dist);
      await this.zoomOut(this.active);

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


 async   zoomOut( pano :any) {

    this.zoomact=1;
    this.adist=0;
    this.dtot=0;
    console.log("distance = "+this.dist);
    return new Promise<void>(resolve => {
      this.startzoom = performance.now();

      const step = (now: any) => {
        let msg="adist :"+this.adist;
        msg+="startzoom :"+this.startzoom;
        msg+="now ="+now;
        msg+="vitesse :"+this.vit;
        let lapsTemps = (this.dist -this.adist) / this.vit * 3600;
        msg+="lapsTemps :"+lapsTemps;
        // @ts-ignore
         this.dtot = this.dtot+(now - this.startzoom) / lapsTemps;
        msg+="dtot :"+this.dtot;
        this.zoomact= 1+ this.adist/this.dist * this.vitZoom;
        msg+="zoomact :"+this.zoomact;
        console.log(msg);
        // @ts-ignore

        this.adist=this.adist+(now-this.startzoom)*this.vit/3600;
        console.log("adist :"+this.adist);
        pano.setZoom(this.zoomact); // zoom vers 3
        this.startzoom = now;
        if (this.adist< this.dist) requestAnimationFrame(step);
        else resolve();
      }

      requestAnimationFrame(step);
    });
  }

  /*
 async   zoomOut(pano :any) {
    let duration =  10 / this.vit * 3600;
    console.log("duration = "+duration);
    return new Promise<void>(resolve => {
      const start = performance.now();

      const step = (now: any) => {
        const dtot = Math.min((now - start) / duration, 1);
        console.log(("vitzoom = "+this.vitZoom+" dtot ="+dtot));
        this.zoomact=1+dtot * this.vitZoom;
        pano.setZoom(this.zoomact); // zoom vers 3

        if (dtot < 1) requestAnimationFrame(step);
        else resolve();
      }

      requestAnimationFrame(step);
    });
  }*/
}










