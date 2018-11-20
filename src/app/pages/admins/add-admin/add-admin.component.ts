import { Component, OnInit, OnDestroy, Inject, ViewChild, ElementRef } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormArray, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { User } from '$/models/user.model';
import { BlockUIService } from '$/services/block-ui.service';
import { CommonService } from '$/services/common.service';
import { FormValidationService } from '$/services/form-validation.service';
import { SelectionModel } from '@angular/cdk/collections';
import * as _ from 'underscore';
import { ENTER } from '@angular/cdk/keycodes';
const COMMA = 188;

@Component({
	selector: 'app-add-admin',
	templateUrl: './add-admin.component.html',
	styleUrls: ['./add-admin.component.scss'],
})
export class AddAdminComponent implements OnInit, OnDestroy {
	@ViewChild('inputForTag', { static: false }) private inputForTag: ElementRef;
	public submitted: boolean;
	public separatorKeysCodes = [ENTER, COMMA];
	public form: FormGroup;
	public allCities: any[];
	public autocompleteCities: any[] = [];
	public selection = new SelectionModel<any>(true, []);
	private autocompleteSubscription: Subscription;

	constructor(
		public dialogRef: MatDialogRef<AddAdminComponent>,
		@Inject(MAT_DIALOG_DATA) public data: any,
		public fb: FormBuilder,
		private blockUIService: BlockUIService,
		private commonService: CommonService,
		private snackBar: MatSnackBar,
		private formValidationService: FormValidationService,
	) {}

	ngOnInit() {
		if (!this.data) {
			this.data = new User();
		}

		this.form = this.fb.group({
			name: [this.data.name, Validators.compose([Validators.required])],
			phone: [
				this.data.phone ? this.data.phone : '',
				Validators.compose([Validators.required, Validators.pattern(/^\d*\-?\d*\-?\d*\-?\d*$/)]),
			],
			city: [this.data.city ? this.data.city.name : ''],
		});

		// 		(/^\d*\.?\d{0,2}$/g)

		// (/^(admin|user)$/)

		//Show password field when super admin create admin.
		if (!this.data.id) {
			this.selection.select('password');
			this.addPasswordControl();
		}

		this.commonService.getAllCities().subscribe((res: any) => {
			if (res.data) {
				this.allCities = res.data;
			}
		});

		this.autocompleteSubscription = this.form
			.get('city')
			.valueChanges.pipe(debounceTime(100))
			.subscribe((text) => {
				this.autocompleteCities = this.allCities.filter((element) =>
					element.match(new RegExp('(' + text.trim() + ')', 'i')),
				);
			});
	}

	ngOnDestroy() {
		this.autocompleteSubscription.unsubscribe();
	}

	checkError(form, field, error) {
		return this.formValidationService.checkError(form, field, error);
	}

	changeAutocompleteCities() {
		const text = this.form.value.city.trim();
		this.autocompleteCities = this.allCities.filter((element) =>
			element.match(new RegExp('(' + text.trim() + ')', 'i')),
		);
	}

	close() {
		this.dialogRef.close();
	}

	togglePass() {
		if (this.selection.isSelected('password')) {
			this.addPasswordControl();
		} else {
			this.removePasswordControl();
		}
	}

	addPasswordControl() {
		this.form.addControl(
			'password',
			this.fb.control('', Validators.compose([Validators.required, Validators.minLength(8)])),
		);
		this.form.addControl(
			'confirmPassword',
			this.fb.control(
				'',
				Validators.compose([Validators.required, this.formValidationService.arePasswordsMismatching]),
			),
		);
	}

	removePasswordControl() {
		this.form.removeControl('password');
		this.form.removeControl('confirmPassword');
	}

	addAdmin() {
		if (this.form.valid) {
			this.submitted = true;
			if (this.data.id) {
				this.blockUIService.setBlockStatus(true);
				this.commonService.updateAdmin(this.data.id, this.form.value).subscribe(
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
			} else {
				this.blockUIService.setBlockStatus(true);
				this.commonService.createAdmin(this.form.value).subscribe(
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
}
