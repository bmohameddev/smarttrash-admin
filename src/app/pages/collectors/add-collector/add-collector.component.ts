import { Component, OnInit, Inject, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { AuthenticationService } from '$/services/authentication.service';
import { BlockUIService } from '$/services/block-ui.service';
import { CommonService } from '$/services/common.service';
import { FormValidationService } from '$/services/form-validation.service';
import * as _ from 'underscore';

@Component({
	selector: 'app-add-collector',
	templateUrl: './add-collector.component.html',
	styleUrls: ['./add-collector.component.scss'],
})
export class AddCollectorComponent implements OnInit, OnDestroy {
	public submitted: boolean;
	public form: FormGroup;
	public cardIds = [];
	public isSelectedCardField: boolean[] = [true];
	public lastMaxCardId;
	public city;
	public dustName: string[] = [];

	public authInfo: any;

	public allCities: any[];
	public autocompleteCities: any[] = [];
	private autocompleteCitySubscription: Subscription;

	constructor(
		public dialogRef: MatDialogRef<AddCollectorComponent>,
		@Inject(MAT_DIALOG_DATA) public collector: any,
		public fb: FormBuilder,
		private authenticationService: AuthenticationService,
		private blockUIService: BlockUIService,
		private commonService: CommonService,
		private snackBar: MatSnackBar,
		private formValidationService: FormValidationService,
	) {}

	ngOnInit() {
		this.authInfo = this.authenticationService.getUser();
		if (this.authInfo && this.authInfo.city) {
			this.city = this.authInfo.city;
			this.refreshDustName();
		}
		if (this.collector && this.collector.cardIds) {
			const tempCardIds = this.collector.cardIds.split(',');
			tempCardIds.forEach((element, index) => {
				if (element) {
					this.cardIds.push(element);
					this.isSelectedCardField[index] = true;
				} else {
					this.isSelectedCardField[index] = false;
				}
			});
		}

		this.form = this.fb.group({
			name: [this.collector && this.collector.name, Validators.compose([Validators.required])],
			phone: [
				this.collector && this.collector.phone ? this.collector.phone : '',
				Validators.compose([Validators.pattern(/^\d*\-?\d*\-?\d*\-?\d*$/)]),
			],
			cardId_0: [''],
			// cardId_1: [''],
			// cardId_2: [''],
			sex: [this.collector && this.collector.sex ? this.collector.sex : 'MALE'],
			city: [this.collector && this.collector.city ? this.collector.city.name : ''],
			address: [this.collector && this.collector.address ? this.collector.address : ''],
		});

		this.commonService.getAllCities().subscribe((res: any) => {
			if (res.data) {
				this.allCities = res.data;
			}
		});

		this.commonService.getMaxCardId().subscribe((res: any) => {
			if (res.data) {
				this.lastMaxCardId = res.data;
				if (!this.cardIds.length) {
					this.addOrRemoveCardId(0);
				} else {
					this.refreshCardIds();
				}
			}
		});

		this.autocompleteCitySubscription = this.form
			.get('city')
			.valueChanges.pipe(debounceTime(100))
			.subscribe((text) => {
				this.autocompleteCities = this.allCities.filter((element) =>
					element.match(new RegExp('(' + text.trim() + ')', 'i')),
				);
			});
	}

	ngOnDestroy() {
		this.autocompleteCitySubscription.unsubscribe();
	}

	checkError(form, field, error) {
		return this.formValidationService.checkError(form, field, error);
	}

	refreshDustName() {
		if (this.city) {
			this.dustName[0] = this.city.dustAName;
			this.dustName[1] = this.city.dustBName;
		} else {
			this.dustName[0] = '';
			this.dustName[1] = '';
		}
	}

	changeAutocompleteCities() {
		const text = this.form.value.city.trim();
		this.autocompleteCities = this.allCities.filter((element) =>
			element.match(new RegExp('(' + text.trim() + ')', 'i')),
		);
	}

	close(): void {
		this.dialogRef.close();
	}

	submitForm() {
		if (this.form.valid) {
			let cnt = 0,
				cardIdsStr = '';
			this.isSelectedCardField.forEach(async (element, index) => {
				if (index) {
					cardIdsStr += ',';
				}
				if (element) {
					cardIdsStr += this.cardIds[cnt];
					cnt = cnt + 1;
				}
			});
			this.form.value.cardIds = cardIdsStr;
			this.submitted = true;
			if (this.collector) {
				this.blockUIService.setBlockStatus(true);
				this.commonService.updateCollector(this.collector.id, this.form.value).subscribe(
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
				this.commonService.createCollector(this.form.value).subscribe(
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

	addOrRemoveCardId(index) {
		if (this.isSelectedCardField[index]) {
			let maxCardId = '';
			if (this.cardIds.length) {
				maxCardId = _.reduce(
					this.cardIds,
					function (acc, val) {
						return val > acc ? val : acc;
					},
					0,
				);
			}
			maxCardId = this.lastMaxCardId > maxCardId ? this.lastMaxCardId : maxCardId;
			let nextCardId = ('0000000000' + String(Number(maxCardId) + 1)).slice(-10);
			const firstNumber = Number(nextCardId.slice(0, 1));
			const secondNumber = Number(nextCardId.slice(1, 2));
			const preNumber = '' + ((firstNumber + Math.floor(secondNumber / 4)) % 4) + (secondNumber % 4);
			nextCardId = preNumber + nextCardId.slice(2, 10);
			if (nextCardId.length != 10) {
				this.snackBar.open('卡号不能少于10位数', '确认', { duration: 1500 });
				return;
			}
			if (this.cardIds.some((element) => element == nextCardId)) {
				this.snackBar.open('卡号已存在', '确认', { duration: 1500 });
				return;
			}
			this.cardIds.push(nextCardId);
			this.isSelectedCardField[index] = true;
			this.refreshCardIds();
		} else {
			this.cardIds.splice(this.cardIds.length - 1, 1);
			this.refreshCardIds();
		}
	}

	public refreshCardIds() {
		let cnt = 0;
		this.isSelectedCardField.forEach(async (element, index) => {
			if (element) {
				this.form.controls['cardId_' + index].setValue(this.cardIds[cnt++]);
			} else {
				this.form.controls['cardId_' + index].setValue('');
			}
		});
	}
}
