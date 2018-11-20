import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import { SharedModule } from '$/shared.module';
import { PipesModule } from '@theme/pipes/pipes.module';
import { AddTrashComponent } from './add-trash/add-trash.component';
import { ListTrashComponent } from './list-trash/list-trash.component';
import { DetailTrashComponent } from './detail-trash/detail-trash.component';
import { LazyLoadImageModule } from 'ng-lazyload-image';

export const routes = [
	{
		path: 'list',
		component: ListTrashComponent,
	},
	{
		path: 'detail/:id',
		component: DetailTrashComponent,
	},
	{
		path: '**',
		redirectTo: 'list',
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
		SharedModule,
		PipesModule,
		LazyLoadImageModule,
	],
	declarations: [AddTrashComponent, ListTrashComponent, DetailTrashComponent],
	entryComponents: [AddTrashComponent, ListTrashComponent, DetailTrashComponent],
})
export class TrashesModule {}
