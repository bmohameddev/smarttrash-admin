import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import { SharedModule } from '$/shared.module';
import { PipesModule } from '@theme/pipes/pipes.module';
import { AddUserComponent } from './add-user/add-user.component';
import { ListUserComponent } from './list-user/list-user.component';
import { MultiUserComponent } from './multi-user/multi-user.component';
import { DetailUserComponent } from './detail-user/detail-user.component';

export const routes = [
	{
		path: 'list',
		component: ListUserComponent
	},
	{
		path: 'muticreate',
		component: MultiUserComponent,
        data: { expectedRole: 'ADMIN' }  
	},
	{
		path: 'detail/:id',
		component: DetailUserComponent
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
		AddUserComponent,
		ListUserComponent,
		MultiUserComponent,
		DetailUserComponent
	],
	entryComponents: [
		AddUserComponent
	]
})
export class UsersModule {}
