import { Component, OnDestroy, OnInit } from '@angular/core';
import { LayoutService, ServerResponse, ResourceService} from '@sunbird/shared';
import { FormService } from '@sunbird/core';
import * as _ from 'lodash-es';
import { mergeMap, takeUntil, map } from 'rxjs/operators';
import { of,combineLatest, Subject } from 'rxjs';

@Component({
  selector: 'app-landing-page',
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.scss']
})
export class LandingPageComponent implements OnInit, OnDestroy {
  private unsubscribe$ = new Subject<void>();
  layoutConfiguration;
  UserArticle:{}
  userCalender:{}
  showUserArticle:boolean = true;
  showUserCalender:boolean = true;
  showAnnoucements: boolean = true;
  mainContent=  [];

  constructor(public layoutService: LayoutService, public formService: FormService, public resourceService: ResourceService) {
    this.formService= formService;
    this.resourceService = resourceService;
   }

  ngOnInit() {
    this.layoutConfiguration = this.layoutService.initlayoutConfig();
    this.getUserContentconfig();
    ;
    combineLatest(
      this.resourceService.frmelmnts$,
      this.getPortalConfig()).pipe(
        takeUntil(this.unsubscribe$),
        map((data) => ({ frmelmnts: data[0], mainContent: data[1] })
      ))
      .subscribe((result) => {
        this.mainContent= result.mainContent;
        _.forEach(this.mainContent, (content) => {
          content.contentText = _.get(result, content.contentText);
        });
      },
      (error) =>  {
        this.mainContent= [];
      });

  }

  getUserContentconfig(){
    const formInputParams = {
      formType: 'user',
      subType: 'content',
      formAction: 'display',
      component:'portal',
    };

    this.layoutService.getFormData(formInputParams).subscribe(
      (data:ServerResponse)=>{
        if(data.result?.form?.data){
          this.UserArticle= data.result.form.data?.fields[0]
          this.showUserArticle = this.UserArticle['showFeatureArticle']
          if(!this.showUserArticle){
              this.showAnnoucements = false
          }
          this.userCalender = data.result.form.data?.fields[1]
          this.showUserCalender = this.userCalender['showCalender']
        }   
      },
      (err:ServerResponse)=>{
        this.showUserArticle = true
        this.showUserCalender = true
        this.showAnnoucements = true

      }
    )
  }

    /**
   * @description -  to fetch portal config to display relevant content
   */
    getPortalConfig() {
      const formReadInputParams = { 
        formType: 'config',
        formAction: 'display',
        contentType: 'global',
        component: 'portal'
      };
      return this.formService.getFormConfig(formReadInputParams).
        pipe(mergeMap((data) => {
          if (data && _.get(data, "guestLandingPage") && _.get(_.get(data, "guestLandingPage"), 'mainContent')) {
            return of(_.get(_.get(data, "guestLandingPage"), 'mainContent').length > 0 ? _.get(_.get(data, "guestLandingPage"), 'mainContent') : []);
          }else {
            return of([]);
          }
        }));
    }

    ngOnDestroy() {
      this.unsubscribe$.next();
      this.unsubscribe$.complete();
    }

}
