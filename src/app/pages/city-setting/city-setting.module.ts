import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '$/shared.module';
import { CitySettingComponent } from './city-setting.component';

export const routes = [
    { path: '', component: CitySettingComponent, pathMatch: 'full' }
];

@NgModule({
    imports: [
        CommonModule,
        HttpClientModule,
        RouterModule.forChild(routes),
        FormsModule,
        ReactiveFormsModule,
        SharedModule
    ],
    declarations: [
        CitySettingComponent
    ]
})
export class CitySettingModule { }