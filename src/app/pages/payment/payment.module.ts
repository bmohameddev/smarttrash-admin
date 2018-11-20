import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import { SharedModule } from '$/shared.module';
import { PipesModule } from '@theme/pipes/pipes.module';
import { ListPaymentComponent } from './list-payment/list-payment.component';
import { AddPaymentComponent } from './add-payment/add-payment.component';
export const routes = [
	{
		path: '',
		component: ListPaymentComponent,
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
	],
	declarations: [AddPaymentComponent, ListPaymentComponent],
	entryComponents: [AddPaymentComponent],
})
export class PaymentModule {}
