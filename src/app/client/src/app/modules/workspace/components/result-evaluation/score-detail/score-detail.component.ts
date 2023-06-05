
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { WorkSpace } from '../../../classes/workspace';
import { WorkSpaceService } from '../../../services';
import { SearchService, UserService} from '@sunbird/core';
import { IScoreDetails } from '@sunbird/shared';
import { Location } from '@angular/common';

@Component({
    selector: 'app-score-detail',
    templateUrl: './score-detail.component.html',
    styleUrls: ['./score-detail.component.scss']
})

export class ScoreDetailComponent extends WorkSpace  implements OnInit, OnDestroy {
   /**
     * to store all nav links
    */
    navLinks: any[];
    
    /**
     * to store selected link value
    */
    activeLink: string;

    assessment:any= {}
    pageNumber:any = null
    scoreDetails: IScoreDetails;
    batchID:any

    constructor(
      private router: Router,
      public workSpaceService: WorkSpaceService,
      public searchService: SearchService,
      public userService: UserService,
      private location: Location,
      private activatedRoute: ActivatedRoute
    ) { 
        super(searchService, workSpaceService, userService);
        this.scoreDetails= {
            assessmentId: "1",
            assessmentName:  "GNM - First Year - Anatomy & Biology",
            assessmentDate: "2023-03-16T18:30:00.000Z",
            framework:  {
                board: "GNM",
            },
            scoreSummary: {
                totalCorrect: 15,
                totalIncorrect: 5,
                totalTimeSpent: "1h 15m",
                totalResult: 75,
            },
            nodalFeedback: "Assessment taken as per schedule and guideline",
            competenciesScores:[{
                name: "Pregency Identification",
                score: 75,
                levels: [
                    {
                        name: "Understands health of mails and femails"
                    }
                ],
                totalQuestion: 8,
                correctAnswer: 6,
                incorrectAnswer: 2,
            },
            {
                name: "Normal Delivery",
                score:75,
                levels: [
                    {
                        name: "Understands components  of noraml delivery"
                    }
                ],
                totalQuestion: 10,
                correctAnswer: 9,
                incorrectAnswer: 1,
            },
            {
                name: "AMSTL",
                score: 75,
                levels: [
                    {
                        name: "Understands health of mails and femails"
                    }
                ],
                totalQuestion: 8,
                correctAnswer: 6,
                incorrectAnswer: 2,
            },
            {
                name: "Birth Planning and Preparedness for PW and HRP",
                score: 90,
                levels: [
                    {
                        name: "Understands components  of noraml delivery"
                    }
                ],
                totalQuestion: 10,
                correctAnswer: 9,
                incorrectAnswer: 1,
            }  
            ]
        }
        const routerStateObj: any = this.location.getState();
        this.assessment = routerStateObj?.assessment;
        this.pageNumber = routerStateObj?.pageNumber;
        this.activatedRoute.queryParams.subscribe((params) => {
            this.batchID = params.id;
          });

    }

    ngOnInit() { }

    navigateBack() {
      this.router.navigate(['workspace/content/resultEvaluation/all/1'],{ state: {assessment: this.assessment, pageNumber: this.pageNumber},queryParams:{id:this.batchID}});
    }

    ngOnDestroy(): void {

    }
}
