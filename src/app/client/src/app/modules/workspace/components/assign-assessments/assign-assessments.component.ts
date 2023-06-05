
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';

@Component({
    selector: 'app-assign-assessments',
    templateUrl: './assign-assessments.component.html',
    styleUrls: ['./assign-assessments.component.scss']
})

export class AssignAssessmentsComponent implements OnInit, OnDestroy {
    /**
     * to store selected link value
    */
    activeLink: string;
    /**
    *To store the assessment object   
    */
    assessment: any = {}

      /**
     * To send activatedRoute.snapshot to router navigation
     * service for redirection to draft  component
    */
      //private activatedRoute: ActivatedRoute;

    /**
     * to store all nav links
    */
    batchID:any;
    navLinks: any[];


    routerStateObj: any;

    constructor(
      private router: Router,
      private location: Location,
      private activatedRoute: ActivatedRoute
    ) { 
      this.routerStateObj = this.location.getState();
      this.assessment =  this.routerStateObj?.assessment;
      this.navLinks = [
        {
            label: 'Pending for Submission',
            path: '/pendingForSubmission/1',
            index: 0
        }, {
            label: 'All',
            path: '/all/1',
            index: 1
        }
    ];
    this.activeLink= "/all/1";
    this.activatedRoute.queryParams.subscribe((params) => {
      this.batchID = params.id;
    });
    }

    ngOnInit() { 
    }

    navigateToLink(selectedLink: string) {
      this.activeLink = selectedLink;
      this.router.navigate(['workspace/content/assessments/assign'+ selectedLink], { state: {assessment: this.assessment, pageNumber: 1},queryParams: { id:this.batchID } });
      
    }

    navigateToAssessments()  {
      this.router.navigate(['workspace/content/assessments/list', this.routerStateObj?.pageNumber]);
    }

    ngOnDestroy(): void {

    }
}
