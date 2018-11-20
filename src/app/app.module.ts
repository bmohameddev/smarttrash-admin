import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { OverlayContainer } from '@angular/cdk/overlay';
import { CustomOverlayContainer } from '@theme/utils/custom-overlay-container';

import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { PERFECT_SCROLLBAR_CONFIG } from 'ngx-perfect-scrollbar';
import { PerfectScrollbarConfigInterface } from 'ngx-perfect-scrollbar';
const DEFAULT_PERFECT_SCROLLBAR_CONFIG: PerfectScrollbarConfigInterface = {
    wheelPropagation: true,
    suppressScrollX: true
};
import { BlockUIModule } from 'ng-block-ui';
import { LazyLoadImageModule } from 'ng-lazyload-image';
import { CalendarModule, DateAdapter } from 'angular-calendar';
import { adapterFactory } from 'angular-calendar/date-adapters/date-fns';
import { SharedModule } from '$/shared.module';
import { PipesModule } from '@theme/pipes/pipes.module';
import { routing } from './app.routing';
import { AppComponent } from './app.component';
import { PagesComponent } from './pages/pages.component';
import { AppSettings } from '@app/app.settings';

import { SidenavComponent } from '@theme/components/sidenav/sidenav.component';
import { VerticalMenuComponent } from '@theme/components/menu/vertical-menu/vertical-menu.component';
import { HorizontalMenuComponent } from '@theme/components/menu/horizontal-menu/horizontal-menu.component';
import { FullScreenComponent } from '@theme/components/fullscreen/fullscreen.component';
import { MessagesComponent } from '@theme/components/messages/messages.component';
import { UserMenuComponent } from '@theme/components/user-menu/user-menu.component';

import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { AuthInterceptor } from './auth.interceptor';
import { APP_BASE_HREF } from '@angular/common';
import { environment } from '@env/environment';
import { ServiceWorkerModule } from '@angular/service-worker';

@NgModule({
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        HttpClientModule,
        FormsModule,
        ReactiveFormsModule,
        PerfectScrollbarModule,
        BlockUIModule.forRoot(),
        CalendarModule.forRoot({
            provide: DateAdapter,
            useFactory: adapterFactory
        }),
        LazyLoadImageModule,
        SharedModule,
        PipesModule,
        routing,
        ServiceWorkerModule.register('ngsw-worker.js', {
            enabled: environment.production
        })
    ],
    declarations: [
        AppComponent,
        PagesComponent,
        SidenavComponent,
        VerticalMenuComponent,
        HorizontalMenuComponent,
        MessagesComponent,
        FullScreenComponent,
        UserMenuComponent
    ],
    entryComponents: [
        VerticalMenuComponent
    ],
    providers: [
        AppSettings,
        {
            provide: APP_BASE_HREF,
            useValue: '/'
        },
        {
            provide: PERFECT_SCROLLBAR_CONFIG,
            useValue: DEFAULT_PERFECT_SCROLLBAR_CONFIG
        },
        {
            provide: OverlayContainer,
            useClass: CustomOverlayContainer
        },
        {
            provide: HTTP_INTERCEPTORS,
            useClass: AuthInterceptor,
            multi: true
        }
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }