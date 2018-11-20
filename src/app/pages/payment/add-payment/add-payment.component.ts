import { Component, OnInit, Inject, ViewChild, ElementRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { User } from '$/models/user.model';
import { HttpErrorResponse } from '@angular/common/http';
import { BlockUIService } from '$/services/block-ui.service';
import { CommonService } from '$/services/common.service';
import { FormValidationService } from '$/services/form-validation.service';
import { environment } from '@env/environment';
import { startWith, debounceTime } from 'rxjs/operators';
import * as moment from 'moment';

@Component({
	selector: 'app-add-payment',
	templateUrl: './add-payment.component.html',
	styleUrls: ['./add-payment.component.scss'],
})
export class AddPaymentComponent implements OnInit {
	public submitted: boolean;
	public form: FormGroup;
	public cardIds = [];
	private totalPoint;
	serverUrl = environment.apiUrl;

	public dusts: Array<any> = [];

	public commonData: any;

	constructor(
		public dialogRef: MatDialogRef<AddPaymentComponent>,
		@Inject(MAT_DIALOG_DATA) public user: any,
		public fb: FormBuilder,
		private blockUIService: BlockUIService,
		private commonService: CommonService,
		private snackBar: MatSnackBar,
		private formValidationService: FormValidationService,
	) {}

	ngOnInit() {
		this.commonData = this.commonService.getCommonData();
		this.refreshDust();

		this.form = this.fb.group({
			dustType: ['', Validators.compose([Validators.required])],
			startDate: [null, Validators.compose([Validators.required])],
			endDate: [null, Validators.compose([Validators.required])],
			totalPoint: ['', Validators.compose([Validators.required, Validators.min(0.1)])],
			rate: [this.commonData.city?.rate || '', Validators.compose([Validators.required])],
			totalMoney: ['', Validators.compose([Validators.required, Validators.min(0.1)])],
			paymentPoint: ['', Validators.compose([Validators.required, Validators.min(0.1)])],
			paymentMoney: ['', Validators.compose([Validators.required, Validators.min(0.1)])],
			description: [''],
		});
	}

	ngOnDestroy() {}

	checkError(form, field, error) {
		return this.formValidationService.checkError(form, field, error);
	}

	close(): void {
		this.dialogRef.close();
	}

	refreshDust() {
		if (!this.commonData.city) return;
		try {
			this.dusts = JSON.parse(this.commonData.city.dusts);
		} catch (e) {
			console.log('Dusts Error');
		}
	}

	getReport() {
		if (moment(this.form.value.startDate).isValid() && moment(this.form.value.endDate).isValid()) {
			this.commonService
				.getTotalResult({
					startDate: this.form.value.startDate.getTime(),
					endDate: this.form.value.endDate.getTime(),
					city: this.commonData.city.id,
				})
				.subscribe(
					(res: any) => {
						this.blockUIService.setBlockStatus(false);
						if (res.data) {
							if (res.data.totalPoint) {
								this.totalPoint = res.data.dustPoint;
								this.updateTotalPoint();
							}
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

	updateTotalPoint() {
		if (this.totalPoint && this.form.value.dustType + '' && this.totalPoint[this.form.value.dustType]) {
			this.form.controls.totalPoint.setValue(this.totalPoint[this.form.value.dustType]);
			this.form.controls.totalMoney.setValue(
				this.totalPoint[this.form.value.dustType] * this.commonData.city.rate,
			);
		}
	}

	changePoint() {
		this.form.controls.paymentMoney.setValue(this.form.value.paymentPoint * this.commonData.city.rate);
	}

	payment() {
		if (this.form.valid) {
			const postData = {
				...this.form.value,
				city: this.commonData.city.id,
				startDate: this.form.value.startDate.getTime(),
				endDate: this.form.value.endDate.getTime(),
			};
			this.submitted = true;
			this.blockUIService.setBlockStatus(true);
			this.commonService.createPayment(postData).subscribe(
				(res: any) => {
					this.blockUIService.setBlockStatus(false);
					this.snackBar.open(res.msg, '确认', { duration: 1500 });
					if (res.data) {
						this.dialogRef.close(res.data);
					}
					this.submitted = false;
				},
				(err: HttpErrorResponse) => {
					this.blockUIService.setBlockStatus(false);
					this.snackBar.open(err.error.msg, '确认', { duration: 4000 });
					this.submitted = false;
				},
			);
		}
	}
}
