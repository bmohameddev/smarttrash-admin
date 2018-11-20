import {
	Component,
	OnInit,
	OnDestroy,
	ViewChild,
	HostListener,
	ViewChildren,
	QueryList,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { Router, NavigationEnd } from '@angular/router';
import {
	PerfectScrollbarDirective,
	PerfectScrollbarConfigInterface,
} from 'ngx-perfect-scrollbar';
import { AppSettings } from '@app/app.settings';
import { Settings } from '@app/app.settings.model';
import { Title } from '@angular/platform-browser';
import { MenuService } from '@theme/components/menu/menu.service';
import { AuthenticationService } from '$/services/authentication.service';
import { BlockUIService } from '$/services/block-ui.service';
import { CommonService } from '$/services/common.service';
declare var BMap: any;

@Component({
	selector: 'app-pages',
	templateUrl: './pages.component.html',
	styleUrls: ['./pages.component.scss'],
	providers: [MenuService],
})
export class PagesComponent implements OnInit, OnDestroy {
	@ViewChild('sidenav', { static: false }) sidenav: any;
	@ViewChild('backToTop', { static: false }) backToTop: any;
	@ViewChildren(PerfectScrollbarDirective) pss: QueryList<
		PerfectScrollbarDirective
	>;
	public settings: Settings;
	public menus = ['vertical', 'horizontal'];
	public menuOption: string;
	public menuTypes = ['default', 'compact', 'mini'];
	public menuTypeOption: string;
	public isStickyMenu: boolean = false;
	public lastScrollTop: number = 0;
	public showBackToTop: boolean = false;
	public toggleSearchBar: boolean = false;
	private defaultMenu: string; //declared for return default menu when window resized
	public user: any;
	private userUpdatesSubscription: Subscription;
	private routerSubscription: Subscription;

	constructor(
		public appSettings: AppSettings,
		public router: Router,
		private title: Title,
		private menuService: MenuService,
		private authenticationService: AuthenticationService,
		public commonService: CommonService,
	) {
		this.settings = this.appSettings.settings;
	}

	ngOnInit() {
		this.userUpdatesSubscription = this.authenticationService
			.getUserUpdates()
			.subscribe((user) => (this.user = user));
		if (window.innerWidth <= 768) {
			this.settings.menu = 'vertical';
			this.settings.sidenavIsOpened = false;
			this.settings.sidenavIsPinned = false;
		}
		if (this.router.url == '/') {
			this.settings.sidenavIsOpened = false;
		}
		this.menuOption = this.settings.menu;
		this.menuTypeOption = this.settings.menuType;
		this.defaultMenu = this.settings.menu;
		// this.getAddress();
		this.getDefaultSetting();
	}

	ngAfterViewInit() {
		setTimeout(() => {
			this.settings.loadingSpinner = false;
		}, 300);
		this.routerSubscription = this.router.events
			.pipe(filter((event) => event instanceof NavigationEnd))
			.subscribe((event: any) => {
				window.scrollTo(0, 0);
				if (!this.settings.sidenavIsPinned || event.url == '/') {
					this.sidenav.close();
				}
				if (window.innerWidth <= 768) {
					this.sidenav.close();
				}
			});
		if (this.settings.menu == 'vertical')
			this.menuService.expandActiveSubMenu(
				this.menuService.getVerticalMenuItems(),
			);
	}

	ngOnDestroy() {
		this.userUpdatesSubscription.unsubscribe();
		this.routerSubscription.unsubscribe();
	}

	private getDefaultSetting() {
		this.commonService.getDefaultSetting().subscribe((res: any) => {
			if (res.data) {
				this.commonService.setCommonDataVariable({
					defaultSetting: res.data.defaultSetting,
				});
			}
		});
	}

	private getAddress() {
		const self = this;
		self.commonService.setCommonDataVariable({ allowBaiduMap: false });

		const promise = new Promise(function (resolve, reject) {
			new BMap.LocalCity().get(function (result) {
				if (result) {
					resolve(
						new BMap.Point(result.center.lng, result.center.lat),
					);
				}
			});
		});
		promise.then(function (value: any) {
			new BMap.Geocoder().getLocation(value, (result) => {
				if (result) {
					const locationCityName = result.addressComponents.district.slice(
						0,
						2,
					);
					self.commonService.setCommonDataVariable({
						locationCityName: locationCityName,
						webLocation: result,
						title: locationCityName + '智能环保垃圾分类管理系统',
						allowBaiduMap: true,
					});
					// self.title.setTitle(title);
				}
			});
		});
	}

	public toggleHeader() {
		this.settings.fixedHeader = !this.settings.fixedHeader;
		this.appSettings.saveSetting('fixedHeader');
	}

	public toggleRtl() {
		this.settings.rtl = !this.settings.rtl;
		this.appSettings.saveSetting('rtl');
	}

	public chooseMenu() {
		this.settings.menu = this.menuOption;
		this.appSettings.saveSetting('menu');
		this.defaultMenu = this.menuOption;
		this.router.navigate(['/']);
	}

	public chooseMenuType() {
		this.settings.menuType = this.menuTypeOption;
		this.appSettings.saveSetting('menuType');
	}

	public changeTheme(theme) {
		this.settings.theme = theme;
		this.appSettings.saveSetting('theme');
	}

	public toggleSidenavIsOpend() {
		this.settings.sidenavIsOpened = !this.settings.sidenavIsOpened;
		this.appSettings.saveSetting('sidenavIsOpened');
	}

	public toggleSidenavIsPinned() {
		this.settings.sidenavIsPinned = !this.settings.sidenavIsPinned;
		this.appSettings.saveSetting('sidenavIsPinned');
	}

	public toggleSidenavUserBlock() {
		this.settings.sidenavUserBlock = !this.settings.sidenavUserBlock;
		this.appSettings.saveSetting('sidenavUserBlock');
	}

	public toggleSidenav() {
		this.sidenav.toggle();
	}

	public onPsScrollY(event) {
		// (event.target.scrollTop > 300) ? this.backToTop.nativeElement.style.display = 'flex': this.backToTop.nativeElement.style.display = 'none';
		// if (this.settings.menu == 'horizontal') {
		// 	if (this.settings.fixedHeader) {
		// 		var currentScrollTop = (event.target.scrollTop > 56) ? event.target.scrollTop : 0;
		// 		(currentScrollTop > this.lastScrollTop) ? this.isStickyMenu = true: this.isStickyMenu = false;
		// 		this.lastScrollTop = currentScrollTop;
		// 	} else {
		// 		(event.target.scrollTop > 56) ? this.isStickyMenu = true: this.isStickyMenu = false;
		// 	}
		// }
	}

	public scrollToTop() {
		this.pss.forEach((ps) => {
			if (
				ps.elementRef.nativeElement.id == 'main' ||
				ps.elementRef.nativeElement.id == 'main-content'
			) {
				ps.scrollToTop(0, 250);
			}
		});
	}

	@HostListener('window:resize')
	public onWindowResize(): void {
		if (window.innerWidth <= 768) {
			this.settings.sidenavIsOpened = false;
			this.settings.sidenavIsPinned = false;
			this.settings.menu = 'vertical';
		} else {
			this.defaultMenu == 'horizontal'
				? (this.settings.menu = 'horizontal')
				: (this.settings.menu = 'vertical');
			// this.settings.sidenavIsOpened = true;
			this.settings.sidenavIsPinned = true;
		}
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
}
