import { Component, ViewChild} from '@angular/core';
import { Subscription } from 'rxjs';
import { BlockUI, NgBlockUI } from 'ng-block-ui';
import { AppSettings } from '@app/app.settings';
import { Settings } from '@app/app.settings.model';
import { HttpClient } from '@angular/common/http';
import { BlockUIService } from '$/services/block-ui.service';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss']
})
export class AppComponent {
	public settings: Settings;
	@BlockUI() blockUI: NgBlockUI;
	private blockingSubscription: Subscription;
	constructor(
		public appSettings: AppSettings,
		private httpClient: HttpClient,
		private blockUIService: BlockUIService
	) {
		this.settings = this.appSettings.settings;
	}

	ngOnInit() {
		this.getBlockStatus();
	}

	ngOnDestroy() {
		this.blockingSubscription.unsubscribe();
	}

	getBlockStatus() {
		this.blockingSubscription = this.blockUIService
			.getBlockStatus()
			.subscribe(status => {
				if (status) {
					this.blockUI.start();
				} else {
					this.blockUI.stop();
				}
			});
	}
}