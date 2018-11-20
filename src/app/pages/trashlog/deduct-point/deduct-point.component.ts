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
import { environment } from '@env/environment';

@Component({
    selector: 'app-deduct-point',
    templateUrl: './deduct-point.component.html',
    styleUrls: ['./deduct-point.component.scss'],
    providers: [AuthenticationService]
})
export class DeductPointComponent implements OnInit, OnDestroy {
    public form: FormGroup;
    public volume: number = 100;
    public serverUrl: string = environment.apiUrl;

    constructor(
        private fb: FormBuilder,
        private formValidationService: FormValidationService,
        private blockUIService: BlockUIService,
        private commonService: CommonService,
        private authenticationService: AuthenticationService,
        private snackBar: MatSnackBar,
        private dialogRef: MatDialogRef<DeductPointComponent>,
        @Optional() @Inject(MAT_DIALOG_DATA) public trashlog: any,
    ) { }

    ngOnInit() {
        this.form = this.fb.group({
            deductionPoint: [
                this.trashlog ? this.trashlog.deductionPoint : '', 
                [Validators.required, Validators.min(0)]
            ]
        });
    }

    ngOnDestroy() { }

    checkError(form, field, error) {
        return this.formValidationService.checkError(form, field, error);
    }

    submitForm() {
        if (this.form.valid) {
            this.blockUIService.setBlockStatus(true);
            this.commonService.deductPoint(this.trashlog.id, this.form.value).subscribe((res: any) => {
                this.blockUIService.setBlockStatus(false);
                this.snackBar.open(res.msg, '确认', {duration: 1500});
                if(res.data) {
                    this.dialogRef.close(res.data);
                }
            }, (err: HttpErrorResponse) => {
                this.blockUIService.setBlockStatus(false);
                this.snackBar.open(err.error.msg, '确认', { duration: 4000 });
            });
        }
    }

}

