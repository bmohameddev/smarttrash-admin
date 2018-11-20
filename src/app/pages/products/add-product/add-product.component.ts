import { Component, OnInit, Inject, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { User } from '$/models/user.model';
import { BlockUIService } from '$/services/block-ui.service';
import { CommonService } from '$/services/common.service';
import { FormValidationService } from '$/services/form-validation.service';
import { SelectionModel } from '@angular/cdk/collections';
import * as _ from 'underscore';

@Component({
	selector: 'app-add-product',
	templateUrl: './add-product.component.html',
	styleUrls: ['./add-product.component.scss'],
})
export class AddProductComponent implements OnInit, OnDestroy {
	public submitted: boolean;
	public infoForm: FormGroup;

	constructor(
		public dialogRef: MatDialogRef<AddProductComponent>,
		@Inject(MAT_DIALOG_DATA) public product: any,
		public fb: FormBuilder,
		private blockUIService: BlockUIService,
		private commonService: CommonService,
		private snackBar: MatSnackBar,
		private formValidationService: FormValidationService,
	) {}

	ngOnInit() {
		this.infoForm = this.fb.group({
			name: [
				this.product && this.product.name ? this.product.name : '',
				Validators.compose([Validators.required]),
			],
			point: [
				this.product && this.product.point ? this.product.point : '',
				Validators.compose([Validators.required]),
			],
		});
	}

	ngOnDestroy() {}

	checkError(form, field, error) {
		return this.formValidationService.checkError(form, field, error);
	}

	close(): void {
		this.dialogRef.close();
	}

	submitForm() {
		if (this.infoForm.valid) {
			this.submitted = true;
			if (this.product && this.product.id) {
				this.blockUIService.setBlockStatus(true);
				this.commonService.updateProduct(this.product.id, this.infoForm.value).subscribe(
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
				this.commonService.createProduct(this.infoForm.value).subscribe(
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
