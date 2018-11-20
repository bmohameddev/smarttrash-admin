import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import { SharedModule } from '$/shared.module';
import { PipesModule } from '@theme/pipes/pipes.module';
import { AddAdminComponent } from './add-admin/add-admin.component';
import { ListAdminComponent } from './list-admin/list-admin.component';
export const routes = [
	{
		path: '',
		component: ListAdminComponent
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
		AddAdminComponent,
		ListAdminComponent
	],
	entryComponents: [
		AddAdminComponent
	]
})
export class AdminsModule {}
