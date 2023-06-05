
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

import { WorkSpace } from '../../../classes/workspace';
import { WorkSpaceService } from '../../../services';
import { FormControl, FormGroup, Validators } from '@angular/forms';

@Component({
    selector: 'app-result-evaluation-pending-list',
    templateUrl: './pending-list.component.html',
    styleUrls: ['./pending-list.component.scss']
})

export class ResultEvalutionPendingListComponent extends WorkSpace implements OnInit, AfterViewInit, OnDestroy {

    /**
     * state for content editior
    */
    state: string;

    feedbackForm:FormGroup

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
    participantsList: any[] = [];
    isChecked: boolean = false;
    enableFeedback: boolean = false;
    batchID:any;
    /**
    *To store the flag to open issue or reject popup 
    */
    isIssueCertificate: boolean = true;
    feedbackText: string= '';
    /**
    *To store the flag to disable/enable not issue button
    */
    disableRejectCertificateAction: boolean = true;

    /**
    *To store the flag to disable/enable issue certificate button
    */
    disableIssueCertificateAction: boolean = true;

    /**
    *To store the selected student for submission or abort
    */
    selectedStudents: any[] = [];
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
        this.paginationService = paginationService;
        this.activatedRoute = activatedRoute;
        this.toasterService = toasterService;
        this.resourceService = resourceService;
        this.config = config;
        this.state = 'allcontent';
        this.loaderMessage = {
            'loaderMessage': this.resourceService.messages.stmsg.m0110,
        };
        this.sortingOptions = this.config.dropDownConfig.FILTER.RESOURCES.adminPendingStudentsortingOptions;     

