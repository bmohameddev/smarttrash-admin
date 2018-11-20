import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { AppSettings } from '@app/app.settings';
import { Settings } from '@app/app.settings.model';
import { User } from '$/models/user.model';
import { AddAdminComponent } from '../add-admin/add-admin.component';
import { SelectionModel } from '@angular/cdk/collections';
import { FormBuilder, FormGroup, EmailValidator } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { environment } from '@env/environment';
import { BlockUIService } from '$/services/block-ui.service';
import { CommonService } from '$/services/common.service';
import { ConfirmDialogComponent } from '$/components/confirm-dialog/confirm-dialog.component';

@Component({
    selector: 'app-list-admin',
    templateUrl: './list-admin.component.html',
    styleUrls: ['./list-admin.component.scss'],
    animations: [
        trigger('detailExpand', [
            state('collapsed', style({ height: '0px', minHeight: '0' })),
            state('expanded', style({ height: '*' })),
            transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
        ]),
    ],
})
export class ListAdminComponent implements OnInit {
    public displayedColumns: string[] = ['select', 'index', 'name', 'phone', 'city', 'trashCnt', 'createdAt', 'weixin', 'state', 'menu'];
    public displayedColumnsMobile: string[] = ['select', 'index', 'name', 'trashCnt', 'state', 'menu'];
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

    constructor(
        public router: Router,
        private fb: FormBuilder,
        private blockUIService: BlockUIService,
        public commonService: CommonService,
        private snackBar: MatSnackBar,
        public dialog: MatDialog
    ) { }

    ngOnInit() {
        this.searchForm = this.fb.group({
            keyword: ''
        });
        this.getAdmins();
    }

    public getAdmins(event?): void {
        if (event) {
            this.pageSize = event.pageSize;
            this.pageIndex = event.pageIndex;
        }
        this.blockUIService.setBlockStatus(true);
        this.commonService.getAdmins(
            this.pageSize,
            this.pageIndex,
            this.searchForm.value.keyword,
            this.sortParam.active,
            this.sortParam.direction,
        ).subscribe((res: any) => {
            this.blockUIService.setBlockStatus(false);
            if (res.data) {
                this.totalCnt = res.data.totalCnt;
                this.dataSource = new MatTableDataSource<any>(res.data.admins);
                this.selection.clear();
                if (this.totalCnt <= this.pageSize * this.pageIndex) {
                    this.pageIndex = 0;
                }
            }
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
        this.getAdmins();
    }

    applySearch() {
        this.getAdmins();
    }

    public deleteAdmins() {
        var ids = [];
        this.dataSource.data.forEach((row, index) => {
            if (this.selection.selected.some(selected => selected.index == row.index)) {
                ids.push(row.id);
            }
        });
        this.finalDeleteAdmins(ids);
    }

    public deleteAdmin(event, id) {
        event.stopPropagation();
        var ids = [];
        ids.push(id);
        this.finalDeleteAdmins(ids);
    }

    public finalDeleteAdmins(ids) {
        if (ids.length) {
            const confirmMsg = '确认删除吗?';
            this.dialog.open(ConfirmDialogComponent, {
                data: { content: confirmMsg },
                width: '360px'
            }).afterClosed().subscribe(res => {
                if (res == 'ok') {
                    this.blockUIService.setBlockStatus(true);
                    this.commonService.deleteAdmins(ids).subscribe((res: any) => {
                        this.blockUIService.setBlockStatus(false);
                        this.snackBar.open(res.msg, '确认', {duration: 1500});
                        if(res.data) {
                            this.getAdmins();
                        }
                    }, (err: HttpErrorResponse) => {
                        this.blockUIService.setBlockStatus(false);
                        this.snackBar.open(err.error.msg, '确认', { duration: 4000 });
                    });
                }
            });
        } else {
            this.snackBar.open("选择管理员", '确认', {duration: 1500});
        }
    }

    public suspendAdmins() {
        var ids = [];
        this.dataSource.data.forEach((row, index) => {
            if (this.selection.selected.some(selected => selected.index == row.index)) {
                ids.push(row.id);
            }
        });
        this.finalSuspendAdmins(ids, true);
    }

    public suspendAdmin(event, id, operationType) {
        event.stopPropagation();
        var ids = [];
        ids.push(id);
        this.finalSuspendAdmins(ids, operationType);
    }

    public finalSuspendAdmins(ids, operationType) {
        // if operationType is true, suspend admin.
        // if operationType is false, activate user.
        if (ids.length) {
            const confirmMsg = '确认黑名单吗?';
            this.dialog.open(ConfirmDialogComponent, {
                data: { content: confirmMsg },
                width: '360px'
            }).afterClosed().subscribe(res => {
                if (res == 'ok') {
                    this.blockUIService.setBlockStatus(true);
                    this.commonService.changeAdminsState(ids, operationType).subscribe((res: any) => {
                        this.blockUIService.setBlockStatus(false);
                        this.snackBar.open(res.msg, '确认', {duration: 1500});
                        if(res.data) {
                            this.getAdmins();
                        }
                    }, (err: HttpErrorResponse) => {
                        this.blockUIService.setBlockStatus(false);
                        this.snackBar.open(err.error.msg, '确认', { duration: 4000 });
                    });
                }
            });
        } else {
            this.snackBar.open("选择管理员", '确认', {duration: 1500});
        }
    }

    public openAdminDialog(admin?) {
        this.dialog.open(AddAdminComponent, {
            data: admin || null,
            width: '600px'
        }).afterClosed().subscribe(data => {
            if (data) {
                this.getAdmins();
            }
        });
    }
}

