import { Component, OnInit, ViewEncapsulation, ViewChild, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { AppSettings } from '@app/app.settings';
import { Settings } from '@app/app.settings.model';
import { Question, Answer } from '$/models/question.model';
import { AuthenticationService } from '$/services/authentication.service';
import { SelectionModel } from '@angular/cdk/collections';
import { FormBuilder, FormGroup, EmailValidator, FormControl } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { AddTrashComponent } from '../add-trash/add-trash.component';
import { environment } from '@env/environment';
import { BlockUIService } from '$/services/block-ui.service';
import { CommonService } from '$/services/common.service';
import { SocketsService } from '$/services/sockets.service';
import { ConfirmDialogComponent } from '$/components/confirm-dialog/confirm-dialog.component';
import { PasswordDialogComponent } from '$/components/password-dialog/password-dialog.component';
import * as moment from 'moment';
import * as _ from 'underscore';

@Component({
	selector: 'app-list-trash',
	templateUrl: './list-trash.component.html',
	styleUrls: ['./list-trash.component.scss'],
	animations: [
		trigger('detailExpand', [
			state('collapsed', style({ height: '0px', minHeight: '0' })),
			state('expanded', style({ height: '*' })),
			transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
		]),
	],
})
export class ListTrashComponent implements OnInit, OnDestroy {
	public displayedColumns: string[] = [
		'select',
		'index',
		'deviceId',
		'location',
		'city',
		'address',
		'createdAt',
		'topAdmin',
		'topAdminPhone',
		'state',
		'warn',
		'menu',
	];
	public displayedColumnsMobile: string[] = ['select', 'index', 'deviceId', 'city', 'state', 'menu'];
	public dataSource: any;
	public selection = new SelectionModel<any>(true, []);
	public totalCnt: number;
	public pageIndex: number;
	public infoForm: FormGroup;
	public serverUrl = environment.apiUrl;
	private pageSize = 10;
	private sortParam = {
		active: '',
		direction: '',
	};
	public dustName: any[] = [];

	public trashes;
	public searchForm: FormGroup;

	public user: any;
	private userUpdatesSubscription: Subscription;

	public commonData: any;
	private commonDataUpdatesSubscription: Subscription;

	constructor(
		private router: Router,
		private fb: FormBuilder,
		public dialog: MatDialog,
		private blockUIService: BlockUIService,
		public commonService: CommonService,
		private socketsService: SocketsService,
		private snackBar: MatSnackBar,
		private authenticationService: AuthenticationService,
	) {}

	ngOnInit() {
		this.searchForm = this.fb.group({
			keyword: '',
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
			this.getTrashes();
		});
	}

	ngOnDestroy() {
		this.userUpdatesSubscription.unsubscribe();
		this.commonDataUpdatesSubscription.unsubscribe();
	}

	public openTrashDialog(trash?: any) {
		this.dialog
			.open(AddTrashComponent, {
				data: trash,
				width: '800px',
			})
			.afterClosed()
			.subscribe((data) => {
				if (data) {
					this.getTrashes();
				}
			});
	}

	searchBoxAction() {
		this.getTrashes();
	}

	getTrashes(event?) {
		if (event) {
			this.pageSize = event.pageSize;
			this.pageIndex = event.pageIndex;
		}
		this.blockUIService.setBlockStatus(true);
		this.commonService
			.getTrashes({
				limit: this.pageSize,
				offset: this.pageIndex,
				search: this.searchForm.value.keyword,
				city: this.commonData.city.id,
				active: this.sortParam.active,
				direction: this.sortParam.direction,
			})
			.subscribe(
				(res: any) => {
					this.blockUIService.setBlockStatus(false);
					this.totalCnt = res.data.totalCnt;
					this.trashes = res.data.trashes;
					res.data.trashes.forEach((element) => {
						if (
							element.voltage < 10 * (element.voltageType === 'DC12' ? 1 : 2) ||
							element.voltage > 15 * (element.voltageType === 'DC12' ? 1 : 2)
						) {
							element.voltageState = 'error';
						} else if (element.voltage < 11 * (element.voltageType === 'DC12' ? 1 : 2)) {
							element.voltageState = 'warn';
						}
						if (element.level > element.levelLimit * 0.8 || element.level < element.levelLimit * 0.2) {
							element.levelState = 'warn';
						}
						if (element.temperature > 60.0) {
							element.temperatureState = 'warn';
						}
						if (element.dustHeight1 > (element.trashHeight - element.trashMargin) * 0.8) {
							element.dustHeight1State = 'error';
						}
						if (element.dustHeight2 > (element.trashHeight - element.trashMargin) * 0.8) {
							element.dustHeight2State = 'error';
						}
						if (element.dustHeight3 > (element.trashHeight - element.trashMargin) * 0.8) {
							element.dustHeight3State = 'error';
						}
						if (element.dustHeight4 > (element.trashHeight - element.trashMargin) * 0.8) {
							element.dustHeight4State = 'error';
						}
					});
					this.dataSource = new MatTableDataSource<any>(this.processData(res.data.trashes));
					this.selection.clear();
					if (this.totalCnt <= this.pageSize * this.pageIndex) {
						this.pageIndex = 0;
					}
				},
				(err: HttpErrorResponse) => {
					this.blockUIService.setBlockStatus(false);
					this.snackBar.open(err.error.msg, '确认', { duration: 4000 });
				},
			);
	}

	processData(trashes) {
		trashes.forEach((element) => {
			let totalPoint = 0;
			element.trashlogs.forEach((item) => {
				totalPoint += item.amount * (item.dust ? item.dust.point : 0);
			});
			element.totalPoint = totalPoint;
		});
		return trashes;
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
		this.getTrashes();
	}

	applySearch() {
		this.getTrashes();
	}

	changeQuestionTag() {
		this.getTrashes();
	}

	public deleteTrashes() {
		const ids = [];
		this.dataSource.data.forEach((row, index) => {
			if (this.selection.selected.some((selected) => selected.index === row.index)) {
				ids.push(row.id);
			}
		});
		this.finalDeleteTrashes(ids);
	}

	public deleteTrash(event, id) {
		event.stopPropagation();
		const ids = [];
		ids.push(id);
		this.finalDeleteTrashes(ids);
	}

	public finalDeleteTrashes(ids) {
		if (ids.length) {
			const confirmMsg = '确认删除吗?';
			this.dialog
				.open(ConfirmDialogComponent, {
					data: { content: confirmMsg },
					width: '360px',
				})
				.afterClosed()
				.subscribe((response) => {
					if (response === 'ok') {
						this.blockUIService.setBlockStatus(true);
						this.commonService.deleteTrashes(ids).subscribe(
							(res: any) => {
								this.blockUIService.setBlockStatus(false);
								this.snackBar.open(res.msg, '确认', { duration: 1500 });
								if (res.data) {
									this.getTrashes();
								}
							},
							(err: HttpErrorResponse) => {
								this.blockUIService.setBlockStatus(false);
								this.snackBar.open(err.error.msg, '确认', { duration: 4000 });
							},
						);
					}
				});
		} else {
			this.snackBar.open('选择垃圾!', '确认', { duration: 1500 });
		}
	}

	saveVolume(trash) {
		this.blockUIService.setBlockStatus(true);
		this.commonService.updateVolume(trash.id, trash.volume).subscribe(
			(res: any) => {
				this.blockUIService.setBlockStatus(false);
				this.snackBar.open(res.msg, '确认', { duration: 1500 });
				this.socketsService.notify('updatedData', {
					type: 'trash-volume',
					deviceId: trash.deviceId,
					volume: trash.volume,
				});
			},
			(err: HttpErrorResponse) => {
				this.blockUIService.setBlockStatus(false);
				this.snackBar.open(err.error.msg, '确认', { duration: 4000 });
			},
		);
	}

	getAllTrashes(resolve) {
		this.blockUIService.setBlockStatus(true);
		this.commonService
			.getTrashes({
				search: this.searchForm.value.keyword,
				city: this.commonData.city.id,
				active: this.sortParam.active,
				direction: this.sortParam.direction,
			})
			.subscribe(
				(res: any) => {
					this.blockUIService.setBlockStatus(false);
					if (res.data) {
						resolve(res.data.trashes);
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
				if (res === 'ok') {
					const self = this;
					new Promise(function (resolve, reject) {
						self.getAllTrashes(resolve);
					}).then(function (value: any) {
						const printData: any[] = [];
						value.forEach((element) => {
							printData.push({
								No: element.index + 1,
								设备ID: element.deviceId,
								位置: '' + (element.lat ? element.lat : '') + ' ' + (element.lng ? element.lng : ''),
								城市: element.city.name,
								详细地址: element.address,
								创建时间: moment(element.createdAt).format('YYYY.MM.DD - HH:mm:ss'),
								地区总管理员: element.city.topAdmin ? element.city.topAdmin.name : '',
								电话号码: element.city.topAdmin ? element.city.topAdmin.phone : '',
							});
						});
						self.commonService.exportAsExcelFile(printData, '设备');
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
						self.getAllTrashes(resolve);
					}).then(function (value: any) {
						const printData: any[] = [];
						value.forEach((element) => {
							printData.push({
								index: element.index + 1,
								deviceId: element.deviceId,
								location:
									'' + (element.lat ? element.lat : '') + ' ' + (element.lng ? element.lng : ''),
								city: element.city.name,
								address: element.address,
								createdAt: moment(element.createdAt).format('YYYY.MM.DD - HH:mm:ss'),
								topAdmin: element.city.topAdmin ? element.city.topAdmin.name : '',
								topAdminPhone: element.city.topAdmin ? element.city.topAdmin.phone : '',
							});
						});
						self.commonService.printTable({
							columns: [
								'index',
								'deviceId',
								'location',
								'city',
								'address',
								'createdAt',
								'topAdmin',
								'topAdminPhone',
							],
							headers: [
								'No',
								'设备ID',
								'位置',
								'城市',
								'详细地址',
								'创建时间',
								'地区总管理员',
								'电话号码',
							],
							content: printData,
						});
					});
				}
			});
	}
}
