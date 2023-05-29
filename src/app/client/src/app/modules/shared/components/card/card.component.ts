import { ResourceService } from '../../services/index';
import { Component, Input, EventEmitter, Output } from '@angular/core';
import { ICard } from '../../interfaces';
import { Router } from '@angular/router';

@Component({
  selector: 'app-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.scss']
})
export class CardComponent {
  /**
  * content is used to render IContents value on the view
  */
  @Input() data: ICard;
  @Input() dialCode: string;
  @Input() customClass: string;
  @Input() hideProgress: boolean = true;
  @Output() clickEvent = new EventEmitter<any>();
  telemetryCdata: Array<{}> = [];
  hover: Boolean;
  isConnected: Boolean = navigator.onLine;
  route: string;

  constructor(public resourceService: ResourceService, private router: Router) {
    this.resourceService = resourceService;
    if (this.dialCode) {
      this.telemetryCdata = [{ 'type': 'DialCode', 'id': this.dialCode }];
    }
    this.route = this.router.url;
    setTimeout(()=>{

      console.log(this.data,'data')
    }, 50000)
  }

  public onAction(data, action) {
    this.clickEvent.emit({ 'action': action, 'data': data });
  }
}
