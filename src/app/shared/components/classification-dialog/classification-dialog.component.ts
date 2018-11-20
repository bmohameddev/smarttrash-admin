import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
	selector: 'app-classification-dialog',
	templateUrl: './classification-dialog.component.html',
	styleUrls: ['./classification-dialog.component.scss']
})
export class ClassificationDialogComponent implements OnInit {

	constructor(
		public dialogRef: MatDialogRef<ClassificationDialogComponent>,
		@Inject(MAT_DIALOG_DATA) public data: any
	) { }

	ngOnInit() {
	}

	close(result): void {
		this.dialogRef.close(result);
	}

}