        this.feedbackForm = new FormGroup({
            feedback: new FormControl('',Validators.required),
          });   
    }

    ngOnInit() {
        this.activatedRoute.queryParams.subscribe((params) => {
            this.batchID = params.id;
          });

        this.filterType = this.config.appConfig.allmycontent.filterType;
        this.redirectUrl = this.config.appConfig.allmycontent.inPageredirectUrl;

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
                        student['checked'] = false;
                        if(assessmentInfo){
                            student['assessmentInfo'] = assessmentInfo;
                        }
                    });
                    this.totalCount = data.result.response.count;
                    this.pager = this.paginationService.getPager(data.result.response.count, pageNumber, limit);

                    // let allStudents= data.result.response.content;
                    // allStudents.forEach((student) => {
                    //     const assessmentInfo = _.find(this.participantsList, (participant) => {return participant.userId === student.id});
                    //     if(assessmentInfo){
                    //         student['assessmentInfo']  = assessmentInfo;
                    //     }
                    // });
                    // this.allStudents= _.filter(allStudents, (student) => { return student?.assessmentInfo  !== null });
                    // this.totalCount =  this.allStudents.length;
                    // this.pager = this.paginationService.getPager(this.totalCount, pageNumber, limit);
                    
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
        this.router.navigate(['workspace/content/resultEvaluation/pendingForEvaluation', this.pageNumber], { queryParams: this.queryParams });
        this.isChecked = false;
        this.disableRejectCertificateAction = true;     
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


    handleKeyDown(event: KeyboardEvent){
        if(this.maxCount == 0 && event.key !== 'Backspace' ){
         event.preventDefault();
         return
        }
        if(event.key === 'Backspace'){
          this.maxCount = this.maxCount + 1
        }
        else {
            this.maxCount = this.maxCount - 1
        }
    }

    handleCheckBoxChange($event: MatCheckboxChange, studentObj?: any) {
        if (studentObj?.id) {
            this.checkUncheck($event, studentObj);
            return;
        }
        
        this.allStudents.forEach((student) => {
            if(student?.assessmentInfo && student?.assessmentInfo?.status === 3) {
                this.checkUncheck($event, student);
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

        const studentsWithAssessmentInfo= _.filter(this.selectedStudents, (student)  => {return student?.assessmentInfo != null});
        const studentsWithStatusPendingForEval = _.filter(studentsWithAssessmentInfo, (student)  => {return student?.assessmentInfo?.status === 3});
        if(studentsWithStatusPendingForEval.length > 0) {
            this.disableIssueCertificateAction = false;
            this.disableRejectCertificateAction = false;
        } else {
            this.disableIssueCertificateAction = true;
            this.disableRejectCertificateAction = true;
        }
    }

    shiftUnShiftArray(flag: string, obj: any): void {
        if (flag === 'push') {
            if (_.findIndex(this.selectedStudents,  {id: obj.id}) === -1) {
                this.selectedStudents.push(obj);
            }
        } else {
            this.selectedStudents.splice(_.findIndex(this.selectedStudents,  {id: obj.id}), 1); 
        }
    }

    closeModal(): void {
        this.feedbackForm.reset();
        this.enableFeedback = false;
    }

    openFeedbackPopup(flag: string): void {
        if(flag === 'issue'){
            // this.feedbackText = this.resourceService.frmelmnts.lbl.reasonToIssueCert;
            this.isIssueCertificate =  true;
            this.handleSubmitData()
        } else{
            this.feedbackText =  this.resourceService.frmelmnts.lbl.reasonToNotIssueCert;
            this.isIssueCertificate =  false;
            this.enableFeedback = true;
        }
       
    }

    handleSubmitData(modal?): void {
        const batch = this.assessment.batches[0];
        const userIds = _.compact(_.map(this.selectedStudents, (student) =>  {
            if (student?.assessmentInfo  && student?.assessmentInfo?.status === 3) {
                return student.id
            };
        }));
        let requestBody = {
            request: {
                batchId: batch?.batchId,
                courseId: this.assessment?.identifier,
                userIds: userIds,
                status: null
            }
        };
        if(this.isIssueCertificate){
            this.courseBatchService.issueCertificate(requestBody).pipe(takeUntil(this.destroySubject$))
            .subscribe((res)=>{
                if(res){
                    requestBody.request.status = 4
                    this.courseBatchService.submitforEval(requestBody).pipe(takeUntil(this.destroySubject$))
                    .subscribe((res)=>{
                    })
                }
                this.disableIssueCertificateAction = true;
                this.disableRejectCertificateAction = true;
                _.forEach(this.allStudents, (student) =>  {
                    userIds.forEach(ids=>{
                        if(student.id == ids){
                          student.assessmentInfo.status  = 4;
                          student.assessmentInfo.certificates  = ["issued"];
                        //   student.assessmentInfo.comment =requestBody.request['comment']
                          student.checked = false;
                        }
                    });
                });
            },(err)=>{
               if (err.error && err.error.params && err.error.params.errmsg) {
                    this.toasterService.error(err.error.params.errmsg);
               } else {
                     this.toasterService.error(this.resourceService.messages.fmsg.m0103);
               }
            });
        } else{
            requestBody.request['comment'] = this.feedbackForm.value.feedback;
            requestBody.request.status = 5
            this.courseBatchService.rejectCertificate(requestBody).pipe(takeUntil(this.destroySubject$))
            .subscribe((res)=>{
                this.closeModal();
                this.disableIssueCertificateAction = true;
                this.disableRejectCertificateAction = true;
                _.forEach(this.allStudents, (student) =>  {
                    userIds.forEach(ids=>{
                        if(student.id == ids){
                          student.assessmentInfo.status  = 5;
                          student.assessmentInfo.comment =requestBody.request['comment']
                          student.checked = false;
                        }
                    });
                });
            },(err)=>{
               if (err.error && err.error.params && err.error.params.errmsg) {
                    this.toasterService.error(err.error.params.errmsg);
               } else {
                     this.toasterService.error(this.resourceService.messages.fmsg.m0103);
               }
            });
        }   
    }

    getStatusText(student: any) {
        let statusText = '';
        switch(student?.assessmentInfo?.status) {
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
                statusText= "Pending for evaluation"; 
                break;
            case 4:
                 statusText= "Certificate issued";
                break; 
           case 5:
            statusText= "Certificate not issued";
            break;
        }
        return statusText;
    }

    getDisableCheckboxFlag(obj: any) {
        let disableFlag = true;
        if(obj?.assessmentInfo){
            if(obj?.assessmentInfo?.status === 3) {
                disableFlag =false;
            }
        } 
        return disableFlag;
    }

    ngOnDestroy(): void {
        this.destroySubject$.unsubscribe();
    }
}
