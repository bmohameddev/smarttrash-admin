import { Component, OnInit, ViewEncapsulation, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { AppSettings } from '@app/app.settings';
import { Settings } from '@app/app.settings.model';
import { User } from '$/models/user.model';
import { SelectionModel } from '@angular/cdk/collections';
import { FormBuilder, FormGroup, EmailValidator } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { environment } from '@env/environment';
import { BlockUIService } from '$/services/block-ui.service';
import { CommonService } from '$/services/common.service';
import { Subscription } from 'rxjs';
import { debounceTime, filter } from 'rxjs/operators';

@Component({
    selector: 'app-detail-trash',
    templateUrl: './detail-trash.component.html',
    styleUrls: ['./detail-trash.component.scss'],
    animations: [
        trigger('detailExpand', [
            state('collapsed', style({ height: '0px', minHeight: '0' })),
            state('expanded', style({ height: '*' })),
            transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
        ]),
    ],
})
export class DetailTrashComponent implements OnInit, OnDestroy {

    public displayedColumns: string[] = ['index', 'totalPoint', 'totalCnt'];
    public dataSource: any;
    public selection = new SelectionModel<any>(true, []);
    public serverUrl = environment.apiUrl;
    public selectedYear: string = '';
    public selectedMonth: string = '';
	public autocomplete: any[];
    private autocompleteSubscription: Subscription;
    public form: FormGroup;
    public trash;
    public dateType = "year";
    
	public commonData: any;
    private commonDataUpdatesSubscription: Subscription;

    constructor(
		private route: ActivatedRoute,
		private fb: FormBuilder,
        public router: Router,
        private blockUIService: BlockUIService,
        private commonService: CommonService,
        private snackBar: MatSnackBar,
        public dialog: MatDialog
    ) { }

    ngOnInit() {
        
		this.autocomplete = [];
		this.form = this.fb.group({
			search: ''
        });

        this.commonDataUpdatesSubscription = this.commonService
            .getCommonDataUpdates()
            .subscribe(commonData => {
                this.commonData = commonData;
            });
        
        this.autocompleteSubscription = this.form.get('search')
			.valueChanges.pipe(debounceTime(100))
			.subscribe(text => {
				if (text.trim()) {
					this.commonService.getTrashes({
                        search: text,
                        city: this.commonData.city.id
                    }).subscribe((res: any) => {
                        this.autocomplete = res.data.trashes;
                    });
				} else {
					this.autocomplete.splice(0);
				}
			});

        this.route.paramMap.subscribe(params => {
			if (params.has('id')) {
				const id = params.get('id');
				this.commonService.getTrash(id).subscribe((res: any) => {
                    this.trash = res.data;
                    this.form.controls.search.setValue(this.trash.deviceId)
                    this.getTrashReport();
                });
			}
		});
    }

	ngOnDestroy() {
		this.commonDataUpdatesSubscription.unsubscribe();
    }

    public getTrashReport() {
        if(this.trash) {
            this.blockUIService.setBlockStatus(true);
            this.commonService.getTrashReport(
                this.trash.id,
                this.selectedYear,
                this.selectedMonth
            ).subscribe((res: any) => {
                this.blockUIService.setBlockStatus(false);
                if (res.data) {
                    this.dataSource = new MatTableDataSource<any>(res.data.result);
                    this.selection.clear();
                } else {
                    this.snackBar.open(res.msg, '确认', {duration: 1500});
                }
            }, (err: HttpErrorResponse) => {
                this.blockUIService.setBlockStatus(false);
                this.snackBar.open(err.error.msg, '确认', { duration: 4000 });
            });
        }
    }

    searchBoxAction() {
        let temp;
        if(this.autocomplete.length == 1) {
            temp = this.autocomplete;
        } else {
            temp = this.autocomplete.filter(element => element.deviceId == this.form.value.search)
        }
        this.trash = '';
        if(temp.length == 1) {
            this.trash = temp[0];
            this.getTrashReport();
            this.autocomplete.splice(0)
            this.form.controls.search.setValue(this.trash.deviceId)
        }
    }

    goToList() {
        this.router.navigateByUrl('trashes/list');
    }

    changeDate(data) {
		if (data) {
            this.dateType = data.dateType;
			this.selectedYear = data.selectedYear;
			this.selectedMonth = data.selectedMonth;
            this.getTrashReport()
		}
	}

}

