import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import { LazyLoadImageModule } from 'ng-lazyload-image';
import { SharedModule } from '$/shared.module';
import { PipesModule } from '@theme/pipes/pipes.module';
import { ListTrashlogComponent } from './list-trashlog/list-trashlog.component';
import { DeductPointComponent } from './deduct-point/deduct-point.component';
import { QuillModule } from 'ngx-quill';
import { UserGuard } from '$/guards/user.guard';

export const routes = [
    { 
        path: '', 
        component: ListTrashlogComponent 
    }
];

@NgModule({
    imports: [
        CommonModule,
        HttpClientModule,
        RouterModule.forChild(routes),
        FormsModule,
        ReactiveFormsModule,
        NgxPaginationModule,
        LazyLoadImageModule,
        QuillModule,
        SharedModule,
        PipesModule,
    ],
    declarations: [
        ListTrashlogComponent,
        DeductPointComponent
    ],
    entryComponents: [
        DeductPointComponent
    ]
})
export class TrashlogModule { }
