import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { MediaChange, MediaObserver } from '@angular/flex-layout';
// import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import * as moment from 'moment';

@Injectable({
	providedIn: 'root',
})
export class CommonService {
	private commonDataSubject: BehaviorSubject<any> = new BehaviorSubject({
		title: '建德智能垃圾桶管理系统',
		locationCityName: '',
		webLocation: '',
		city: '',
		defaultSetting: '',
		appInitialized: false,
	});
	private importData: any = '';

	constructor(private httpClient: HttpClient, private mediaObserver: MediaObserver) {}

	// Common data service
	setCommonData(data) {
		this.commonDataSubject.next(data);
	}

	setCommonDataVariable(data) {
		let commonData = this.commonDataSubject.getValue();
		for (var element in data) {
			commonData[element] = data[element];
		}
		this.commonDataSubject.next(commonData);
	}

	getCommonData() {
		return this.commonDataSubject.getValue();
	}

	getCommonDataUpdates() {
		return this.commonDataSubject.asObservable();
	}

	public printTable(tableData: any) {
		let printContents = '';
		const WindowObject = window.open('', '', 'left=0,top=0,width=900,height=900,toolbar=0,scrollbars=0,status=0');
		printContents += `<table border="1" cellspacing="0"><tr>`;
		tableData.headers.forEach((element) => {
			printContents += `<th>${element}</th>`;
		});
		printContents += `</tr>`;
		tableData.content.map((data) => {
			printContents += `<tr>`;
			tableData.columns.forEach((element) => {
				printContents += `<td>${data[element]}</td>`;
			});
			printContents += `</tr>`;
		});
		const htmlData = `<html>
                <style>
                    @media print {
                        @page {
                            size: 8.3in 11.7in;
                        }
                    }
                </style>
                <body onload="window.print(); window.close();">${printContents}</body></html>`;

		WindowObject.document.writeln(htmlData);
		WindowObject.document.close();
		WindowObject.focus();
		setTimeout(() => {
			WindowObject.close();
		}, 0.5);
	}

	public exportAsExcelFile(json: any[], excelFileName: string): void {
		const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(json);
		console.log('worksheet', worksheet);
		const workbook: XLSX.WorkBook = {
			Sheets: { data: worksheet },
			SheetNames: ['data'],
		};
		const excelBuffer: any = XLSX.write(workbook, {
			bookType: 'xlsx',
			type: 'array',
		});
		//const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
		this.saveAsExcelFile(excelBuffer, excelFileName);
	}

	private saveAsExcelFile(buffer: any, fileName: string): void {
		const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
		const EXCEL_EXTENSION = '.xlsx';
		const data: Blob = new Blob([buffer], {
			type: EXCEL_TYPE,
		});
		FileSaver.saveAs(data, fileName + '_' + moment().format('YYYY-MM-DD-HH-mm-ss') + EXCEL_EXTENSION);
	}

	public parseExcel(resolve, reject, file) {
		let reader = new FileReader();
		reader.readAsBinaryString(file);
		reader.onload = (e) => {
			let data = (<any>e.target).result;
			let workbook = XLSX.read(data, {
				type: 'binary',
			});
			workbook.SheetNames.forEach(
				function (sheetName) {
					let XL_row_object = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
					resolve(XL_row_object);
				}.bind(this),
				this,
			);
		};

		reader.onerror = function (error) {
			reject(error);
		};
	}

	public getImportData() {
		return this.importData;
	}

	public setImportData(data) {
		this.importData = data;
	}

	public isMediaActive(breakpoint) {
		return this.mediaObserver.isActive(breakpoint);
	}

	checkWeixinToken(token) {
		return this.httpClient.get(`${environment.apiUrl}/api/auth/checkWeixinToken/${token}`);
	}

	// Api service
	getImage(imageUrl: string) {
		return this.httpClient.get(imageUrl, { responseType: 'blob' });
	}

	getAllCities() {
		return this.httpClient.get(`${environment.apiUrl}/api/admin/getAllCities`);
	}

	getAllAdmins() {
		return this.httpClient.get(`${environment.apiUrl}/api/admin/getAllAdmins`);
	}

