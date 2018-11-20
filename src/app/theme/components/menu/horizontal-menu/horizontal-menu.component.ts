import { Component, OnInit, OnDestroy, Input, ViewChild, ViewEncapsulation } from '@angular/core';
import { Subscription } from 'rxjs';
import { Router, NavigationEnd } from '@angular/router';
import { AppSettings } from '@app/app.settings';
import { Settings } from '@app/app.settings.model';
import { MenuService } from '../menu.service';
import { MatMenuTrigger } from '@angular/material/menu';
import { AuthenticationService } from '$/services/authentication.service';

@Component({
	selector: 'app-horizontal-menu',
	templateUrl: './horizontal-menu.component.html',
	styleUrls: ['./horizontal-menu.component.scss'],
	encapsulation: ViewEncapsulation.None,
	providers: [MenuService, AuthenticationService],
})
export class HorizontalMenuComponent implements OnInit, OnDestroy {
	@Input('menuParentId') menuParentId;
	public menuItems: Array<any>;
	public settings: Settings;
	@ViewChild(MatMenuTrigger, { static: false }) trigger: MatMenuTrigger;
	public user: any;
	private userUpdatesSubscription: Subscription;
	constructor(
		public appSettings: AppSettings, 
		public menuService: MenuService, 
		public router: Router,
		private authenticationService: AuthenticationService
	) {
		this.settings = this.appSettings.settings;
	}

	ngOnInit() {
		this.menuItems = this.menuService.getHorizontalMenuItems();
		this.menuItems = this.menuItems.filter(item => item.parentId == this.menuParentId);
		this.userUpdatesSubscription = this.authenticationService
			.getUserUpdates()
			.subscribe(user => this.user = user);
	}

	ngAfterViewInit() {
		this.router.events.subscribe(event => {
			if (event instanceof NavigationEnd) {
				if (this.settings.fixedHeader) {
					let mainContent = document.getElementById('main-content');
					if (mainContent) {
						mainContent.scrollTop = 0;
					}
				}
				else {
					document.getElementsByClassName('mat-drawer-content')[0].scrollTop = 0;
				}
			}
		});
	}

	ngOnDestroy() {
		this.userUpdatesSubscription.unsubscribe();
	}

}