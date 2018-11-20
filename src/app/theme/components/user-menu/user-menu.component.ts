import { Component, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { environment } from '@env/environment';
import { AuthenticationService } from '$/services/authentication.service';
import { ProfileDialogComponent } from '$/components/profile-dialog/profile-dialog.component';

@Component({
	selector: 'app-user-menu',
	templateUrl: './user-menu.component.html',
	styleUrls: ['./user-menu.component.scss'],
	encapsulation: ViewEncapsulation.None
})
export class UserMenuComponent implements OnInit, OnDestroy {
	public serverUrl = environment.apiUrl;
	public user: any;
	private userUpdatesSubscription: Subscription;
    
	public commonData: any;
	private commonDataUpdatesSubscription: Subscription;
	
	constructor(
		private authenticationService: AuthenticationService,
        public dialog: MatDialog
	) { }

	ngOnInit() {
		this.userUpdatesSubscription = this.authenticationService
			.getUserUpdates()
			.subscribe(user => this.user = user);
	}

	ngOnDestroy() {
		this.userUpdatesSubscription.unsubscribe();
	}

	public editProfile() {
		this.dialog.open(ProfileDialogComponent, {
            data: this.user,
            width: '600px'
        }).afterClosed().subscribe(data => {
            if (data) {
                this.authenticationService.setToken(data);
            }
        });
	}

	public logout() {
		this.authenticationService.logout();
	}

}
