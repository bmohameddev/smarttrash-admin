import { Component, OnInit, ViewEncapsulation, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { AppSettings } from '@app/app.settings';
import { Settings } from '@app/app.settings.model';
import { User } from '$/models/user.model';
import { SelectionModel } from '@angular/cdk/collections';
import { FormBuilder, FormGroup, EmailValidator } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { environment } from '@env/environment';
import { BlockUIService } from '$/services/block-ui.service';
import { CommonService } from '$/services/common.service';
import { Subscription } from 'rxjs';
import { debounceTime, filter } from 'rxjs/operators';
import * as _ from 'underscore';

@Component({
	selector: 'app-trash',
	templateUrl: './trash.component.html',
	styleUrls: ['./trash.component.scss'],
	animations: [
		trigger('detailExpand', [
			state('collapsed', style({ height: '0px', minHeight: '0' })),
			state('expanded', style({ height: '*' })),
			transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
		]),
	],
})
export class TrashComponent implements OnInit, OnDestroy {
	public displayedColumns: string[] = [
		'index',
		'deviceId',
		'city',
		'address',
		'dustAAmount',
		'dustBAmount',
		'totalPoint',
		'operationCnt',
		'state',
		'topAdmin',
		'admin',
	];
	public dataSource: any;
	public selection = new SelectionModel<any>(true, []);
	public serverUrl = environment.apiUrl;
	public totalTrashes: number;
	public totalCnt: number;
	private pageSize: number = 10;
	public pageIndex: number;
	private search: string = '';
	private sortParam = {
		active: '',
		direction: '',
	};
	public selectedYear: string = String(new Date().getFullYear());
	public selectedMonth: string = '';
	public selectedDate: string = '';
	public autocomplete: any[];
	private autocompleteSubscription: Subscription;
	public form: FormGroup;
	public trash;
	public dustName: any[] = [];

	public commonData: any;
	private commonDataUpdatesSubscription: Subscription;

	constructor(
		private route: ActivatedRoute,
		private fb: FormBuilder,
		public router: Router,
		private blockUIService: BlockUIService,
		private commonService: CommonService,
		private snackBar: MatSnackBar,
		public dialog: MatDialog,
	) {}

	ngOnInit() {
		this.commonDataUpdatesSubscription = this.commonService.getCommonDataUpdates().subscribe((commonData) => {
			this.commonData = commonData;
			if (this.commonData.city) {
				this.dustName = _.pluck(JSON.parse(this.commonData.city.dusts), 'name');
			} else if (this.commonData.defaultSetting) {
				this.dustName = _.pluck(JSON.parse(this.commonData.defaultSetting.dusts), 'name');
			}
			this.getTrashesReport();
		});
	}

	ngOnDestroy() {
		this.commonDataUpdatesSubscription.unsubscribe();
	}

	public getTrashesReport(event?) {
		if (event) {
			this.pageSize = event.pageSize;
			this.pageIndex = event.pageIndex;
		}

		this.commonService
			.getTrashesReport({
				limit: this.pageSize,
				offset: this.pageIndex,
				search: this.search,
				selectedYear: this.selectedYear,
				selectedMonth: this.selectedMonth,
				selectedDate: this.selectedDate,
				city: this.commonData.city.id,
				active: this.sortParam.active,
				direction: this.sortParam.direction,
			})
			.subscribe(
				(res: any) => {
					if (res.data) {
						this.totalTrashes = res.data.totalCnt;
						this.totalCnt = res.data.totalCnt;
						this.dataSource = new MatTableDataSource<any>(res.data.trashes);
						this.selection.clear();
					} else {
						this.snackBar.open(res.msg, '确认', { duration: 1500 });
					}
				},
				(err: HttpErrorResponse) => {
					this.snackBar.open(err.error.msg, '确认', { duration: 4000 });
				},
			);
	}

	changeDate(data) {
		if (data) {
			this.selectedYear = data.selectedYear;
			this.selectedMonth = data.selectedMonth;
			this.selectedDate = data.selectedDate;
			this.getTrashesReport();
		}
	}
}
