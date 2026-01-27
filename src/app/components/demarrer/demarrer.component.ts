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
  vitZoom:number= 0.90;
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

  constructor(private zone: NgZone) {
  }

  ngOnInit(): void {
    // Exposer la fonction callback pour Google
    window.initializeStreetView = () => {
      this.zone.run(() => this.initializeStreetView());
    };

    this.loadGoogleMapsScript();
    this.setFadeDuration(this.FADE_MS);

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

    const panorama = new (window as any).google.maps.StreetViewPanorama(
      document.getElementById('streetview') as HTMLElement,
      {
        position: {lat: 50.8503, lng: 4.3517}, // Bruxelles par ex
        pov: {heading: 165, pitch: 0},
        zoom: 1,
      }
    );

    this.panoA = new (window as any).google.maps.StreetViewPanorama(
      document.getElementById('panoA') as HTMLElement,
      {
        position: {lat: 50.8503, lng: 4.3517}, // Bruxelles par ex
        pov: {heading: 165, pitch: 0},
        zoom: 1,
      }
    );


    this.panoB = new (window as any).google.maps.StreetViewPanorama(
      document.getElementById('panoB') as HTMLElement,
      {
        position: {lat: 50.8503, lng: 4.3517}, // Bruxelles par ex
        pov: {heading: 165, pitch: 0},
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
    let curr;
    do {
      console.log("ok0");
      if (this.isTransitioning) return;
      this.isTransitioning = true;

      const active = (this.current === "A") ? this.panoA : this.panoB;
      const next = (this.current === "A") ? this.panoB : this.panoA;

      const links = active.getLinks();
      if (!links || links.length === 0) {
        this.isTransitioning = false;
        return;
      }
      console.log(" nbre liens = " + active.getLinks().length);
      console.log(" heading active= " + active.pov.heading);
      this.curr = active.links[0];
      let differ = this.difference(active, this.curr);
      console.log("differ 0 = " + differ);
      for (let i = 1; i < active.getLinks().length; i++) {
        differ = this.difference(active, active.links[i]);

        console.log("differ " + i + " = " + differ);
        if (this.difference(active, this.curr) > this.difference(active, active.links[i])) {
          curr = active.links[i];
          console.log("ok =" + i);
        }
      }

      const target :any = this.curr;

      // Aligne POV pour que le fondu paraisse “continu”
      const pov = active.getPov();
      //next.setPov({ heading: target.heading, pitch: pov.pitch });
      console.log("head = " + this.head);
      next.setPov({heading: this.head, pitch: pov.pitch});
      //next.setZoom(active.getZoom());
      next.setZoom(1);

      // Précharge le pano suivant (EN RESTANT INVISIBLE)
      next.setPano(target.pano);
      let lapsTemps = 10 / this.vit * 3600;
      await this.zoomOut(lapsTemps, active);

      // Attendre qu’il soit “prêt” (au moins un pano_changed + petite marge)
      await this.waitForNextPanoReady(next, target.pano);
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


  async   zoomOut(duration = 2000, pano :any) {

    return new Promise<void>(resolve => {
      const start = performance.now();

      const step = (now: any) => {
        const progress = Math.min((now - start) / duration, 1);
        pano.setZoom(1 + progress * this.vitZoom); // zoom vers 3

        if (progress < 1) requestAnimationFrame(step);
        else resolve();
      }

      requestAnimationFrame(step);
    });
  }
}










