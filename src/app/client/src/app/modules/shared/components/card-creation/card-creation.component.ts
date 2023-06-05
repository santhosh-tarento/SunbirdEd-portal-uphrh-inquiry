import { ResourceService } from '../../services/index';
import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';
import { ICard } from '../../interfaces';
import {IInteractEventObject, IInteractEventEdata } from '@sunbird/telemetry';
import * as _ from 'lodash-es';
import { UserService } from '@sunbird/core';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import {IUserData} from '@sunbird/shared'
@Component({
  selector: 'app-card-creation',
  templateUrl: './card-creation.component.html',
  styleUrls: ['./card-creation.component.scss']
})
export class CardCreationComponent implements OnInit {
  /**
  * content is used to render IContents value on the view
  */
  @Input() data: ICard;
  @Input() customClass: string;
  @Output() clickEvent = new EventEmitter<any>();
  telemetryInteractEdata: IInteractEventEdata;
  telemetryInteractObject: IInteractEventObject;
  public unsubscribe$ = new Subject<void>();
  userType:any
  userRole:any
  showDeleteBtn:boolean = true;

  constructor(public resourceService: ResourceService,
    private userService: UserService) {
  }

  ngOnInit() {
    console.log('ddd',this.data)
    this.telemetryInteractObject = {
      id: this.data.metaData.identifier,
      type: this.data.metaData.contentType,
      ver: '1.0'
    };
    this.telemetryInteractEdata = {
      id: 'delete',
      type: 'click',
      pageid: _.get(this.data, 'telemetryObjectType')
    };
    this.getUserProfile()
  }

  getUserProfile(){
    if (this.userService.loggedIn) {
      this.userService.userData$.pipe(takeUntil(this.unsubscribe$)).subscribe((profileData: IUserData) => {
        if (_.get(profileData, 'userProfile.profileUserType.type')) {
        this.userType = profileData.userProfile['profileUserType']['type'];
        this.userRole = profileData.userProfile['roles'].length ? profileData.userProfile['roles'][0]['role'] : ''; 
        if(this.userRole == 'BOOK_REVIEWER' && this.data['telemetryObjectType'] == 'published'){
          this.showDeleteBtn =  false;
        }
        }
      });
    } 
  }

  public onAction(data, action) {
    this.clickEvent.emit({ 'action': action, 'data': data });
  }
  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
  
}
