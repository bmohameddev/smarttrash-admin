import { Component, ElementRef, OnInit, ViewEncapsulation, OnDestroy, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { AppSettings } from '@app/app.settings';
import { Settings } from '@app/app.settings.model';
import { User } from '$/models/user.model';
import { AddUserComponent } from '../add-user/add-user.component';
import { SelectionModel } from '@angular/cdk/collections';
import { FormBuilder, FormGroup, EmailValidator } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { environment } from '@env/environment';
import { BlockUIService } from '$/services/block-ui.service';
import { CommonService } from '$/services/common.service';
import { AuthenticationService } from '$/services/authentication.service';
import { ConfirmDialogComponent } from '$/components/confirm-dialog/confirm-dialog.component';
import { PasswordDialogComponent } from '$/components/password-dialog/password-dialog.component';
import * as moment from 'moment';

@Component({
    selector: 'app-list-user',
    templateUrl: './list-user.component.html',
    styleUrls: ['./list-user.component.scss'],
    animations: [
        trigger('detailExpand', [
            state('collapsed', style({ height: '0px', minHeight: '0' })),
            state('expanded', style({ height: '*' })),
            transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
        ]),
    ],
})
export class ListUserComponent implements OnInit, OnDestroy {
    public displayedColumns: string[] = ['select', 'index', 'name', 'cardIds', 'phone', 'totalPoint', 'city', 'address', 'createdAt', 'state', 'menu'];
    public displayedColumnsMobile: string[] = ['select', 'index', 'name', 'city', 'state', 'menu'];
    public dataSource: any;
    public selection = new SelectionModel<any>(true, []);
    public totalCnt: number;
    private pageSize: number = 10;
    public pageIndex: number;
    private search: string = '';
    private sortParam = {
        active: '',
        direction: '',
    };
    public searchForm: FormGroup;
    serverUrl = environment.apiUrl;  
    @ViewChild('fileInput', {static: false}) fileInput: ElementRef;
    
    public users; 

	public user: any;
    private userUpdatesSubscription: Subscription;
    
	public commonData: any;
    private commonDataUpdatesSubscription: Subscription;

    constructor(
        public router: Router,
        private fb: FormBuilder,
        private blockUIService: BlockUIService,
        public commonService: CommonService,
        private authenticationService: AuthenticationService,
        private snackBar: MatSnackBar,
        public dialog: MatDialog
    ) { }

    ngOnInit() {
        this.searchForm = this.fb.group({
            keyword: ''
        });
		this.userUpdatesSubscription = this.authenticationService
			.getUserUpdates()
			.subscribe(user => this.user = user);
        this.commonDataUpdatesSubscription = this.commonService
            .getCommonDataUpdates()
            .subscribe(commonData => {
                this.commonData = commonData;
                this.getUsers();
            });
    }

	ngOnDestroy() {
		this.userUpdatesSubscription.unsubscribe();
		this.commonDataUpdatesSubscription.unsubscribe();
	}

    public getUsers(event?): void {
        if (event) {
            this.pageSize = event.pageSize;
            this.pageIndex = event.pageIndex;
        }

        this.blockUIService.setBlockStatus(true);
        this.commonService.getUsers({
            search: this.searchForm.value.keyword,
            limit: this.pageSize,
            offset: this.pageIndex,
            city: this.commonData.city.id,
            active: this.sortParam.active,
            direction: this.sortParam.direction
        }).subscribe((res: any) => {
            this.blockUIService.setBlockStatus(false);
            if (res.data) {
                this.totalCnt = res.data.totalCnt;
                this.users = res.data.users;
                this.dataSource = new MatTableDataSource<any>(res.data.users);
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
        this.getUsers();
    }

    applySearch() {
        this.getUsers();
    }

    public deleteUsers() {
        var ids = [];
        this.dataSource.data.forEach((row, index) => {
            if (this.selection.selected.some(selected => selected.index == row.index)) {
                ids.push(row.id);
            }
        });
        this.finalDeleteUsers(ids);
    }

    public deleteUser(event, id) {
        event.stopPropagation();
        var ids = [];
        ids.push(id);
        this.finalDeleteUsers(ids);
    }

    public finalDeleteUsers(ids) {
        if (ids.length) {
            const confirmMsg = '确认删除吗?';
            this.dialog.open(ConfirmDialogComponent, {
                data: { content: confirmMsg },
                width: '360px'
            }).afterClosed().subscribe(res => {
                if (res == 'ok') {
                    this.commonService.deleteUsers(ids).subscribe((res: any) => {
                        this.snackBar.open(res.msg, '确认', {duration: 1500});
                        if (res.data) {
                            this.getUsers();
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

    public suspendUsers() {
        var ids = [];
        this.dataSource.data.forEach((row, index) => {
            if (this.selection.selected.some(selected => selected.index == row.index)) {
                ids.push(row.id);
            }
        });
        this.finalSuspendUsers(ids, true);
    }

    public suspendUser(event, id, operationType) {
        event.stopPropagation();
        var ids = [];
        ids.push(id);
        this.finalSuspendUsers(ids, operationType);
    }

    public finalSuspendUsers(ids, operationType) {
        // if operationType is true, suspend user.
        // if operationType is false, activate user.
        if (ids.length) {
            const confirmMsg = '确认黑名单吗?';
            this.dialog.open(ConfirmDialogComponent, {
                data: { content: confirmMsg },
                width: '360px'
            }).afterClosed().subscribe(res => {
                if (res == 'ok') {
                    this.commonService.changeUsersState(ids, operationType).subscribe((res: any) => {
                        this.snackBar.open(res.msg, '确认', {duration: 1500});
                        if (res.data) {
                            this.getUsers();
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

    public openUserDialog(user?) {
        this.dialog.open(AddUserComponent, {
            data: user || null,
            width: '600px'
        }).afterClosed().subscribe(data => {
            if (data) {
                this.getUsers();
            }
        });
    }

    public getAllUsers(resolve) {
        this.blockUIService.setBlockStatus(true);
        this.commonService.getUsers({
            search: this.searchForm.value.keyword,
            city: this.commonData.city.id,
            active: this.sortParam.active,
            direction: this.sortParam.direction
        }).subscribe((res: any) => {
            this.blockUIService.setBlockStatus(false);
            if (res.data) {
                resolve(res.data.users);
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
                    self.getAllUsers(resolve);
                }).then(function (value: any) {
                    let printData: any[] = [];
                    value.forEach(element => {
                        printData.push({
                            No: element.index + 1,
                            姓名: element.name,
                            卡号: element.cardIds,
                            电话号: element.phone,
                            总积分: Math.round(element.totalPoint * 10) / 10,
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
                    self.getAllUsers(resolve);
                }).then(function (value: any) {
                    let printData: any[] = [];
                    value.forEach(element => {
                        printData.push({
                            index: element.index + 1,
                            name: element.name,
                            cardIds: element.cardIds,
                            phone: element.phone,
                            totalPoint: Math.round(element.totalPoint * 10) / 10,
                            city: (element.city? element.city.name : ''),
                            address: (element.address? element.address : ''),
                            createdAt: moment(element.createdAt).format('YYYY.MM.DD - HH:mm:ss')
                        })
                    })
                    self.commonService.printTable({
                        columns: ['index', 'name', 'cardIds', 'phone', 'totalPoint', 'city', 'address', 'createdAt'],
                        headers: ['No', '姓名', '卡号', '电话号', '总积分', '城市', '详细地址', '创建时间'],
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
                self.router.navigateByUrl('/users/muticreate');
            });
            promise.catch(function (error: any) {
                console.log(error);  
            });
		}
	}
}
