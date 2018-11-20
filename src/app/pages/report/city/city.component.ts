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
import { AuthenticationService } from '$/services/authentication.service';
import { Subscription } from 'rxjs';
import { debounceTime, filter } from 'rxjs/operators';
import * as _ from 'underscore';

@Component({
	selector: 'app-city',
	templateUrl: './city.component.html',
	styleUrls: ['./city.component.scss'],
	animations: [
		trigger('detailExpand', [
			state('collapsed', style({ height: '0px', minHeight: '0' })),
			state('expanded', style({ height: '*' })),
			transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
		]),
	],
})
export class CityComponent implements OnInit, OnDestroy {
	public displayedColumns: string[] = ['index', 'totalPoint', 'totalCnt'];
	public dataSource: any;
	public selection = new SelectionModel<any>(true, []);
	public serverUrl = environment.apiUrl;
	public selectedYear: string = '';
	public selectedMonth: string = '';
	public autocomplete: any[] = [];
	public form: FormGroup;
	public trash;
	public city;
	public dateType = 'year';
	public dustName: any[] = [];

	public totalUserCnt: number = 0;
	public resident: number = 0;
	// public totalCnt: number = 0;
	// public passedCnt: number = 0;
	// public dustATotalCnt: number = 0;
	// public dustAPassedCnt: number = 0;
	// public dustBTotalCnt: number = 0;
	// public dustBPassedCnt: number = 0;
	// public dustAAmount: number = 0;
	// public dustBAmount: number = 0;
	// public dustAUserCnt: number = 0;
	// public dustBUserCnt: number = 0;
	public pointResult;

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
		if (this.route.snapshot.paramMap.has('dateType')) {
			this.dateType = this.route.snapshot.paramMap.get('dateType');
		}

		this.userUpdatesSubscription = this.authenticationService.getUserUpdates().subscribe((user) => {
			this.user = user;
		});

		this.commonDataUpdatesSubscription = this.commonService.getCommonDataUpdates().subscribe((commonData) => {
			this.commonData = commonData;
			this.refreshDustName();
			if (this.commonData.city) {
				this.totalUserCnt = this.commonData.city.user;
				this.resident = this.commonData.city.resident;
				this.dustName = _.pluck(JSON.parse(this.commonData.city.dusts), 'name');
			} else if (this.commonData.defaultSetting) {
				this.dustName = _.pluck(JSON.parse(this.commonData.defaultSetting.dusts), 'name');
				this.getTotalUsers();
			}
		});
	}

	ngOnDestroy() {
		this.commonDataUpdatesSubscription.unsubscribe();
		this.userUpdatesSubscription.unsubscribe();
	}

	refreshDustName() {
		if (this.commonData.city) {
			this.dustName = _.pluck(JSON.parse(this.commonData.city.dusts), 'name');
		} else if (this.commonData.defaultSetting) {
			this.dustName = _.pluck(JSON.parse(this.commonData.defaultSetting.dusts), 'name');
		}
		this.displayedColumns = ['index'];
		this.dustName.forEach((eleemnt, idx) => {
			this.displayedColumns.push('dustAmount' + idx);
		});
		this.displayedColumns = this.displayedColumns.concat(['totalPoint', 'totalCnt']);
	}

	public getCityReport() {
		this.commonService
			.getCityReport(this.commonData.city ? this.commonData.city.id : '', this.selectedYear, this.selectedMonth)
			.subscribe(
				(res: any) => {
					if (res.data) {
						this.pointResult = res.data.pointResult;
						// this.totalCnt = res.data.pointResult.totalCnt;
						// this.passedCnt = res.data.pointResult.passedCnt;
						// this.dustATotalCnt = res.data.pointResult.dustATotalCnt;
						// this.dustAPassedCnt = res.data.pointResult.dustAPassedCnt;
						// this.dustBTotalCnt = res.data.pointResult.dustBTotalCnt;
						// this.dustBPassedCnt = res.data.pointResult.dustBPassedCnt;
						// this.dustAAmount = res.data.pointResult.dustAAmount;
						// this.dustBAmount = res.data.pointResult.dustBAmount;
						// this.dustAUserCnt = res.data.pointResult.dustAUserCnt;
						// this.dustBUserCnt = res.data.pointResult.dustBUserCnt;
						this.dataSource = new MatTableDataSource<any>(res.data.result);
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

	public getTotalUsers() {
		this.commonService.getTotalUsers().subscribe(
			(res: any) => {
				if (res.data) {
					this.totalUserCnt = res.data.totalUserCnt;
					this.resident = res.data.resident;
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
			this.dateType = data.dateType;
			this.selectedYear = data.selectedYear;
			this.selectedMonth = data.selectedMonth;
			this.getCityReport();
		}
	}
}
