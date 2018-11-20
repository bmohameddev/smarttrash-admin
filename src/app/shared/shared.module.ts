import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatNativeDateModule, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatRippleModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSliderModule } from '@angular/material/slider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatStepperModule } from '@angular/material/stepper';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { ImageCropperModule } from 'ngx-image-cropper';
import { LightboxModule } from 'ngx-lightbox';
import { BaiduMapModule } from 'angular2-baidu-map';
// import { NgxAudioPlayerModule } from 'ngx-audio-player';
import { NumericDirective } from './directives/number.directive';
import { UploadImageComponent } from '$/components/upload-image/upload-image.component';
import { SelectDateComponent } from '$/components/select-date/select-date.component';
import { ClassificationDialogComponent } from '$/components/classification-dialog/classification-dialog.component';
import { ConfirmDialogComponent } from '$/components/confirm-dialog/confirm-dialog.component';
import { PasswordDialogComponent } from '$/components/password-dialog/password-dialog.component';
import { ProfileDialogComponent } from '$/components/profile-dialog/profile-dialog.component';
import { MapComponent } from '$/components/map/map.component';
import { getDutchPaginatorIntl } from '$/directives/paginator.directive';

@NgModule({
	imports: [
		CommonModule,
		FlexLayoutModule,
        FormsModule,
        ReactiveFormsModule,
		MatAutocompleteModule,
		MatButtonModule,
		MatButtonToggleModule,
		MatCardModule,
		MatCheckboxModule,
		MatChipsModule,
		MatDatepickerModule,
		MatDialogModule,
		MatExpansionModule,
		MatGridListModule,
		MatIconModule,
		MatInputModule,
		MatListModule,
		MatMenuModule,
		MatPaginatorModule,
		MatProgressBarModule,
		MatProgressSpinnerModule,
		MatRadioModule,
		MatRippleModule,
		MatSelectModule,
		MatSidenavModule,
		MatSliderModule,
		MatSlideToggleModule,
		MatSnackBarModule,
		MatSortModule,
		MatTableModule,
		MatTabsModule,
		MatToolbarModule,
		MatTooltipModule,
		MatStepperModule,
		// OwlDateTimeModule,
		// OwlNativeDateTimeModule,
		ImageCropperModule,
		LightboxModule,
		BaiduMapModule.forRoot({ ak: '0E9a1d87c1b0c5025565a115e62c8b90' }),
		// NgxAudioPlayerModule
	],
	exports: [
		FlexLayoutModule,
		MatAutocompleteModule,
		MatButtonModule,
		MatButtonToggleModule,
		MatCardModule,
		MatCheckboxModule,
		MatChipsModule,
		MatDatepickerModule,
		MatDialogModule,
		MatExpansionModule,
		MatGridListModule,
		MatIconModule,
		MatInputModule,
		MatListModule,
		MatMenuModule,
		MatNativeDateModule,
		MatPaginatorModule,
		MatProgressBarModule,
		MatProgressSpinnerModule,
		MatRadioModule,
		MatRippleModule,
		MatSelectModule,
		MatSidenavModule,
		MatSliderModule,
		MatSlideToggleModule,
		MatSnackBarModule,
		MatSortModule,
		MatTableModule,
		MatTabsModule,
		MatToolbarModule,
		MatTooltipModule,
		MatStepperModule,
		// NgxAudioPlayerModule,
		NumericDirective,
		UploadImageComponent,
		SelectDateComponent,
		ProfileDialogComponent,
		MapComponent
	],
	declarations: [
		NumericDirective,
		UploadImageComponent,
		SelectDateComponent,
		ClassificationDialogComponent,
		ConfirmDialogComponent,
		PasswordDialogComponent,
		ProfileDialogComponent,
		MapComponent
	],
	providers: [
		{ provide: MatPaginatorIntl, useValue: getDutchPaginatorIntl() },
		{ provide: MAT_DATE_LOCALE, useValue: 'ja-JP' }
	],
	entryComponents: [
		ClassificationDialogComponent,
		ConfirmDialogComponent,
		PasswordDialogComponent,
		ProfileDialogComponent
	]
})
export class SharedModule { }
