import {StreetViewMapsService} from '../../services/StreetViewMapService.service';
import {ValeursService} from '../../services/valeurs.service';

export class Coordonnees {
  constructor(
    public lat: number,
    public lng: number
  ) {
  }


  toString(): string {
    return `${this.lat}, ${this.lng}`;
  }

  public distance(crd: Coordonnees): number {


    const R = 6371000.0;
    const oldlatr =  this.lat* Math.PI / 180;
    const oldlongr = this.lng * Math.PI / 180;
    const latr = crd.lat * Math.PI / 180;
    const longr = crd.lng * Math.PI / 180;

    return R * Math.acos(Math.cos(oldlatr) * Math.cos(latr) *
      Math.cos(longr - oldlongr) + Math.sin(oldlatr) *
      Math.sin(latr));

  }


  public destination(bearing: number, distance: number) {

    // Convertir l'orientation en radians
    const bearingRad: number = bearing * (Math.PI / 180);
    const latRad: number = this.lat * (Math.PI / 180);

    // Calcul de la nouvelle latitude et longitude
    const newLat = this.lat + (distance * Math.cos(bearingRad)) / 111320;

    const newLon = this.lng + (distance * Math.sin(bearingRad)) / (111320 * Math.cos(latRad));
    console.log("destination = "+new Coordonnees(newLat, newLon));
    return new Coordonnees(newLat, newLon);
  }
}

export class Carte {

  carte:any;
  centre:Coordonnees;
  constructor(centre: Coordonnees, public rot: number, public maps: StreetViewMapsService) {

   this.centre=new Coordonnees(centre.lat,centre.lng);
    this.carte = this.maps.createMap(
      document.getElementById('carte') as HTMLElement,
      {
        center: this.centre,
        zoom: 22,
        tilt: 47.5,
        mapTypeId: 'satellite',
        heading: this.rot,
        mapId: '90f87356969d889c',
      }
    );
  }

  moveCenter() {
    let distance:number=10;
    this.centre = this.centre.destination(this.rot, distance);
    this.carte.setCenter({lat:this.centre.lat,lng:this.centre.lng});
  }

  setHeading(rot:number){
    this.rot=rot;
    this.carte.setHeading(this.rot);
  }

  setCenter(centre:any){
    this.centre=new Coordonnees(centre.lat(),centre.lng());
    this.carte.setCenter(centre);
  }

}

export class Panos{
  public panoA:any;
  public panoB:any;
  public active:any;
  public next:any;
  private FADE_MS:number;
  private READY_GRACE_MS:number;
  private MAX_WAIT_MS:number;
  private current="A";
  private isTransitioning = false;
  private head = 0;
  private vitZoom:number;
  public distParcours=0;
  constructor(private maps: StreetViewMapsService,private startPos:Coordonnees,private rot:number,private valeursService:ValeursService) {

    this.panoA=this.maps.createPanorama(
      document.getElementById('panoA') as HTMLElement,
      this.startPos,
      this.rot
    );
    this.panoB=this.maps.createPanorama(
      document.getElementById('panoB') as HTMLElement,
      this.startPos,
      this.rot
    );
    this.active=this.panoA;
    this.next=this.panoB;
    this.FADE_MS = valeursService.FADE_MS;
    this.READY_GRACE_MS=valeursService.READY_GRACE_MS;
    this.MAX_WAIT_MS=valeursService.MAX_WAIT_MS;
    this.vitZoom=valeursService.vitZoom;
    this.setFadeDuration(this.FADE_MS);
  }

  setFadeDuration(ms: any) {
    (document.getElementById("panoA") as HTMLElement).style.transition = `opacity ${ms}ms ease`;
    (document.getElementById("panoB") as HTMLElement).style.transition = `opacity ${ms}ms ease`;
  }

  public getPosition():Coordonnees {
    return this.active.getPosition();
  }

  public getNextPosition():Coordonnees {
    return this.next.getPosition();
  }



  public setPov(nrot:number) : void {
    this.rot=nrot;
    this.panoA?.setPov({ heading: this.rot, pitch: 0 });
    this.panoB?.setPov({ heading: this.rot, pitch: 0 });
  }


  waitForNextPanoReady(pano: any, expectedPanoId: any) {
    return new Promise(async (resolve) => {
      const start = performance.now();
      if (pano.getPano && pano.getPano() === expectedPanoId) {
        await this.sleep(this.READY_GRACE_MS);
        resolve(true);
        return;
      }

      const listener = pano.addListener("pano_changed", async () => {
        if (pano.getPano && pano.getPano() === expectedPanoId) {
          listener.remove();
          await this.sleep(this.READY_GRACE_MS);
          resolve(true);
        }
      });

      while (performance.now() - start < this.MAX_WAIT_MS) {
        if (pano.getPano && pano.getPano() === expectedPanoId) {
          listener.remove();
          await this.sleep(this.READY_GRACE_MS);
          resolve(true);
          return;
        }
        await this.sleep(100);
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

  public swap():void{
    this.active = (this.current === "A") ? this.panoA : this.panoB;
    this.next = (this.current === "A") ? this.panoB : this.panoA;
  }


  public async avancer(){
    const links = this.active.getLinks();
    if (!links || links.length === 0) {
      this.isTransitioning = false;
      return;
    }
    let curr = this.active.links[0];
    let differ = this.difference(this.active, curr);
    for (let i = 1; i < this.active.getLinks().length; i++) {
      differ = this.difference(this.active, this.active.links[i]);
      if (this.difference(this.active, curr) > this.difference(this.active, this.active.links[i])) {
        curr = this.active.links[i];
       }
    }

    const target :any = curr;

    // Aligne POV pour que le fondu paraisse “continu”
    const pov = this.active.getPov();
    this.head=pov.heading;
    this.next.setPov({heading: this.head, pitch: pov.pitch});
    this.next.setZoom(1);

    // Précharge le pano suivant (EN RESTANT INVISIBLE)
    this.next.setPano(target.pano);
    const crdAct = new Coordonnees(this.active.getPosition().lat(),this.active.getPosition().lng());
    const crdNext = new Coordonnees(this.next.getPosition().lat(),this.next.getPosition().lng());
    let dist=crdAct.distance(crdNext);
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
    this.sleep(this.FADE_MS);
    this.isTransitioning = false;
  }

  async sleep(ms: number) {
    return new Promise(r => setTimeout(r, ms));
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
        //console.log("distance parcours="+this.distParcours);
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
