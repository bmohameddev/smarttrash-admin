import {
	Component,
	OnDestroy,
	Inject,
	OnInit,
	Optional,
	ViewChild,
	ViewChildren,
	ElementRef,
	AfterViewInit,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { FormArray, FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { HttpErrorResponse, HttpResponse, HttpEventType } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { FormValidationService } from '$/services/form-validation.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BlockUIService } from '$/services/block-ui.service';
import { CommonService } from '$/services/common.service';
import { AuthenticationService } from '$/services/authentication.service';
import { environment } from '@env/environment';
import { ConfirmDialogComponent } from '$/components/confirm-dialog/confirm-dialog.component';

@Component({
	selector: 'app-city-setting',
	templateUrl: './city-setting.component.html',
	styleUrls: ['./city-setting.component.scss'],
	providers: [AuthenticationService],
})
export class CitySettingComponent implements OnInit, AfterViewInit, OnDestroy {
	public serverUrl: string = environment.apiUrl;
	@ViewChildren('videoPlayer') videoPlayers: any;
	public submitted: boolean;
	public dustForm: FormGroup;
	public dustError: boolean = false;
	public dusts: Array<any> = [];
	public devicePasswordForm: FormGroup;
	public residentForm: FormGroup;
	public siteNameForm: FormGroup;
	public dateAllowCntForm: FormGroup;
	public rateForm: FormGroup;
	public limitForm: FormGroup;
	public passwordHide: boolean = true;
	public videoUrlList: any[] = [];
	public deviceVideoFileList: any[] = ['', ''];
	public dashboardVideo: any[] = [false, false];
	public deviceVideo: any[] = [false, false];
	public percentDone: number = 0;
	public uploading: string = '';
	// public volume: number = 0;

	// public uploadingAudio: boolean = false;
	// public audioFileName: any[] = [
	//     { name: '音乐1', queryName: 'audio1' },
	//     { name: '音乐2', queryName: 'audio2' },
	//     { name: '音乐3', queryName: 'audio3' }
	// ]
	// public selectedAudioIndex: number = 0;
	// public msaapPlaylist: Track[] = [];

	public user: any;
	private userUpdatesSubscription: Subscription;

	public commonData: any;
	private commonDataUpdatesSubscription: Subscription;

	constructor(
		private fb: FormBuilder,
		public dialog: MatDialog,
		private formValidationService: FormValidationService,
		private blockUIService: BlockUIService,
		private commonService: CommonService,
		private authenticationService: AuthenticationService,
		private snackBar: MatSnackBar,
	) {}

	ngOnInit() {
		this.dustForm = this.fb.group({});

		this.devicePasswordForm = this.fb.group({
			devicePassword: [null, Validators.compose([Validators.required, Validators.minLength(8)])],
		});

		this.residentForm = this.fb.group({
			resident: [null, Validators.compose([Validators.required])],
		});

		this.siteNameForm = this.fb.group({
			siteName: [null, Validators.compose([Validators.required])],
			siteSlogan: [null, Validators.compose([Validators.required])],
		});

		this.dateAllowCntForm = this.fb.group({
			dateAllowCnt: [null, Validators.compose([Validators.required, Validators.min(1)])],
		});

		this.rateForm = this.fb.group({
			rate: [null, Validators.compose([Validators.required, Validators.min(0)])],
		});

		this.limitForm = this.fb.group({
			voltageLimit: [null, Validators.compose([Validators.required])],
			levelLimit: [null, Validators.compose([Validators.required])],
		});
		this.userUpdatesSubscription = this.authenticationService
			.getUserUpdates()
			.subscribe((user) => (this.user = user));
	}

	ngAfterViewInit() {
		setTimeout(
			() =>
				(this.commonDataUpdatesSubscription = this.commonService
					.getCommonDataUpdates()
					.subscribe((commonData) => {
						this.commonData = commonData;
						this.refreshDust();
						this.refreshDevicePassword();
						this.refreshResident();
						// this.refreshVolume();
						this.refreshSiteName();
						this.refreshDateAllowCnt();
						this.refreshRate();
						// this.refreshLimit();
						this.refreshVideoUrl();
						// this.refreshAudioUrl();
					})),
			1000,
		);
	}

	ngOnDestroy() {
		this.stopDeviceVideo();
		this.commonDataUpdatesSubscription.unsubscribe();
		this.userUpdatesSubscription.unsubscribe();
	}

	checkError(form, field, error) {
		return this.formValidationService.checkError(form, field, error);
	}

	public deletePointRule(dustIdx, pointRuleIdx) {
		this.dusts[dustIdx].pointRule.splice(pointRuleIdx, 1);
		this.checkPointRule();
	}

	public addPointRule(dustIdx) {
		this.dusts[dustIdx].pointRule.push({ amount: 0, point: 0, type: 'STANDARD' });
		this.checkPointRule();
	}

	refreshDust() {
		if (!this.commonData.city) return;
		try {
			this.dusts = JSON.parse(this.commonData.city.dusts);
		} catch (e) {
			console.log('Dusts Error');
		}
		this.checkPointRule();
	}

	checkPointRule() {
		this.dustError = true;
		this.dusts.forEach((dust: any) => {
			if (!dust.name) {
				dust.error = '垃圾名称错误';
				return;
			}
			const pointRule = dust.pointRule;
			for (var index = 0; pointRule[index]; index++) {
				dust.error = null;
				if (!pointRule[index].type || !('' + pointRule[index].amount) || !('' + pointRule[index].point)) {
					dust.error = '积分规则错误';
					return;
				}
				if (pointRule[index].type != 'INTERVAL' && pointRule[index].type != 'STANDARD') {
					dust.error = '积分规则错误';
					return;
				}
				if (index && !pointRule[index].amount) {
					dust.error = '积分规则错误';
					return;
				}
				if (index && pointRule[index].amount <= pointRule[index - 1].amount) {
					dust.error = '积分规则错误';
					return;
				}
			}
			dust.pointRule = pointRule;
		});
		this.dustError = false;
	}

	updatePointRule() {
		this.checkPointRule();
		if (this.dustForm.valid && !this.dustError) {
			this.dustForm.value.dusts = JSON.stringify(this.dusts);
			this.submitted = true;
			this.blockUIService.setBlockStatus(true);
			this.commonService.updatePointRule(this.commonData.city.id, this.dustForm.value).subscribe(
				(res: any) => {
					this.blockUIService.setBlockStatus(false);
					this.snackBar.open(res.msg, '确认', { duration: 1500 });
					if (res.data) {
						this.commonService.setCommonDataVariable({ city: res.data });
					}
					this.submitted = false;
				},
				(err: HttpErrorResponse) => {
					this.blockUIService.setBlockStatus(false);
					this.snackBar.open(err.error.msg, '确认', { duration: 4000 });
					this.submitted = false;
				},
			);
		}
	}

	refreshDevicePassword() {
		this.devicePasswordForm.controls.devicePassword.setValue(this.commonData.city.devicePassword);
	}

	updateDevicePassword() {
		if (this.devicePasswordForm.valid) {
			this.submitted = true;
			this.blockUIService.setBlockStatus(true);
			this.commonService.updateDevicePassword(this.commonData.city.id, this.devicePasswordForm.value).subscribe(
				(res: any) => {
					this.blockUIService.setBlockStatus(false);
					this.snackBar.open(res.msg, '确认', { duration: 1500 });
					if (res.data) {
						this.commonService.setCommonDataVariable({ city: res.data });
					}
					this.submitted = false;
				},
				(err: HttpErrorResponse) => {
					this.blockUIService.setBlockStatus(false);
					this.snackBar.open(err.error.msg, '确认', { duration: 4000 });
					this.submitted = false;
				},
			);
		}
	}

	refreshResident() {
		this.residentForm.controls.resident.setValue(this.commonData.city.resident);
	}

	updateResident() {
		if (this.residentForm.valid) {
			this.submitted = true;
			this.blockUIService.setBlockStatus(true);
			this.commonService.updateResident(this.commonData.city.id, this.residentForm.value).subscribe(
				(res: any) => {
					this.blockUIService.setBlockStatus(false);
					this.snackBar.open(res.msg, '确认', { duration: 1500 });
					if (res.data) {
						this.commonService.setCommonDataVariable({ city: res.data });
					}
					this.submitted = false;
				},
				(err: HttpErrorResponse) => {
					this.blockUIService.setBlockStatus(false);
					this.snackBar.open(err.error.msg, '确认', { duration: 4000 });
					this.submitted = false;
				},
			);
		}
	}

	// refreshVolume() {
	//    this.volume = this.commonData.city.volume;
	// }

	// updateVolume() {
	//     if (this.volume) {
	//         this.submitted = true;
	//         this.commonService.updateVolume(this.commonData.city.id, this.volume).subscribe((res: any) => {
	//             this.snackBar.open(res.msg, '确认', {duration: 1500});
	//             if(res.data) {
	//                 this.commonService.setCommonDataVariable({ city: res.data });
	//             }
	//             this.submitted = false;
	//         }, (err: HttpErrorResponse) => {
	//             this.snackBar.open(err.error.msg, '确认', { duration: 4000 });
	//             this.submitted = false;
	//         });
	//     }
	// }

	refreshSiteName() {
		this.siteNameForm.controls.siteName.setValue(this.commonData.city.siteName);
		this.siteNameForm.controls.siteSlogan.setValue(this.commonData.city.siteSlogan);
	}

	updateSiteName() {
		if (this.siteNameForm.valid) {
			this.submitted = true;
			this.blockUIService.setBlockStatus(true);
			this.commonService.updateSiteName(this.commonData.city.id, this.siteNameForm.value).subscribe(
				(res: any) => {
					this.blockUIService.setBlockStatus(false);
					this.snackBar.open(res.msg, '确认', { duration: 1500 });
					if (res.data) {
						this.commonService.setCommonDataVariable({ city: res.data });
					}
					this.submitted = false;
				},
				(err: HttpErrorResponse) => {
					this.blockUIService.setBlockStatus(false);
					this.snackBar.open(err.error.msg, '确认', { duration: 4000 });
					this.submitted = false;
				},
			);
		}
	}

	refreshDateAllowCnt() {
		this.dateAllowCntForm.controls.dateAllowCnt.setValue(this.commonData.city.dateAllowCnt);
	}

	updateDateAllowCnt() {
		if (this.dateAllowCntForm.valid) {
			this.submitted = true;
			this.blockUIService.setBlockStatus(true);
			this.commonService.updateDateAllowCnt(this.commonData.city.id, this.dateAllowCntForm.value).subscribe(
				(res: any) => {
					this.blockUIService.setBlockStatus(false);
					this.snackBar.open(res.msg, '确认', { duration: 1500 });
					if (res.data) {
						this.commonService.setCommonDataVariable({ city: res.data });
					}
					this.submitted = false;
				},
				(err: HttpErrorResponse) => {
					this.blockUIService.setBlockStatus(false);
					this.snackBar.open(err.error.msg, '确认', { duration: 4000 });
					this.submitted = false;
				},
			);
		}
	}

	refreshRate() {
		this.rateForm.controls.rate.setValue(this.commonData.city.rate);
	}

	updateRate() {
		if (this.rateForm.valid) {
			this.submitted = true;
			this.blockUIService.setBlockStatus(true);
			this.commonService.updateRate(this.commonData.city.id, this.rateForm.value).subscribe(
				(res: any) => {
					this.blockUIService.setBlockStatus(false);
					this.snackBar.open(res.msg, '确认', { duration: 1500 });
					if (res.data) {
						this.commonService.setCommonDataVariable({ city: res.data });
					}
					this.submitted = false;
				},
				(err: HttpErrorResponse) => {
					this.blockUIService.setBlockStatus(false);
					this.snackBar.open(err.error.msg, '确认', { duration: 4000 });
					this.submitted = false;
				},
			);
		}
	}

	refreshLimit() {
		this.limitForm.controls.voltageLimit.setValue(this.commonData.city.voltageLimit);
		this.limitForm.controls.levelLimit.setValue(this.commonData.city.levelLimit);
	}

	updateLimit() {
		if (this.limitForm.valid) {
			this.submitted = true;
			this.blockUIService.setBlockStatus(true);
			this.commonService.updateLimit(this.commonData.city.id, this.limitForm.value).subscribe(
				(res: any) => {
					this.blockUIService.setBlockStatus(false);
					this.snackBar.open(res.msg, '确认', { duration: 1500 });
					if (res.data) {
						this.commonService.setCommonDataVariable({ city: res.data });
					}
					this.submitted = false;
				},
				(err: HttpErrorResponse) => {
					this.blockUIService.setBlockStatus(false);
					this.snackBar.open(err.error.msg, '确认', { duration: 4000 });
					this.submitted = false;
				},
			);
		}
	}

	selectVideo(videoIndex, event: any): void {
		if (event.target.files && event.target.files[0]) {
			this.deviceVideoFileList[videoIndex] = event.target.files[0];
			this.videoPlayers._results[videoIndex].nativeElement.src = URL.createObjectURL(
				this.deviceVideoFileList[videoIndex],
			);
		}
	}

	refreshVideoUrl(videoIndex?) {
		if (!this.commonData.city) return;
		this.videoUrlList = this.commonData.city.videoUrl.split(',');
		if (this.videoUrlList.length == 1) {
			this.videoUrlList.push('');
		}
		if (this.commonData.city.dashboardVideo) {
			this.dashboardVideo = [false, false];
			this.commonData.city.dashboardVideo.split(',').forEach((element) => {
				if (element) {
					this.dashboardVideo[element] = true;
				}
			});
		}
		if (this.commonData.city.deviceVideo) {
			this.deviceVideo = [false, false];
			this.commonData.city.deviceVideo.split(',').forEach((element) => {
				if (element) {
					this.deviceVideo[element] = true;
				}
			});
		}
		if (videoIndex) {
			if (
				this.videoUrlList[videoIndex] &&
				this.videoPlayers._results[videoIndex].nativeElement.src != this.videoUrlList[videoIndex]
			) {
				this.videoPlayers._results[videoIndex].nativeElement.src =
					this.serverUrl + '/' + this.videoUrlList[videoIndex];
			}
			this.deviceVideoFileList[videoIndex] = '';
		} else {
			this.videoPlayers._results.forEach((element, index) => {
				if (this.videoUrlList[index] && element.nativeElement.src != this.videoUrlList[index]) {
					element.nativeElement.src = this.serverUrl + '/' + this.videoUrlList[index];
				}
				this.deviceVideoFileList[index] = '';
			});
		}
	}

	uploadDeviceVideo(videoIndex) {
		let uploadData = new FormData();
		uploadData.append('file', this.deviceVideoFileList[videoIndex], this.deviceVideoFileList[videoIndex].name);
		this.uploading = videoIndex;
		this.commonService.uploadDeviceVideo(this.commonData.city.id, videoIndex, uploadData).subscribe((event) => {
			if (event.type === HttpEventType.UploadProgress) {
				this.percentDone = Math.round((100 * event.loaded) / event.total);
			} else if (event instanceof HttpResponse) {
				this.uploading = '';
				this.percentDone = 0;
				const body: any = event.body;
				this.commonService.setCommonDataVariable({ city: body.data });
			}
		});
	}

	updateDashboardVideo(videoIndex) {
		const dashboardVideoStr = [];
		if (this.dashboardVideo[videoIndex]) {
			dashboardVideoStr.push(videoIndex);
		}
		this.blockUIService.setBlockStatus(true);
		this.commonService.updateDashboardVideo(this.commonData.city.id, dashboardVideoStr.join(',')).subscribe(
			(res: any) => {
				this.blockUIService.setBlockStatus(false);
				this.snackBar.open(res.msg, '确认', { duration: 1500 });
				if (res.data) {
					this.commonService.setCommonDataVariable({ city: res.data });
				}
				this.submitted = false;
			},
			(err: HttpErrorResponse) => {
				this.blockUIService.setBlockStatus(false);
				this.snackBar.open(err.error.msg, '确认', { duration: 4000 });
				this.submitted = false;
			},
		);
	}

	updateDeviceVideo(videoIndex) {
		const deviceVideoStr = [];
		if (this.deviceVideo[videoIndex]) {
			deviceVideoStr.push(videoIndex);
		}
		this.blockUIService.setBlockStatus(true);
		this.commonService.updateDeviceVideo(this.commonData.city.id, deviceVideoStr.join(',')).subscribe(
			(res: any) => {
				this.blockUIService.setBlockStatus(false);
				this.snackBar.open(res.msg, '确认', { duration: 1500 });
				if (res.data) {
					this.commonService.setCommonDataVariable({ city: res.data });
				}
				this.submitted = false;
			},
			(err: HttpErrorResponse) => {
				this.blockUIService.setBlockStatus(false);
				this.snackBar.open(err.error.msg, '确认', { duration: 4000 });
				this.submitted = false;
			},
		);
	}

	private stopDeviceVideo(): void {
		this.videoPlayers.forEach((element) => {
			element.nativeElement.pause();
		});
	}

	// private refreshAudioUrl() {
	//     this.msaapPlaylist = []
	//     this.audioFileName.forEach(element => {
	//         this.msaapPlaylist.push({
	//             title: element.name,
	//             link: this.commonData.city[element.queryName]
	//         })
	//     });
	// }

	// playAudio(index): void {
	//     this.selectedAudioIndex = index;
	//     setTimeout(() => {
	//         let audioPlayer = document.querySelector("audio")
	//         if (audioPlayer) {
	//             audioPlayer.play()
	//         }
	//     });
	// }

	// selectAudio(event: any): void {
	// 	if (event.target.files && event.target.files[0]) {
	//         let deviceAudioFile = event.target.files[0]
	//         const confirmMsg = '确认编辑吗?';
	//         this.dialog.open(ConfirmDialogComponent, {
	//             data: { content: confirmMsg },
	//             width: '360px'
	//         }).afterClosed().subscribe(res => {
	//             if (res == 'ok') {
	//                 this.updateDeviceAudio(deviceAudioFile);
	//             }
	//         });
	//         event.target.value = '';
	// 	}
	// }

	// updateDeviceAudio(deviceAudioFile) {
	//     let uploadData = new FormData();
	//     uploadData.append('file', deviceAudioFile, deviceAudioFile.name);
	//     uploadData.append('audioFileName', this.audioFileName[this.selectedAudioIndex].queryName);
	//     this.uploadingAudio = true;
	// 	this.commonService.updateDefaultDeviceAudio(uploadData).subscribe(event => {
	//         if (event.type === HttpEventType.UploadProgress) {
	//             this.percentDone = Math.round(100 * event.loaded / event.total);
	//         } else if (event instanceof HttpResponse) {
	//             this.uploadingAudio = false;
	//             this.percentDone = 0;
	//             const body: any = event.body;
	// 			this.commonService.setCommonDataVariable({ city: body.data });
	//             this.refreshAudioUrl();
	//         }
	// 	});
	// }
}
