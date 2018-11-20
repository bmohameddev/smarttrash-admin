import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SharedModule } from '$/shared.module';
import { BaiduMapsComponent } from './baidu-maps/baidu-maps.component';

export const routes = [
  { path: '', redirectTo: 'baidumaps', pathMatch: 'full'},
  { path: 'baidumaps', component: BaiduMapsComponent },
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    SharedModule
  ],
  declarations: [
    BaiduMapsComponent
  ]
})
export class MapsModule { }