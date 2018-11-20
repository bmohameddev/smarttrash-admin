import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import { SharedModule } from '$/shared.module';
import { PipesModule } from '@theme/pipes/pipes.module';
import { UserComponent } from './user/user.component';
import { TrashComponent } from './trash/trash.component';
import { CityComponent } from './city/city.component';
import { CitiesComponent } from './cities/cities.component';
import { ExchangerComponent } from './exchanger/exchanger.component';
import { QuillModule } from 'ngx-quill';
import { UserGuard } from '$/guards/user.guard';

export const routes = [
	{
		path: 'user',
		component: UserComponent,
	},
	{
		path: 'trash',
		component: TrashComponent,
	},
	{
		path: 'city',
		component: CityComponent,
		canActivate: [UserGuard],
	},
	{
		path: 'city/:dateType',
		component: CityComponent,
		canActivate: [UserGuard],
	},
	{
		path: 'cities',
		component: CitiesComponent,
		canActivate: [UserGuard],
		data: { expectedRole: 'SUPER' },
	},
	{
		path: 'cities/:dateType',
		component: CitiesComponent,
		canActivate: [UserGuard],
		data: { expectedRole: 'SUPER' },
	},
	{
		path: 'exchanger',
		component: ExchangerComponent,
	},
];

@NgModule({
	imports: [
		CommonModule,
		HttpClientModule,
		RouterModule.forChild(routes),
		FormsModule,
		ReactiveFormsModule,
		NgxPaginationModule,
		QuillModule,
		SharedModule,
		PipesModule,
	],
	declarations: [UserComponent, TrashComponent, CityComponent, CitiesComponent, ExchangerComponent],
	entryComponents: [],
})
export class ReportModule {}
