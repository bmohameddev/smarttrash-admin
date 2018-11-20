import { Component, OnInit, ViewEncapsulation, ViewChild, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { MatMenuTrigger } from '@angular/material/menu';
import { AuthenticationService } from '$/services/authentication.service';

@Component({
	selector: 'app-messages',
	templateUrl: './messages.component.html',
	styleUrls: ['./messages.component.scss'],
	encapsulation: ViewEncapsulation.None
})
export class MessagesComponent implements OnInit, OnDestroy {
	@ViewChild(MatMenuTrigger, {static: false}) trigger: MatMenuTrigger;
	public selectedTab:number=1;
	public messages:Array<Object>;
	public files:Array<Object>;
	public meetings:Array<Object>; 

	public notificationsActive: boolean = false;

	public user: any;
	private userUpdatesSubscription: Subscription;

	constructor(
		private authenticationService: AuthenticationService,
	) { }

	ngOnInit() {
		this.userUpdatesSubscription = this.authenticationService
			.getUserUpdates()
			.subscribe(user => {
				this.user = user;
				if (!(this.user && this.user.weixinOpenId)) {
					this.notificationsActive = true;
				}
			});
	}

	ngOnDestroy() {
		this.userUpdatesSubscription.unsubscribe();
	}

	openMessagesMenu() {
		this.trigger.openMenu();
		this.selectedTab = 0;
	}

	onMouseLeave() {
		this.trigger.closeMenu();
	}

	stopClickPropagate(event: any) {
		event.stopPropagation();
		event.preventDefault();
	}

}
