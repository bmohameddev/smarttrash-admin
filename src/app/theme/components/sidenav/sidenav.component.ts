import { Component, OnInit, ViewEncapsulation, ViewChild, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { AppSettings } from '@app/app.settings';
import { Settings } from '@app/app.settings.model';
import { MenuService } from '../menu/menu.service';
import { PerfectScrollbarComponent } from 'ngx-perfect-scrollbar';
import { environment } from '@env/environment';
import { AuthenticationService } from '$/services/authentication.service';
import { BlockUIService } from '$/services/block-ui.service';
import { CommonService } from '$/services/common.service';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ProfileDialogComponent } from '$/components/profile-dialog/profile-dialog.component';
import { Lightbox } from 'ngx-lightbox';

@Component({
	selector: 'app-sidenav',
	templateUrl: './sidenav.component.html',
	styleUrls: ['./sidenav.component.scss'],
	encapsulation: ViewEncapsulation.None,
	providers: [MenuService],
})
export class SidenavComponent implements OnInit, OnDestroy {
	@ViewChild('sidenavPS', { static: false })
	sidenavPS: PerfectScrollbarComponent;
	public userImage = '../assets/img/users/user.jpg';
	public menuItems: Array<any>;
	public settings: Settings;
	public user: any;
	public serverUrl = environment.apiUrl;
	public city;
	private userUpdatesSubscription: Subscription;
	public siteName = '';

	public commonData: any;
	private commonDataUpdatesSubscription: Subscription;

	constructor(
		public appSettings: AppSettings,
		public menuService: MenuService,
		private authenticationService: AuthenticationService,
		public router: Router,
		private blockUIService: BlockUIService,
		public commonService: CommonService,
		public dialog: MatDialog,
		private lightbox: Lightbox,
	) {
		this.settings = this.appSettings.settings;
	}

	ngOnInit() {
		this.userUpdatesSubscription = this.authenticationService.getUserUpdates().subscribe((user) => {
			this.user = user;
			if (user && user.city) {
				this.city = user.city;
				this.changeCity(this.city);
			} else {
				this.commonService.setCommonDataVariable({
					city: '',
					appInitialized: true,
				});
			}
		});

		this.commonDataUpdatesSubscription = this.commonService.getCommonDataUpdates().subscribe((commonData) => {
			this.commonData = commonData;
			if (this.commonData.city) {
				this.siteName = this.commonData.city.siteName;
			} else if (this.commonData.defaultSetting) {
				this.siteName = this.commonData.defaultSetting.siteName;
			}
		});

		this.menuItems = this.menuService.getVerticalMenuItems();
	}

	ngOnDestroy() {
		this.userUpdatesSubscription.unsubscribe();
		this.commonDataUpdatesSubscription.unsubscribe();
	}

	public closeSubMenus() {
		let menu = document.querySelector('.sidenav-menu-outer');
		if (menu) {
			for (let i = 0; i < menu.children[0].children.length; i++) {
				let child = menu.children[0].children[i];
				if (child) {
					if (child.children[0].classList.contains('expanded')) {
						child.children[0].classList.remove('expanded');
						child.children[1].classList.remove('show');
					}
				}
			}
		}
	}

	public updatePS(e) {
		this.sidenavPS.directiveRef.update();
	}

	public logout() {
		this.authenticationService.logout();
	}

	public changeCity(city) {
		this.commonService.getCity(city.id).subscribe((res: any) => {
			if (res.data) {
				this.city = res.data;
				this.commonService.setCommonDataVariable({ city: res.data, appInitialized: true });
			}
		});
		// this.commonService.setCommonDataVariable({
		// 	city,
		// 	appInitialized: true,
		// });
	}

	public editProfile() {
		this.dialog
			.open(ProfileDialogComponent, {
				data: this.user,
				width: '600px',
			})
			.afterClosed()
			.subscribe((data) => {
				if (data) {
					this.authenticationService.setToken(data);
				}
			});
	}

	public openPicture(src): void {
		let _albums: any = [];
		const album = {
			src: src,
		};

		_albums.push(album);
		this.lightbox.open(_albums, 0, {
			fadeDuration: 0.3,
			resizeDuration: 0.2,
			centerVertically: true,
		});
	}
}
