import { Component, OnInit, ViewEncapsulation, OnDestroy } from '@angular/core';
import { SelectionModel } from '@angular/cdk/collections';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, FormGroup, EmailValidator } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { AppSettings } from '@app/app.settings';
import { Settings } from '@app/app.settings.model';
import { User } from '$/models/user.model';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { environment } from '@env/environment';
import { BlockUIService } from '$/services/block-ui.service';
import { CommonService } from '$/services/common.service';
import { AuthenticationService } from '$/services/authentication.service';
import { Subscription } from 'rxjs';
import { debounceTime, filter } from 'rxjs/operators';
import * as _ from 'underscore';

@Component({
	selector: 'app-detail-city',
	templateUrl: './detail-city.component.html',
	styleUrls: ['./detail-city.component.scss'],
	animations: [
		trigger('detailExpand', [
			state('collapsed', style({ height: '0px', minHeight: '0' })),
			state('expanded', style({ height: '*' })),
			transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
		]),
	],
})
export class DetailCityComponent implements OnInit, OnDestroy {
	public displayedColumns: string[] = ['index', 'totalPoint', 'totalCnt'];
	public dataSource: any;
	public selection = new SelectionModel<any>(true, []);
	public serverUrl = environment.apiUrl;
	public selectedYear: string = '';
	public selectedMonth: string = '';
	public autocomplete: any[] = [];
	private autocompleteSubscription: Subscription;
	public form: FormGroup;
	public trash;
	public city;
	public dateType = 'year';
	public dustName: any[] = [];

	// public user: any;
	// private userUpdatesSubscription: Subscription;

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
		this.form = this.fb.group({
			search: '',
		});

		// this.userUpdatesSubscription = this.authenticationService
		// 	.getUserUpdates()
		// 	.subscribe(user => {
		//         this.user = user;
		//         if (this.user && this.user.city) {
		//             this.city = this.user.city;
		//             this.form.controls.search.setValue(this.city.name);
		//             this.getCityReport();
		//         }
		//     });
		this.commonDataUpdatesSubscription = this.commonService.getCommonDataUpdates().subscribe((commonData) => {
			this.commonData = commonData;
		});

		this.autocompleteSubscription = this.form
			.get('search')
			.valueChanges.pipe(debounceTime(100))
			.subscribe((text) => {
				if (text.trim()) {
					this.commonService.getCities(null, null, text, null, null).subscribe((res: any) => {
						this.autocomplete = res.data.cities;
					});
				} else {
					this.autocomplete.splice(0);
				}
			});

		this.route.paramMap.subscribe((params) => {
			if (params.has('id')) {
				const id = params.get('id');
				this.commonService.getCity(id).subscribe((res: any) => {
					this.city = res.data;
					this.form.controls.search.setValue(this.city.name);
					this.getCityReport();
				});
			}
		});
	}

	ngOnDestroy() {
		this.commonDataUpdatesSubscription.unsubscribe();
		// this.userUpdatesSubscription.unsubscribe();
	}

	refreshDustName() {
		this.dustName = _.pluck(JSON.parse(this.city.dusts), 'name');
		this.displayedColumns = ['index'];
		this.dustName.forEach((eleemnt, idx) => {
			this.displayedColumns.push('dustAmount' + idx);
		});
		this.displayedColumns = this.displayedColumns.concat(['totalPoint', 'totalCnt']);
	}

	public getCityReport() {
		if (this.city) {
			this.refreshDustName();
			this.blockUIService.setBlockStatus(true);
			this.commonService.getCityReport(this.city.id, this.selectedYear, this.selectedMonth).subscribe(
				(res: any) => {
					this.blockUIService.setBlockStatus(false);
					if (res.data) {
						this.dataSource = new MatTableDataSource<any>(res.data.result);
						this.selection.clear();
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
	}

	searchBoxAction() {
		let temp;
		if (this.autocomplete.length == 1) {
			temp = this.autocomplete;
		} else {
			temp = this.autocomplete.filter((element) => element.name == this.form.value.search);
		}
		this.city = '';
		if (temp.length == 1) {
			this.city = temp[0];
			this.getCityReport();
			this.autocomplete.splice(0);
			this.form.controls.search.setValue(this.city.name);
		}
	}

	goToList() {
		this.router.navigateByUrl('cities/list');
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
