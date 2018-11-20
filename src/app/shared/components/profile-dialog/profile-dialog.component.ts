import { Component, OnDestroy, Inject, OnInit, Optional, AfterViewInit, AfterContentInit, ViewChildren, ViewChild, ElementRef } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '@env/environment';
import { BlockUIService } from '$/services/block-ui.service';
import { CommonService } from '$/services/common.service';
import { FormValidationService } from '$/services/form-validation.service';

@Component({
	selector: 'app-profile-dialog',
	templateUrl: './profile-dialog.component.html',
	styleUrls: ['./profile-dialog.component.scss']
})
export class ProfileDialogComponent implements OnInit {
	public serverUrl = environment.apiUrl;
	public submitted: boolean;
	public uploadFiles: any[] = [];
	public selectedFileIndex: number = -1;
	public uploadFile: any;

	constructor(
		private blockUIService: BlockUIService,
		public commonService: CommonService,
		private fb: FormBuilder,
		private formValidationService: FormValidationService,
		private snackBar: MatSnackBar,
		private dialogRef: MatDialogRef<ProfileDialogComponent>,
		@Optional()
		@Inject(MAT_DIALOG_DATA) public data: any,
	) { }

	ngOnInit() {
		if (this.data && this.data.profilePicture) {
			this.getInitialImage(0);
		}
	}

	getInitialImage(index) {
		var reader = new FileReader();
		this.commonService.getImage(this.serverUrl + '/' + this.data.profilePicture).subscribe((res: any) => {
			this.uploadFile = res;
			reader.readAsDataURL(this.uploadFile);
			reader.onload = (event) => {
				this.uploadFiles.push({
					originalFile: this.uploadFile,
					croppedFile: this.uploadFile,
					croppedImage: reader.result
				});
			}
		}, (err: HttpErrorResponse) => { });
	}

	checkError(form, field, error) {
		return this.formValidationService.checkError(form, field, error);
	}

	editProfile() {
		let uploadData = new FormData();
		this.uploadFiles.forEach(element => {
			if (element.croppedFile) {
				uploadData.append('file', element.croppedFile, element.croppedFile.name);
			}
		});
		this.submitted = true;
		this.commonService.editProfile(uploadData).subscribe((res: any) => {
			this.snackBar.open(res.msg, '确认', {duration: 1500});
			if (res.data) {
				this.dialogRef.close(res.data);
			}
			this.submitted = false;
		}, (err: HttpErrorResponse) => {
			this.snackBar.open(err.error.msg, '确认', { duration: 4000 });
			this.submitted = false;
		});
	}

	addPicture(data) {
		if (data) {
			this.uploadFiles[this.selectedFileIndex] = {
				originalFile: data.originalFile,
				croppedFile: data.croppedFile ? data.croppedFile : this.uploadFiles[this.selectedFileIndex].croppedFile,
				croppedImage: data.croppedImage ? data.croppedImage : this.uploadFiles[this.selectedFileIndex].croppedImage
			};
		}
		else {
			this.uploadFiles.splice(this.selectedFileIndex, 1);
		}
		this.selectedFileIndex = -1;
	}

	openCrop(index) {
		if (this.selectedFileIndex != -1 && this.uploadFiles[this.selectedFileIndex].croppedFile == '') {
			this.uploadFiles.splice(this.selectedFileIndex, 1);
		}
		this.selectedFileIndex = index;
	}

	addFile(event: any): void {
		if (event.target.files && event.target.files[0]) {
			this.uploadFiles.push({
				originalFile: event.target.files[0],
				croppedFile: '',
				croppedImage: ''
			});
			this.selectedFileIndex = this.uploadFiles.length - 1;
		}
	}

}

