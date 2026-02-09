import {Component, NgZone, OnInit, OnDestroy, ChangeDetectorRef} from '@angular/core';
import {SimulationComponent} from '../simulation/simulation.component';
import {FormsModule} from '@angular/forms';
import {TdbComponent} from '../tdb/tdb.component';
import {GoogleMapsLoaderService} from '../../services/google-maps-loader.service'

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
  imports: [SimulationComponent, FormsModule, TdbComponent],
  templateUrl: './demarrer.component.html',
  styleUrl: './demarrer.component.css',
})



export class DemarrerComponent implements  OnInit,OnDestroy {
  private googleMapsScriptLoaded = false;
  vitZoom:number= 0.80;
  FADE_MS = 1500;
  head = 0;
  vit = 10;
  pente:number=0;
  current = "A";
  active:any;
  next:any;
  isTransitioning = false;
  READY_GRACE_MS = 250;    // marge après "pano_changed" pour laisser apparaître des tuiles
  MAX_WAIT_MS = 4000;
  panoA:any;
  panoB:any;
  wstacx:WebSocket;
  wsarduino: WebSocket;
  distParcours:number=0;
  elevation: number=0;
  elevator!: google.maps.ElevationService;
  startPos =  {lat:50.456494,lng:4.238618} //rue de la portelette Morlanwez

  //{lat: 44.442500, lng: 4.413828};//Lagorce



  constructor(private zone: NgZone, private cdr: ChangeDetectorRef,private mapsService:GoogleMapsLoaderService) {
    this.wstacx = new WebSocket("ws://pi5.local/wstacxhtml");
    this.wstacx.onmessage = (e) => {
      console.log("infos reçues = "+e.data);
       let  infos=e.data.split(":");
      if(infos[0]=="v") {
        this.vit = parseFloat(infos[1]);
        console.log("réception vitesse : " + this.vit);

      }
      if(infos[0]=="p") {
        this.pente = parseFloat(infos[1]);
        console.log("réception pente: " + this.pente);

      }
      this.cdr.detectChanges();
    }

    this.wsarduino = new WebSocket("ws://pi5.local/wsarduinohtml");

    this.wsarduino.onmessage = (e) => {
      console.log("réception direction map:" + e.data);
       let rot = parseInt(e.data);
      this.active.setPov({
        heading: rot,
        pitch: 0,
      });
      this.next.setPov({
        heading: rot,
        pitch: 0,
      })
    };




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
    const apiKey = this.mapsService.apiKey;

    script.src =
   `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initializeStreetView`;


    script.onload = () => {
      console.log('Google Maps script chargé');
      this.googleMapsScriptLoaded = true;
      if (!this.elevator) {
        this.elevator = new google.maps.ElevationService();
      }
    };

    script.onerror = () => {
      console.error('Erreur de chargement Google Maps');
    };

    document.head.appendChild(script);
  }






  private initializeStreetView(): void {
    console.log('Initialisation Street View (Angular)');
    this.init();

    this.panoA = new (window as any).google.maps.StreetViewPanorama(
      document.getElementById('panoA') as HTMLElement,
      {
        position: this.startPos,
        pov: {heading: this.head, pitch: 0},
        zoom: 1,
      }
    );


    this.panoB = new (window as any).google.maps.StreetViewPanorama(
      document.getElementById('panoB') as HTMLElement,
      {
        position: this.startPos,
        pov: {heading: this.head, pitch: 0},
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

    this.startPos =  {lat:50.456494,lng:4.238618} //rue de la portelette Morlanwez

  }

  async chargerElevation() {
    this.elevator.getElevationForLocations({'locations': [this.next.getPosition()]}, (results, status) => {
      if (status === 'OK') {
         if (!(results) || results[0]) {
          if (results) {
            this.elevation=results[0].elevation;
            console.log("elevation = " + results[0].elevation);
            this.wstacx.send("h:"+this.elevation);
          }
            }
          }

   });
  }





    difference(pano:any, link:any) {
    var diff = Math.abs(pano.pov.heading % 360 - link.heading);
    if (diff > 180)
      diff = Math.abs(360 - diff);
    return diff;
  }

  async   avancer() {

    do {
      this.chargerElevation();
      console.log("ok0");
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

       // console.log("distance parcours="+this.distParcours);
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










