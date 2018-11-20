import { Component, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthenticationService } from '$/services/authentication.service';
import { BlockUIService } from '$/services/block-ui.service';
import { CommonService } from '$/services/common.service';
import { FormValidationService } from '$/services/form-validation.service';
import { AppSettings } from '@app/app.settings';

@Component({
	selector: 'app-password-dialog',
	templateUrl: './password-dialog.component.html',
	styleUrls: ['./password-dialog.component.scss']
})
export class PasswordDialogComponent implements OnInit {
    public submitted: boolean;
    public form: FormGroup;
    public passwordHide: boolean = true;

    constructor(
        public appSettings: AppSettings,
        public fb: FormBuilder,
        public router: Router,
        private authenticationService: AuthenticationService,
        private blockUIService: BlockUIService,
        private commonService: CommonService,
        private formValidationService: FormValidationService,
        private snackBar: MatSnackBar,
        private route: ActivatedRoute,
		public dialogRef: MatDialogRef<PasswordDialogComponent>
    ) {};

    ngOnInit() {
        this.form = this.fb.group({
            'password': [null, Validators.compose([Validators.required])],
        });
    }

    public checkError(form, field, error) {
        return this.formValidationService.checkError(form, field, error);
    }

	close(result): void {
		this.dialogRef.close(result);
	}

    public onSubmit() {
        if (this.form.valid) {
            this.blockUIService.setBlockStatus(true);
            this.commonService.checkPassword(this.form.value).subscribe((res: any) => {
                this.blockUIService.setBlockStatus(false);
                if (res.data) {
                    this.dialogRef.close('ok');
                } else {
                    this.snackBar.open(res.msg, 'ç¡®è®¤', {duration: 1500});
                }
            }, (err: HttpErrorResponse) => {
                this.blockUIService.setBlockStatus(false);
                this.snackBar.open(err.error.msg, 'ç¡®è®¤', { duration: 4000 });
            });
        }
    }

}

