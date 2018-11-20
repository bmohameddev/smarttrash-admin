import { Component, OnInit, ViewEncapsulation, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { SelectionModel } from '@angular/cdk/collections';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { environment } from '@env/environment';
import { BlockUIService } from '$/services/block-ui.service';
import { AuthenticationService } from '$/services/authentication.service';
import { CommonService } from '$/services/common.service';
import { PasswordDialogComponent } from '$/components/password-dialog/password-dialog.component';
import * as moment from 'moment';
import * as _ from 'underscore';

@Component({
	selector: 'app-user',
	templateUrl: './user.component.html',
	styleUrls: ['./user.component.scss'],
	animations: [
		trigger('detailExpand', [
			state('collapsed', style({ height: '0px', minHeight: '0' })),
			state('expanded', style({ height: '*' })),
			transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
		]),
	],
})
export class UserComponent implements OnInit, OnDestroy {
	public displayedColumns: string[] = [
		'index',
		'name',
		'cardIds',
		'dustAAmount',
		'dustBAmount',
		'totalPoint',
		'withdrawPoint',
		'deductionPoint',
		'remainingPoint',
		'operationCnt',
	];
	public dataSource: any;
	public selection = new SelectionModel<any>(true, []);
	public serverUrl = environment.apiUrl;
	public totalResult: any;
	public totalCnt: number;
	private pageSize: number = 10;
	public pageIndex: number;
	private sortParam = {
		active: '',
		direction: '',
	};
	public selectedYear: string = String(new Date().getFullYear());
	public selectedMonth: string = '';
	public selectedDate: string = '';
	public autocomplete: any[];
	private autocompleteSubscription: Subscription;
	public dustName: any[] = [];
	public searchForm: FormGroup;

	public users;

	public user: any;
	private userUpdatesSubscription: Subscription;

	public commonData: any;
	private commonDataUpdatesSubscription: Subscription;

	constructor(
		private route: ActivatedRoute,
		private fb: FormBuilder,
		public router: Router,
		private blockUIService: BlockUIService,
		private commonService: CommonService,
		private authenticationService: AuthenticationService,
		private snackBar: MatSnackBar,
		public dialog: MatDialog,
	) {}

	ngOnInit() {
		this.searchForm = this.fb.group({
			keyword: '',
			startDate: [moment().startOf('year').toDate()],
			endDate: [new Date()],
			operationUser: new FormControl(false),
			withdrawUser: new FormControl(false),
		});
		this.userUpdatesSubscription = this.authenticationService.getUserUpdates().subscribe((user) => {
			this.user = user;
		});

		this.commonDataUpdatesSubscription = this.commonService.getCommonDataUpdates().subscribe((commonData) => {
			this.commonData = commonData;
			if (this.commonData.city) {
				this.dustName = _.pluck(JSON.parse(this.commonData.city.dusts), 'name');
			} else if (this.commonData.defaultSetting) {
				this.dustName = _.pluck(JSON.parse(this.commonData.defaultSetting.dusts), 'name');
			}
			this.getUsersReport();
		});
	}

	ngOnDestroy() {
		this.userUpdatesSubscription.unsubscribe();
		this.commonDataUpdatesSubscription.unsubscribe();
	}

	public getUsersReport(event?) {
		if (event) {
			this.pageSize = event.pageSize;
			this.pageIndex = event.pageIndex;
		}
		let filter: any = {};
		if (this.searchForm.value.operationUser) {
			filter.operationUser = true;
		}
		if (this.searchForm.value.withdrawUser) {
			filter.withdrawUser = true;
		}

		this.blockUIService.setBlockStatus(true);
		this.commonService
			.getUsersReport({
				limit: this.pageSize,
				offset: this.pageIndex,
				search: this.searchForm.value.keyword,
				filter: JSON.stringify(filter),
				startDate: this.searchForm.value.startDate.getTime(),
				endDate: this.searchForm.value.endDate.getTime(),
				city: this.commonData.city.id,
				active: this.sortParam.active,
				direction: this.sortParam.direction,
			})
			.subscribe(
				(res: any) => {
					this.blockUIService.setBlockStatus(false);
					if (res.data) {
						this.totalCnt = res.data.totalCnt;
						this.users = res.data.users;
						this.totalResult = res.data.totalResult;
						this.dataSource = new MatTableDataSource<any>(res.data.users);
						this.selection.clear();
					} else {
						this.snackBar.open(res.msg, 'ç¡®è®¤', { duration: 1500 });
					}
				},
				(err: HttpErrorResponse) => {
					this.blockUIService.setBlockStatus(false);
					this.snackBar.open(err.error.msg, 'ç¡®è®¤', { duration: 4000 });
				},
			);
	}

	applySearch() {
		this.getUsersReport();
	}

	public getAllUsersReport(resolve) {
		let filter: any = {};
		if (this.searchForm.value.operationUser) {
			filter.operationUser = true;
		}
		if (this.searchForm.value.withdrawUser) {
			filter.withdrawUser = true;
		}

		this.blockUIService.setBlockStatus(true);
		this.commonService
			.getUsersReport({
				search: this.searchForm.value.keyword,
				filter: JSON.stringify(filter),
				startDate: this.searchForm.value.startDate.getTime(),
				endDate: this.searchForm.value.endDate.getTime(),
				city: this.commonData.city.id,
				active: this.sortParam.active,
				direction: this.sortParam.direction,
			})
			.subscribe(
				(res: any) => {
					this.blockUIService.setBlockStatus(false);
					if (res.data) {
						resolve(res.data.users);
					} else {
						this.snackBar.open(res.msg, 'ç¡®è®¤', { duration: 1500 });
					}
				},
				(err: HttpErrorResponse) => {
					this.blockUIService.setBlockStatus(false);
					this.snackBar.open(err.error.msg, 'ç¡®è®¤', { duration: 4000 });
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
						self.getAllUsersReport(resolve);
					}).then(function (value: any) {
						let printData: any[] = [];
						value.forEach((element) => {
							printData.push({
								No: element.index + 1,
								姓名: element.name,
								卡号: element.cardIds,
								[(self.dustName[0] ? self.dustName[0] : 'A') + '重量']:
									Math.round(element.dustAAmount * 10) / 10,
								[(self.dustName[1] ? self.dustName[1] : 'B') + '重量']:
									Math.round(element.dustBAmount * 10) / 10,
								总积分: Math.round(element.totalPoint * 10) / 10,
								兑换积分: Math.round(element.withdrawPoint * 10) / 10,
								扣除积分: Math.round((element.deductionPoint ? element.deductionPoint : 0) * 10) / 10,
								剩余积分: Math.round(element.remainingPoint * 10) / 10,
								投放次数: element.operationCnt,
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
						self.getAllUsersReport(resolve);
					}).then(function (value: any) {
						let printData: any[] = [];
						value.forEach((element) => {
							printData.push({
								index: element.index + 1,
								name: element.name,
								cardIds: element.cardIds,
								dustAAmount: Math.round(element.dustAAmount * 10) / 10,
								dustBAmount: Math.round(element.dustBAmount * 10) / 10,
								totalPoint: Math.round(element.totalPoint * 10) / 10,
								withdrawPoint: Math.round(element.withdrawPoint * 10) / 10,
								deductionPoint:
									Math.round((element.deductionPoint ? element.deductionPoint : 0) * 10) / 10,
								remainingPoint: Math.round(element.remainingPoint * 10) / 10,
								operationCnt: element.operationCnt,
							});
						});
						self.commonService.printTable({
							columns: [
								'index',
								'name',
								'cardIds',
								'dustAAmount',
								'dustBAmount',
								'totalPoint',
								'withdrawPoint',
								'deductionPoint',
								'remainingPoint',
								'operationCnt',
							],
							headers: [
								'No',
								'姓名',
								'卡号',
								(self.dustName[0] ? self.dustName[0] : 'A') + '重量',
								(self.dustName[1] ? self.dustName[1] : 'B') + '重量',
								'总积分',
								'兑换积分',
								'扣除积分',
								'剩余积分',
								'投放次数',
							],
							content: printData,
						});
					});
				}
			});
	}
}
