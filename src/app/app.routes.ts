import {AdminComponent} from './components/admin/admin.component';
import {CycloComponent} from './components/cyclo/cyclo.component';
import {HomeComponent} from './components/home/home.component';
import {GestionparcoursComponent} from './components/gestionparcours/gestionparcours.component';
import {GestionpointsComponent} from './components/gestionpoints/gestionpoints.component';
import {SimulationComponent} from './components/simulation/simulation.component';
import {ReelComponent} from './components/reel/reel.component';
import {ChoixparcoursComponent} from './components/choixparcours/choixparcours.component';
import {ChoixpointComponent} from './components/choixpoint/choixpoint.component';
import {DemarrerComponent} from './components/demarrer/demarrer.component';
import {Routes} from '@angular/router';

export const routes: Routes = [
  {path: 'admin', component: AdminComponent},
  {path: 'cyclo', component: CycloComponent},
  {path: '', component: HomeComponent},
  {path: 'gestionparcours', component:GestionparcoursComponent},
  {path: 'gestionpoints', component:GestionpointsComponent},
  {path: 'simulation', component:SimulationComponent},
  {path: 'reel', component:ReelComponent},
  {path: 'choixparcours', component:ChoixparcoursComponent},
  {path: 'choixpoint', component:ChoixpointComponent},
  {path: 'demarrer', component:DemarrerComponent},

];
