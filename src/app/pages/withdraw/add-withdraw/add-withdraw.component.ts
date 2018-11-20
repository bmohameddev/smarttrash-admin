import { Component, OnInit, Inject, ViewChild, ElementRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { FormGroup, FormBuilder, Validators} from '@angular/forms';
import { User } from '$/models/user.model';
import { HttpErrorResponse } from '@angular/common/http';
import { BlockUIService } from '$/services/block-ui.service';
import { CommonService } from '$/services/common.service';
import { FormValidationService } from '$/services/form-validation.service';
import { environment } from '@env/environment';
import { startWith, debounceTime } from 'rxjs/operators';

@Component({
	selector: 'app-add-withdraw',
	templateUrl: './add-withdraw.component.html',
	styleUrls: ['./add-withdraw.component.scss']
})
export class AddWithdrawComponent implements OnInit {
	public submitted: boolean;
	public form:FormGroup;
	public cardIds = [];
	serverUrl = environment.apiUrl;
	
	public product;
	public withdrawType: string = 'PRODUCT';

	public products: any[];
    public autocompleteProducts: any[] = [];
	private autocompleteProductsSubscription: Subscription;

	public commonData: any;
	
	constructor(
		public dialogRef: MatDialogRef<AddWithdrawComponent>,
		@Inject(MAT_DIALOG_DATA) public user: any,
		public fb: FormBuilder,
        private blockUIService: BlockUIService,
		private commonService: CommonService,   
		private snackBar: MatSnackBar,
		private formValidationService: FormValidationService,
	) { }

	ngOnInit() {
		this.cardIds = (this.user && this.user.cardIds)? this.user.cardIds.split(','): [];

		this.form = this.fb.group({
			withdrawPoint: ['', 
				Validators.compose([Validators.required, Validators.min(0.1)])
			],
			product: ['', 
				Validators.compose([Validators.required])
			],
			productCount: ['', 
				Validators.compose([Validators.required, Validators.min(1)])
			],
			description: ['']
		});	

		this.commonData = this.commonService.getCommonData();

		this.commonService.getProducts(10000, 0, '', this.commonData.city?.id).subscribe((res: any) => {
			if (res.data) {
                this.products = res.data.products;
				this.autocompleteProductsSubscription = this.form.get('product')
					.valueChanges.pipe(startWith(null), debounceTime(100))
					.subscribe(text => {
						this.autocompleteProducts = this.products.filter(element => 
							element.name.match(new RegExp("(" + (text || '').toLowerCase().trim() + ")", "i"))
						);
					});	
			}
        });
	}

    ngOnDestroy() {
        this.autocompleteProductsSubscription.unsubscribe();
    }

	checkError(form, field, error) {
		return this.formValidationService.checkError(form, field, error);
	}

	close(): void {
		this.dialogRef.close();
	}
	
	selectProduct() {
		const tempProduct = this.products.find(element => element.name == this.form.value.product);
		if (tempProduct) {
			this.product = tempProduct;
		} else {
			this.product = null;
			this.form.controls.product.setValue('');
		}
		this.updateWithdrawPoint();
	}

	updateWithdrawPoint() {
		if (this.withdrawType == 'PRODUCT') {
			if (this.form.controls.productCount.valid && this.form.controls.product.valid && this.product) {
				this.form.controls.withdrawPoint.setValue(this.form.value.productCount * this.product.point);
			} else {
				this.form.controls.withdrawPoint.setValue('');
			}
		} else {
			this.form.controls.withdrawPoint.setValue('');
		}
	}

	withdraw() {
		let formValid = false;
		if (this.withdrawType == 'MANUAL') {
			if (this.form.controls.withdrawPoint.valid) {
				formValid = true;
				this.form.value.productCount = 0;
			}
		} else if (this.withdrawType == 'PRODUCT') {
			if (this.form.controls.withdrawPoint.valid && this.form.controls.product.valid && this.form.controls.productCount.valid && this.product) {
				formValid = true;
				this.form.value.productId = this.product.id;
			}
		}
		if (formValid) {
			this.form.value.cardId = this.user.currentCardId;
			this.form.value.totalPoint = this.user.totalPoint;
			this.submitted = true;
			this.blockUIService.setBlockStatus(true);
			this.commonService.withdraw(this.form.value).subscribe((res: any) => {
				this.blockUIService.setBlockStatus(false);
				this.snackBar.open(res.msg, '确认', {duration: 1500});
				if (res.data){
					this.dialogRef.close(res.data);
				}
				this.submitted = false;
			}, (err: HttpErrorResponse) => {
				this.blockUIService.setBlockStatus(false);
                this.snackBar.open(err.error.msg, '确认', { duration: 4000 });
				this.submitted = false;
            });
		}
	}

}
