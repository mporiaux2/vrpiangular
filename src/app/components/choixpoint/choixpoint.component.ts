import {ChangeDetectorRef, Component} from '@angular/core';
import {ValeursService} from '../../services/valeurs.service';
import {StreetViewMapsService} from '../../services/StreetViewMapService.service';

@Component({
  selector: 'app-choixpoint',
  imports: [],
  templateUrl: './choixpoint.component.html',
  styleUrl: './choixpoint.component.css',
})
export class ChoixpointComponent {
  carte:any;
  protected latitude: number=0;
  protected longitude: number=0;

  constructor(
    private cdr: ChangeDetectorRef,
    private valeursService: ValeursService,
    private maps: StreetViewMapsService
  ){}

  async ngOnInit(): Promise<void> {
    await this.maps.load(this.valeursService.apiKey);
    this.carte = this.maps.createMap(
      document.getElementById('carte') as HTMLElement,
      {
        center: this.valeursService.startPos,
        zoom: 8,
      }
    );
    this.latitude=this.valeursService.startPos.lat;
    this.longitude=this.valeursService.startPos.lng;

    this.cdr.detectChanges();


    // Add click event listener on the map
    google.maps.event.addListener(this.carte, 'click', (event: { latLng: { lat: () => any; lng: () => any; }; }) => {
      // Get the coordinates of the click event


      var lat = event.latLng.lat();
      this.latitude= parseFloat(lat.toFixed(6));
      var lng = event.latLng.lng();
      this.longitude = parseFloat(lng.toFixed(6));
      this.cdr.detectChanges();
      this.valeursService.startPos.lat=this.latitude;
      this.valeursService.startPos.lng=this.longitude;

    });


  }
}
