import { Component, ElementRef, OnInit, ViewEncapsulation, OnDestroy, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { SelectionModel } from '@angular/cdk/collections';
import { FormBuilder, FormGroup } from '@angular/forms';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { environment } from '@env/environment';
import { BlockUIService } from '$/services/block-ui.service';
import { CommonService } from '$/services/common.service';
import { AuthenticationService } from '$/services/authentication.service';
import { ConfirmDialogComponent } from '$/components/confirm-dialog/confirm-dialog.component';
import { PasswordDialogComponent } from '$/components/password-dialog/password-dialog.component';
import * as moment from 'moment';
import * as _ from 'underscore';

@Component({
	selector: 'app-attendance-detail',
	templateUrl: './attendance-detail.component.html',
	styleUrls: ['./attendance-detail.component.scss'],
	animations: [
		trigger('detailExpand', [
			state('collapsed', style({ height: '0px', minHeight: '0' })),
			state('expanded', style({ height: '*' })),
			transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
		]),
	],
})
export class AttendanceDetailComponent implements OnInit, OnDestroy {
	public displayedColumns: string[] = [
		'select',
		'index',
		'key',
		'onTime',
		'offTime',
		'attendTime',
		'userCnt',
		'dustAAmount',
		'dustBAmount',
	];
	public displayedColumnsMobile: string[] = ['select', 'index', 'name', 'city'];
	public dataSource: any;
	public selection = new SelectionModel<any>(true, []);
	public totalCnt: number;
	private pageSize: number = 10;
	public pageIndex: number;
	public searchForm: FormGroup;
	public dustName: any[] = [];
	private sortParam = {
		active: '',
		direction: '',
	};
	infoForm: FormGroup;
	serverUrl = environment.apiUrl;
	@ViewChild('fileInput', { static: false }) fileInput: ElementRef;

	public collector;

	public collectorId;
	public user: any;
	private userUpdatesSubscription: Subscription;

	public commonData: any;
	private commonDataUpdatesSubscription: Subscription;

	constructor(
		private route: ActivatedRoute,
		private router: Router,
		private fb: FormBuilder,
		private blockUIService: BlockUIService,
		public commonService: CommonService,
		private authenticationService: AuthenticationService,
		private snackBar: MatSnackBar,
		private dialog: MatDialog,
	) {}

	ngOnInit() {
		this.searchForm = this.fb.group({
			startDate: [moment().startOf('month').toDate()],
			endDate: [new Date()],
		});
		this.userUpdatesSubscription = this.authenticationService
			.getUserUpdates()
			.subscribe((user) => (this.user = user));
		this.commonDataUpdatesSubscription = this.commonService.getCommonDataUpdates().subscribe((commonData) => {
			this.commonData = commonData;
			if (this.commonData.city) {
				this.dustName = _.pluck(JSON.parse(this.commonData.city.dusts), 'name');
			} else if (this.commonData.defaultSetting) {
				this.dustName = _.pluck(JSON.parse(this.commonData.defaultSetting.dusts), 'name');
			}
		});

		this.route.paramMap.subscribe((params) => {
			if (params.has('collectorId')) {
				this.collectorId = params.get('collectorId');
				this.commonService.getCollector(this.collectorId).subscribe((res: any) => {
					this.collector = res.data;
				});
				this.getCollectorReport();
			}
		});
	}

	ngOnDestroy() {
		this.userUpdatesSubscription.unsubscribe();
		this.commonDataUpdatesSubscription.unsubscribe();
	}

	public getCollectorReport(event?): void {
		if (event) {
			this.pageSize = event.pageSize;
			this.pageIndex = event.pageIndex;
		}

		this.blockUIService.setBlockStatus(true);
		this.commonService
			.getCollectorReport({
				id: this.collectorId,
				limit: this.pageSize,
				offset: this.pageIndex,
				startDate: this.searchForm.value.startDate.getTime(),
				endDate: this.searchForm.value.endDate.getTime(),
				active: this.sortParam.active,
				direction: this.sortParam.direction,
			})
			.subscribe(
				(res: any) => {
					this.blockUIService.setBlockStatus(false);
					if (res.data) {
						this.totalCnt = res.data.totalCnt;
						this.dataSource = new MatTableDataSource<any>(res.data.collectorlogs);
						this.selection.clear();
						if (this.totalCnt <= this.pageSize * this.pageIndex) {
							this.pageIndex = 0;
						}
					} else {
						this.snackBar.open(res.msg, '确认', { duration: 1500 });
					}
				},
				(err: HttpErrorResponse) => {
					this.blockUIService.setBlockStatus(false);
					this.snackBar.open(err.error.msg, '确认', { duration: 4000 });
				},
			);
	}

	isAllSelected() {
		const numSelected = this.selection.selected.length;
		const numRows = this.dataSource.data.length;
		return numSelected === numRows;
	}

	masterToggle() {
		this.isAllSelected()
			? this.selection.clear()
			: this.dataSource.data.forEach((row) => this.selection.select(row));
	}

	public customSort(event) {
		this.sortParam = event;
		this.getCollectorReport();
	}

	applySearch() {
		this.getCollectorReport();
	}

	public getAllCollectorReport(resolve) {
		this.blockUIService.setBlockStatus(true);
		this.commonService
			.getCollectorReport({
				id: this.collectorId,
				limit: this.pageSize,
				offset: this.pageIndex,
				startDate: this.searchForm.value.startDate.getTime(),
				endDate: this.searchForm.value.endDate.getTime(),
				active: this.sortParam.active,
				direction: this.sortParam.direction,
			})
			.subscribe(
				(res: any) => {
					this.blockUIService.setBlockStatus(false);
					if (res.data) {
						resolve(res.data.collectorlogs);
					} else {
						this.snackBar.open(res.msg, '确认', { duration: 1500 });
					}
				},
				(err: HttpErrorResponse) => {
					this.blockUIService.setBlockStatus(false);
					this.snackBar.open(err.error.msg, '确认', { duration: 4000 });
				},
			);
	}

	public export(fileType) {
		this.dialog
			.open(PasswordDialogComponent, {
				data: null,
				width: '360px',
			})
			.afterClosed()
			.subscribe((res) => {
				if (res == 'ok') {
					const self = this;
					new Promise(function (resolve, reject) {
						self.getAllCollectorReport(resolve);
					}).then(function (value: any) {
						let printData: any[] = [];
						value.forEach((element) => {
							printData.push({
								No: element.index + 1,
								日期: element.key,
								上班时间: moment(element.onTime).isValid()
									? moment(element.onTime).format('HH:mm:ss')
									: '',
								下班时间: moment(element.offTime).isValid()
									? moment(element.offTime).format('HH:mm:ss')
									: '',
								上班时长: element.attendTime,
								收集户数: element.userCnt,
								[(self.dustName[0] ? self.dustName[0] : 'A') + '重量']:
									Math.round(element.dustAAmount * 10) / 10,
								[(self.dustName[1] ? self.dustName[1] : 'B') + '重量']:
									Math.round(element.dustBAmount * 10) / 10,
							});
						});
						self.commonService.exportAsExcelFile(printData, '用户统计');
					});
				}
			});
	}

	public print() {
		this.dialog
			.open(PasswordDialogComponent, {
				data: null,
				width: '360px',
			})
			.afterClosed()
			.subscribe((res) => {
				if (res == 'ok') {
					const self = this;
					new Promise(function (resolve, reject) {
						self.getAllCollectorReport(resolve);
					}).then(function (value: any) {
						let printData: any[] = [];
						value.forEach((element) => {
							printData.push({
								index: element.index + 1,
								key: element.key,
								onTime: moment(element.onTime).isValid()
									? moment(element.onTime).format('HH:mm:ss')
									: '',
								offTime: moment(element.offTime).isValid()
									? moment(element.offTime).format('HH:mm:ss')
									: '',
								attendTime: element.attendTime,
								userCnt: element.userCnt,
								dustAAmount: Math.round(element.dustAAmount * 10) / 10,
								dustBAmount: Math.round(element.dustBAmount * 10) / 10,
							});
						});
						self.commonService.printTable({
							columns: [
								'index',
								'key',
								'onTime',
								'offTime',
								'attendTime',
								'userCnt',
								'dustAAmount',
								'dustBAmount',
							],
							headers: [
								'No',
								'日期',
								'上班时间',
								'下班时间',
								'上班时长',
								'收集户数',
								(self.dustName[0] ? self.dustName[0] : 'A') + '重量',
								(self.dustName[1] ? self.dustName[1] : 'B') + '重量',
							],
							content: printData,
						});
					});
				}
			});
	}
}
