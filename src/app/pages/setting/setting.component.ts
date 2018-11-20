import { Component, OnDestroy, Inject, OnInit, Optional, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { FormArray, FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpErrorResponse, HttpResponse, HttpEventType } from '@angular/common/http';
import { FormValidationService } from '$/services/form-validation.service';
import { BlockUIService } from '$/services/block-ui.service';
import { CommonService } from '$/services/common.service';
import { AuthenticationService } from '$/services/authentication.service';
import { environment } from '@env/environment';
import { ConfirmDialogComponent } from '$/components/confirm-dialog/confirm-dialog.component';

@Component({
    selector: 'app-setting',
    templateUrl: './setting.component.html',
    styleUrls: ['./setting.component.scss'],
    providers: [AuthenticationService]
})
export class SettingComponent implements OnInit, AfterViewInit, OnDestroy {
	@ViewChild('videoPlayer', {static: false}) videoPlayer: any;
    public submitted: boolean;
    public dustForm: FormGroup;
    public dustError: boolean = false;
    public dusts:Array<any> = [];
    public devicePasswordForm: FormGroup;
    public passwordHide: boolean = true;
    public siteNameForm: FormGroup;
    public classificationGuideForm: FormGroup;
    public serverUrl: string = environment.apiUrl;
    public deviceVideoFile: any = "";
    public percentDone: number = 0;
    public uploadingVideo: boolean = false;

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
        private snackBar: MatSnackBar
    ) { }

    ngOnInit() {
        this.dustForm = this.fb.group({});

        this.devicePasswordForm = this.fb.group({
            'devicePassword': [null, Validators.compose([Validators.required, Validators.minLength(8)])]
        });

        this.siteNameForm = this.fb.group({
            'siteName': [null, Validators.compose([Validators.required])],
            'siteSlogan': [null, Validators.compose([Validators.required])]
        });

        this.classificationGuideForm = this.fb.group({
            'classificationGuide': [null, Validators.compose([])]
        });

		this.userUpdatesSubscription = this.authenticationService
            .getUserUpdates()
            .subscribe(user => this.user = user);
    }

    ngAfterViewInit() {
        setTimeout(() =>
            this.commonDataUpdatesSubscription = this.commonService
                .getCommonDataUpdates()
                .subscribe(commonData => {
                    this.commonData = commonData;
                    this.refreshDust();
                    this.refreshDevicePassword();
                    // this.refreshVolume();
                    this.refreshSiteName();
                    this.refreshClassificationGuide();
                    // this.refreshLimit();
                    this.refreshVideoUrl();
                    // this.refreshAudioUrl();
                }),
            1000
        )
    }

    ngOnDestroy() {
        this.stopDeviceVideo();
        this.commonDataUpdatesSubscription.unsubscribe();
        this.userUpdatesSubscription.unsubscribe();
    }

    checkError(form, field, error) {
        return this.formValidationService.checkError(form, field, error);
    }

    public  deletePointRule(dustIdx, pointRuleIdx) {
        this.dusts[dustIdx].pointRule.splice(pointRuleIdx, 1);
        this.checkPointRule();
    }
  
    public addPointRule(dustIdx) {
        this.dusts[dustIdx].pointRule.push({amount: 0, point: 0, type: 'STANDARD' });
        this.checkPointRule();
    }

    refreshDust() {
        try {
            this.dusts = JSON.parse(this.commonData.defaultSetting.dusts);
        } catch (e) {
            console.log('Dusts Error')
        }
        this.checkPointRule();
    }

    checkPointRule() {
        this.dustError = true;
        this.dusts.forEach((dust: any) => {
            if (!dust.name) {
                dust.error = "垃圾名称错误";
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
        })
        this.dustError = false;
    }

    updatePointRule() {
        this.checkPointRule();
        if (this.dustForm.valid && !this.dustError) {
            console.log(this.dusts)
            this.dustForm.value.dusts = JSON.stringify(this.dusts);
            this.submitted = true;
            this.blockUIService.setBlockStatus(true);
            this.commonService.updateDefaultPointRule(this.dustForm.value).subscribe((res: any) => {
                this.blockUIService.setBlockStatus(false);
                this.snackBar.open(res.msg, '确认', {duration: 1500});
                if(res.data) {
                    this.commonService.setCommonDataVariable({ defaultSetting: res.data });
                }
                this.submitted = false;
            }, (err: HttpErrorResponse) => {
                this.blockUIService.setBlockStatus(false);
                this.snackBar.open(err.error.msg, '确认', { duration: 4000 });
                this.submitted = false;
            });
        }
    }

    refreshDevicePassword() {
        this.devicePasswordForm.controls.devicePassword.setValue(this.commonData.defaultSetting.devicePassword);
    }

    updateDevicePassword() {
        if (this.dustForm.valid) {
            this.submitted = true;
            this.blockUIService.setBlockStatus(true);
            this.commonService.updateDefaultDevicePassword(this.devicePasswordForm.value).subscribe((res: any) => {
                this.blockUIService.setBlockStatus(false);
                this.snackBar.open(res.msg, '确认', {duration: 1500});
                if(res.data) {
                    this.commonData.defaultSetting = res;
                }
                this.submitted = false;
            }, (err: HttpErrorResponse) => {
                this.blockUIService.setBlockStatus(false);
                this.snackBar.open(err.error.msg, '确认', { duration: 4000 });
                this.submitted = false;
            });
        }
    }

    refreshSiteName() {
        this.siteNameForm.controls.siteName.setValue(this.commonData.defaultSetting.siteName);
        this.siteNameForm.controls.siteSlogan.setValue(this.commonData.defaultSetting.siteSlogan);
    }

    updateSiteName() {
        if (this.dustForm.valid) {
            this.submitted = true;
            this.blockUIService.setBlockStatus(true);
            this.commonService.updateDefaultSiteName(this.siteNameForm.value).subscribe((res: any) => {
                this.blockUIService.setBlockStatus(false);
                this.snackBar.open(res.msg, '确认', {duration: 1500});
                if(res.data) {
                    this.commonData.defaultSetting = res.data;
                    this.commonService.setCommonDataVariable({ defaultSetting: res.data });
                }
                this.submitted = false;
            }, (err: HttpErrorResponse) => {
                this.blockUIService.setBlockStatus(false);
                this.snackBar.open(err.error.msg, '确认', { duration: 4000 });
                this.submitted = false;
            });
        }
    }

    refreshClassificationGuide() {
        this.classificationGuideForm.controls.classificationGuide.setValue(this.commonData.defaultSetting.classificationGuide);
    }

    updateClassificationGuide() {
        if (this.dustForm.valid) {
            this.submitted = true;
            this.blockUIService.setBlockStatus(true);
            this.commonService.updateDefaultClassificationGuide(this.classificationGuideForm.value).subscribe((res: any) => {
                this.blockUIService.setBlockStatus(false);
                this.snackBar.open(res.msg, '确认', {duration: 1500});
                if(res.data) {
                    this.commonData.defaultSetting = res.data;
                    this.commonService.setCommonDataVariable({ defaultSetting: res.data });
                }
                this.submitted = false;
            }, (err: HttpErrorResponse) => {
                this.blockUIService.setBlockStatus(false);
                this.snackBar.open(err.error.msg, '确认', { duration: 4000 });
                this.submitted = false;
            });
        }
    }

    selectVideo(event: any): void {
		if (event.target.files && event.target.files[0]) {
            this.deviceVideoFile = event.target.files[0]
            this.videoPlayer.nativeElement.src = URL.createObjectURL(this.deviceVideoFile);
		}
    }
    
    refreshVideoUrl() {
        let videoUrl = "";
        if (this.commonData.defaultSetting && this.commonData.defaultSetting.videoUrl) {
            videoUrl = this.serverUrl + '/' + this.commonData.defaultSetting.videoUrl;
        }
        if (this.videoPlayer.nativeElement.src != videoUrl) {
            this.videoPlayer.nativeElement.src = videoUrl;
        }
        this.deviceVideoFile = "";
    }

    updateDeviceVideo() {
        let uploadData = new FormData();
        uploadData.append('file', this.deviceVideoFile, this.deviceVideoFile.name);
        this.uploadingVideo = true;
		this.commonService.updateDefaultDeviceVideo(uploadData).subscribe(event => {
            if (event.type === HttpEventType.UploadProgress) {
                this.percentDone = Math.round(100 * event.loaded / event.total);
            } else if (event instanceof HttpResponse) {
                this.uploadingVideo = false;
                this.percentDone = 0;
                const body: any = event.body;
                this.commonData.defaultSetting = body.data;
                this.refreshVideoUrl();
            }
		});
    }

    private stopDeviceVideo(): void {
        this.videoPlayer.nativeElement.pause();
    }

    // private refreshAudioUrl() {
    //     this.msaapPlaylist = []
    //     this.audioFileName.forEach(element => {
    //         this.msaapPlaylist.push({
    //             title: element.name,
    //             link: this.commonData.defaultSetting[element.queryName]
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
    //             this.commonData.defaultSetting = body.data;
    //             this.refreshAudioUrl();
    //         }
	// 	});
    // }

}

