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
	selector: 'app-cities',
	templateUrl: './cities.component.html',
	styleUrls: ['./cities.component.scss'],
	animations: [
		trigger('detailExpand', [
			state('collapsed', style({ height: '0px', minHeight: '0' })),
			state('expanded', style({ height: '*' })),
			transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
		]),
	],
})
export class CitiesComponent implements OnInit, OnDestroy {
	public displayedColumns: string[] = ['index', 'name', 'dustAAmount', 'dustBAmount', 'totalPoint', 'operationCnt'];
	public dataSource: any;
	public selection = new SelectionModel<any>(true, []);
	public serverUrl = environment.apiUrl;
	public totalCities: number;
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
	public autocomplete: any[] = [];
	private autocompleteSubscription: Subscription;
	public form: FormGroup;
	public trash;
	public city;
	public dustName: any[] = [];
	public dateType = 'year';

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
			if (this.user && this.user.city) {
				this.city = this.user.city;
				// this.getCitiesReport();
			}
		});

		this.commonDataUpdatesSubscription = this.commonService.getCommonDataUpdates().subscribe((commonData) => {
			this.commonData = commonData;
			if (this.commonData.city) {
				this.dustName = _.pluck(JSON.parse(this.commonData.city.dusts), 'name');
			} else if (this.commonData.defaultSetting) {
				this.dustName = _.pluck(JSON.parse(this.commonData.defaultSetting.dusts), 'name');
			}
			// this.getCitiesReport();
		});
	}

	ngOnDestroy() {
		this.commonDataUpdatesSubscription.unsubscribe();
		this.userUpdatesSubscription.unsubscribe();
	}

	public getCitiesReport(event?) {
		if (event) {
			this.pageSize = event.pageSize;
			this.pageIndex = event.pageIndex;
		}

		this.commonService
			.getCitiesReport(
				this.pageSize,
				this.pageIndex,
				this.search,
				this.selectedYear,
				this.selectedMonth,
				this.selectedDate,
				this.sortParam.active,
				this.sortParam.direction,
			)
			.subscribe(
				(res: any) => {
					if (res.data) {
						this.totalCities = res.data.totalCnt;
						this.totalCnt = res.data.totalCnt;
						this.dataSource = new MatTableDataSource<any>(res.data.cities);
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
			this.getCitiesReport();
		}
	}
}
