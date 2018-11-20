import { Component, OnInit, Input, Output, ViewEncapsulation, EventEmitter } from '@angular/core';
import { Subscription } from 'rxjs';
import { Router, NavigationEnd } from '@angular/router';
import { AppSettings } from '@app/app.settings';
import { Settings } from '@app/app.settings.model';
import { MenuService } from '../menu.service';
import { AuthenticationService } from '$/services/authentication.service';
import { BlockUIService } from '$/services/block-ui.service';
import { CommonService } from '$/services/common.service';

@Component({
	selector: 'app-vertical-menu',
	templateUrl: './vertical-menu.component.html',
	styleUrls: ['./vertical-menu.component.scss'],
	encapsulation: ViewEncapsulation.None,
	providers: [MenuService, AuthenticationService],
})
export class VerticalMenuComponent implements OnInit {
	@Input('menuItems') menuItems;
	@Input('menuParentId') menuParentId;
	@Output() onClickMenuItem: EventEmitter<any> = new EventEmitter<any>();
	parentMenu: Array<any>;
	public settings: Settings;
	public user: any;
	private userUpdatesSubscription: Subscription;
    
	public commonData: any;
	private commonDataUpdatesSubscription: Subscription;

	constructor(
		public appSettings: AppSettings, 
		public menuService: MenuService,
		public router: Router,
		private authenticationService: AuthenticationService,
        public commonService: CommonService
	) {
		this.settings = this.appSettings.settings;
	}

	ngOnInit() {
		this.parentMenu = this.menuItems.filter(item => item.parentId == this.menuParentId);
		this.userUpdatesSubscription = this.authenticationService
			.getUserUpdates()
			.subscribe(user => this.user = user);
		
		this.commonDataUpdatesSubscription = this.commonService
			.getCommonDataUpdates()
			.subscribe(commonData => this.commonData = commonData);
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
		this.commonDataUpdatesSubscription.unsubscribe();
	}

	onClick(menuId) {
		this.menuService.toggleMenuItem(menuId);
		this.menuService.closeOtherSubMenus(this.menuItems, menuId);
		this.onClickMenuItem.emit(menuId);
	}

}
