import { Component, OnInit, ViewChild, HostListener, OnDestroy, AfterViewInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { MatSelect } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
import { MatPaginator } from '@angular/material/paginator';
import { AuthenticationService } from '$/services/authentication.service';
import { SelectionModel } from '@angular/cdk/collections';
import { FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { environment } from '@env/environment';
import { BlockUIService } from '$/services/block-ui.service';
import { CommonService } from '$/services/common.service';
import { ConfirmDialogComponent } from '$/components/confirm-dialog/confirm-dialog.component';
import { PasswordDialogComponent } from '$/components/password-dialog/password-dialog.component';
import { DeductPointComponent } from '../deduct-point/deduct-point.component';
import { Lightbox } from 'ngx-lightbox';
import * as moment from 'moment';
import * as _ from 'underscore';

@Component({
	selector: 'app-list-trashlog',
	templateUrl: './list-trashlog.component.html',
	styleUrls: ['./list-trashlog.component.scss'],
	animations: [
		trigger('detailExpand', [
			state('collapsed', style({ height: '0px', minHeight: '0' })),
			state('expanded', style({ height: '*' })),
			transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
		]),
	],
})
export class ListTrashlogComponent implements OnInit, OnDestroy, AfterViewInit {
	public displayedColumns: string[] = [
		'select',
		'index',
		'userName',
		'cardId',
		'dustName',
		'amount',
		'picture',
		'calcPoint',
		'state',
		'createdAt',
		'point',
		'deviceType',
		'deductionPoint',
		'reviewAt',
		'reviewer',
		'menu',
	];
	public displayedColumnsMobile: string[] = ['select', 'index', 'userName', 'picture', 'state', 'point', 'menu'];
	public dataSource: any;
	public selection = new SelectionModel<any>(true, []);
	public totalCnt: number = 0;
	private pageSize: number = 10;
	public pageIndex: number = 0;
	public dustName = [];
	private sortParam = {
		active: '',
		direction: '',
	};
	public searchForm: FormGroup;
	public dustType: number = 0;
	serverUrl = environment.apiUrl;
	public stateForm: FormGroup;
	public state: string = '';
	// @ViewChild('allStateSelected', {static: false}) private allStateSelected: MatOption;
	// @ViewChild('filterSelect', {static: false}) private filterSelect: MatSelect;
	@ViewChild('paginator', { static: false }) paginator: MatPaginator;

	public lastEventTime: Date = new Date();

	@HostListener('document:keypress', ['$event'])
	@HostListener('document:mousemove', ['$event'])
	onEvent(event) {
		this.lastEventTime = new Date();
	}

	public trashlogs;
	public cntList: any[] = [];
	public userCnt;

	public user: any;
	private userUpdatesSubscription: Subscription;

	public commonData: any;
	private commonDataUpdatesSubscription: Subscription;

	constructor(
		private route: ActivatedRoute,
		private router: Router,
		private fb: FormBuilder,
		public dialog: MatDialog,
		private blockUIService: BlockUIService,
		public commonService: CommonService,
		private authenticationService: AuthenticationService,
		private snackBar: MatSnackBar,
		private lightbox: Lightbox,
	) {}

	ngOnInit() {
		this.route.queryParamMap.subscribe((params) => {
			if (params.has('dustType')) {
				this.dustType = +params.get('dustType');
				console.log(this.dustType);
				if (this.commonData) {
					this.getTrashLogs();
				}
			}
		});
		this.searchForm = this.fb.group({
			keyword: '',
			startDate: [moment().startOf('month').toDate()],
			endDate: [new Date()],
			dustA: new FormControl(true),
			dustB: new FormControl(true),
			notHaveDeduction: new FormControl(true),
			haveDeduction: new FormControl(true),
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
			this.getTrashLogs();
		});
		setInterval(() => {
			if (new Date().getTime() - this.lastEventTime.getTime() > 10 * 1000) {
				// if ((this.paginator.pageIndex + 1) * this.paginator.pageSize > this.totalCnt) {
				//     this.paginator.firstPage();
				// } else {
				//     this.paginator.nextPage()
				// }
			}
		}, 5000);
	}

	ngOnDestroy() {
		this.userUpdatesSubscription.unsubscribe();
		this.commonDataUpdatesSubscription.unsubscribe();
	}

	ngAfterViewInit() {}

	getTrashLogs(event?) {
		if (event) {
			this.pageSize = event.pageSize;
			this.pageIndex = event.pageIndex;
		}
		let deduct = '';
		if (this.searchForm.value.haveDeduction && this.searchForm.value.notHaveDeduction) {
			deduct = '';
		} else if (this.searchForm.value.notHaveDeduction) {
			deduct = '0';
		} else if (this.searchForm.value.haveDeduction) {
			deduct = '1';
		}
		this.blockUIService.setBlockStatus(true);
		this.commonService
			.getTrashLogs({
				limit: this.pageSize,
				offset: this.pageIndex,
				city: this.commonData.city.id,
				search: this.searchForm.value.keyword,
				dustTypes: '' + this.dustType,
				deduct: deduct,
				startDate: this.searchForm.value.startDate.getTime(),
				endDate: this.searchForm.value.endDate.getTime(),
				state: this.state,
				active: this.sortParam.active,
				direction: this.sortParam.direction,
			})
			.subscribe(
				(res: any) => {
					this.blockUIService.setBlockStatus(false);
					this.totalCnt = res.data.totalCnt;
					this.cntList = res.data.cntList;
					this.userCnt = res.data.userCnt;
					this.dataSource = new MatTableDataSource<any>(res.data.trashlogs);
					this.selection.clear();
					if (this.totalCnt <= this.pageSize * this.pageIndex) {
						this.pageIndex = 0;
					}
				},
				(err: HttpErrorResponse) => {
					this.blockUIService.setBlockStatus(false);
					this.snackBar.open(err.error.msg, 'ç¡®è®¤', { duration: 4000 });
				},
			);
	}

	isAllSelected() {
		const numSelected = this.selection.selected.length;
		const numRows = this.dataSource.data.length;
		return numSelected === numRows;
	}

	changeFilter() {
		this.getTrashLogs();
	}

	public customSort(event) {
		this.sortParam = event;
		this.getTrashLogs();
	}

	applySearch() {
		this.getTrashLogs();
	}

	public deleteTrashlogs() {
		var ids = [];
		this.dataSource.data.forEach((row, index) => {
			if (this.selection.selected.some((selected) => selected.index == row.index)) {
				ids.push(row.id);
			}
		});
		this.finalDeleteTrashlogs(ids);
	}

	public deleteTrashlog(event, id) {
		event.stopPropagation();
		var ids = [];
		ids.push(id);
		this.finalDeleteTrashlogs(ids);
	}

	public finalDeleteTrashlogs(ids) {
		if (ids.length) {
			if (confirm('Are you sure to delete trash logs?')) {
				this.blockUIService.setBlockStatus(true);
				this.commonService.deleteTrashlogs(ids).subscribe((res: any) => {
					this.blockUIService.setBlockStatus(false);
					this.getTrashLogs();
				});
			}
		} else {
			alert('Select the trash logs.');
		}
	}

	public changeTrashlogState(id, orderState) {
		const orderStateName = {
			PASS: '合格',
			FAIL: '不合格',
			EMPTY: '空桶',
			PENDING: '未处理',
		};
		const confirmMsg = '确认为' + orderStateName[orderState] + '状态吗?';
		this.dialog
			.open(ConfirmDialogComponent, {
				data: { content: confirmMsg },
				width: '360px',
			})
			.afterClosed()
			.subscribe((res) => {
				if (res == 'ok') {
					this.blockUIService.setBlockStatus(true);
					this.commonService.changeTrashlogState(id, orderState).subscribe(
						(res: any) => {
							this.blockUIService.setBlockStatus(false);
							this.snackBar.open(res.msg, '确认', { duration: 1500 });
							if (res.data) {
								this.getTrashLogs();
							}
						},
						(err: HttpErrorResponse) => {
							this.blockUIService.setBlockStatus(false);
							this.snackBar.open(err.error.msg, '确认', { duration: 4000 });
						},
					);
				}
			});
	}

	public deductPoint(trashlog) {
		this.dialog
			.open(PasswordDialogComponent, {
				data: null,
				width: '360px',
			})
			.afterClosed()
			.subscribe((res) => {
				if (res == 'ok') {
					this.dialog
						.open(DeductPointComponent, {
							data: trashlog,
							width: '600px',
						})
						.afterClosed()
						.subscribe((data) => {
							if (data) {
								this.getTrashLogs();
							}
						});
				}
			});
	}

	public openPicture(trashlog): void {
		let _albums: any = [];
		const src = this.serverUrl + '/' + trashlog.pictureUrl;
		const album = {
			src: src,
		};

		_albums.push(album);
		this.lightbox.open(_albums, 0, { fadeDuration: 0.3, resizeDuration: 0.2, centerVertically: true });
	}

	getAllTrashLogs(resolve) {
		this.blockUIService.setBlockStatus(true);
		this.commonService
			.getTrashLogs({
				city: this.commonData.city.id,
				search: this.searchForm.value.keyword,
				dustTypes: '' + this.dustType,
				deduct: this.searchForm.value.deduct,
				startDate: this.searchForm.value.startDate.getTime(),
				endDate: this.searchForm.value.endDate.getTime(),
				state: this.state,
				active: this.sortParam.active,
				direction: this.sortParam.direction,
			})
			.subscribe(
				(res: any) => {
					this.blockUIService.setBlockStatus(false);
					resolve(res.data.trashlogs);
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
						self.getAllTrashLogs(resolve);
					}).then(function (value: any) {
						const orderStateName = {
							PASS: '合格',
							FAIL: '不合格',
							EMPTY: '空桶',
							PENDING: '未处理',
						};
						let printData: any[] = [];
						value.forEach((element) => {
							printData.push({
								No: element.index + 1,
								用户: element.user ? element.user.name : '',
								卡号: element.cardId,
								垃圾名称:
									element.dustType == 'A'
										? element.trash.city.dustAName
										: element.trash.city.dustBName,
								重量: element.amount,
								积分: element.point,
								状态: orderStateName[element.state],
								创建时间: moment(element.createdAt).format('YYYY.MM.DD - HH:mm:ss'),
								['自动/手动']: element.deviceType == 'MANUAL' ? '手动' : '自动',
								分类违规扣除积分: element.deductionPoint ? element.deductionPoint : '',
								审核评定日期: element.reviewAt
									? moment(element.reviewAt).format('YYYY.MM.DD - HH:mm:ss')
									: '',
								审核评定人: element.reviewer ? element.reviewer.name : '',
							});
						});
						self.commonService.exportAsExcelFile(printData, '垃圾分类');
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
						self.getAllTrashLogs(resolve);
					}).then(function (value: any) {
						const orderStateName = {
							PASS: '合格',
							FAIL: '不合格',
							EMPTY: '空桶',
							PENDING: '未处理',
						};
						let printData: any[] = [];
						value.forEach((element) => {
							printData.push({
								index: element.index + 1,
								userName: element.user ? element.user.name : '',
								cardId: element.cardId,
								dustName:
									element.dustType == 'A'
										? element.trash.city.dustAName
										: element.trash.city.dustBName,
								amount: element.amount,
								point: element.point,
								state: orderStateName[element.state],
								createdAt: moment(element.createdAt).format('YYYY.MM.DD - HH:mm:ss'),
								deviceType: element.deviceType == 'MANUAL' ? '手动' : '自动',
								deductionPoint: element.deductionPoint ? element.deductionPoint : '',
								reviewAt: element.reviewAt
									? moment(element.reviewAt).format('YYYY.MM.DD - HH:mm:ss')
									: '',
								reviewer: element.reviewer ? element.reviewer.name : '',
							});
						});
						self.commonService.printTable({
							columns: [
								'index',
								'userName',
								'cardId',
								'dustName',
								'amount',
								'point',
								'state',
								'createdAt',
								'deviceType',
								'deductionPoint',
								'reviewAt',
								'reviewer',
							],
							headers: [
								'No',
								'用户',
								'卡号',
								'垃圾名称',
								'重量',
								'积分',
								'状态',
								'创建时间',
								'自动/手动',
								'分类违规扣除积分',
								'审核评定日期',
								'审核评定人',
							],
							content: printData,
						});
					});
				}
			});
	}
}
