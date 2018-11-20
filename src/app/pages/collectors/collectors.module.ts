import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import { SharedModule } from '$/shared.module';
import { PipesModule } from '@theme/pipes/pipes.module';
import { AddCollectorComponent } from './add-collector/add-collector.component';
import { ListCollectorComponent } from './list-collector/list-collector.component';
import { AttendanceCollectorComponent } from './attendance-collector/attendance-collector.component';
import { AttendanceDetailComponent } from './attendance-detail/attendance-detail.component';

export const routes = [
	{
		path: '',
		component: ListCollectorComponent
	},
	{
		path: 'attendance',
		component: AttendanceCollectorComponent
	},
	{
		path: 'attendance/:collectorId',
		component: AttendanceDetailComponent
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
		AddCollectorComponent,
		ListCollectorComponent,
		AttendanceCollectorComponent,
		AttendanceDetailComponent
	],
	entryComponents: [
		AddCollectorComponent
	]
})
export class CollectorsModule {}
