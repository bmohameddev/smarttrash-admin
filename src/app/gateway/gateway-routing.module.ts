import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { UserGuard } from '$/guards/user.guard';

import { GatewayComponent } from './gateway.component';
import { VerifyAccountComponent } from './verify-account/verify-account.component';

const routes: Routes = [
	{
		path: '',
		component: GatewayComponent,
		children: [{ 
				path: 'verifyWeixin/:weixinToken', 
				component: VerifyAccountComponent,
				canActivate: [UserGuard] 
			},
		]
	}
];

@NgModule({
	imports: [RouterModule.forChild(routes)],
	exports: [RouterModule]
})
export class GatewayRoutingModule { }
