import { Component, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthenticationService } from '$/services/authentication.service';
import { BlockUIService } from '$/services/block-ui.service';
import { CommonService } from '$/services/common.service';
import { FormValidationService } from '$/services/form-validation.service';
import { ChangePasswordService } from './change-password.service';
import { AppSettings } from '@app/app.settings';
import { Settings } from '@app/app.settings.model';

@Component({
    selector: 'app-change-password',
    templateUrl: './change-password.component.html',
    providers: [CommonService]
})
export class ChangePasswordComponent implements OnInit {
    public submitted: boolean;
    public form: FormGroup;
    public settings: Settings;
    public currentPasswordHide: boolean = true;
    public passwordHide: boolean = true;
    returnUrl: string = '';

    constructor(
        public appSettings: AppSettings,
        public fb: FormBuilder,
        public router: Router,
        private authenticationService: AuthenticationService,
        private blockUIService: BlockUIService,
        private commonService: CommonService,
        private snackBar: MatSnackBar,
        private changePasswordService: ChangePasswordService,
        private formValidationService: FormValidationService,
        private route: ActivatedRoute
    ) {
        this.settings = this.appSettings.settings;
        this.form = this.fb.group({
            'currentPassword': [null, Validators.compose([Validators.required])],
            'password': [null, Validators.compose([Validators.required, Validators.minLength(8)])],
            'confirmPassword': [null,
                Validators.compose([
                    Validators.required,
                    Validators.minLength(8),
                    this.formValidationService.arePasswordsMismatching
                ])
            ]
        });
    };

    ngOnInit() {
    }

    ngAfterViewInit() {
        this.settings.loadingSpinner = false;
    }

    public checkError(form, field, error) {
        return this.formValidationService.checkError(form, field, error);
    }

    public onSubmit(values: Object): void {
        if (this.form.valid) {
            this.changePassword();
        }
    }

    private changePassword() {
        this.submitted = true;
        this.blockUIService.setBlockStatus(true);
        this.changePasswordService.adminChangePassword(this.form.value).subscribe((res: any) => {
            this.blockUIService.setBlockStatus(false);
            this.snackBar.open(res.msg, '确认', {duration: 1500});
            if (res.data) {
                this.authenticationService.setToken(res.data);
                this.router.navigateByUrl('/');
            }
            this.submitted = false;
        }, (err: HttpErrorResponse) => {
            this.blockUIService.setBlockStatus(false);
            this.snackBar.open(err.error.msg, '确认', { duration: 4000 });
            this.submitted = false;
        });
    }

}