	adminLogin(body) {
		return this.httpClient.post(`${environment.apiUrl}/api/auth/adminLogin`, body);
	}

	getCaptcha() {
		return this.httpClient.get(`${environment.apiUrl}/api/auth/getCaptcha`);
	}

	checkPassword(body) {
		return this.httpClient.post(`${environment.apiUrl}/api/auth/checkPassword`, body);
	}

	// User api
	createUser(body) {
		return this.httpClient.post(`${environment.apiUrl}/api/admin/createUser`, body);
	}

	getUsers(queryParams) {
		return this.httpClient.get(
			`${environment.apiUrl}/api/admin/getUsers?limit=${queryParams.limit || ''}&offset=${
				queryParams.offset || ''
			}&search=${queryParams.search || ''}&city=${queryParams.city || ''}&active=${
				queryParams.active || ''
			}&direction=${queryParams.direction || ''}`,
		);
	}

	getUser(id) {
		return this.httpClient.get(`${environment.apiUrl}/api/admin/getUser/${id}`);
	}

	getUserByCard(cardId) {
		return this.httpClient.get(`${environment.apiUrl}/api/admin/getUserByCard/${cardId}`);
	}

	updateUser(userId, body) {
		return this.httpClient.post(`${environment.apiUrl}/api/admin/updateUser/${userId}`, body);
	}

	deleteUsers(ids) {
		return this.httpClient.post(`${environment.apiUrl}/api/admin/deleteUsers`, { ids });
	}

	changeUsersState(ids, operationType) {
		return this.httpClient.post(`${environment.apiUrl}/api/admin/changeUsersState/${operationType}`, { ids });
	}

	getMaxCardId() {
		return this.httpClient.get(`${environment.apiUrl}/api/admin/getMaxCardId`);
	}

	getTotalUsers() {
		return this.httpClient.get(`${environment.apiUrl}/api/admin/getTotalUsers`);
	}

	// Collector api
	createCollector(body) {
		return this.httpClient.post(`${environment.apiUrl}/api/admin/createCollector`, body);
	}

	getCollectors(queryParams) {
		return this.httpClient.get(
			`${environment.apiUrl}/api/admin/getCollectors?limit=${queryParams.limit || ''}&offset=${
				queryParams.offset || ''
			}&search=${queryParams.search || ''}&startDate=${queryParams.startDate || ''}&endDate=${
				queryParams.endDate || ''
			}&city=${queryParams.city || ''}&active=${queryParams.active || ''}&direction=${
				queryParams.direction || ''
			}`,
		);
	}

	getCollector(id) {
		return this.httpClient.get(`${environment.apiUrl}/api/admin/getCollector/${id}`);
	}

	getCollectorByCard(cardId) {
		return this.httpClient.get(`${environment.apiUrl}/api/admin/getCollectorByCard/${cardId}`);
	}

	updateCollector(userId, body) {
		return this.httpClient.post(`${environment.apiUrl}/api/admin/updateCollector/${userId}`, body);
	}

	deleteCollectors(ids) {
		return this.httpClient.post(`${environment.apiUrl}/api/admin/deleteCollectors`, { ids });
	}

	changeCollectorsState(ids, operationType) {
		return this.httpClient.post(`${environment.apiUrl}/api/admin/changeCollectorsState/${operationType}`, { ids });
	}

	getCollectorsReport(queryParams) {
		return this.httpClient.get(
			`${environment.apiUrl}/api/admin/getCollectorsReport?limit=${queryParams.limit || ''}&offset=${
				queryParams.offset || ''
			}&search=${queryParams.search || ''}&startDate=${queryParams.startDate || ''}&endDate=${
				queryParams.endDate || ''
			}&city=${queryParams.city || ''}&active=${queryParams.active || ''}&direction=${
				queryParams.direction || ''
			}`,
		);
	}

	getCollectorReport(queryParams) {
		return this.httpClient.get(
			`${environment.apiUrl}/api/admin/getCollectorReport/${queryParams.id}?limit=${
				queryParams.limit || ''
			}&offset=${queryParams.offset || ''}&startDate=${queryParams.startDate || ''}&endDate=${
				queryParams.endDate || ''
			}&active=${queryParams.active || ''}&direction=${queryParams.direction || ''}`,
		);
	}

