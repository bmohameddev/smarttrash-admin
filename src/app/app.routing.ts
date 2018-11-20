import { Routes, RouterModule, PreloadAllModules } from '@angular/router';
import { ModuleWithProviders } from '@angular/core';
import { PagesComponent } from './pages/pages.component';
import { UserGuard } from '$/guards/user.guard';

export const routes: Routes = [
	{
		path: '',
		component: PagesComponent,
		children: [
			{
				path: '',
				loadChildren: () => import('./pages/dashboard/dashboard.module').then((m) => m.DashboardModule),
				canActivate: [UserGuard],
			},
			{
				path: 'users',
				loadChildren: () => import('./pages/users/users.module').then((m) => m.UsersModule),
				canActivate: [UserGuard],
			},
			{
				path: 'collectors',
				loadChildren: () => import('./pages/collectors/collectors.module').then((m) => m.CollectorsModule),
				canActivate: [UserGuard],
			},
			{
				path: 'trashes',
				loadChildren: () => import('./pages/trashes/trashes.module').then((m) => m.TrashesModule),
				canActivate: [UserGuard],
			},
			{
				path: 'trashlog',
				loadChildren: () => import('./pages/trashlog/trashlog.module').then((m) => m.TrashlogModule),
				canActivate: [UserGuard],
			},
			{
				path: 'report',
				loadChildren: () => import('./pages/report/report.module').then((m) => m.ReportModule),
				canActivate: [UserGuard],
			},
			{
				path: 'maps',
				loadChildren: () => import('./pages/maps/maps.module').then((m) => m.MapsModule),
				canActivate: [UserGuard],
			},
			{
				path: 'withdraw',
				loadChildren: () => import('./pages/withdraw/withdraw.module').then((m) => m.WithdrawModule),
				canActivate: [UserGuard],
			},
			{
				path: 'payment',
				loadChildren: () => import('./pages/payment/payment.module').then((m) => m.PaymentModule),
				canActivate: [UserGuard],
			},
			{
				path: 'products',
				loadChildren: () => import('./pages/products/products.module').then((m) => m.ProductsModule),
				canActivate: [UserGuard],
			},
			{
				path: 'citysetting',
				loadChildren: () => import('./pages/city-setting/city-setting.module').then((m) => m.CitySettingModule),
				canActivate: [UserGuard],
				data: { expectedRole: 'ADMIN' },
			},
			{
				path: 'admins',
				loadChildren: () => import('./pages/admins/admins.module').then((m) => m.AdminsModule),
				canActivate: [UserGuard],
				data: { expectedRole: 'SUPER' },
			},
			{
				path: 'cities',
				loadChildren: () => import('./pages/cities/cities.module').then((m) => m.CitiesModule),
				canActivate: [UserGuard],
				data: { expectedRole: 'SUPER' },
			},
			{
				path: 'setting',
				loadChildren: () => import('./pages/setting/setting.module').then((m) => m.SettingModule),
				canActivate: [UserGuard],
				data: { expectedRole: 'SUPER' },
			},
		],
	},
	{
		path: 'login',
		loadChildren: () => import('./pages/login/login.module').then((m) => m.LoginModule),
	},
	{
		path: 'changepassword',
		loadChildren: () =>
			import('./pages/change-password/change-password.module').then((m) => m.ChangePasswordModule),
		canActivate: [UserGuard],
	},
	{
		path: 'gateway',
		loadChildren: () => import('./gateway/gateway.module').then((m) => m.GatewayModule),
	},
	{
		path: '**',
		redirectTo: '',
	},
];

export const routing: ModuleWithProviders = RouterModule.forRoot(routes, {
	preloadingStrategy: PreloadAllModules, // <- comment this line for activate lazy load
	// useHash: true
});
