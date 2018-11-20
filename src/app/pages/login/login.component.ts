import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthenticationService } from '$/services/authentication.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BlockUIService } from '$/services/block-ui.service';
import { CommonService } from '$/services/common.service';
import { AppSettings } from '@app/app.settings';
import { Settings } from '@app/app.settings.model';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    providers: [CommonService]
})
export class LoginComponent implements OnInit {
    public submitted: boolean;
    public form: FormGroup;
    public settings: Settings;
    public passwordHide: boolean = true;
    returnUrl: string = '';
    public captchaImg = '';
    public captchaId = '';

    constructor(
        public appSettings: AppSettings,
        public fb: FormBuilder,
        public router: Router,
        private authenticationService: AuthenticationService,
        private blockUIService: BlockUIService,
        private commonService: CommonService,
        private snackBar: MatSnackBar,
        private route: ActivatedRoute
    ) {
        this.settings = this.appSettings.settings;
        this.form = this.fb.group({
            'name': [null, Validators.compose([Validators.required])],
            'password': [null, Validators.compose([Validators.required, Validators.minLength(8)])],
            'captcha': [null, Validators.compose([Validators.required])]
        });
    };

    ngOnInit() {
        this.route.queryParams.subscribe(params => this.returnUrl = params['returnUrl'] || '/');
        this.getCaptcha();
    }

    ngAfterViewInit() {
        this.settings.loadingSpinner = false;
    }

    public onSubmit(values: Object): void {
        if (this.form.valid) {
            this.adminLogin();
        }
    }

    public getCaptcha() {
        this.blockUIService.setBlockStatus(true);
        this.commonService.getCaptcha().subscribe((res: any) => {
            this.blockUIService.setBlockStatus(false);
            if (res.data) {
                this.captchaImg = res.data.captchaImg;
                this.captchaId = res.data.captchaId;
            }
        })
    }

    private adminLogin() {
        this.submitted = true;
        this.form.value.captchaId = this.captchaId;
        this.blockUIService.setBlockStatus(true);
        this.commonService.adminLogin(this.form.value).subscribe((res: any) => {
            this.blockUIService.setBlockStatus(false);
            this.snackBar.open(res.msg, '确认', {duration: 1500});
            if (res.data) {
                this.authenticationService.setToken(res.data);
                this.router.navigateByUrl(this.returnUrl);
            } else {
                this.getCaptcha();
                this.form.controls.captcha.setValue('');
            }
            this.submitted = false;
        }, (err: HttpErrorResponse) => {
            this.blockUIService.setBlockStatus(false);
            this.snackBar.open(err.error.msg, '确认', { duration: 4000 });
            this.submitted = false;
        });
    }

}

