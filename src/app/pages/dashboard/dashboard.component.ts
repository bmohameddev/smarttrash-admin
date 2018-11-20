import { Component, OnInit, ViewChild, HostListener, AfterViewInit, OnDestroy, NgZone } from '@angular/core';
import { Subscription } from 'rxjs';
import { Router, ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatPaginator } from '@angular/material/paginator';
import { HttpErrorResponse } from '@angular/common/http';
import { Settings } from '../../app.settings.model';
import { AppSettings } from '../../app.settings';
import { environment } from '@env/environment';
import { BlockUIService } from '$/services/block-ui.service';
import { CommonService } from '$/services/common.service';
import { AuthenticationService } from '$/services/authentication.service';
import { MapComponent } from '$/components/map/map.component';
import * as _ from 'underscore';
import * as moment from 'moment';
import { ClassificationDialogComponent } from '$/components/classification-dialog/classification-dialog.component';

@Component({
	selector: 'app-dashboard',
	templateUrl: './dashboard.component.html',
	styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, OnDestroy, AfterViewInit {
	@ViewChild('videoPlayer', { static: false }) videoPlayer: any;
	public serverUrl: string = environment.apiUrl;

	public dateReport: any[] = [];
	public datePercentReport: any[] = [];
	public datePointResult;
	public totalUserCnt = 0;
	public resident = 0;
	public monthReport: any[] = [];
	public monthPercentReport: any[] = [];
	public yearReport: any[] = [];
	public showXAxis = true;
	public showYAxis = true;
	public gradient = false;
	public showLegend = false;
	public showXAxisLabel = false;
	public xAxisLabel = 'Country';
	public showYAxisLabel = false;
	public yAxisLabel = 'Population';
	public colorScheme = {
		domain: ['#3B995F', '#4B4B4B', '#0000FF'],
	};
	public barPadding = 1;
	public groupPadding = 1;
	public legendTitle = '垃圾分类标识图例';
	public legendPosition = 'right';

	public trashLogPageSize = 4;
	public trashPageSize = 3;

	public displayedColumnsTrashLog: string[] = [
		'index',
		'userName',
		'dustName',
		'amount',
		'picture',
		'calcPoint',
		'state',
		'deviceType',
	];
	public dataSourceTrashLogA: any;
	public dataSourceTrashLogANull: any;
	public dataSourceTrashLogB: any;
	public dataSourceTrashLogBNull: any;
	private sortParam = {
		active: '',
		direction: '',
	};
	public dustName: any[] = [];
	public siteName = '';
	public siteSlogan = '';

	@ViewChild('trashlogsA', { static: false }) trashlogsA: any;
	@ViewChild('trashlogsB', { static: false }) trashlogsB: any;
	public trashlogsADir = true;
	public trashlogsBDir = true;

	public displayedColumnsReport: string[] = ['index', 'deviceId', 'state'];
	public dataSourceReport: any;
	public dataSourceReportNull: any;
	public selectedYear: string = String(new Date().getFullYear());
	public selectedMonth: string = String(new Date().getMonth() + 1);
	public selectedDate: string = String(new Date().getDate());
	public value = 'month';

	@ViewChild('trashesTable', { static: false }) trashesTable: any;
	public trashesDir = true;

	public user: any;
	private userUpdatesSubscription: Subscription;

	public commonData: any;
	private commonDataUpdatesSubscription: Subscription;

	public interval: any;

	constructor(
		private router: Router,
		public dialog: MatDialog,
		public appSettings: AppSettings,
		private blockUIService: BlockUIService,
		public commonService: CommonService,
		private authenticationService: AuthenticationService,
		private snackBar: MatSnackBar,
		private _ngZone: NgZone,
	) {}

	ngOnInit() {
		this.userUpdatesSubscription = this.authenticationService
			.getUserUpdates()
			.subscribe((user) => (this.user = user));
		this.commonDataUpdatesSubscription = this.commonService.getCommonDataUpdates().subscribe((commonData) => {
			this.commonData = commonData;
			if (this.commonData.city) {
				this.totalUserCnt = this.commonData.city.user;
				this.resident = this.commonData.city.resident;
				this.dustName = _.pluck(JSON.parse(this.commonData.city.dusts), 'name');
				this.siteName = this.commonData.city.siteName;
				this.siteSlogan = this.commonData.city.siteSlogan;
			} else if (this.commonData.defaultSetting) {
				this.dustName = _.pluck(JSON.parse(this.commonData.defaultSetting.dusts), 'name');
				this.siteName = this.commonData.defaultSetting.siteName;
				this.siteSlogan = this.commonData.defaultSetting.siteSlogan;
			}
			if (this.authenticationService.isAdmin() && this.commonData.appInitialized) {
				this.refreshVideoUrl();
				this.getTrashLogs();
				this.getTrashesReport();
				this.getDateReport();
				this.getMonthReport();
				this.getYearReport();
			}
		});
		this._ngZone.runOutsideAngular(() => {
			this.interval = setInterval(() => {
				if (this.dataSourceTrashLogA && this.dataSourceTrashLogA.data.length) {
					if (
						this.trashlogsA.nativeElement.scrollTop ===
							this.trashlogsA.nativeElement.scrollHeight - this.trashlogsA.nativeElement.offsetHeight &&
						this.trashlogsADir
					) {
						this.trashlogsADir = !this.trashlogsADir;
					} else if (this.trashlogsA.nativeElement.scrollTop === 0 && !this.trashlogsADir) {
						this.trashlogsADir = !this.trashlogsADir;
					} else {
						this.trashlogsA.nativeElement.scrollTop =
							Math.round(
								(this.trashlogsA.nativeElement.scrollTop + (this.trashlogsADir ? 48 : -48)) / 48,
							) * 48;
					}
				}

				if (this.dataSourceTrashLogB && this.dataSourceTrashLogB.data.length) {
					if (
						this.trashlogsB.nativeElement.scrollTop ===
							this.trashlogsB.nativeElement.scrollHeight - this.trashlogsB.nativeElement.offsetHeight &&
						this.trashlogsBDir
					) {
						this.trashlogsBDir = !this.trashlogsBDir;
					} else if (this.trashlogsB.nativeElement.scrollTop === 0 && !this.trashlogsBDir) {
						this.trashlogsBDir = !this.trashlogsBDir;
					} else {
						this.trashlogsB.nativeElement.scrollTop =
							Math.round(
								(this.trashlogsB.nativeElement.scrollTop + (this.trashlogsBDir ? 48 : -48)) / 48,
							) * 48;
					}
				}

				if (this.dataSourceReport && this.dataSourceReport.data.length) {
					if (
						this.trashesTable.nativeElement.scrollTop ===
							this.trashesTable.nativeElement.scrollHeight -
								this.trashesTable.nativeElement.offsetHeight &&
						this.trashesDir
					) {
						this.trashesDir = !this.trashesDir;
					} else if (this.trashesTable.nativeElement.scrollTop === 0 && !this.trashesDir) {
						this.trashesDir = !this.trashesDir;
					} else {
						this.trashesTable.nativeElement.scrollTop =
							Math.round(
								(this.trashesTable.nativeElement.scrollTop + (this.trashesDir ? 48 : -48)) / 48,
							) * 48;
					}
				}
			}, 2000);
		});
	}

	ngAfterViewInit() {
		this.refreshVideoUrl();
	}

	ngOnDestroy() {
		if (this.userUpdatesSubscription) {
			this.userUpdatesSubscription.unsubscribe();
		}
		if (this.commonDataUpdatesSubscription) {
			this.commonDataUpdatesSubscription.unsubscribe();
		}
		if (this.interval) {
			clearInterval(this.interval);
		}
	}

	refreshVideoUrl() {
		let videoUrl;
		if (this.commonData.city && this.commonData.city.videoUrl) {
			const videoUrlList = this.commonData.city.videoUrl.split(',');
			if (this.commonData.city.dashboardVideo) {
				videoUrl = this.serverUrl + '/' + videoUrlList[this.commonData.city.dashboardVideo.split(',')[0]];
			} else {
				videoUrl = this.serverUrl + '/' + videoUrlList[0];
			}
		} else if (this.commonData.defaultSetting && this.commonData.defaultSetting.videoUrl) {
			videoUrl = this.serverUrl + '/' + this.commonData.defaultSetting.videoUrl;
		}
		if (this.videoPlayer && this.videoPlayer.nativeElement.src !== videoUrl && videoUrl) {
			this.videoPlayer.nativeElement.src = videoUrl;
			this.videoPlayer.nativeElement.muted = true;
		}
	}

	getTrashLogs() {
		const startDate = moment().startOf('month').toDate().getTime();
		this.commonService
			.getTrashLogs({
				city: this.commonData.city.id,
				dustTypes: '0',
				limit: 100,
				// startDate
			})
			.subscribe((res: any) => {
				this.dataSourceTrashLogA = new MatTableDataSource<any>(res.data.trashlogs);
				this.dataSourceTrashLogANull = new MatTableDataSource<any>(null);
			});
		this.commonService
			.getTrashLogs({
				city: this.commonData.city.id,
				dustTypes: '1',
				limit: 100,
				// startDate
			})
			.subscribe((res: any) => {
				this.dataSourceTrashLogB = new MatTableDataSource<any>(res.data.trashlogs);
				this.dataSourceTrashLogBNull = new MatTableDataSource<any>(null);
			});
	}

	public getTrashesReport(event?) {
		this.commonService
			.getTrashesReport({
				city: this.commonData.city.id,
			})
			.subscribe(
				(res: any) => {
					if (res.data) {
						this.dataSourceReport = new MatTableDataSource<any>(res.data.trashes);
						this.dataSourceReportNull = new MatTableDataSource<any>(null);
					} else {
						this.snackBar.open(res.msg, '确认', { duration: 1500 });
					}
				},
				(err: HttpErrorResponse) => {
					this.snackBar.open(err.error.msg, '确认', {
						duration: 4000,
					});
				},
			);
	}

	public getDateReport() {
		this.commonService
			.getCityReport(
				this.commonData.city ? this.commonData.city.id : '',
				this.selectedYear,
				this.selectedMonth,
				this.selectedDate,
			)
			.subscribe(
				(res: any) => {
					if (res.data) {
						this.datePointResult = res.data.pointResult;
						this.dateReport = [];
						this.dustName.forEach((element) => {
							this.dateReport.push({
								name: element,
								series: [],
							});
						});
						for (let index = 1; index <= 24; index++) {
							const dustAmount = _.reduce(
								res.data.result,
								function (acc, val) {
									return Number(val.key) === index ? val.dustAmount : acc;
								},
								[0, 0, 0],
							);
							this.dustName.forEach((element, jdx) => {
								this.dateReport[jdx].series.push({
									name: '' + index,
									value: dustAmount[jdx],
								});
							});
						}
					} else {
						this.snackBar.open(res.msg, '确认', { duration: 1500 });
					}
				},
				(err: HttpErrorResponse) => {
					this.snackBar.open(err.error.msg, '确认', {
						duration: 4000,
					});
				},
			);
	}

	public getMonthReport() {
		this.commonService
			.getCityReport(this.commonData.city ? this.commonData.city.id : '', this.selectedYear, this.selectedMonth)
			.subscribe(
				(res: any) => {
					if (res.data) {
						this.monthReport = [];
						this.dustName.forEach((element) => {
							this.monthReport.push({
								name: element,
								series: [],
							});
						});
						for (let index = 1; index <= moment().daysInMonth(); index++) {
							const dustAmount = _.reduce(
								res.data.result,
								function (acc, val) {
									return Number(val.key) === index ? val.dustAmount : acc;
								},
								[0, 0, 0],
							);
							this.dustName.forEach((element, jdx) => {
								this.monthReport[jdx].series.push({
									name: '' + index,
									value: dustAmount[jdx],
								});
							});
						}
					} else {
						this.snackBar.open(res.msg, '确认', { duration: 1500 });
					}
				},
				(err: HttpErrorResponse) => {
					this.snackBar.open(err.error.msg, '确认', {
						duration: 4000,
					});
				},
			);
	}

	public getYearReport() {
		this.commonService
			.getCityReport(this.commonData.city ? this.commonData.city.id : '', this.selectedYear)
			.subscribe(
				(res: any) => {
					if (res.data) {
						this.yearReport = [];
						this.dustName.forEach((element) => {
							this.yearReport.push({
								name: element,
								series: [],
							});
						});
						for (let index = 1; index <= 12; index++) {
							const dustAmount = _.reduce(
								res.data.result,
								function (acc, val) {
									return Number(val.key) === index ? val.dustAmount : acc;
								},
								[0, 0, 0],
							);
							this.dustName.forEach((element, jdx) => {
								this.yearReport[jdx].series.push({
									name: '' + index,
									value: dustAmount[jdx],
								});
							});
						}
					} else {
						this.snackBar.open(res.msg, '确认', { duration: 1500 });
					}
				},
				(err: HttpErrorResponse) => {
					this.snackBar.open(err.error.msg, '确认', {
						duration: 4000,
					});
				},
			);
	}

	public openClassificationDialog() {
		this.dialog.open(ClassificationDialogComponent, {
			data: {
				classificationGuide: this.commonData.defaultSetting.classificationGuide,
			},
			width: '1024px',
		});
	}

	public goToMap() {
		if (this.user.role !== 'SUPER') {
			this.router.navigateByUrl('/maps/baidumaps');
		}
	}
}
