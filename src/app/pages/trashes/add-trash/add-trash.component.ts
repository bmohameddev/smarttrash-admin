import { Component, OnDestroy, Inject, OnInit, Optional, ViewChild, ElementRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { FormArray, FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormValidationService } from '$/services/form-validation.service';
import { BlockUIService } from '$/services/block-ui.service';
import { CommonService } from '$/services/common.service';
import { AuthenticationService } from '$/services/authentication.service';
import { User } from '$/models/user.model';
import { environment } from '@env/environment';
import { startWith, debounceTime } from 'rxjs/operators';
import * as _ from 'underscore';
import { ENTER } from '@angular/cdk/keycodes';
const COMMA = 188;

@Component({
	selector: 'app-add-trash',
	templateUrl: './add-trash.component.html',
	styleUrls: ['./add-trash.component.scss'],
	providers: [AuthenticationService],
})
export class AddTrashComponent implements OnInit, OnDestroy {
	@ViewChild('inputForAdmin', { static: false }) inputForAdmin: ElementRef;
	public submitted: boolean;
	public form: FormGroup;
	public volume: number = 100;
	public serverUrl: string = environment.apiUrl;
	public separatorKeysCodes = [ENTER, COMMA];

	public allCities: any[];
	public autocompleteCities: any[] = [];
	private autocompleteCitiesSubscription: Subscription;

	public allAdmins: any[] = [];
	public admins = [];
	public autocompleteAdmins: any[] = [];
	private autocompleteAdminsSubscription: Subscription;

	public user: any;
	private userUpdatesSubscription: Subscription;

	public commonData: any;
	private commonDataUpdatesSubscription: Subscription;

	constructor(
		private fb: FormBuilder,
		private formValidationService: FormValidationService,
		private blockUIService: BlockUIService,
		private commonService: CommonService,
		private authenticationService: AuthenticationService,
		private snackBar: MatSnackBar,
		private dialogRef: MatDialogRef<AddTrashComponent>,
		@Optional() @Inject(MAT_DIALOG_DATA) public trash: any,
	) {}

	ngOnInit() {
		this.userUpdatesSubscription = this.authenticationService
			.getUserUpdates()
			.subscribe((user) => (this.user = user));

		this.commonDataUpdatesSubscription = this.commonService.getCommonDataUpdates().subscribe((commonData) => {
			this.commonData = commonData;
		});

		this.form = this.fb.group({
			deviceId: [this.trash ? this.trash.deviceId : '', [Validators.required]],
			city: [
				this.trash && this.trash.city ? this.trash.city.name : '',
				Validators.compose([Validators.required]),
			],
			address: [this.trash && this.trash.address ? this.trash.address : ''],
			admin: '',
			volume: [this.trash && this.trash.volume ? this.trash.volume : ''],
			voltageType: [
				this.trash && this.trash.voltageType ? this.trash.voltageType : 'DC12',
				Validators.compose([Validators.required]),
			],
			levelLimit: [
				this.trash && this.trash.levelLimit ? this.trash.levelLimit : 620,
				Validators.compose([Validators.required]),
			],
			trashHeight: [
				this.trash && this.trash.trashHeight ? this.trash.trashHeight : 1300,
				Validators.compose([Validators.required]),
			],
			trashMargin: [
				this.trash && this.trash.trashMargin ? this.trash.trashMargin : 300,
				Validators.compose([Validators.required]),
			],
			dust1Name: [
				this.trash && this.trash.dust1Name ? this.trash.dust1Name : '垃圾1',
				Validators.compose([Validators.required]),
			],
			dust2Name: [
				this.trash && this.trash.dust2Name ? this.trash.dust2Name : '垃圾2',
				Validators.compose([Validators.required]),
			],
			dust3Name: [
				this.trash && this.trash.dust3Name ? this.trash.dust3Name : '垃圾3',
				Validators.compose([Validators.required]),
			],
			dust4Name: [
				this.trash && this.trash.dust4Name ? this.trash.dust4Name : '垃圾4',
				Validators.compose([Validators.required]),
			],
		});
		if (this.trash && this.trash.volume) {
			this.volume = this.trash.volume;
		}
		this.admins = this.trash && this.trash.admin ? _.pluck(this.trash.admin, 'name') : [];

		this.commonService.getAllCities().subscribe((res: any) => {
			if (res.data) {
				this.allCities = res.data;
				this.startAutoCompleteCities();
			}
		});

		this.commonService.getAllAdmins().subscribe((res: any) => {
			if (res.data) {
				this.allAdmins = res.data;
				this.startAutoCompleteAdmins();
			}
		});
	}

	ngOnDestroy() {
		this.autocompleteAdminsSubscription.unsubscribe();
		this.autocompleteCitiesSubscription.unsubscribe();
		this.userUpdatesSubscription.unsubscribe();
	}

	private startAutoCompleteAdmins(): void {
		this.autocompleteAdminsSubscription = this.form
			.get('admin')
			.valueChanges.pipe(startWith(null), debounceTime(100))
			.subscribe((text) => this._filterAdmins(text));
	}

	public addAdmin() {
		let value = this.form.value.admin;
		if ((value || '').trim()) {
			const tempAdmin = value.trim();
			if (
				!this.admins.some((element) => element == tempAdmin) &&
				this.allAdmins.some((element) => element.name == tempAdmin && element.city.name == this.form.value.city)
			) {
				this.admins.push(tempAdmin);
			}
		}
		this.form.controls.admin.setValue('');
		this.inputForAdmin.nativeElement.value = '';
	}

	public removeAdmin(index: any) {
		if (index >= 0) {
			this.admins.splice(index, 1);
		}
		this._filterAdmins();
	}

	private _filterAdmins(value?: string): void {
		this.autocompleteAdmins = this.allAdmins.filter(
			(element) =>
				element.name.match(new RegExp('(' + (value || '').toLowerCase().trim() + ')', 'i')) &&
				!this.admins.some((item) => item == element.name) &&
				element.city &&
				element.city.name == this.form.value.city,
		);
	}

	private startAutoCompleteCities(): void {
		this.autocompleteCitiesSubscription = this.form
			.get('city')
			.valueChanges.pipe(startWith(null), debounceTime(100))
			.subscribe((text) => this._filterCities(text));
	}

	private _filterCities(value?: string): void {
		this.autocompleteCities = this.allCities.filter((element) =>
			element.match(new RegExp('(' + (value || '').toLowerCase().trim() + ')', 'i')),
		);
	}

	checkError(form, field, error) {
		return this.formValidationService.checkError(form, field, error);
	}

	submitForm() {
		if (this.form.valid) {
			this.form.value.admins = JSON.stringify(this.admins);
			// this.form.value.volume = this.volume;
			this.submitted = true;
			if (this.trash) {
				this.blockUIService.setBlockStatus(true);
				this.commonService.updateTrash(this.trash.id, this.form.value).subscribe(
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
				this.commonService.addTrash(this.form.value).subscribe(
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
