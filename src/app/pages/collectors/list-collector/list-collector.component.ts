import { Component, ElementRef, OnInit, ViewEncapsulation, OnDestroy, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { AppSettings } from '@app/app.settings';
import { Settings } from '@app/app.settings.model';
import { SelectionModel } from '@angular/cdk/collections';
import { FormBuilder, FormGroup, EmailValidator } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { environment } from '@env/environment';
import { BlockUIService } from '$/services/block-ui.service';
import { CommonService } from '$/services/common.service';
import { AuthenticationService } from '$/services/authentication.service';
import { AddCollectorComponent } from '../add-collector/add-collector.component';
import { ConfirmDialogComponent } from '$/components/confirm-dialog/confirm-dialog.component';
import { PasswordDialogComponent } from '$/components/password-dialog/password-dialog.component';
import * as moment from 'moment';

@Component({
    selector: 'app-list-collector',
    templateUrl: './list-collector.component.html',
    styleUrls: ['./list-collector.component.scss'],
    animations: [
        trigger('detailExpand', [
            state('collapsed', style({ height: '0px', minHeight: '0' })),
            state('expanded', style({ height: '*' })),
            transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
        ]),
    ],
})
export class ListCollectorComponent implements OnInit, OnDestroy {
    public displayedColumns: string[] = ['select', 'index', 'name', 'cardIds', 'phone', 'sex', 'city', 'address', 'createdAt', 'state', 'menu'];
    public displayedColumnsMobile: string[] = ['select', 'index', 'name', 'city', 'state', 'menu'];
    public dataSource: any;
    public selection = new SelectionModel<any>(true, []);
    public totalCnt: number;
    private pageSize: number = 10;
    public pageIndex: number;
    public searchForm: FormGroup;
    private sortParam = {
        active: '',
        direction: '',
    };
    infoForm: FormGroup;
    serverUrl = environment.apiUrl;  
    @ViewChild('fileInput', {static: false}) fileInput: ElementRef;
    
    public collectors; 

	public user: any;
    private userUpdatesSubscription: Subscription;
    
	public commonData: any;
    private commonDataUpdatesSubscription: Subscription;

    constructor(
        private router: Router,
        private fb: FormBuilder,
        private blockUIService: BlockUIService,
        public commonService: CommonService,
        private authenticationService: AuthenticationService,
        private snackBar: MatSnackBar,
        private dialog: MatDialog
    ) { }

    ngOnInit() {
        this.searchForm = this.fb.group({
            keyword: '',
            startDate: [
                moment().startOf('year').toDate()
            ],
            endDate: [
                new Date()
            ]
        });
		this.userUpdatesSubscription = this.authenticationService
			.getUserUpdates()
			.subscribe(user => this.user = user);
        this.commonDataUpdatesSubscription = this.commonService
            .getCommonDataUpdates()
            .subscribe(commonData => {
                this.commonData = commonData;
                this.getCollectors();
            });
    }

	ngOnDestroy() {
		this.userUpdatesSubscription.unsubscribe();
		this.commonDataUpdatesSubscription.unsubscribe();
	}

    public getCollectors(event?): void {
        if (event) {
            this.pageSize = event.pageSize;
            this.pageIndex = event.pageIndex;
        }

        this.blockUIService.setBlockStatus(true);
        this.commonService.getCollectors({
            limit: this.pageSize,
            offset: this.pageIndex,
            search: this.searchForm.value.keyword,
            startDate: this.searchForm.value.startDate.getTime(),
            endDate: this.searchForm.value.endDate.getTime(),
            city: this.commonData.city.id,
            active: this.sortParam.active,
            direction: this.sortParam.direction
        }).subscribe((res: any) => {
            this.blockUIService.setBlockStatus(false);
            if (res.data) {
                this.totalCnt = res.data.totalCnt;
                this.collectors = res.data.collectors;
                this.dataSource = new MatTableDataSource<any>(res.data.collectors);
                this.selection.clear();
                if (this.totalCnt <= this.pageSize * this.pageIndex) {
                    this.pageIndex = 0;
                }
            } else {
                this.snackBar.open(res.msg, '确认', {duration: 1500});
            }
        }, (err: HttpErrorResponse) => {
            this.blockUIService.setBlockStatus(false);
            this.snackBar.open(err.error.msg, '确认', { duration: 4000 });
        });
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
        this.getCollectors();
    }

    applySearch() {
        this.getCollectors();
    }

    public deleteCollectors() {
        var ids = [];
        this.dataSource.data.forEach((row, index) => {
            if (this.selection.selected.some(selected => selected.index == row.index)) {
                ids.push(row.id);
            }
        });
        this.finalDeleteCollectors(ids);
    }

    public deleteCollector(event, id) {
        event.stopPropagation();
        var ids = [];
        ids.push(id);
        this.finalDeleteCollectors(ids);
    }

    public finalDeleteCollectors(ids) {
        if (ids.length) {
            const confirmMsg = '确认删除吗?';
            this.dialog.open(ConfirmDialogComponent, {
                data: { content: confirmMsg },
                width: '360px'
            }).afterClosed().subscribe(res => {
                if (res == 'ok') {
                    this.commonService.deleteCollectors(ids).subscribe((res: any) => {
                        this.snackBar.open(res.msg, '确认', {duration: 1500});
                        if (res.data) {
                            this.getCollectors();
                        }
                    }, (err: HttpErrorResponse) => {
                        this.snackBar.open(err.error.msg, '确认', { duration: 4000 });
                    });
                }
            });
        } else {
            this.snackBar.open("选择用户!", '确认', {duration: 1500});
        }
    }

    public suspendCollectors() {
        var ids = [];
        this.dataSource.data.forEach((row, index) => {
            if (this.selection.selected.some(selected => selected.index == row.index)) {
                ids.push(row.id);
            }
        });
        this.finalSuspendCollectors(ids, true);
    }

    public suspendCollector(event, id, operationType) {
        event.stopPropagation();
        var ids = [];
        ids.push(id);
        this.finalSuspendCollectors(ids, operationType);
    }

    public finalSuspendCollectors(ids, operationType) {
        // if operationType is true, suspend user.
        // if operationType is false, activate user.
        if (ids.length) {
            const confirmMsg = '确认黑名单吗?';
            this.dialog.open(ConfirmDialogComponent, {
                data: { content: confirmMsg },
                width: '360px'
            }).afterClosed().subscribe(res => {
                if (res == 'ok') {
                    this.commonService.changeCollectorsState(ids, operationType).subscribe((res: any) => {
                        this.snackBar.open(res.msg, '确认', {duration: 1500});
                        if (res.data) {
                            this.getCollectors();
                        }
                    }, (err: HttpErrorResponse) => {
                        this.snackBar.open(err.error.msg, '确认', { duration: 4000 });
                    });
                }
            });
        } else {
            this.snackBar.open("选择用户!", '确认', {duration: 1500});
        }
    }

    public openCollectorDialog(user?) {
        this.dialog.open(AddCollectorComponent, {
            data: user || null,
            width: '600px'
        }).afterClosed().subscribe(data => {
            if (data) {
                this.getCollectors();
            }
        });
    }

    public getAllCollectors(resolve) {
        this.blockUIService.setBlockStatus(true);
        this.commonService.getCollectors({
            search: this.searchForm.value.keyword,
            startDate: this.searchForm.value.startDate.getTime(),
            endDate: this.searchForm.value.endDate.getTime(),
            city: this.commonData.city.id,
            active: this.sortParam.active,
            direction: this.sortParam.direction
        }).subscribe((res: any) => {
            this.blockUIService.setBlockStatus(false);
            if (res.data) {
                resolve(res.data.collectors);
            } else {
                this.snackBar.open(res.msg, '确认', {duration: 1500});
            }
        }, (err: HttpErrorResponse) => {
            this.blockUIService.setBlockStatus(false);
            this.snackBar.open(err.error.msg, '确认', { duration: 4000 });
        });
    }
      
    public export(fileType) {
        this.dialog.open(PasswordDialogComponent, {
            data: null,
            width: '360px'
        }).afterClosed().subscribe(res => {
            if (res == 'ok') {
                const self = this;
                new Promise(function (resolve, reject) {
                    self.getAllCollectors(resolve);
                }).then(function (value: any) {
                    let printData: any[] = [];
                    value.forEach(element => {
                        printData.push({
                            No: element.index + 1,
                            姓名: element.name,
                            卡号: element.cardIds,
                            电话号: element.phone,
                            姓别: element.sex == 'MALE'? '男' : '女',
                            城市: (element.city? element.city.name : ''),
                            详细地址: (element.address? element.address : ''),
                            创建时间: moment(element.createdAt).format('YYYY.MM.DD - HH:mm:ss')
                        });
                    })
                    self.commonService.exportAsExcelFile(printData, '用户统计');
                })
            }
        })
    }

    public print(){
        this.dialog.open(PasswordDialogComponent, {
            data: null,
            width: '360px'
        }).afterClosed().subscribe(res => {
            if (res == 'ok') {
                const self = this;
                new Promise(function (resolve, reject) {
                    self.getAllCollectors(resolve);
                }).then(function (value: any) {
                    let printData: any[] = [];
                    value.forEach(element => {
                        printData.push({
                            index: element.index + 1,
                            name: element.name,
                            cardIds: element.cardIds,
                            phone: element.phone,
                            sex: element.sex == 'MALE'? '男' : '女',
                            city: (element.city? element.city.name : ''),
                            address: (element.address? element.address : ''),
                            createdAt: moment(element.createdAt).format('YYYY.MM.DD - HH:mm:ss')
                        })
                    })
                    self.commonService.printTable({
                        columns: ['index', 'name', 'cardIds', 'phone', 'sex', 'city', 'address', 'createdAt'],
                        headers: ['No', '姓名', '卡号', '电话号', '姓别', '城市', '详细地址', '创建时间'],
                        content: printData
                    });
                })
            }
        })
    };

    importFile() {
        this.dialog.open(PasswordDialogComponent, {
            data: null,
            width: '360px'
        }).afterClosed().subscribe(res => {
            if (res == 'ok') {
                this.fileInput.nativeElement.click();
            }
        });  
    }

	import(event: any): void { 
		if (event.target.files && event.target.files[0]) {
            const self = this;
            const promise = new Promise(function (resolve, reject) {
                self.commonService.parseExcel(resolve, reject, event.target.files[0]);
            });
            promise.then(function (value: any) {
                self.commonService.setImportData(value);
                self.router.navigateByUrl('/collectors/muticreate');
            });
            promise.catch(function (error: any) {
                console.log(error);  
            });
		}
	}
}
