import { Component, OnInit, ViewEncapsulation, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { AppSettings } from '@app/app.settings';
import { Settings } from '@app/app.settings.model';
import { Question, Answer } from '$/models/question.model';
import { AuthenticationService } from '$/services/authentication.service';
import { SelectionModel } from '@angular/cdk/collections';
import { FormBuilder, FormGroup, EmailValidator, FormControl } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { AddCityComponent } from '../add-city/add-city.component';
import { environment } from '@env/environment';
import { BlockUIService } from '$/services/block-ui.service';
import { CommonService } from '$/services/common.service';
import { ConfirmDialogComponent } from '$/components/confirm-dialog/confirm-dialog.component';

@Component({
    selector: 'app-list-city',
    templateUrl: './list-city.component.html',
    styleUrls: ['./list-city.component.scss'],
    animations: [
        trigger('detailExpand', [
            state('collapsed', style({ height: '0px', minHeight: '0' })),
            state('expanded', style({ height: '*' })),
            transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
        ]),
    ],
})
export class ListCityComponent implements OnInit {
    public serverUrl = environment.apiUrl;
    public displayedColumns: string[] = ['select', 'index', 'name', 'topAdmin', 'admins', 'menu'];
    public displayedColumnsMobile: string[] = ['select', 'index', 'name', 'topAdmin', 'menu'];
    public dataSource: any;
    public selection = new SelectionModel<any>(true, []);
    public totalCnt: number;
    public pageIndex: number;
    private pageSize: number = 10;
    private search: string = '';
    private sortParam = {
        active: '',
        direction: 'asc',
    };
    public searchForm: FormGroup;

    constructor(
        private router: Router,
        private fb: FormBuilder,
        public dialog: MatDialog,
        private blockUIService: BlockUIService,
        public commonService: CommonService,
        private snackBar: MatSnackBar,
        private authenticationService: AuthenticationService,
    ) { }

    ngOnInit() {
        this.searchForm = this.fb.group({
            keyword: ''
        });
        this.getCities();
    }

    public openCityDialog(city?: any) {
        this.dialog.open(AddCityComponent, {
            data: city,
            width: '450px'
        }).afterClosed().subscribe(res => {
            if (res) {
                this.getCities();
            }
        });
    }

    searchBoxAction() {
        this.getCities();
    }

    getCities(event?) {
        if (this.authenticationService.isAdmin()) {
            if (event) {
                this.pageSize = event.pageSize;
                this.pageIndex = event.pageIndex;
            }
            this.blockUIService.setBlockStatus(true);
            this.commonService.getCities(
                this.pageSize,
                this.pageIndex,
                this.searchForm.value.keyword,
                this.sortParam.active,
                this.sortParam.direction,
            ).subscribe((res: any) => {
                this.blockUIService.setBlockStatus(false);
                this.totalCnt = res.data.totalCnt;
                this.dataSource = new MatTableDataSource<any>(res.data.cities);
                this.selection.clear();
                if (this.totalCnt <= this.pageSize * this.pageIndex) {
                    this.pageIndex = 0;
                }
            });
        }
    }

    isAllSelected() {
        const numSelected = this.selection.selected.length;
        const numRows = this.dataSource.data.length;
        return numSelected === numRows;
    }

    masterToggle() {
        this.isAllSelected() ?
            this.selection.clear() :
            this.dataSource.data.forEach(row => this.selection.select(row));
    }

    public customSort(event) {
        this.sortParam = event;
        this.getCities();
    }

    applySearch() {
        this.getCities();
    }

    public deleteCities() {
        var ids = [];
        this.dataSource.data.forEach((row, index) => {
            if (this.selection.selected.some(selected => selected.index == row.index)) {
                ids.push(row.id);
            }
        });
        this.finalDeleteCities(ids);
    }

    public deleteCity(event, id) {
        event.stopPropagation();
        var ids = [];
        ids.push(id);
        this.finalDeleteCities(ids);
    }

    public finalDeleteCities(ids) {
        if (ids.length) {
            this.dialog.open(ConfirmDialogComponent, {
                data: { content: '同意删除吗?' },
                width: '360px'
            }).afterClosed().subscribe(res => {
                if (res == 'ok') {
                    this.blockUIService.setBlockStatus(true);
                    this.commonService.deleteCities(ids).subscribe((res: any) => {
                        this.blockUIService.setBlockStatus(false);
                        this.snackBar.open(res.msg, '确认', {duration: 1500});
                        if (res.data) {
                            this.getCities();
                        }
                    }, (err: HttpErrorResponse) => {
                        this.blockUIService.setBlockStatus(false);
                        this.snackBar.open(err.error.msg, '确认', { duration: 4000 });
                    });
                }
            });
        } else {
            this.snackBar.open("选择城市", '确认', {duration: 1500});
        }
    }

}
