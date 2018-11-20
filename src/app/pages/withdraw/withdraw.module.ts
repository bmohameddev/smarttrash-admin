import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import { SharedModule } from '$/shared.module';
import { PipesModule } from '@theme/pipes/pipes.module';
import { ListWithdrawComponent } from './list-withdraw/list-withdraw.component';
import { AddWithdrawComponent } from './add-withdraw/add-withdraw.component';
export const routes = [
	{
		path: '',
		component: ListWithdrawComponent
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
		AddWithdrawComponent,
		ListWithdrawComponent
	],
	entryComponents: [
		AddWithdrawComponent
	]
})
export class WithdrawModule {}
