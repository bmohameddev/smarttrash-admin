import { Component, ViewChild, EventEmitter, Type, Input, Output, OnInit, OnDestroy } from '@angular/core';
import { ImageCroppedEvent } from 'ngx-image-cropper';
@Component({
	selector: 'app-select-date',
	templateUrl: './select-date.component.html',
	styleUrls: ['./select-date.component.scss'],
})

export class SelectDateComponent implements OnInit {
    dates = [
        {value: '1', viewValue: '一日'},
        {value: '2', viewValue: '二日'},
        {value: '3', viewValue: '三日'},
        {value: '4', viewValue: '四日'},
        {value: '5', viewValue: '五日'},
        {value: '6', viewValue: '六日'},
        {value: '7', viewValue: '七日'},
        {value: '8', viewValue: '八日'},
        {value: '9', viewValue: '九日'},
        {value: '10', viewValue: '十日'},
        {value: '11', viewValue: '十一日'},
        {value: '12', viewValue: '十二日'},
        {value: '13', viewValue: '十三日'},
        {value: '14', viewValue: '十四日'},
        {value: '15', viewValue: '十五日'},
        {value: '16', viewValue: '十六日'},
        {value: '17', viewValue: '十七日'},
        {value: '18', viewValue: '十八日'},
        {value: '19', viewValue: '十九日'},
        {value: '20', viewValue: '二十日'},
        {value: '21', viewValue: '二十一日'},
        {value: '22', viewValue: '二十二日'},
        {value: '23', viewValue: '二十三日'},
        {value: '24', viewValue: '二十四日'},
        {value: '25', viewValue: '二十五日'},
        {value: '26', viewValue: '二十六日'},
        {value: '27', viewValue: '二十七日'},
        {value: '28', viewValue: '二十八日'},
        {value: '29', viewValue: '二十九日'},
        {value: '30', viewValue: '三十日'},
        {value: '31', viewValue: '三十一日'},
    ];
    months = [
        {value: '1', viewValue: '一月'},
        {value: '2', viewValue: '二月'},
        {value: '3', viewValue: '三月'},
        {value: '4', viewValue: '四月'},
        {value: '5', viewValue: '五月'},
        {value: '6', viewValue: '六月'},
        {value: '7', viewValue: '七月'},
        {value: '8', viewValue: '八月'},
        {value: '9', viewValue: '九月'},
        {value: '10', viewValue: '十月'},
        {value: '11', viewValue: '十一月'},
        {value: '12', viewValue: '十二月'}
    ];
    years = [
        {value: '2016', viewValue: '2016年'},
        {value: '2017', viewValue: '2017年'},
        {value: '2018', viewValue: '2018年'},
        {value: '2019', viewValue: '2019年'},
        {value: '2020', viewValue: '2020年'},
    ];
    public selectedYear: string = String(new Date().getFullYear());
    public selectedMonth: string = String(new Date().getMonth() + 1);
	public selectedDate: string = String(new Date().getDate());

    @Input() selectType: String;
    @Input() dateType: String = "year";
	@Output() sendData: EventEmitter<any> = new EventEmitter<any>();

	ngOnInit() { 
        this.changeDate();
    }

    checkDate(type, value) {
        if (type == 'month') {
            return new Date() > new Date(this.selectedYear + '-' + value)
        } else if (type == 'date') {
            const date = new Date(this.selectedYear + '-' + this.selectedMonth + '-' + value);
            return new Date() > date && date.getDate() == value
        }
    }

	changeDate() {
        if (this.selectType == 'range') {
            this.sendData.emit({ 
                dateType: this.dateType,
                selectedYear: this.dateType != 'year'? this.selectedYear : '', 
                selectedMonth: this.dateType == 'date'? this.selectedMonth : ''
            });
        } else if (this.selectType == 'correct') {
            this.sendData.emit({ 
                selectedYear: this.selectedYear, 
                selectedMonth: this.dateType != 'year'? this.selectedMonth : '', 
                selectedDate: this.dateType == 'date'? this.selectedDate : ''
            });  
        }
	}
}