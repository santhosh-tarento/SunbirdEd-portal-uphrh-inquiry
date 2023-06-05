
import { Component, OnInit, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { MatCheckboxChange } from '@angular/material/checkbox';

import { combineLatest } from 'rxjs';
import { Subject } from 'rxjs';
import { debounceTime, map, takeUntil } from 'rxjs/operators';
import * as _ from 'lodash-es';

import { SuiModalService, ModalTemplate } from 'ng2-semantic-ui-v9';
import { IImpressionEventInput } from '@sunbird/telemetry';
import { SearchService, UserService, ISort, FrameworkService, LearnerService } from '@sunbird/core';
import { CourseBatchService } from '@sunbird/learn';
import { ServerResponse, PaginationService, ConfigService, ToasterService, IPagination, ResourceService, ILoaderMessage, INoResultMessage, IContents, NavigationHelperService } from '@sunbird/shared';

import { WorkSpace } from './../../../classes/workspace';
import { WorkSpaceService } from './../../../services';
import { FormControl, FormGroup, Validators } from '@angular/forms';

@Component({
    selector: 'app-students-list',
    templateUrl: './students-list.component.html',
    styleUrls: ['./students-list.component.scss']
})

export class StudentsListComponent extends WorkSpace implements OnInit, AfterViewInit, OnDestroy {

    /**
     * state for content editior
    */
    state: string;

    /**
     * To send activatedRoute.snapshot to router navigation
     * service for redirection to draft  component
    */
    private activatedRoute: ActivatedRoute;

    /**
     * Contains unique contentIds id
    */
    contentIds: string;

    /**
     * Contains list of students
    */
    allStudents: any[] = [];

    /**
     * To show / hide loader
    */
    showLoader = true;

    /**
     * loader message
    */
    loaderMessage: ILoaderMessage;

    /**
     * To show / hide no result message when no result found
    */
    noResult = false;

    /**
     * lock popup data for locked contents
    */
    lockPopupData: object;

    /**
     * To show content locked modal
    */
    showLockedContentModal = false;

    /**
     * To show / hide error
    */
    showError = false;

    /**
     * no result  message
    */
    noResultMessage: INoResultMessage;

    /**
      * For showing pagination on draft list
    */
    private paginationService: PaginationService;

    /**
    * To get url, app configs
    */
    public config: ConfigService;

    /**
    * Contains page limit of inbox list
    */
    pageLimit: number;

    /**
    * Current page number of inbox list
    */
    pageNumber = 1;

    /**
    * totalCount of the list
    */
    totalCount: Number;

    /**
      status for preselection;
    */
    status: string;

    /**
    route query param;
    */
    queryParams: any;

    batchID:any;
    /**
    redirectUrl;
    */
    public redirectUrl: string;

    /**
    filterType;
    */
    public filterType: string;

    /**
    sortingOptions ;
    */
    public sortingOptions: Array<ISort>;

    /**
    sortingOptions ;
    */
    sortByOption: string;

    /**
    sort for filter;
    */
    sort: object;

    /**
     * inviewLogs
    */
    inviewLogs = [];

    /**
    * value typed
    */
    query: string;

    /**
    * Contains returned object of the pagination service
    * which is needed to show the pagination on all content view
    */
    pager: IPagination;

    /**
    * To show toaster(error, success etc) after any API calls
    */
    private toasterService: ToasterService;

    /**
     * telemetryImpression
    */
    telemetryImpression: IImpressionEventInput;

    /**
    * To call resource service which helps to use language constant
    */
    public resourceService: ResourceService;

    /**
    * To store all the collection details to be shown in collection modal
    */
    public collectionData: Array<any>;

    /**
    *To store the assessment object   
    */

    assessment: any = {}
    batchAssessmentId:any = null
    participantsList: any[] = [];
    isChecked: boolean = false;
    disableAssessmentAction: boolean = true;
    checkedArray: string[] = [];
    maxCount:number = 250

    /**
     * To show/hide collection modal
     */
    public collectionListModal = false;
    private destroySubject$ = new Subject();

    /**
      * Constructor to create injected service(s) object
      Default method of Draft Component class
      * @param {SearchService} SearchService Reference of SearchService
      * @param {UserService} UserService Reference of UserService
      * @param {Router} route Reference of Router
      * @param {PaginationService} paginationService Reference of PaginationService
      * @param {ActivatedRoute} activatedRoute Reference of ActivatedRoute
      * @param {ConfigService} config Reference of ConfigService
    */

    constructor(
        public searchService: SearchService,
        public navigationhelperService: NavigationHelperService,
        public workSpaceService: WorkSpaceService,
        public frameworkService: FrameworkService,
        private router: Router,
        private location: Location,
        paginationService: PaginationService,
        activatedRoute: ActivatedRoute,
        userService: UserService,
        toasterService: ToasterService,
        resourceService: ResourceService,
        config: ConfigService,
        public learnerService: LearnerService,
        public modalService: SuiModalService,
        private courseBatchService: CourseBatchService) {

        super(searchService, workSpaceService, userService);

        const routerStateObj: any = this.location.getState();
        this.assessment = routerStateObj?.assessment;
        this.batchAssessmentId = routerStateObj?.id

        this.paginationService = paginationService;
        this.activatedRoute = activatedRoute;
        this.toasterService = toasterService;
        this.resourceService = resourceService;
        this.config = config;
        this.state = 'allcontent';
        this.loaderMessage = {
            'loaderMessage': this.resourceService.messages.stmsg.m0110,
        };
        this.sortingOptions = this.config.dropDownConfig.FILTER.RESOURCES.AssignStudentsortingOptions;     
    }

    ngOnInit() {
        this.filterType = this.config.appConfig.allmycontent.filterType;
        this.redirectUrl = this.config.appConfig.allmycontent.inPageredirectUrl;

        this.activatedRoute.queryParams.subscribe((params) => {
            this.batchID = params.id;
          });

        combineLatest([this.activatedRoute.params, this.activatedRoute.queryParams])
            .pipe(
                debounceTime(10),
                map(([params, queryParams]) => ({ params, queryParams }) )
            )
            .subscribe(bothParams => {
                if (bothParams.params.pageNumber) {
                    this.pageNumber = Number(bothParams.params.pageNumber);
                }
                this.queryParams = bothParams.queryParams;
                this.query = this.queryParams['query'];
                this.getParticipantsList(bothParams);                
            });
    }

    ngAfterViewInit() {
        setTimeout(() => {
            this.telemetryImpression = {
                context: {
                    env: this.activatedRoute.snapshot.data.telemetry.env
                },
                edata: {
                    type: this.activatedRoute.snapshot.data.telemetry.type,
                    pageid: this.activatedRoute.snapshot.data.telemetry.pageid,
                    subtype: this.activatedRoute.snapshot.data.telemetry.subtype,
                    uri: this.activatedRoute.snapshot.data.telemetry.uri + '/' + this.activatedRoute.snapshot.params.pageNumber,
                    visits: this.inviewLogs,
                    duration: this.navigationhelperService.getPageLoadTime()
                }
            };
        });
    }

    getParticipantsList(bothParams): void {
        const batchDetails = {
            "request": {
                "batch": {
                    "batchId": this.batchID
                },
                "filters": {
                    "status": [],
                    "enrolled_date": ""
                },
                "sort_by": {
                    "dateTime": "desc"
                }
            }
        };
        this.courseBatchService.getbatchParticipantList(batchDetails)
            .pipe(takeUntil(this.destroySubject$))
            .subscribe((data) => {
                this.participantsList = data;
                this.fecthAllContent(this.config.appConfig.WORKSPACE.ASSESSMENT.PAGE_LIMIT, this.pageNumber, bothParams);
            }, (err: ServerResponse) => {
                this.showLoader = false;
                this.noResult = false;
                this.showError = true;
                this.toasterService.error(this.resourceService.messages.fmsg.m0081);
            });
    }

    /**
    * This method sets the make an api call to get all users with profileType as students with page No and offset
    */
    fecthAllContent(limit: number, pageNumber: number, bothParams) {

        const status = bothParams?.queryParams?.status ? _.map(bothParams.queryParams.status, (assessmentStatus) => {
            return this.config.appConfig.WORKSPACE.ASSESSMENT.STATUS.findIndex((status) => status === assessmentStatus);
        }) : []
        this.showLoader = true;
        if (bothParams.queryParams.sort_by) {
            const sort_by = bothParams.queryParams.sort_by;
            const sortType = bothParams.queryParams.sortType;
            this.sort = {
                [sort_by]: _.toString(sortType)
            };  
        } else {
            this.sort = { lastUpdatedOn: this.config.appConfig.WORKSPACE.lastUpdatedOn };
        }

        const searchParams = {
            filters: {
                "roles" : [],
                "profileUserType.type" : "student"  
            },
            limit: limit,
            offset: (pageNumber - 1) * (limit),
            pageNumber: this.pageNumber || 1,
            query: _.toString(bothParams.queryParams.query),
            sort_by: this.sort,
            type: 'studentList'
        };

        this.search(searchParams)
            .pipe(takeUntil(this.destroySubject$))
            .subscribe((data: ServerResponse) => {
                if (data.result.response.count && !_.isEmpty(data.result.response.content)) {
                    this.allStudents = data.result.response.content;
                    this.allStudents.forEach((student) => {
                        const assessmentInfo = _.find(this.participantsList, (participant) => {return participant.userId === student.id});
                        if(assessmentInfo){
                            student['assessmentInfo']  = assessmentInfo;
                            student['checked'] = true;
                        } else {    
                            student['checked'] = false;
                        }
                    });
                    this.totalCount = data.result.response.count;
                    this.pager = this.paginationService.getPager(data.result.response.count, pageNumber, limit);
                    this.showLoader = false;
                    this.noResult = false;
                } else {
                    this.showError = false;
                    this.noResult = true;
                    this.showLoader = false;
                    this.noResultMessage = {
                        'messageText': 'messages.stmsg.m0006'
                    };
                }
            }, (err: ServerResponse) => {
                this.showLoader = false;
                this.noResult = false;
                this.showError = true;
                this.toasterService.error(this.resourceService.messages.fmsg.m0081);
            });
    }

    /**
     * This method helps to navigate to different pages.
     * If page number is less than 1 or page number is greater than total number
     * of pages is less which is not possible, then it returns.
     *
     * @param {number} page Variable to know which page has been clicked
     *
     * @example handleNavigateToPage(1)
     */
    handleNavigateToPage(page: number): undefined | void {
        if (page < 1 || page > this.pager.totalPages) {
            return;
        }
        this.pageNumber = page;
        this.router.navigate(['workspace/content/assessments/assign', this.pageNumber], { queryParams: this.queryParams });
        this.isChecked = false;
        this.disableAssessmentAction = true;     
    }

    inview(event) {
        _.forEach(event.inview, (inview, key) => {
            const obj = _.find(this.inviewLogs, (o) => {
                return o.objid === inview?.data?.identifier;
            });
            if (obj === undefined) {
                this.inviewLogs.push({
                    objid: inview?.data?.identifier,
                    objtype: inview?.data?.contentType,
                    index: inview?.id
                });
            }
        });
        this.telemetryImpression.edata.visits = this.inviewLogs;
        this.telemetryImpression.edata.subtype = 'pageexit';
        this.telemetryImpression = Object.assign({}, this.telemetryImpression);
    }

    handleAssignStudent(): void {
        const batch = this.assessment.batches[0];
        const userIds = _.compact(_.map(this.allStudents, (student) =>  {
            if (student.checked && !student['assessmentInfo']) {
                return student.id
            };
        }))
        const requestBody = {
            request: {
                batchId: batch?.batchId,
                courseId: this.assessment?.identifier,
                userIds: userIds
            }
        };
        this.courseBatchService.enrollUsersToBatch(requestBody)
            .pipe(takeUntil(this.destroySubject$))
            .subscribe((res) => {
                this.toasterService.success(this.resourceService.messages.smsg.m0099);
                this.disableAssessmentAction = true;
                this.isChecked = false;
                _.forEach(this.allStudents, (student) =>  {
                    userIds.forEach(id=>{
                        if(student.id === id){
                          student['assessmentInfo'] = {status: 0}
                        }
                    });
                });
            }, (err) => {
                if (err.error && err.error.params && err.error.params.errmsg) {
                    this.toasterService.error(err.error.params.errmsg);
                } else {
                    this.toasterService.error(this.resourceService?.messages?.fmsg?.m0104);

                }
            })
    }


    handleCheckBoxChange($event: MatCheckboxChange, studentObj?: any) {
        if (studentObj?.id) {
            this.checkUncheck($event, studentObj);
            return;
        }
        
        this.allStudents.forEach((obj) => {
            if(!obj.assessmentInfo){
                this.checkUncheck($event, obj);
            }
           
        })
    }
    

    checkUncheck($event: MatCheckboxChange, obj: any): void {
        if ($event.checked) {
            obj['checked'] = true;
            this.shiftUnShiftArray('push', obj);
        } else {
            obj['checked'] = false;
            this.shiftUnShiftArray('pop', obj);
        }

        this.disableAssessmentAction = this.checkedArray.length ? false : true;
    }

    shiftUnShiftArray(flag: string, obj: any): void {
        if (flag === 'push') {
            if (!this.checkedArray.includes(obj.id)) {
                this.checkedArray.push(obj.id);
            }
        } else {
            this.checkedArray.splice(this.checkedArray.indexOf(obj.id), 1); 
        }
    }

    getStatusText(status: number) {
        let statusText = '';
        switch(status) {
            case 0: 
                statusText= "Assigned";
                 break;
            case 1:
                statusText= "In progress";
                break;
            case 2:
                statusText= "Completed";
                break;
            case 3:
                statusText= "Sent for evaluation"; 
                break;
            case 4:
                statusText= "Evaluation completed";
                break; 
            case 5:
                statusText= "Evaluation completed";
                break;
        }
        return statusText;
    }

    ngOnDestroy(): void {
        this.destroySubject$.unsubscribe();
    }
}
