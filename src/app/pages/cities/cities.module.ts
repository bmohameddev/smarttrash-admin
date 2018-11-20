import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import { SharedModule } from '$/shared.module';
import { PipesModule } from '@theme/pipes/pipes.module';
import { AddCityComponent } from './add-city/add-city.component';
import { ListCityComponent } from './list-city/list-city.component';
import { DetailCityComponent } from './detail-city/detail-city.component';

export const routes = [
    {
        path: '',
        component: ListCityComponent
    },
    {
        path: 'detail/:id',
        component: DetailCityComponent
    },
    {
        path: '**',
        redirectTo: ''
    }
];

@NgModule({
    imports: [
        CommonModule,
        HttpClientModule,
        RouterModule.forChild(routes),
        FormsModule,
        ReactiveFormsModule,
        NgxPaginationModule,
        SharedModule,
        PipesModule
    ],
    declarations: [
        AddCityComponent,
        ListCityComponent,
        DetailCityComponent
    ],
    entryComponents: [
        AddCityComponent
    ]
})
export class CitiesModule { }
