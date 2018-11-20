import { Component, OnDestroy, Inject, OnInit, Optional, ViewChild, ElementRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { FormArray, FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { FormValidationService } from '$/services/form-validation.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { BlockUIService } from '$/services/block-ui.service';
import { CommonService } from '$/services/common.service';
import { AuthenticationService } from '$/services/authentication.service';
import { User } from '$/models/user.model';
import { environment } from '@env/environment';
import { startWith, debounceTime } from 'rxjs/operators';
import * as _ from 'underscore';
import { ENTER } from '@angular/cdk/keycodes';
import { element } from 'protractor';
const COMMA = 188;

@Component({
	selector: 'app-add-city',
	templateUrl: './add-city.component.html',
	styleUrls: ['./add-city.component.scss'],
})
export class AddCityComponent implements OnInit, OnDestroy {
	@ViewChild('inputForAdmin', { static: false }) inputForAdmin: ElementRef;
	public user: User;
	public submitted: boolean;
	public form: FormGroup;
	public serverUrl: string = environment.apiUrl;
	public selectedFileIndex: number = -1;
	private userUpdatesSubscription: Subscription;
	public separatorKeysCodes = [ENTER, COMMA];

	public allAdmins: any[] = [];
	public admins = [];
	public autocompleteAdmins: any[] = [];
	private autocompleteAdminsSubscription: Subscription;
	public showAdminValidation: boolean;

	constructor(
		private fb: FormBuilder,
		private formValidationService: FormValidationService,
		private blockUIService: BlockUIService,
		private commonService: CommonService,
		private authenticationService: AuthenticationService,
		private snackBar: MatSnackBar,
		private dialogRef: MatDialogRef<AddCityComponent>,
		@Optional() @Inject(MAT_DIALOG_DATA) public data: any,
	) {}

	ngOnInit() {
		this.userUpdatesSubscription = this.authenticationService
			.getUserUpdates()
			.subscribe((user) => (this.user = user));
		this.form = this.fb.group({
			name: [this.data ? this.data.name : '', Validators.compose([Validators.required])],
			admin: '',
			topAdmin: [
				this.data && this.data.topAdmin ? this.data.topAdmin.name : '',
				Validators.compose([Validators.required]),
			],
		});
		this.admins = this.data && this.data.admin ? _.pluck(this.data.admin, 'name') : [];

		this.blockUIService.setBlockStatus(true);
		this.commonService.getAllAdmins().subscribe((res: any) => {
			this.blockUIService.setBlockStatus(false);
			if (res.data) {
				this.allAdmins = res.data;
				this.autocompleteAdminsSubscription = this.form
					.get('admin')
					.valueChanges.pipe(startWith(null), debounceTime(100))
					.subscribe((text) => this._filterAdmins(text));
			}
		});
	}

	ngOnDestroy() {
		this.autocompleteAdminsSubscription.unsubscribe();
		this.userUpdatesSubscription.unsubscribe();
	}

	checkError(form, field, error) {
		return this.formValidationService.checkError(form, field, error);
	}

	changeAutocompleteAdmin() {
		const text = this.form.value.admin;
		this._filterAdmins(text);
	}

	public addAdmin() {
		this.showAdminValidation = true;
		let value = this.form.value.admin;
		if ((value || '').trim()) {
			const tempAdmin = value.trim();
			if (
				!this.admins.some((element) => element == tempAdmin) &&
				this.allAdmins.some((element) => element.name == tempAdmin)
			) {
				this.admins.push(tempAdmin);
			}
		}
		this.form.controls.admin.setValue('');
		this.inputForAdmin.nativeElement.value = '';
	}

	public removeAdmin(index: any) {
		if (index >= 0) {
			if (this.form.value.topAdmin == this.admins[index]) {
				this.form.controls.topAdmin.setValue('');
			}
			this.admins.splice(index, 1);
		}
		this._filterAdmins();
	}

	private _filterAdmins(value?: string): void {
		this.autocompleteAdmins = this.allAdmins.filter(
			(element) =>
				element.name.match(new RegExp('(' + (value || '').toLowerCase().trim() + ')', 'i')) &&
				!this.admins.some((item) => item == element.name) &&
				(!element.city || (this.data && this.data.admin.some((item) => item.id == element.id))),
		);
	}

	submitForm() {
		if (this.form.valid) {
			this.form.value.admins = JSON.stringify(this.admins);
			this.submitted = true;
			if (this.data) {
				this.blockUIService.setBlockStatus(true);
				this.commonService.updateCity(this.data.id, this.form.value).subscribe(
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
				this.commonService.addCity(this.form.value).subscribe(
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
