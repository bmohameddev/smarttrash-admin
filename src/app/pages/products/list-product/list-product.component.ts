import { Component, OnInit, ViewEncapsulation, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { AppSettings } from '@app/app.settings';
import { Settings } from '@app/app.settings.model';
import { User } from '$/models/user.model';
import { AddProductComponent } from '../add-product/add-product.component';
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
import * as moment from 'moment';

@Component({
    selector: 'app-list-product',
    templateUrl: './list-product.component.html',
    styleUrls: ['./list-product.component.scss'],
    animations: [
        trigger('detailExpand', [
            state('collapsed', style({ height: '0px', minHeight: '0' })),
            state('expanded', style({ height: '*' })),
            transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
        ]),
    ],
})
export class ListProductComponent implements OnInit, OnDestroy {
    public displayedColumns: string[] = ['select', 'index', 'name', 'point', 'createdAt', 'menu'];
    public displayedColumnsMobile: string[] = ['select', 'index', 'name', 'point', 'menu'];
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
    
    public products; 

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
                this.getProducts();
            });
    }

	ngOnDestroy() {
		this.userUpdatesSubscription.unsubscribe();
		this.commonDataUpdatesSubscription.unsubscribe();
	}

    public getProducts(event?): void {
        if (event) {
            this.pageSize = event.pageSize;
            this.pageIndex = event.pageIndex;
        }

        this.blockUIService.setBlockStatus(true);
        this.commonService.getProducts(
            this.pageSize,
            this.pageIndex,
            this.searchForm.value.keyword,
            this.commonData.city.id,
            this.sortParam.active,
            this.sortParam.direction,
        ).subscribe((res: any) => {
            this.blockUIService.setBlockStatus(false);
            if (res.data) {
                this.totalCnt = res.data.totalCnt;
                this.products = res.data.products;
                this.dataSource = new MatTableDataSource<any>(res.data.products);
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
        this.getProducts();
    }

    applySearch() {
        this.getProducts();
    }

    public deleteProducts() {
        var ids = [];
        this.dataSource.data.forEach((row, index) => {
            if (this.selection.selected.some(selected => selected.index == row.index)) {
                ids.push(row.id);
            }
        });
        this.finaldeleteProducts(ids);
    }

    public deleteProduct(event, id) {
        event.stopPropagation();
        var ids = [];
        ids.push(id);
        this.finaldeleteProducts(ids);
    }

    public finaldeleteProducts(ids) {
        if (ids.length) {
            const confirmMsg = '确认删除吗?';
            this.dialog.open(ConfirmDialogComponent, {
                data: { content: confirmMsg },
                width: '360px'
            }).afterClosed().subscribe(res => {
                if (res == 'ok') {
                    this.blockUIService.setBlockStatus(true);
                    this.commonService.deleteProducts(ids).subscribe((res: any) => {
                        this.blockUIService.setBlockStatus(false);
                        this.snackBar.open(res.msg, '确认', {duration: 1500});
                        if (res.data) {
                            this.getProducts();
                        }
                    }, (err: HttpErrorResponse) => {
                        this.blockUIService.setBlockStatus(false);
                        this.snackBar.open(err.error.msg, '确认', { duration: 4000 });
                    });
                }
            });
        } else {
            this.snackBar.open("选择商品!", '确认', {duration: 1500});
        }
    }

    public openProductDialog(product?) {
        this.dialog.open(AddProductComponent, {
            data: product || null,
            width: '600px'
        }).afterClosed().subscribe(data => {
            if (data) {
                this.getProducts();
            }
        });
    }
}
