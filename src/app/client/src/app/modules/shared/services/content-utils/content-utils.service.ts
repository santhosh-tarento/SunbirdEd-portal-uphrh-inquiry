import { EventEmitter, Injectable } from '@angular/core';
import { ISharelink } from './../../interfaces';
import { ConfigService } from './../config/config.service';
import { environment } from '@sunbird/environment';
import * as _ from 'lodash-es';

@Injectable()
export class ContentUtilsServiceService {
  /**
  *baseUrl;
  */
  public baseUrl: string;

  public contentShareEvent: EventEmitter<any> =  new EventEmitter<any>();
  /**
  *input for Sharelink;
  */
  contentShare: ISharelink;
  constructor(public configService: ConfigService) {
    const isDesktopApp = environment.isDesktopApp;
    this.baseUrl = document.location.origin + '/';
    if (isDesktopApp) {
      const origin = (<HTMLInputElement>document.getElementById('baseUrl'))
        ? (<HTMLInputElement>document.getElementById('baseUrl')).value : document.location.origin;
      this.baseUrl = origin + '/';
    }
  }
  /**
   * getBase64Url
   * generate the base url to play unlisted content for public users.
   * {object} identifier-content or course identifier
   * returns {string} type - content or course type.
   */
  getBase64Url(type, identifier) {
    return btoa(type + '/' + identifier);
  }
  /**
  * getUnlistedShareUrl
  * generate the url to play unlisted content for other users.
  * {object}  cData - content data
  * returns {string} url to share.
  */
  getUnlistedShareUrl(contentShare) {
    if (contentShare.mimeType === 'application/vnd.ekstep.content-collection') {
      if (contentShare.contentType === 'Course') {
        return `${this.baseUrl}learn/course/${contentShare.identifier}/Unlisted`;
      } else {
        return `${this.baseUrl}resources/play/collection/${contentShare.identifier}/Unlisted`;
      }
    } else {
      return `${this.baseUrl}resources/play/content/${contentShare.identifier}/Unlisted`;
    }
  }
  /**
  * getPublicShareUrl
  * {string}  identifier - content or course identifier
  * {string}  type - content or course type
  * {string}  collectionId - collection Id
  * returns {string} url to share
  */
  getPublicShareUrl(identifier, type, collectionId?) {
    let playertype: string;
    if (collectionId && type !== this.configService.appConfig.PLAYER_CONFIG.MIME_TYPE.questionset ) {
      return `${this.baseUrl}play/collection/${collectionId}?contentId=${identifier}`;
    }
    if (type === this.configService.appConfig.PLAYER_CONFIG.MIME_TYPE.collection) {
      playertype = 'collection';
    } else if (type === this.configService.appConfig.PLAYER_CONFIG.MIME_TYPE.questionset) {
      playertype = 'questionset';
    } else {
      playertype = 'content';
    }
    return this.baseUrl + 'play' + '/' + playertype + '/' + identifier;
  }

  getCoursePublicShareUrl (courseid) {
    return `${this.baseUrl}explore-course/course/${courseid}`;
  }

  getCourseModulePublicShareUrl (courseId: string, moduleId: string) {
    return `${this.baseUrl}explore-course/course/${courseId}?moduleId=${moduleId}`;
  }
  /**
  * {content} is node which comes from collection tree for each content and returns rollup object upto 4 elements
  *  this function is called from public and private modules of collection and course players
  */
  getContentRollup (content) {
    const objectRollUp = {};
    let nodes = content.getPath();
    nodes = _.slice(nodes, 0, 4).slice(0, -1);
    nodes.forEach((eachnode, index) => objectRollUp['l' + (index + 1)] = eachnode.model.identifier);
    return objectRollUp;
  }

  /* Check if question set blueptint or normal question set*/
  isQuestionSetBP(metadata) {
    let isQuestionSetBP = false;
    if(metadata?.mimeType === this.configService.appConfig.PLAYER_CONFIG.MIME_TYPE.questionset) {
      const childMimeTypes = _.map(metadata.children, 'mimeType');
      const isSectionsAvailable =  childMimeTypes[0] === this.configService.appConfig.PLAYER_CONFIG.MIME_TYPE.questionset;
      if(isSectionsAvailable) {
        const section = metadata.children[0];
        if((section.children.length === 0) && ((section.criterias && section.criterias.length > 0) || (section?.board && section?.medium && section?.gradeLevel && section?.subject))) {
          isQuestionSetBP= true;
        }
      }
    }
    return isQuestionSetBP;
  }

  /* Prepare and return composite search */
  getCompositeSearchParams(criteria) {
    const searchParams= {
      filters: {
        primaryCategory: criteria?.selectedQuestionType || "Multiple Choice Question",
        board: criteria?.board,
        medium: criteria?.medium,
        gradeLevel: criteria?.gradeLevel,
        subject: criteria?.subject,
        status: ["Live"],
        objectType:["Question"]
      },
      limit: criteria?.requiredQuestionCount || 10
    }
    return searchParams;
  }
}
