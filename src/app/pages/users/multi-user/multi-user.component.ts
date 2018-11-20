import { Component, OnInit, ViewEncapsulation, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { AppSettings } from '@app/app.settings';
import { Settings } from '@app/app.settings.model';
import { User } from '$/models/user.model';
import { AddUserComponent } from '../add-user/add-user.component';
import { SelectionModel } from '@angular/cdk/collections';
import { FormBuilder, FormGroup, EmailValidator } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { environment } from '@env/environment';
import { BlockUIService } from '$/services/block-ui.service';
import { CommonService } from '$/services/common.service';
import { AuthenticationService } from '$/services/authentication.service';
import { ConfirmDialogComponent } from '$/components/confirm-dialog/confirm-dialog.component';
import * as moment from 'moment';

@Component({
	selector: 'app-multi-user',
	templateUrl: './multi-user.component.html',
	styleUrls: ['./multi-user.component.scss'],
	animations: [
		trigger('detailExpand', [
			state('collapsed', style({ height: '0px', minHeight: '0' })),
			state('expanded', style({ height: '*' })),
			transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
		]),
	],
})
export class MultiUserComponent implements OnInit, OnDestroy {
	public submitted: boolean;
	public displayedColumns: string[] = [
		'select',
		'index',
		'name',
		'cardIds',
		'phone',
		'city',
		'address',
		'createStatus',
	];
	public dataSource: any;
	public selection = new SelectionModel<any>(true, []);
	public totalCnt: number;
	private pageSize: number = 10;
	public pageIndex: number;
	private search: string = '';
	private sortParam = {
		active: '',
		direction: '',
	};
	infoForm: FormGroup;
	serverUrl = environment.apiUrl;

	public users;

	public user: any;
	private userUpdatesSubscription: Subscription;

	public commonData: any;
	private commonDataUpdatesSubscription: Subscription;

	constructor(
		public router: Router,
		private blockUIService: BlockUIService,
		public commonService: CommonService,
		private authenticationService: AuthenticationService,
		private snackBar: MatSnackBar,
		public dialog: MatDialog,
	) {}

	ngOnInit() {
		this.userUpdatesSubscription = this.authenticationService
			.getUserUpdates()
			.subscribe((user) => (this.user = user));
		this.commonDataUpdatesSubscription = this.commonService.getCommonDataUpdates().subscribe((commonData) => {
			this.commonData = commonData;
			this.getUsers();
		});
	}

	ngOnDestroy() {
		this.userUpdatesSubscription.unsubscribe();
		this.commonDataUpdatesSubscription.unsubscribe();
	}

	public getUsers(): void {
		const importData = this.commonService.getImportData();
		if (importData) {
			this.users = [];
			importData.forEach((element, index) => {
				this.users.push({
					index: index,
					name: '' + element.姓名,
					cardIds: '未知',
					phone: element.电话号,
					city: this.commonData.city,
					address: element.详细地址,
				});
			});
			this.filterUsers();
		} else {
			this.router.navigateByUrl('/users/list');
		}
	}

	filterUsers() {
		this.dataSource = new MatTableDataSource<any>(
			this.users.filter((element) => {
				return (
					element.name.match(new RegExp(this.search, 'i')) ||
					element.cardIds.match(new RegExp(this.search, 'i')) ||
					element.phone.match(new RegExp(this.search, 'i'))
				);
			}),
		);
		this.dataSource.data.forEach((row) => this.selection.select(row));
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

	applySearch(searchValue: string) {
		this.search = searchValue.trim().toLowerCase();
		this.filterUsers();
	}

	public addUsers() {
		const confirmMsg = '确认添加吗?';
		this.dialog
			.open(ConfirmDialogComponent, {
				data: { content: confirmMsg },
				width: '360px',
			})
			.afterClosed()
			.subscribe((res) => {
				if (res === 'ok') {
					this.createUser(0);
				}
			});
	}

	public createUser(index) {
		const row = this.dataSource.data[index];
		if (!row) {
			return;
		}
		if (row.createStatus !== 'OK' && this.selection.selected.some((selected) => selected.index === row.index)) {
			const userData = {
				name: row.name,
				phone: row.phone,
				city: row.city.name,
				address: row.address,
			};
			// console.log('save', index);
			this.blockUIService.setBlockStatus(true);
			this.commonService.createUser(userData).subscribe(
				(res: any) => {
					this.blockUIService.setBlockStatus(false);
					console.log(res);
					if (res.data) {
						this.dataSource.data[index].cardIds = res.data.cardIds;
						this.dataSource.data[index].createStatus = 'OK';
					} else {
						this.dataSource.data[index].createStatus = res.msg;
					}
					this.submitted = false;
					this.createUser(index + 1);
				},
				(err: HttpErrorResponse) => {
					this.blockUIService.setBlockStatus(false);
					this.submitted = false;
					this.dataSource.data[index].createStatus = 'Http Error';
					this.createUser(index + 1);
				},
			);
		} else {
			// console.log('ignore', index);
			this.createUser(index + 1);
		}
	}
}
