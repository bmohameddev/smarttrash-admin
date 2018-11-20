import { Injectable } from '@angular/core';
import { Settings } from '@app/app.settings.model';

@Injectable()
export class AppSettings {
    public settings;

    constructor() {
        // this.settings = JSON.parse(localStorage.getItem('smarttrashSettings'));
        if (!this.settings) {
            this.settings = new Settings(
                    'SmartTrash',   //theme name
                    false,       //loadingSpinner
                    true,       //fixedHeader
                    true,       //sidenavIsOpened
                    true,       //sidenavIsPinned  
                    true,       //sidenavUserBlock 
                    'vertical', //horizontal , vertical
                    'default',  //default, compact, mini
                    'my-theme',   //indigo-light, teal-light, red-light, blue-dark, green-dark, pink-dark
                    false       // true = rtl, false = ltr
                )
            // localStorage.setItem('smarttrashSettings', JSON.stringify(this.settings));
        }
	}

    public saveSetting(key) {
        // let tempSetting = JSON.parse(localStorage.getItem('smarttrashSettings'));
        // tempSetting[key] = this.settings[key];
        // localStorage.setItem('smarttrashSettings', JSON.stringify(tempSetting));
	}

}