	editProfile(body) {
		return this.httpClient.post(`${environment.apiUrl}/api/auth/editProfile`, body, {
			reportProgress: true,
		});
	}

	addDust(body) {
		return this.httpClient.post(`${environment.apiUrl}/api/admin/addDust`, body);
	}

	getDusts(limit?, offset?, search?, active?, direction?) {
		return this.httpClient.get<any>(
			`${environment.apiUrl}/api/admin/getDusts?limit=${limit || 10}&offset=${offset || 0}&search=${
				search || ''
			}&active=${active || ''}&direction=${direction || ''}`,
		);
	}

	updateDust(id, body) {
		return this.httpClient.post(`${environment.apiUrl}/api/admin/updateDust/${id}`, body);
	}

	deleteDusts(ids) {
		return this.httpClient.post(`${environment.apiUrl}/api/admin/deleteDusts`, { ids });
	}

	addTrash(body) {
		return this.httpClient.post(`${environment.apiUrl}/api/admin/addTrash`, body);
	}

	getTrashes(queryParams) {
		return this.httpClient.get<any>(
			`${environment.apiUrl}/api/admin/getTrashes?limit=${queryParams.limit || ''}&offset=${
				queryParams.offset || ''
			}&search=${queryParams.search || ''}&city=${queryParams.city || ''}&active=${
				queryParams.active || ''
			}&direction=${queryParams.direction || ''}`,
		);
	}

	getTrash(id) {
		return this.httpClient.get(`${environment.apiUrl}/api/admin/getTrash/${id}`);
	}

	updateTrash(id, body) {
		return this.httpClient.post(`${environment.apiUrl}/api/common/updateTrash/${id}`, body, {
			reportProgress: true,
		});
	}

	deleteTrashes(ids) {
		return this.httpClient.post(`${environment.apiUrl}/api/admin/deleteTrashes`, { ids });
	}

	updateVolume(id, volume) {
		return this.httpClient.get(`${environment.apiUrl}/api/admin/updateVolume/${id}?volume=${volume || 100}`);
	}

	// Trash log api
	getTrashLogs(queryParams) {
		return this.httpClient.get(
			`${environment.apiUrl}/api/admin/getTrashLogs?limit=${queryParams.limit || ''}&offset=${
				queryParams.offset || ''
			}&search=${queryParams.search || ''}&dustTypes=${queryParams.dustTypes || ''}&deduct=${
				queryParams.deduct || ''
			}&city=${queryParams.city || ''}&startDate=${queryParams.startDate || ''}&endDate=${
				queryParams.endDate || ''
			}&state=${queryParams.state || ''}&active=${queryParams.active || ''}&direction=${
				queryParams.direction || ''
			}`,
		);
	}

	deleteTrashlogs(ids) {
		return this.httpClient.post(`${environment.apiUrl}/api/admin/deleteTrashlogs`, { ids });
	}

	changeTrashlogState(id, orderState) {
		return this.httpClient.get(`${environment.apiUrl}/api/admin/changeTrashlogState/${id}/${orderState}`);
	}

	deductPoint(id, body) {
		return this.httpClient.post(`${environment.apiUrl}/api/admin/deductPoint/${id}`, body);
	}

	getUserReport(id, year?, month?) {
		return this.httpClient.get(
			`${environment.apiUrl}/api/admin/getUserReport?id=${id || ''}&year=${year || ''}&month=${month || ''}`,
		);
	}

	getUsersReport(queryParams) {
		return this.httpClient.get(
			`${environment.apiUrl}/api/admin/getUsersReport?limit=${queryParams.limit || ''}&offset=${
				queryParams.offset || ''
			}&search=${queryParams.search || ''}&filter=${queryParams.filter || ''}&startDate=${
				queryParams.startDate || ''
			}&endDate=${queryParams.endDate || ''}&city=${queryParams.city || ''}&active=${
				queryParams.active || ''
			}&direction=${queryParams.direction || ''}`,
		);
	}

	getTrashReport(id, year?, month?) {
		return this.httpClient.get(
			`${environment.apiUrl}/api/admin/getTrashReport?id=${id || ''}&year=${year || ''}&month=${month || ''}`,
		);
	}

