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
import { AddPaymentComponent } from '../add-payment/add-payment.component';

@Component({
	selector: 'app-list-payment',
	templateUrl: './list-payment.component.html',
	styleUrls: ['./list-payment.component.scss'],
	animations: [
		trigger('detailExpand', [
			state('collapsed', style({ height: '0px', minHeight: '0' })),
			state('expanded', style({ height: '*' })),
			transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
		]),
	],
})
export class ListPaymentComponent implements OnInit, OnDestroy {
	public displayedColumns: string[] = [
		'index',
		'dustType',
		'startDate',
		'endDate',
		'operator',
		'totalPoint',
		'paymentPoint',
		'paymentMoney',
		'createdAt',
	];
	public dataSource: any;
	public selection = new SelectionModel<any>(true, []);
	public serverUrl = environment.apiUrl;
	public totalCnt: number;
	private pageSize = 10;
	public pageIndex: number;
	private sortParam = {
		active: '',
		direction: '',
	};
	public searchForm: FormGroup;
	public dusts: Array<any> = [];

	public user: any;
	private userUpdatesSubscription: Subscription;

	public commonData: any;
	private commonDataUpdatesSubscription: Subscription;

	constructor(
		private route: ActivatedRoute,
		private fb: FormBuilder,
		private router: Router,
		private blockUIService: BlockUIService,
		private commonService: CommonService,
		private authenticationService: AuthenticationService,
		private snackBar: MatSnackBar,
		private dialog: MatDialog,
	) {}

	ngOnInit() {
		this.searchForm = this.fb.group({});
		this.userUpdatesSubscription = this.authenticationService.getUserUpdates().subscribe((user) => {
			this.user = user;
		});

		this.commonDataUpdatesSubscription = this.commonService.getCommonDataUpdates().subscribe((commonData) => {
			this.commonData = commonData;
			this.refreshDust();
			this.getData();
		});
	}

	ngOnDestroy() {
		this.userUpdatesSubscription.unsubscribe();
		this.commonDataUpdatesSubscription.unsubscribe();
	}

	refreshDust() {
		if (!this.commonData.city) {
			return;
		}
		try {
			this.dusts = JSON.parse(this.commonData.city.dusts);
		} catch (e) {
			console.log('Dusts Error');
		}
	}

	public getData(event?) {
		if (event) {
			this.pageSize = event.pageSize;
			this.pageIndex = event.pageIndex;
		}
		const dustTypes = [];
		this.dusts.forEach((element, idx) => {
			if (element.selected) {
				dustTypes.push(idx);
			}
		});

		this.blockUIService.setBlockStatus(true);
		this.commonService
			.getPayments({
				limit: this.pageSize,
				offset: this.pageIndex,
				dustTypes: dustTypes.join(','),
				city: this.commonData.city.id,
				active: this.sortParam.active,
				direction: this.sortParam.direction,
			})
			.subscribe(
				(res: any) => {
					this.blockUIService.setBlockStatus(false);
					if (res.data) {
						this.totalCnt = res.data.total;
						this.dataSource = new MatTableDataSource<any>(res.data.list);
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
		this.getData();
	}

	public customSort(event) {
		this.sortParam = event;
		this.getData();
	}

	public getAllData(resolve) {
		const dustTypes = [];
		this.dusts.forEach((element, idx) => {
			if (element.selected) {
				dustTypes.push(idx);
			}
		});

		this.blockUIService.setBlockStatus(true);
		this.commonService
			.getPayments({
				dustTypes: dustTypes.join(','),
				city: this.commonData.city.id,
				active: this.sortParam.active,
				direction: this.sortParam.direction,
			})
			.subscribe(
				(res: any) => {
					this.blockUIService.setBlockStatus(false);
					if (res.data) {
						resolve(res.data.list);
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
				if (res === 'ok') {
					const self = this;
					new Promise(function (resolve, reject) {
						self.getAllData(resolve);
					}).then(function (value: any) {
						const printData: any[] = [];
						value.forEach((element) => {
							printData.push({
								No: element.index + 1,
								垃圾分类: self.dusts[element.dustType].name,
								开始日期: element.startDate ? moment(element.startDate).format('YYYY.MM.DD') : '',
								结束日期: element.endDate ? moment(element.endDate).format('YYYY.MM.DD') : '',
								管理员: element.operator.name,
								总积分: Math.round(element.totalPoint * 10) / 10,
								兑换积分: Math.round(element.paymentPoint * 10) / 10,
								兑换钱: Math.round(element.paymentMoney * 10) / 10,
								兑换日期: element.createdAt
									? moment(element.createdAt).format('YYYY.MM.DD - HH:mm:ss')
									: '',
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
				if (res === 'ok') {
					const self = this;
					new Promise(function (resolve, reject) {
						self.getAllData(resolve);
					}).then(function (value: any) {
						const printData: any[] = [];
						value.forEach((element) => {
							printData.push({
								index: element.index + 1,
								dustType: self.dusts[element.dustType].name,
								startDate: element.startDate ? moment(element.startDate).format('YYYY.MM.DD') : '',
								endDate: element.endDate ? moment(element.endDate).format('YYYY.MM.DD') : '',
								operator: element.operator.name,
								totalPoint: Math.round(element.totalPoint * 10) / 10,
								paymentPoint: Math.round(element.paymentPoint * 10) / 10,
								paymentMoney: Math.round(element.paymentMoney * 10) / 10,
								createdAt: element.createdAt
									? moment(element.createdAt).format('YYYY.MM.DD - HH:mm:ss')
									: '',
							});
						});
						self.commonService.printTable({
							columns: [
								'index',
								'dustType',
								'startDate',
								'endDate',
								'operator',
								'totalPoint',
								'paymentPoint',
								'paymentMoney',
								'createdAt',
							],
							headers: [
								'No',
								'垃圾分类',
								'开始日期',
								'结束日期',
								'管理员',
								'总积分',
								'兑换积分',
								'兑换钱',
								'兑换日期',
							],
							content: printData,
						});
					});
				}
			});
	}

	public openAddDialog(cardId) {
		this.dialog
			.open(AddPaymentComponent, {
				data: {},
				width: '600px',
			})
			.afterClosed()
			.subscribe((data) => {
				if (data) {
					this.getData();
				}
			});
	}
}
