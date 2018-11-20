import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';
import { Router } from '@angular/router';

@Injectable({
    providedIn: 'root'
})
export class ChangePasswordService {

    constructor(
        private router: Router,
        private httpClient: HttpClient
    ) { }

    adminChangePassword(body) {
        return this.httpClient.post(
            `${environment.apiUrl}/api/auth/adminChangePassword`,
            body
        );
    }
}