	getTrashesReport(queryParams) {
		return this.httpClient.get(
			`${environment.apiUrl}/api/admin/getTrashesReport?limit=${queryParams.limit || ''}&offset=${
				queryParams.offset || ''
			}&search=${queryParams.search || ''}&year=${queryParams.year || ''}&month=${queryParams.month || ''}&date=${
				queryParams.date || ''
			}&city=${queryParams.city || ''}&active=${queryParams.active || ''}&direction=${
				queryParams.direction || ''
			}`,
		);
	}

	getCityReport(id?, year?, month?, date?) {
		return this.httpClient.get(
			`${environment.apiUrl}/api/admin/getCityReport?id=${id || ''}&year=${year || ''}&month=${
				month || ''
			}&date=${date || ''}`,
		);
	}

	getCitiesReport(limit?, offset?, search?, year?, month?, date?, active?, direction?) {
		return this.httpClient.get(
			`${environment.apiUrl}/api/admin/getCitiesReport?limit=${limit || 10}&offset=${offset || 0}&search=${
				search || ''
			}&year=${year || ''}&month=${month || ''}&date=${date || ''}&active=${active || ''}&direction=${
				direction || ''
			}`,
		);
	}

	getTotalResult(queryParams) {
		return this.httpClient.get(
			`${environment.apiUrl}/api/admin/getTotalResult?startDate=${queryParams.startDate || ''}&endDate=${
				queryParams.endDate || ''
			}&city=${queryParams.city || ''}`,
		);
	}

	createAdmin(body) {
		return this.httpClient.post(`${environment.apiUrl}/api/admin/createAdmin`, body);
	}

	getAdmins(limit?, offset?, search?, active?, direction?) {
		return this.httpClient.get(
			`${environment.apiUrl}/api/admin/getAdmins?limit=${limit || 10}&offset=${offset || 0}&search=${
				search || ''
			}&active=${active || ''}&direction=${direction || ''}`,
		);
	}

	getAdmin(id) {
		return this.httpClient.get(`${environment.apiUrl}/api/admin/getAdmin/${id}`);
	}

	updateAdmin(userId, body) {
		return this.httpClient.post(`${environment.apiUrl}/api/admin/updateAdmin/${userId}`, body);
	}

	deleteAdmins(ids) {
		return this.httpClient.post(`${environment.apiUrl}/api/admin/deleteAdmins`, { ids });
	}

	changeAdminsState(ids, operationType) {
		return this.httpClient.post(`${environment.apiUrl}/api/admin/changeAdminsState/${operationType}`, { ids });
	}

	withdraw(body) {
		return this.httpClient.post(`${environment.apiUrl}/api/admin/withdraw`, body);
	}

	getWithdraws(queryParams) {
		return this.httpClient.get(
			`${environment.apiUrl}/api/admin/getWithdraws?limit=${queryParams.limit || ''}&offset=${
				queryParams.offset || ''
			}&search=${queryParams.search || ''}&active=${queryParams.active || ''}&direction=${
				queryParams.direction || ''
			}`,
		);
	}

	addCity(body) {
		return this.httpClient.post(`${environment.apiUrl}/api/admin/addCity`, body);
	}

	getCities(limit?, offset?, search?, active?, direction?) {
		return this.httpClient.get<any>(
			`${environment.apiUrl}/api/admin/getCities?limit=${limit || 10}&offset=${offset || 0}&search=${
				search || ''
			}&active=${active || ''}&direction=${direction || ''}`,
		);
	}

	getCity(id) {
		return this.httpClient.get(`${environment.apiUrl}/api/admin/getCity/${id}`);
	}

	updateCity(id, body) {
		return this.httpClient.post(`${environment.apiUrl}/api/admin/updateCity/${id}`, body);
	}

	updatePointRule(id, body) {
		return this.httpClient.post(`${environment.apiUrl}/api/admin/updatePointRule/${id}`, body);
	}

	updateDevicePassword(id, body) {
		return this.httpClient.post(`${environment.apiUrl}/api/admin/updateDevicePassword/${id}`, body);
	}

	updateResident(id, body) {
		return this.httpClient.post(`${environment.apiUrl}/api/admin/updateResident/${id}`, body);
	}

