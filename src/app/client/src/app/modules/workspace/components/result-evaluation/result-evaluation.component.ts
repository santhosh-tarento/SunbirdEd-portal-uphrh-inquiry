
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';

@Component({
    selector: 'app-result-evaluation',
    templateUrl: './result-evaluation.component.html',
    styleUrls: ['./result-evaluation.component.scss']
})

export class ResultEvaluationComponent implements OnInit, OnDestroy {
   /**
     * to store all nav links
    */
    navLinks: any[];
    /**
     * to store selected link value
    */
    activeLink: string;

    /**
    *To store the assessment object   
    */
    assessment: any = {}

    routerStateObj: any;
    batchID:any;

    constructor(
      private activatedRoute: ActivatedRoute,
      private router: Router,
      private location: Location,
    ) { 
      this.navLinks = [
        {
            label: 'Pending',
            path: '/pendingForEvaluation/1',
            index: 0
        }, {
            label: 'All',
            path: '/all/1',
            index: 1
        }
    ];
    this.activeLink= "/all/1";
    this.routerStateObj = this.location.getState();
    this.assessment = this.routerStateObj?.assessment;
    this.activatedRoute.queryParams.subscribe((params) => {
      this.batchID = params.id;
    });
    }

    ngOnInit() { }

    navigateToLink(selectedLink: string) {
      this.activeLink = selectedLink;
      this.router.navigate(['workspace/content/resultEvaluation'+ selectedLink], { state: {assessment: this.assessment, pageNumber: 1},queryParams: { id:this.batchID }  });
    }

    navigateToAssessments()  {
      this.router.navigate(['workspace/content/assessments/list', this.routerStateObj?.pageNumber]);
    }

    ngOnDestroy(): void {

    }
}
