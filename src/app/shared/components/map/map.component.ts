import { Component, Input, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { AppSettings } from '@app/app.settings';
import { Settings } from '@app/app.settings.model';
import { Animation, MapOptions, BMarker, BMapInstance, MarkerOptions, Point, MapTypeControlOptions, MapTypeControlType, MapTypeEnum } from 'angular2-baidu-map';
import { AuthenticationService } from '$/services/authentication.service';
import { BlockUIService } from '$/services/block-ui.service';
import { CommonService } from '$/services/common.service';

@Component({
    selector: 'app-map',
    templateUrl: './map.component.html',
    styleUrls: ['./map.component.scss'],
})
export class MapComponent implements OnInit {
    @Input() area: string;
    public mapOptions: MapOptions;
    public markerOptionsOnline: MarkerOptions;
    public markerOptionsOffline: MarkerOptions;
    public mapTypeOpts: MapTypeControlOptions
    public settings: Settings;
    public totalCnt;
    public trashes;
    
	public user: any;
    private userUpdatesSubscription: Subscription;
    
	public commonData: any;
    private commonDataUpdatesSubscription: Subscription;
    constructor(
        public appSettings: AppSettings,
        private authenticationService: AuthenticationService,
        public commonService: CommonService
    ) {
        this.settings = this.appSettings.settings;
        this.mapOptions = {
            centerAndZoom: {
                lat: 30,
                lng: 105,
                zoom: 4
            },
            enableKeyboard: true,
            enableScrollWheelZoom: true,
            // mapType: [MapTypeEnum.BMAP_SATELLITE_MAP],
        };
        this.markerOptionsOnline = {
            icon: {
                imageUrl: '/assets/img/baidu/marker-icon-blue.png',
                size: {
                    height: 35,
                    width: 25
                },
                imageSize: {
                    height: 35,
                    width: 25
                }
            }
        };
        this.markerOptionsOffline = {
            icon: {
                imageUrl: '/assets/img/baidu/marker-icon-pink.png',
                size: {
                    height: 35,
                    width: 25
                },
                imageSize: {
                    height: 35,
                    width: 25
                }
            }
        };
        this.mapTypeOpts = {
            type: MapTypeControlType.BMAP_MAPTYPE_CONTROL_HORIZONTAL,
            mapTypes: [MapTypeEnum.BMAP_NORMAL_MAP, MapTypeEnum.BMAP_SATELLITE_MAP]
        }
    }

    public ngOnInit() {
		this.userUpdatesSubscription = this.authenticationService
			.getUserUpdates()
			.subscribe(user => this.user = user);
        this.commonDataUpdatesSubscription = this.commonService
            .getCommonDataUpdates()
            .subscribe(commonData => {
                this.commonData = commonData;
                if (commonData.webLocation.point && this.area != 'whole') {
                    this.mapOptions.centerAndZoom = {
                        lat: this.commonData.webLocation.point.lat,
                        lng: this.commonData.webLocation.point.lng,
                        zoom: 11
                    };
                }
                if (this.authenticationService.isAdmin()) {
                    this.getTrashes();
                }
            });
    }

	ngOnDestroy() {
		this.userUpdatesSubscription.unsubscribe();
		this.commonDataUpdatesSubscription.unsubscribe();
	}

    getTrashes() {
        this.commonService.getTrashes({
            city: this.commonData.city.id
        }).subscribe((res: any) => {
            this.totalCnt = res.data.totalCnt;
            this.trashes = res.data.trashes;
        });
    }

    public setAnimation(marker: BMarker): void {
        // marker.setAnimation(Animation.BMAP_ANIMATION_BOUNCE)
    }

    public showWindow({ marker, map }: { marker: BMarker; map: BMapInstance }, trash): void {
        let contentStr = `<div class="marker">`
        contentStr += `<div class="title">`
        contentStr += `<a href="/report/trash/` + trash.id + `"> 设备-` + trash.deviceId + `</a>`;
        contentStr += trash.online? `<div class="online"><p>线上</p></div>` : `<div class="offline"><p>离线</p></div>`;
        contentStr += `</div>`
        contentStr += `<div class="content">`
        contentStr += `<p><span>地址：</span>` + (trash.city? trash.city.name: '***') + (trash.address? trash.address: '***') + `</p>`;
        contentStr += '<p><span>位置：</span>' + trash.lng + ', ' + trash.lat + '</p>';
        contentStr += '<p><span>次数：</span>' + trash.today.operationCnt + '</p>';
        contentStr += `</div>`
        contentStr += `</div>`
        map.openInfoWindow(
            new window.BMap.InfoWindow(contentStr, {
                offset: new window.BMap.Size(17, -3),
                width: 300
            }),
            marker.getPosition()
        )
    }

}