	updateSiteName(id, body) {
		return this.httpClient.post(`${environment.apiUrl}/api/admin/updateSiteName/${id}`, body);
	}

	updateDateAllowCnt(id, body) {
		return this.httpClient.post(`${environment.apiUrl}/api/admin/updateDateAllowCnt/${id}`, body);
	}

	updateRate(id, body) {
		return this.httpClient.post(`${environment.apiUrl}/api/admin/updateRate/${id}`, body);
	}

	updateLimit(id, body) {
		return this.httpClient.post(`${environment.apiUrl}/api/admin/updateLimit/${id}`, body);
	}

	uploadDeviceVideo(id, videoIndex, body) {
		return this.httpClient.post(`${environment.apiUrl}/api/admin/uploadDeviceVideo/${id}/${videoIndex}`, body, {
			reportProgress: true,
			observe: 'events',
		});
	}

	updateDashboardVideo(id, dashboardVideo) {
		return this.httpClient.post(
			`${environment.apiUrl}/api/admin/updateDashboardVideo/${id}?dashboardVideo=${dashboardVideo}`,
			null,
		);
	}

	updateDeviceVideo(id, deviceVideo) {
		return this.httpClient.post(
			`${environment.apiUrl}/api/admin/updateDeviceVideo/${id}?deviceVideo=${deviceVideo}`,
			null,
		);
	}

	deleteCities(ids) {
		return this.httpClient.post(`${environment.apiUrl}/api/admin/deleteCities`, { ids });
	}

	getDefaultSetting() {
		return this.httpClient.get(`${environment.apiUrl}/api/admin/getDefaultSetting`);
	}

	updateDefaultPointRule(body) {
		return this.httpClient.post(`${environment.apiUrl}/api/admin/updateDefaultPointRule`, body);
	}

	updateDefaultDevicePassword(body) {
		return this.httpClient.post(`${environment.apiUrl}/api/admin/updateDefaultDevicePassword`, body);
	}

	updateDefaultSiteName(body) {
		return this.httpClient.post(`${environment.apiUrl}/api/admin/updateDefaultSiteName`, body);
	}

	updateDefaultClassificationGuide(body) {
		return this.httpClient.post(`${environment.apiUrl}/api/admin/updateDefaultClassificationGuide`, body);
	}

	updateDefaultDeviceVideo(body) {
		return this.httpClient.post(`${environment.apiUrl}/api/admin/updateDefaultDeviceVideo`, body, {
			reportProgress: true,
			observe: 'events',
		});
	}

	updateDefaultDeviceAudio(body) {
		return this.httpClient.post(`${environment.apiUrl}/api/admin/updateDefaultDeviceAudio`, body, {
			reportProgress: true,
			observe: 'events',
		});
	}

	// Product api
	createProduct(body) {
		return this.httpClient.post(`${environment.apiUrl}/api/admin/createProduct`, body);
	}

	getProducts(limit?, offset?, search?, city?, active?, direction?) {
		return this.httpClient.get(
			`${environment.apiUrl}/api/admin/getProducts?limit=${limit || 10}&offset=${offset || 0}&search=${
				search || ''
			}&city=${city || ''}&active=${active || ''}&direction=${direction || ''}`,
		);
	}

	getProduct(id) {
		return this.httpClient.get(`${environment.apiUrl}/api/admin/getProduct/${id}`);
	}

	updateProduct(id, body) {
		return this.httpClient.post(`${environment.apiUrl}/api/admin/updateProduct/${id}`, body);
	}

	deleteProducts(ids) {
		return this.httpClient.post(`${environment.apiUrl}/api/admin/deleteProducts`, { ids });
	}

	// Payment api
	createPayment(body) {
		return this.httpClient.post(`${environment.apiUrl}/api/admin/createPayment`, body);
	}

	getPayments(queryParams) {
		return this.httpClient.get(
			`${environment.apiUrl}/api/admin/getPayments?limit=${queryParams.limit || ''}&offset=${
				queryParams.offset || ''
			}&dustTypes=${queryParams.dustTypes || ''}&city=${queryParams.city || ''}&active=${
				queryParams.active || ''
			}&direction=${queryParams.direction || ''}`,
		);
	}
}
