import { Component, OnInit } from '@angular/core';
import { NavigationEnd, ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BlockUIService } from '$/services/block-ui.service';
import { CommonService } from '$/services/common.service';
import { AppSettings } from '@app/app.settings';
import { Settings } from '@app/app.settings.model';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthenticationService } from '$/services/authentication.service';
import * as jwtDecode from 'jwt-decode';
import { Subscription } from 'rxjs';
import { SwUpdate } from '@angular/service-worker';
import { takeWhile, filter } from 'rxjs/operators';
import { ConfirmDialogComponent } from '$/components/confirm-dialog/confirm-dialog.component';

@Component({
	selector: 'app-verify-account',
	templateUrl: './verify-account.component.html',
	styleUrls: ['./verify-account.component.scss']
})
export class VerifyAccountComponent implements OnInit {
	public settings: Settings;

	constructor(
		public appSettings: AppSettings, 
		private route: ActivatedRoute,
        private blockUIService: BlockUIService,
		public commonService: CommonService,
		private snackBar: MatSnackBar,
        public dialog: MatDialog,
		private authenticationService: AuthenticationService,
		private router: Router
	) { 
		this.settings = this.appSettings.settings;
	}

	ngOnInit() {
		this.checkWeixinToken();
	}

	private checkWeixinToken() {
		this.route.paramMap.subscribe(params => {
			if (params.has('weixinToken')) {
				const user = this.authenticationService.getUser();
				const confirmMsg = '您确定要连接此微信吗?';
				this.dialog.open(ConfirmDialogComponent, {
					data: { content: confirmMsg },
					width: '360px'
				}).afterClosed().subscribe(res => {
					if (res == 'ok') {
						this.settings.loadingSpinner = true;
						const token = params.get('weixinToken');
						this.commonService.checkWeixinToken(token).subscribe((res: any) => {
							this.settings.loadingSpinner = false;
							this.snackBar.open(res.msg, '确认', {duration: 4000});
							this.router.navigateByUrl('/');
						}, (err: HttpErrorResponse) => {
							this.snackBar.open(err.error.msg, '确认', { duration: 4000 });
						});
					} else {
						this.router.navigateByUrl('/');
					}
				});
			} else {
				this.router.navigateByUrl('/');
			}
		});
	}
}


