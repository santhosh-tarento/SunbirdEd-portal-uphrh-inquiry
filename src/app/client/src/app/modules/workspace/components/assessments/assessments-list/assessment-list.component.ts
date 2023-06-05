
import { Component, OnInit, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { combineLatest, Subject } from 'rxjs';
import { debounceTime, map, takeUntil } from 'rxjs/operators';
import * as _ from 'lodash-es';

import { SuiModalService, ModalTemplate } from 'ng2-semantic-ui-v9';
import { IImpressionEventInput } from '@sunbird/telemetry';
import { SearchService, UserService, ISort, FrameworkService } from '@sunbird/core';
import { ServerResponse, PaginationService, ConfigService, ToasterService, IPagination, ResourceService, ILoaderMessage, INoResultMessage, IContents, NavigationHelperService, IUserData } from '@sunbird/shared';

import { WorkSpace } from './../../../classes/workspace';
import { WorkSpaceService } from './../../../services';
@Component({
    selector: 'app-assessments-list',
    templateUrl: './assessments-list.component.html',
    styleUrls: ['./assessments-list.component.scss']
})

export class AssessmentsListComponent extends WorkSpace implements OnInit, AfterViewInit, OnDestroy {

    @ViewChild('modalTemplate')
    public modalTemplate: ModalTemplate<{ data: string }, string, string>;
    public unsubscribe$ = new Subject<void>();

    /**
     * state for content editior
    */
    state: string;

    /**
     * To navigate to other pages
     */
    route: Router;

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
     * Contains list of published course(s) of logged-in user
    */
    allAssessments: Array<IContents> = [];

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
     * To show/hide collection modal
     */
    public collectionListModal = false;
    public isQuestionSetFilterEnabled: boolean;

    userRoles:any[] = [];

    isOrgAdmin: boolean;

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
        paginationService: PaginationService,
        activatedRoute: ActivatedRoute,
        route: Router,
        userService: UserService,
        toasterService: ToasterService,
        resourceService: ResourceService,
        config: ConfigService,
        public modalService: SuiModalService) {
        super(searchService, workSpaceService, userService);
        this.paginationService = paginationService;
        this.route = route;
        this.activatedRoute = activatedRoute;
        this.toasterService = toasterService;
        this.resourceService = resourceService;
        this.config = config;
        this.state = 'allcontent';
        this.loaderMessage = {
            'loaderMessage': this.resourceService?.messages?.stmsg?.m0110,
        };
        this.sortingOptions = this.config.dropDownConfig.FILTER.RESOURCES.sortingOptions;
        this.isOrgAdmin= false;
    }

    ngOnInit() {
        combineLatest([this.activatedRoute.params, this.activatedRoute.queryParams])
            .pipe(
                debounceTime(10),
                map(([params, queryParams]) => ({ params, queryParams }))
            )
            .subscribe(bothParams => {
                if (bothParams.params.pageNumber) {
                    this.pageNumber = Number(bothParams.params.pageNumber);
                }
                this.queryParams = bothParams.queryParams;
                this.query = this.queryParams['query'];
                if (this.userService.loggedIn) {
                    this.userService.userData$.pipe(takeUntil(this.unsubscribe$)).subscribe((profileData: IUserData) => {
                      this.userRoles = profileData.userProfile['roles'].length ? _.map(profileData.userProfile['roles'], 'role') : []; 
                      this.isOrgAdmin = (!_.isEmpty(this.userRoles) && _.includes(this.userRoles, 'ORG_ADMIN') );
                      this.fecthAllAssessments(this.config.appConfig.WORKSPACE.ASSESSMENT.PAGE_LIMIT, this.pageNumber, bothParams);
                    });
                  }
                
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

    /**
    * This method sets the make an api call to get all PIAA assessments with page No and offset
    */
    fecthAllAssessments(limit: number, pageNumber: number, bothParams) {
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
        const preStatus = ['Live']
        const primaryCategories = _.compact(_.concat(this.frameworkService['_channelData'].contentPrimaryCategories, this.frameworkService['_channelData'].collectionPrimaryCategories));
        const searchParams = {
            filters: {
                // tslint:disable-next-line:max-line-length
                primaryCategory: this.config.appConfig.WORKSPACE.ASSESSMENT.PRIMARY_CATEGORY,
                se_boards:bothParams.queryParams.board,
                subject: bothParams.queryParams.subject,
                se_mediums: bothParams.queryParams.medium,
                se_gradeLevels: bothParams.queryParams.gradeLevel,
                se_difficultyLevels:bothParams.queryParams.difficultyLevel
            },
            limit: limit,
            offset: (pageNumber - 1) * (limit),
            query: _.toString(bothParams.queryParams.query),
            sort_by: this.sort
        };
        if(this.isOrgAdmin) {
            // searchParams.filters['batches.status'] = 3;
        } else {
            searchParams.filters['status'] = bothParams.queryParams.status ? bothParams.queryParams.status : preStatus;
        }

        this.search(searchParams)
            .subscribe((data: ServerResponse) => {
                if (data.result.count && (!_.isEmpty(data.result.content) || (!_.isEmpty(data.result.content)))) {
                    this.allAssessments = data.result.content;
                    this.totalCount = data.result.count;
                    this.pager = this.paginationService.getPager(data.result.count, pageNumber, limit);
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
                this.toasterService.error(this.resourceService.messages?.fmsg?.m0081);
            });
    }

    handleAssignAssessment(assessment): void {
        this.route.navigate([this.isOrgAdmin ? '/workspace/content/resultEvaluation/all/1' : '/workspace/content/assessments/assign/all/1'],{ state: {assessment: assessment, pageNumber: this.pageNumber},queryParams: { id:assessment.batches[0].batchId } },);
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

    /**
     * This method helps to navigate to different pages.
     * If page number is less than 1 or page number is greater than total number
     * of pages is less which is not possible, then it returns.
     *
     * @param {number} page Variable to know which page has been clicked
     *
     * @example navigateToPage(1)
     */
    navigateToPage(page: number): undefined | void {
        if (page < 1 || page > this.pager.totalPages) {
            return;
        }
        this.pageNumber = page;
        this.route.navigate(['workspace/content/assessments/list', this.pageNumber], { queryParams: this.queryParams });        
    }

    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
