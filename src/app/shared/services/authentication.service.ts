import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import * as jwtDecode from 'jwt-decode';
import { Router } from '@angular/router';
import { User } from '$/models/user.model';

@Injectable({
	providedIn: 'root'
})
export class AuthenticationService {
	private token: string = null;
	private userSubject: BehaviorSubject<any>;

	constructor(private router: Router) {
		this.token = localStorage.getItem('smarttrashA');
		const user = localStorage.getItem('smarttrashA')? jwtDecode(localStorage.getItem('smarttrashA')).user : null;
		this.userSubject = new BehaviorSubject<User>(user);
	}

	getToken() {
		return this.token;
	}

	setToken(token: string) {
		this.token = token;
		localStorage.setItem('smarttrashA', token);
		this.userSubject.next(jwtDecode(localStorage.getItem('smarttrashA')).user);
	}

	getUser() {
	  	return this.userSubject.getValue();
	}

	getUserUpdates() {
		return this.userSubject.asObservable();
	}

	isAdmin() {
		return this.token != null && jwtDecode(this.token).admin;
	}

	hasRole(role) {
		return this.token != null && jwtDecode(this.token).user.role == role;
	}

	logout() {
		this.token = null;
		this.router.navigateByUrl('/login');
		this.userSubject.next(null);
		this.clearLocalStorage();
	}

	clearLocalStorage() {
		localStorage.removeItem('smarttrashA');
	}
}
