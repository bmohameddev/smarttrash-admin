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
import * as moment from 'moment';
import * as _ from 'underscore';

@Component({
	selector: 'app-exchanger',
	templateUrl: './exchanger.component.html',
	styleUrls: ['./exchanger.component.scss'],
	animations: [
		trigger('detailExpand', [
			state('collapsed', style({ height: '0px', minHeight: '0' })),
			state('expanded', style({ height: '*' })),
			transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
		]),
	],
})
export class ExchangerComponent implements OnInit, OnDestroy {
	public serverUrl = environment.apiUrl;
	public dustName: any[] = [];
	public pointResult;

	public searchForm: FormGroup;

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
		this.userUpdatesSubscription = this.authenticationService.getUserUpdates().subscribe((user) => {
			this.user = user;
		});
		this.searchForm = this.fb.group({
			startDate: [moment().startOf('year').toDate()],
			endDate: [new Date()],
		});

		this.commonDataUpdatesSubscription = this.commonService.getCommonDataUpdates().subscribe((commonData) => {
			this.commonData = commonData;
			this.refreshDustName();
			if (this.commonData.city) {
				this.dustName = _.pluck(JSON.parse(this.commonData.city.dusts), 'name');
			} else if (this.commonData.defaultSetting) {
				this.dustName = _.pluck(JSON.parse(this.commonData.defaultSetting.dusts), 'name');
			}
			if (this.commonData.city) {
				this.getTotalResult();
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
	}

	public getTotalResult() {
		if (moment(this.searchForm.value.startDate).isValid() && moment(this.searchForm.value.endDate).isValid()) {
			this.commonService
				.getTotalResult({
					startDate: this.searchForm.value.startDate.getTime(),
					endDate: this.searchForm.value.endDate.getTime(),
					city: this.commonData.city.id,
				})
				.subscribe(
					(res: any) => {
						this.blockUIService.setBlockStatus(false);
						if (res.data) {
							this.pointResult = res.data;
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
	}

	applySearch() {
		this.getTotalResult();
	}
}
